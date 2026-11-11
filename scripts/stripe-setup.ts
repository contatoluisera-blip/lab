/**
 * Confere e cria os produtos de assinatura na Stripe (um por plano e ciclo), com o preço da
 * tabela em src/lib/planConfig.ts e os metadados `plan` e `cycle` que o webhook lê.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/stripe-setup.ts          # só confere (leitura)
 *   npx tsx --tsconfig tsconfig.json scripts/stripe-setup.ts --apply  # cria o que falta e marca os existentes
 *
 *   ... --apply --fix-prices  # também troca o preço de produtos SEM assinante ativo (cria o novo, arquiva o antigo)
 *
 * Produto com assinante ativo nunca tem o preço trocado: só aponta a diferença.
 */
import Stripe from 'stripe';
import { BILLING_CYCLES, BillingCycle, PLAN_CONFIGS, PlanId, cycleTotal } from '../src/lib/planConfig';

const apply = process.argv.includes('--apply');
const fixPrices = apply && process.argv.includes('--fix-prices');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const PLANS: PlanId[] = ['start', 'pro', 'elite', 'agency'];
const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'annual'];
const envName = (p: PlanId, c: BillingCycle) => `STRIPE_PRODUCT_${p.toUpperCase()}${c === 'monthly' ? '' : c === 'quarterly' ? '_QUARTERLY' : '_ANNUAL'}`;
const recurring = (c: BillingCycle) => (c === 'annual' ? { interval: 'year' as const, interval_count: 1 } : { interval: 'month' as const, interval_count: BILLING_CYCLES[c].months });

(async () => {
  console.log(apply ? 'MODO: aplicar' : 'MODO: só conferir (use --apply para criar)');
  for (const plan of PLANS) for (const cycle of CYCLES) {
    const want = Math.round(cycleTotal(plan, cycle) * 100);
    const label = `${plan}/${cycle}`.padEnd(18);
    const envId = process.env[envName(plan, cycle)];
    let product: Stripe.Product | null = envId ? await stripe.products.retrieve(envId).catch(() => null) : null;
    if (!product) {
      const found = await stripe.products.search({ query: `active:'true' AND metadata['plan']:'${plan}' AND metadata['cycle']:'${cycle}'`, limit: 1 });
      product = found.data[0] || null;
    }
    if (product) {
      const priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;
      const price = priceId ? await stripe.prices.retrieve(priceId) : null;
      const rec = price?.recurring ? `${price.recurring.interval_count}×${price.recurring.interval}` : 'sem recorrência';
      const ok = price?.unit_amount === want && price?.recurring?.interval === recurring(cycle).interval && price?.recurring?.interval_count === recurring(cycle).interval_count;
      const tagged = product.metadata?.plan === plan && product.metadata?.cycle === cycle;
      console.log(label, 'EXISTE', product.id, `"${product.name}"`, `R$ ${((price?.unit_amount || 0) / 100).toFixed(2)} ${rec}`, ok ? '✓ preço certo' : `✗ esperado R$ ${(want / 100).toFixed(2)}`, tagged ? '' : '(sem metadados)');
      if (apply && !tagged) await stripe.products.update(product.id, { metadata: { plan, cycle } });
      if (!ok && fixPrices && priceId) {
        const subs = await stripe.subscriptions.list({ price: priceId, status: 'active', limit: 1 });
        if (subs.data.length) {
          console.log('   preço mantido: há assinante ativo neste preço');
        } else {
          const fresh = await stripe.prices.create({ product: product.id, currency: 'brl', unit_amount: want, recurring: recurring(cycle) });
          await stripe.products.update(product.id, { default_price: fresh.id });
          await stripe.prices.update(priceId, { active: false });
          console.log('   preço trocado para', fresh.id, `R$ ${(want / 100).toFixed(2)}`, '(antigo arquivado)');
        }
      }
    } else {
      console.log(label, 'FALTA', `criar R$ ${(want / 100).toFixed(2)} ${recurring(cycle).interval_count}×${recurring(cycle).interval}`);
      if (apply) {
        const created = await stripe.products.create({
          name: `Creator Lab ${PLAN_CONFIGS[plan].label} · ${BILLING_CYCLES[cycle].label}`,
          metadata: { plan, cycle },
          default_price_data: { currency: 'brl', unit_amount: want, recurring: recurring(cycle) },
        });
        console.log('   criado', created.id);
      }
    }
  }
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });
