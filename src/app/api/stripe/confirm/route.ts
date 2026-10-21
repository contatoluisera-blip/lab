import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { currentPeriod, productIdFromSubscription, stripeClient } from '@/lib/server/stripe';
import { PLAN_CONFIGS, isPaidPlan, planFromStripeProduct } from '@/lib/planConfig';
import { grantCredits } from '@/lib/server/credits';

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

    return NextResponse.json({ success: true, activated: true, plan });
  } catch (error) {
    return errorResponse(error);
  }
}
