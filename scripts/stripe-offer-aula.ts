/**
 * Cupons da oferta da aula (/aula), um por ciclo, presos aos produtos Start, Pro e Elite daquele ciclo.
 * Não têm código promocional: só entram pelo checkout da página da aula (src/app/api/stripe/checkout).
 *
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/stripe-offer-aula.ts          # só confere
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/stripe-offer-aula.ts --apply  # cria o que falta
 */
import Stripe from 'stripe';
import { AULA_OFFER, BILLING_CYCLES, BillingCycle, PlanId } from '../src/lib/planConfig';

const apply = process.argv.includes('--apply');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const envName = (p: PlanId, c: BillingCycle) => `STRIPE_PRODUCT_${p.toUpperCase()}${c === 'monthly' ? '' : c === 'quarterly' ? '_QUARTERLY' : '_ANNUAL'}`;

async function productId(plan: PlanId, cycle: BillingCycle) {
  const envId = process.env[envName(plan, cycle)];
  if (envId) {
    const p = await stripe.products.retrieve(envId).catch(() => null);
    if (p?.active) return p.id;
  }
  const found = await stripe.products.search({ query: `active:'true' AND metadata['plan']:'${plan}' AND metadata['cycle']:'${cycle}'`, limit: 1 });
  return found.data[0]?.id || null;
}

(async () => {
  console.log(apply ? 'MODO: aplicar' : 'MODO: só conferir (use --apply para criar)');
  for (const cycle of Object.keys(AULA_OFFER.cycles) as BillingCycle[]) {
    const cfg = AULA_OFFER.cycles[cycle];
    const products = (await Promise.all(AULA_OFFER.plans.map(p => productId(p, cycle)))).filter(Boolean) as string[];
    if (products.length !== AULA_OFFER.plans.length) { console.log(cycle, '✗ faltam produtos', products); continue; }
    const existing = await stripe.coupons.retrieve(cfg.coupon, { expand: ['applies_to'] }).catch(() => null);
    const duration = cfg.invoices > 1 ? `${cfg.invoices} cobranças` : '1ª cobrança';
    if (existing) {
      const same = existing.percent_off === cfg.percentOff && existing.valid
        && [...(existing.applies_to?.products || [])].sort().join() === [...products].sort().join();
      console.log(cfg.coupon.padEnd(18), 'EXISTE', `${existing.percent_off}%`, existing.duration, existing.duration_in_months ?? '', existing.valid ? 'válido' : 'INVÁLIDO', same ? '✓' : '✗ diferente do esperado');
      continue;
    }
    console.log(cfg.coupon.padEnd(18), 'FALTA', `${cfg.percentOff}% · ${duration} · ${BILLING_CYCLES[cycle].label}`, products.join(' '));
    if (apply) {
      // Mensal: "repeating" por 3 meses = as 3 primeiras faturas mensais. Trimestral e anual: só a primeira ("once").
      const c = await stripe.coupons.create({
        id: cfg.coupon,
        name: cycle === 'annual' ? 'Condição da aula · 3 meses pela metade' : cycle === 'monthly' ? 'Condição da aula · 50% por 3 meses' : 'Condição da aula · 50% no 1º trimestre',
        percent_off: cfg.percentOff,
        ...(cfg.invoices > 1 ? { duration: 'repeating' as const, duration_in_months: cfg.invoices } : { duration: 'once' as const }),
        applies_to: { products },
        metadata: { offer: AULA_OFFER.id, cycle },
      });
      console.log('   criado', c.id);
    }
  }
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });
