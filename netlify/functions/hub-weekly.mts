import { createHash } from 'node:crypto';

/**
 * Rotina semanal do Hub de Referências: toda segunda, 9h (Brasília),
 * dispara a coleta automática. Só roda no deploy publicado (site oficial).
 * A chave é a mesma derivada em src/lib/server/hub/collect.ts (hubSecret).
 */
export default async () => {
  const token = process.env.APIFY_API_TOKEN;
  const site = process.env.URL;
  if (!token || !site) {
    console.error('[hub-weekly] faltam APIFY_API_TOKEN ou URL');
    return;
  }
  const key = createHash('sha256').update(`hub:${token}`).digest('hex').slice(0, 40);
  const res = await fetch(`${site}/api/hub/collect`, { method: 'POST', headers: { 'x-hub-key': key, 'Content-Type': 'application/json' }, body: '{}' });
  console.log('[hub-weekly] coleta', res.status, await res.text());
};

export const config = {
  schedule: '0 12 * * 1',
};
