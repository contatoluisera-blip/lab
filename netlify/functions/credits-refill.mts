import { createHash } from 'node:crypto';

/**
 * Recarga mensal de créditos dos planos trimestral e anual (a fatura cobre vários meses,
 * a cota é mensal). De hora em hora; só roda no deploy publicado.
 * A chave é a mesma derivada em src/app/api/billing/refill/route.ts.
 */
export default async () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const site = process.env.URL;
  if (!secret || !site) {
    console.error('[credits-refill] faltam STRIPE_WEBHOOK_SECRET ou URL');
    return;
  }
  const key = createHash('sha256').update(`credits-refill:${secret}`).digest('hex').slice(0, 40);
  const res = await fetch(`${site}/api/billing/refill`, { method: 'POST', headers: { 'x-refill-key': key } });
  console.log('[credits-refill]', res.status, (await res.text()).slice(0, 300));
};

export const config = {
  schedule: '0 * * * *',
};
