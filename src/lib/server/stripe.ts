import Stripe from 'stripe';
import { HttpError } from './auth';

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
