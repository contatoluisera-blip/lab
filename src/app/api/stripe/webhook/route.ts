import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          const planName = session.metadata?.planName || 'free';
          // Atualiza o documento do usuário com os dados do Stripe e ativa o plano instantaneamente
          await adminDb.collection('users').doc(userId).set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: 'active',
            plan: planName,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc
        
        const productId = subscription.items.data[0].price.product as string;
        
        let plan = 'free';
        if (status === 'active' || status === 'trialing') {
          if (productId === process.env.STRIPE_PRODUCT_START) plan = 'start';
          else if (productId === process.env.STRIPE_PRODUCT_PRO) plan = 'pro';
          else if (productId === process.env.STRIPE_PRODUCT_ELITE) plan = 'elite';
        }

        // Buscar usuário pelo stripeCustomerId
        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            plan: plan,
            stripeSubscriptionStatus: status,
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            plan: 'free',
            stripeSubscriptionStatus: 'canceled',
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
