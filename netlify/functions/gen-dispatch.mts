import { createHash } from 'node:crypto';

/**
 * Fila da geração de imagens e vídeos: a cada minuto, destrava pedidos parados,
 * confere os que estão gerando e envia os que esperam. Só roda no deploy publicado.
 * A chave é a mesma derivada em src/lib/server/generation/queue.ts (dispatchKey).
 */
export default async () => {
  const kieKey = process.env.KIE_AI_API_KEY;
  const site = process.env.URL;
  if (!kieKey || !site) {
    console.error('[gen-dispatch] faltam KIE_AI_API_KEY ou URL');
    return;
  }
  const key = createHash('sha256').update(`gen-dispatch:${kieKey}`).digest('hex').slice(0, 40);
  const res = await fetch(`${site}/api/gen/dispatch`, { method: 'POST', headers: { 'x-gen-key': key } });
  console.log('[gen-dispatch]', res.status, (await res.text()).slice(0, 300));
};

export const config = {
  schedule: '* * * * *',
};
