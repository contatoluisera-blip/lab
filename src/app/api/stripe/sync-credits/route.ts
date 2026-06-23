import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

const PLAN_CREDITS: Record<string, number> = {
  [process.env.STRIPE_PRODUCT_START || '']: 20,
  [process.env.STRIPE_PRODUCT_PRO || '']: 50,
  [process.env.STRIPE_PRODUCT_ELITE || '']: 100,
};

const PLAN_NAMES: Record<string, string> = {
  [process.env.STRIPE_PRODUCT_START || '']: 'start',
  [process.env.STRIPE_PRODUCT_PRO || '']: 'pro',
  [process.env.STRIPE_PRODUCT_ELITE || '']: 'elite',
};

/**
 * POST /api/stripe/sync-credits
 * Resyncs credits for the authenticated user by reading their active Stripe subscription.
 * Useful when the invoice.paid webhook was missed or fired before the handler existed.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    const stripeSubscriptionId = userData?.stripeSubscriptionId;

    if (!stripeCustomerId || !stripeSubscriptionId) {
      return NextResponse.json({ error: 'Nenhuma assinatura Stripe ativa encontrada.' }, { status: 400 });
    }

    // Fetch the live subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['items.data.price.product']
    });

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json({
        error: `Assinatura não está ativa. Status atual: ${subscription.status}`
      }, { status: 400 });
    }

    const productId = subscription.items.data[0]?.price?.product as string;
    const creditsToSet = PLAN_CREDITS[productId];
    const planName = PLAN_NAMES[productId];

    if (!creditsToSet || !planName) {
      return NextResponse.json({ error: 'Plano não reconhecido. Verifique as variáveis de ambiente STRIPE_PRODUCT_*.' }, { status: 400 });
    }

    // Reset credits to the plan limit
    await adminDb.collection('users').doc(userId).update({
      credits: creditsToSet,
      plan: planName,
      stripeSubscriptionStatus: subscription.status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Créditos sincronizados com sucesso! Plano: ${planName}, Créditos: ${creditsToSet}`,
      plan: planName,
      credits: creditsToSet,
    });

  } catch (error: any) {
    console.error('Sync Credits Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
