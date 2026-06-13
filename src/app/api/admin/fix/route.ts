import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Busca todos os usuários com plano 'free'
    const snapshot = await adminDb.collection('users').where('plan', '==', 'free').get();
    
    let count = 0;
    const batch = adminDb.batch();
    const docsToProcess: any[] = [];

    snapshot.docs.forEach(doc => {
      docsToProcess.push(doc);
    });

    for (const doc of docsToProcess) {
      const userData = doc.data();
      const subId = userData.stripeSubscriptionId;
      
      let correctPlan = 'free';

      if (subId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const productId = subscription.items.data[0]?.price?.product as string;

          if (productId === process.env.STRIPE_PRODUCT_START) correctPlan = 'start';
          else if (productId === process.env.STRIPE_PRODUCT_PRO) correctPlan = 'pro';
          else if (productId === process.env.STRIPE_PRODUCT_ELITE) correctPlan = 'elite';
          else {
            // Se por acaso o env não estiver batendo, podemos tentar checar o nome do produto ou apenas manter pro
            // Mas vamos assumir que o Stripe retornará o ID do produto correto
          }
        } catch (err) {
          console.error(`Erro ao buscar assinatura ${subId} no Stripe:`, err);
        }
      }

      // Se achou o plano correto ou se quer forçar algum comportamento, atualizamos.
      // Se correctPlan continuar 'free' (por falta de subId ou falha no Stripe), não alteramos para não quebrar.
      if (correctPlan !== 'free') {
        batch.update(doc.ref, { plan: correctPlan, updatedAt: new Date().toISOString() });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, message: `Corrigidos ${count} usuários de Free para Elite.` });
  } catch (error: any) {
    console.error('Fix Users Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
