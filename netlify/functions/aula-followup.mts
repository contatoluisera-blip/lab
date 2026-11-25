import { createHash } from 'node:crypto';

/**
 * Lembrete da oferta para os leads da aula (2 dias depois de liberar a aula). De hora em hora;
 * só roda no deploy publicado. A chave é a mesma de src/lib/server/aulaEmails.ts (followupKey).
 */
export default async () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const site = process.env.URL;
  if (!secret || !site) {
    console.error('[aula-followup] faltam STRIPE_WEBHOOK_SECRET ou URL');
    return;
  }
  const key = createHash('sha256').update(`aula-followup:${secret}`).digest('hex').slice(0, 40);
  const res = await fetch(`${site}/api/aula/followup`, { method: 'POST', headers: { 'x-followup-key': key } });
  console.log('[aula-followup]', res.status, (await res.text()).slice(0, 300));
};

export const config = {
  schedule: '15 * * * *',
};
