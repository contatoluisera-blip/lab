import Stripe from 'stripe';
import { HttpError } from './auth';
import type { BillingCycle, PlanId } from '@/lib/planConfig';

let cached: Stripe | null = null;

/** Cliente da Stripe criado só quando uma rota precisa (nunca durante o build). */
export function stripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'stripe_unconfigured', 'Pagamentos indisponíveis: chave da Stripe ausente no servidor.');
  }
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  return cached;
}

/**
 * ID do produto de uma linha de fatura. A API nova guarda em `pricing.price_details.product`;
 * versões antigas, em `price.product`. Cobre as duas.
 */
export function productIdFromInvoiceLine(line: any): string | null {
  const modern = line?.pricing?.price_details?.product;
  if (typeof modern === 'string') return modern;
  if (modern?.id) return modern.id;
  const legacy = line?.price?.product;
  if (typeof legacy === 'string') return legacy;
  if (legacy?.id) return legacy.id;
  return null;
}

/** ID da assinatura de uma fatura, no formato novo (`parent.subscription_details`) ou antigo. */
export function subscriptionIdFromInvoice(invoice: any): string | null {
  const modern = invoice?.parent?.subscription_details?.subscription;
  if (typeof modern === 'string') return modern;
  if (modern?.id) return modern.id;
  const legacy = invoice?.subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy?.id) return legacy.id;
  return null;
}

/** ID do produto de uma assinatura (primeiro item). */
export function productIdFromSubscription(sub: any): string | null {
  const product = sub?.items?.data?.[0]?.price?.product;
  if (typeof product === 'string') return product;
  if (product?.id) return product.id;
  return null;
}

/** Período atual da assinatura (em ms). A API nova guarda por item; a antiga, na assinatura. */
export function currentPeriod(sub: any): { start: number | null; end: number | null } {
  const item = sub?.items?.data?.[0];
  const start = item?.current_period_start ?? sub?.current_period_start ?? null;
  const end = item?.current_period_end ?? sub?.current_period_end ?? null;
  return { start: start ? start * 1000 : null, end: end ? end * 1000 : null };
}

/** Intervalo de cobrança do primeiro item: 'month' ou 'year'. */
export function billingInterval(sub: any): 'month' | 'year' | null {
  const interval = sub?.items?.data?.[0]?.price?.recurring?.interval;
  return interval === 'year' || interval === 'month' ? interval : null;
}

// ── Plano e ciclo de um produto da Stripe ────────────────────────────────────

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'annual'];
const PLANS: PlanId[] = ['start', 'pro', 'elite', 'agency'];
const productCache = new Map<string, { plan: PlanId; cycle: BillingCycle } | null>();

/**
 * Plano e ciclo de um produto. Os produtos antigos vêm das variáveis STRIPE_PRODUCT_*;
 * os novos trazem `metadata.plan` e `metadata.cycle` (criados por scripts/stripe-setup.ts).
 */
export async function planForProduct(productId: string | null | undefined): Promise<{ plan: PlanId; cycle: BillingCycle } | null> {
  if (!productId) return null;
  for (const plan of PLANS) {
    const key = `STRIPE_PRODUCT_${plan.toUpperCase()}`;
    if (process.env[key] === productId) return { plan, cycle: 'monthly' };
    if (process.env[`${key}_QUARTERLY`] === productId) return { plan, cycle: 'quarterly' };
    if (process.env[`${key}_ANNUAL`] === productId) return { plan, cycle: 'annual' };
  }
  if (productCache.has(productId)) return productCache.get(productId)!;
  let found: { plan: PlanId; cycle: BillingCycle } | null = null;
  try {
    const product = await stripeClient().products.retrieve(productId);
    const plan = product.metadata?.plan as PlanId;
    const cycle = product.metadata?.cycle as BillingCycle;
    if (PLANS.includes(plan) && CYCLES.includes(cycle)) found = { plan, cycle };
  } catch (e: any) {
    console.error('[stripe] produto não encontrado', productId, e?.message);
  }
  productCache.set(productId, found);
  return found;
}

/** Produto ativo da Stripe para um plano e ciclo (metadados), com o preço padrão dele. */
export async function productForPlan(plan: PlanId, cycle: BillingCycle): Promise<{ productId: string; priceId: string } | null> {
  const stripe = stripeClient();
  const envId = process.env[`STRIPE_PRODUCT_${plan.toUpperCase()}${cycle === 'monthly' ? '' : cycle === 'quarterly' ? '_QUARTERLY' : '_ANNUAL'}`];
  let product: Stripe.Product | null = null;
  if (envId) product = await stripe.products.retrieve(envId).catch(() => null);
  if (!product) {
    const res = await stripe.products.search({ query: `active:'true' AND metadata['plan']:'${plan}' AND metadata['cycle']:'${cycle}'`, limit: 1 });
    product = res.data[0] || null;
  }
  const priceId = product && (typeof product.default_price === 'string' ? product.default_price : product.default_price?.id);
  return product && priceId ? { productId: product.id, priceId } : null;
}
