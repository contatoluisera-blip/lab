import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { HttpError, requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { grantCredits } from '@/lib/server/credits';
import { PLAN_CONFIGS, isPaidPlan } from '@/lib/planConfig';
import { getAccountState } from '@/lib/accountState';

export const dynamic = 'force-dynamic';

/**
 * Concede plano e créditos a uma conta pelo e-mail (contas sem assinatura na Stripe,
 * cortesias, testes). Registra quem concedeu no perfil e no extrato de créditos.
 * Não mexe na Stripe: se a conta tiver assinatura ativa, a Stripe continua mandando na renovação.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const { email, plan, credits } = await req.json().catch(() => ({}));

    if (!email || typeof email !== 'string') throw new HttpError(400, 'missing_email', 'Informe o e-mail da conta.');
    if (plan !== 'free' && !isPaidPlan(plan)) throw new HttpError(400, 'invalid_plan', 'Plano inválido.');

    const amount = credits === undefined || credits === '' || credits === null
      ? (isPaidPlan(plan) ? PLAN_CONFIGS[plan].credits : 0)
      : Number(credits);
    if (!Number.isInteger(amount) || amount < 0 || amount > 10000) {
      throw new HttpError(400, 'invalid_credits', 'Créditos devem ser um número inteiro entre 0 e 10000.');
    }

    let uid: string;
    try {
      uid = (await adminAuth!.getUserByEmail(email.trim().toLowerCase())).uid;
    } catch {
      throw new HttpError(404, 'user_not_found', 'Nenhuma conta cadastrada com esse e-mail.');
    }

    const ref = adminDb.collection('users').doc(uid);
    if (!(await ref.get()).exists) throw new HttpError(404, 'profile_missing', 'A conta existe, mas ainda não tem perfil. Peça para a pessoa entrar uma vez no app.');

    await grantCredits(uid, amount, 'admin_grant', {
      plan,
      manualGrant: { by: admin.email, at: new Date().toISOString() },
    });

    const state = getAccountState((await ref.get()).data());
    return NextResponse.json({ success: true, account: state });
  } catch (error) {
    return errorResponse(error);
  }
}
