import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { planName } = await req.json();
    
    // Validate Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminAuth) {
      console.error('Firebase Admin não foi inicializado. Verifique as chaves FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no Netlify.');
      return NextResponse.json({ error: 'Erro de configuração do servidor. Chaves do Firebase ausentes no Netlify.' }, { status: 500 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!planName) {
      return NextResponse.json({ error: 'Plan name required' }, { status: 400 });
    }

    let productId = '';
    const normalizedPlan = planName.toLowerCase();
    // Fallback para os IDs fixos que foram criados no painel do Stripe
    if (normalizedPlan === 'start') productId = process.env.STRIPE_PRODUCT_START || 'prod_UZ1PmZZS5Z9KTY';
    else if (normalizedPlan === 'pro') productId = process.env.STRIPE_PRODUCT_PRO || 'prod_UZ1fjWSTPbzrJe';
    else if (normalizedPlan === 'elite') productId = process.env.STRIPE_PRODUCT_ELITE || 'prod_UZ1fwptRpKDIWW';

    if (!productId) {
      return NextResponse.json({ error: 'Invalid plan name or missing Product ID in env' }, { status: 400 });
    }

    // Retrieve the Product's default Price ID
    const product = await stripe.products.retrieve(productId);
    if (!product.default_price) {
       return NextResponse.json({ error: 'No default price set for this product in Stripe' }, { status: 400 });
    }
    const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price.id;

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId,
      allow_promotion_codes: true,
      metadata: {
        planName: normalizedPlan
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout_success=true&plan=${planName}`,
      cancel_url: `${origin}/dashboard/billing?checkout_canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
