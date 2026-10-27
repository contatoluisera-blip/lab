import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { grantCredits } from '@/lib/server/credits';
import { currentPeriod, productIdFromSubscription, stripeClient } from '@/lib/server/stripe';
import { PLAN_CONFIGS, isPaidPlan, planFromStripeProduct } from '@/lib/planConfig';
import { getAccountState } from '@/lib/accountState';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

/** Irregularidades que o admin precisa ver, da mais grave para a mais leve. */
export type Issue = 'pagamento_pendente' | 'renovacao_atrasada' | 'assinatura_encerrada' | 'sem_assinatura_vinculada' | 'creditos_esgotados';

function diagnose(uid: string, d: any) {
  const state = getAccountState(d);
  const sub = d.stripeSubscriptionStatus || null;
  const end = d.currentPeriodEnd ? new Date(d.currentPeriodEnd).getTime() : null;
  const issues: Issue[] = [];
  if (state.status === 'payment_issue') issues.push('pagamento_pendente');
  // Stripe diz "ativa", mas a data de renovação já passou: o webhook não atualizou a conta.
  if (state.status === 'active' && end && end < Date.now() - DAY) issues.push('renovacao_atrasada');
  if ((sub === 'canceled' || sub === 'incomplete_expired') && isPaidPlan(d.plan)) issues.push('assinatura_encerrada');
  if (state.status === 'manual' && !d.manualGrant && !d.stripeSubscriptionId) issues.push('sem_assinatura_vinculada');
  if (state.plan && state.credits === 0) issues.push('creditos_esgotados');

  return {
    uid,
    name: d.name || '',
    email: d.email || '',
    createdAt: d.createdAt || null,
    plan: state.plan,
    planLabel: state.planLabel,
    status: state.status,
    statusLabel: state.statusLabel,
    credits: state.credits,
    planCredits: state.planCredits,
    renewsAt: state.renewsAt,
    daysToRenewal: state.status === 'active' && end ? Math.ceil((end - Date.now()) / DAY) : null,
    stripeStatus: sub,
    hasStripe: !!d.stripeSubscriptionId,
    manualGrant: d.manualGrant || null,
    source: d.acquisition?.first?.utm_source || d.acquisition?.last?.utm_source || null,
    issues,
  };
}

/** Busca a assinatura na Stripe e espelha na conta (mesma regra do webhook). Não libera créditos. */
async function syncFromStripe(uid: string) {
  const ref = adminDb.collection('users').doc(uid);
  const d = (await ref.get()).data();
  if (!d) throw new HttpError(404, 'not_found', 'Usuário não encontrado.');
  const stripe = stripeClient();

  let sub: any = null;
  if (d.stripeSubscriptionId) {
    sub = await stripe.subscriptions.retrieve(d.stripeSubscriptionId).catch(() => null);
  }
  if (!sub && d.stripeCustomerId) {
    const list = await stripe.subscriptions.list({ customer: d.stripeCustomerId, status: 'all', limit: 1 });
    sub = list.data[0] || null;
  }
  if (!sub) throw new HttpError(404, 'no_subscription', 'Nenhuma assinatura desta conta foi encontrada na Stripe.');

  const ended = sub.status === 'canceled' || sub.status === 'incomplete_expired';
  const plan = ended ? 'free' : planFromStripeProduct(productIdFromSubscription(sub));
  const { end } = currentPeriod(sub);
  await ref.update({
    stripeSubscriptionId: sub.id,
    stripeSubscriptionStatus: sub.status,
    currentPeriodEnd: end ? new Date(end).toISOString() : null,
    ...(plan ? { plan } : {}),
    ...(ended ? { credits: 0 } : {}),
    updatedAt: new Date().toISOString(),
  });
  return sub.status as string;
}

/**
 * Gestão de usuários no /admin: lista com o diagnóstico de cada conta e as ações manuais
 * (sincronizar com a Stripe, definir plano e créditos, ajustar créditos, remover plano).
 * Toda ação fica registrada no extrato de créditos com o e-mail de quem fez.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const uid = typeof body.uid === 'string' ? body.uid : '';
    const by = { by: admin.email, at: new Date().toISOString() };

    switch (body.action) {
      case 'list': {
        // Sem orderBy no banco: contas antigas sem `createdAt` também precisam aparecer.
        const snap = await adminDb.collection('users').get();
        const users = snap.docs.map((doc: any) => diagnose(doc.id, doc.data()))
          .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        return NextResponse.json({ success: true, users });
      }

      case 'sync': {
        if (!uid) throw new HttpError(400, 'missing_uid', 'Usuário não informado.');
        const status = await syncFromStripe(uid);
        const d = (await adminDb.collection('users').doc(uid).get()).data();
        return NextResponse.json({ success: true, stripeStatus: status, user: diagnose(uid, d) });
      }

      case 'setPlan': {
        if (!uid) throw new HttpError(400, 'missing_uid', 'Usuário não informado.');
        if (!isPaidPlan(body.plan)) throw new HttpError(400, 'invalid_plan', 'Plano inválido.');
        const credits = body.credits === '' || body.credits === undefined ? PLAN_CONFIGS[body.plan as keyof typeof PLAN_CONFIGS].credits : Number(body.credits);
        if (!Number.isInteger(credits) || credits < 0 || credits > 10000) throw new HttpError(400, 'invalid_credits', 'Créditos devem ser um número inteiro entre 0 e 10000.');
        await grantCredits(uid, credits, 'admin_set_plan', { plan: body.plan, manualGrant: by });
        break;
      }

      case 'setCredits': {
        if (!uid) throw new HttpError(400, 'missing_uid', 'Usuário não informado.');
        const credits = Number(body.credits);
        if (!Number.isInteger(credits) || credits < 0 || credits > 10000) throw new HttpError(400, 'invalid_credits', 'Créditos devem ser um número inteiro entre 0 e 10000.');
        await grantCredits(uid, credits, 'admin_set_credits', { creditsAdjusted: by });
        break;
      }

      case 'removePlan': {
        if (!uid) throw new HttpError(400, 'missing_uid', 'Usuário não informado.');
        await grantCredits(uid, 0, 'admin_remove_plan', { plan: 'free', manualGrant: null, planRemoved: by });
        break;
      }

      default:
        throw new HttpError(400, 'bad_action', 'Ação desconhecida.');
    }

    const d = (await adminDb.collection('users').doc(uid).get()).data();
    return NextResponse.json({ success: true, user: diagnose(uid, d) });
  } catch (error) {
    return errorResponse(error);
  }
}
