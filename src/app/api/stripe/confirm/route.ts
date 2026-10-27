import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { currentPeriod, productIdFromSubscription, stripeClient } from '@/lib/server/stripe';
import { PLAN_CONFIGS, isPaidPlan, planFromStripeProduct } from '@/lib/planConfig';
import { grantCredits } from '@/lib/server/credits';
import { sendMetaEvent } from '@/lib/server/meta';

export const dynamic = 'force-dynamic';

/**
 * Confirma um checkout recém-concluído direto na Stripe e ativa o plano.
 * Substitui a antiga "ativação otimista" feita pelo navegador: aqui só ativa
 * se a Stripe disser que a sessão pertence a este usuário e está paga.
 * Idempotente: se o webhook já ativou, não concede créditos duas vezes.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) throw new HttpError(400, 'missing_session', 'Sessão de pagamento não informada.');

    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.client_reference_id !== user.uid) throw new HttpError(403, 'forbidden', 'Esta sessão de pagamento não é sua.');
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ success: true, activated: false, status: session.payment_status });
    }

    const sub: any = session.subscription;
    const subscriptionId = typeof sub === 'string' ? sub : sub?.id;
    const metaPlan = session.metadata?.planName?.toLowerCase();
    const plan = planFromStripeProduct(productIdFromSubscription(sub)) || (isPaidPlan(metaPlan) ? metaPlan : null);
    if (!plan) throw new HttpError(500, 'unknown_plan', 'Pagamento confirmado, mas o plano não foi reconhecido. Avise o suporte.');
    const { end } = currentPeriod(sub);

    const userRef = adminDb.collection('users').doc(user.uid);
    const snap = await userRef.get();
    const current = snap.data() || {};

    await userRef.set({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: 'active',
      currentPeriodEnd: end ? new Date(end).toISOString() : null,
      plan,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Concede os créditos iniciais só se o webhook ainda não concedeu para esta assinatura.
    const alreadyGranted = current.stripeSubscriptionId === subscriptionId && current.creditsResetAt;
    if (!alreadyGranted) {
      await grantCredits(user.uid, PLAN_CONFIGS[plan].credits, 'checkout_confirmed', {
        plan,
        stripeSubscriptionId: subscriptionId,
        creditsResetAt: new Date().toISOString(),
      });
    }

    // Compra: o mesmo id (sessão da Stripe) no servidor e no navegador evita contagem dupla na Meta.
    const value = (session.amount_total ?? 0) / 100;
    const consent = session.metadata?.mkt_consent === 'granted';
    if (consent && !alreadyGranted) {
      await sendMetaEvent({
        name: 'Purchase', eventId: session.id, email: user.email, externalId: user.uid,
        fbp: session.metadata?.fbp, fbc: session.metadata?.fbc,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(), userAgent: req.headers.get('user-agent'),
        sourceUrl: `${req.headers.get('origin') || ''}/dashboard`, value, currency: (session.currency || 'brl').toUpperCase(), contentName: plan,
      });
    }

    const purchase = consent && !alreadyGranted ? { eventId: session.id, value, currency: (session.currency || 'brl').toUpperCase(), plan } : null;
    return NextResponse.json({ success: true, activated: true, plan, data: { purchase } });
  } catch (error) {
    return errorResponse(error);
  }
}
