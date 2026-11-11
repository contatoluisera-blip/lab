import { NextResponse } from 'next/server';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { productForPlan, stripeClient } from '@/lib/server/stripe';
import { adminDb } from '@/lib/firebase/admin';
import { getAccountState } from '@/lib/accountState';
import { BILLING_CYCLES, BillingCycle, TOPUP_PACKS, TOPUP_VALID_DAYS, isPaidPlan, topupPrice } from '@/lib/planConfig';

export const dynamic = 'force-dynamic';

/**
 * Cria a sessão de checkout da Stripe para o usuário logado:
 * - assinatura: plano (start, pro, elite, agency) e ciclo (mensal, trimestral, anual);
 * - recarga: pagamento único de um pacote de créditos avulsos (só com assinatura ativa).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const stripe = stripeClient();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const profile = (await adminDb.collection('users').doc(user.uid).get()).data() || {};
    // Mesmo cliente da Stripe da assinatura, quando existe (recarga e troca de plano no mesmo cadastro).
    const customer = typeof profile.stripeCustomerId === 'string' && profile.stripeCustomerId ? { customer: profile.stripeCustomerId } : { customer_email: user.email ?? undefined };

    // ── Recarga avulsa ────────────────────────────────────────────────────
    if (body.topup !== undefined) {
      const credits = Number(body.topup);
      if (!TOPUP_PACKS.includes(credits)) throw new HttpError(400, 'bad_topup', 'Pacote de recarga inválido.');
      if (getAccountState(profile).status !== 'active') {
        throw new HttpError(403, 'topup_needs_plan', 'A recarga é para quem tem assinatura ativa. Escolha um plano primeiro.');
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ...customer,
        client_reference_id: user.uid,
        metadata: { kind: 'topup', credits: String(credits) },
        payment_intent_data: { metadata: { kind: 'topup', credits: String(credits), uid: user.uid } },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(topupPrice(credits) * 100),
            product_data: { name: `Recarga de ${credits} créditos`, description: `Créditos avulsos da Creator Lab, válidos por ${TOPUP_VALID_DAYS} dias.` },
          },
        }],
        success_url: `${origin}/dashboard/billing?topup=ok`,
        cancel_url: `${origin}/dashboard/billing?checkout_canceled=true`,
      });
      return NextResponse.json({ url: session.url });
    }

    // ── Assinatura ────────────────────────────────────────────────────────
    const plan = String(body.planName || '').toLowerCase();
    if (!isPaidPlan(plan)) throw new HttpError(400, 'bad_plan', 'Plano inválido.');
    const cycle: BillingCycle = body.cycle in BILLING_CYCLES ? body.cycle : body.interval === 'year' ? 'annual' : 'monthly';
    const product = await productForPlan(plan, cycle);
    if (!product) throw new HttpError(400, 'plan_unavailable', 'Este plano não está disponível para assinatura no momento.');

    // Consentimento e origem do visitante seguem com o pagamento (atribuição da venda e API de Conversões).
    const mkt = body.marketing || {};
    const last = mkt.attribution?.last || mkt.attribution?.first || {};
    const clip = (v: unknown) => (typeof v === 'string' ? v.slice(0, 200) : '');
    const marketingMeta = {
      mkt_consent: mkt.consent === 'granted' ? 'granted' : 'denied',
      fbp: clip(mkt.fbp), fbc: clip(mkt.fbc),
      utm_source: clip(last.utm_source), utm_medium: clip(last.utm_medium),
      utm_campaign: clip(last.utm_campaign), utm_content: clip(last.utm_content),
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...customer,
      client_reference_id: user.uid,
      allow_promotion_codes: true,
      metadata: { planName: plan, cycle, interval: cycle, ...marketingMeta },
      line_items: [{ price: product.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing?checkout_canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
