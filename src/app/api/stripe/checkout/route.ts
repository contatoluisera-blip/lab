import { NextResponse } from 'next/server';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { stripeClient } from '@/lib/server/stripe';
import { isPaidPlan } from '@/lib/planConfig';

export const dynamic = 'force-dynamic';

const PRODUCT_BY_PLAN: Record<string, { monthly?: string; annual?: string }> = {
  start: { monthly: process.env.STRIPE_PRODUCT_START, annual: process.env.STRIPE_PRODUCT_START_ANNUAL },
  pro: { monthly: process.env.STRIPE_PRODUCT_PRO, annual: process.env.STRIPE_PRODUCT_PRO_ANNUAL },
  elite: { monthly: process.env.STRIPE_PRODUCT_ELITE, annual: process.env.STRIPE_PRODUCT_ELITE_ANNUAL },
};

/** Cria a sessão de checkout da Stripe para o usuário logado. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const plan = String(body.planName || '').toLowerCase();
    const interval = body.interval === 'year' ? 'annual' : 'monthly';
    if (!isPaidPlan(plan)) throw new HttpError(400, 'bad_plan', 'Plano inválido.');

    const productId = PRODUCT_BY_PLAN[plan][interval];
    if (!productId) throw new HttpError(400, 'plan_unavailable', 'Este plano não está disponível para assinatura no momento.');

    const stripe = stripeClient();
    const product = await stripe.products.retrieve(productId);
    const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;
    if (!priceId) throw new HttpError(500, 'no_price', 'O plano está sem preço configurado na Stripe.');

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email ?? undefined,
      client_reference_id: user.uid,
      allow_promotion_codes: true,
      metadata: { planName: plan, interval },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?checkout_canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
