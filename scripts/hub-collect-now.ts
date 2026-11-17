/**
 * Roda a coleta do Hub agora, com as regras do código local (memória por termo, pausa e variações),
 * sem depender do site publicado: dispara no Apify sem webhook, espera terminar e processa aqui.
 * Os reels entram na fila do /admin/hub para a IA classificar e para aprovação, como na coleta semanal.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/hub-collect-now.ts
 */
(async () => {
  const { startCollection } = await import('../src/lib/server/hub/start');
  const { ingestRun } = await import('../src/lib/server/hub/collect');
  const token = process.env.APIFY_API_TOKEN!;

  const started = await startCollection({ origin: 'https://labcreator.com.br', requestedBy: 'script', webhook: false });
  console.log('Termos desta coleta:', started.terms.join(' · '));
  if (started.paused.length) console.log('Em pausa:', started.paused.map(p => `${p.value} (até ${p.until?.slice(0, 10) || '?'})`).join(' · '));

  for (const runId of started.runIds) {
    let run: any;
    for (let i = 0; i < 120; i++) {
      run = (await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`).then(r => r.json())).data;
      if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) break;
      await new Promise(r => setTimeout(r, 10_000));
    }
    console.log(`Execução ${runId}: ${run.status} · custo US$ ${run.usageTotalUsd?.toFixed?.(3) ?? '?'}`);
    if (run.status !== 'SUCCEEDED') continue;
    const stats = await ingestRun(runId, run.defaultDatasetId);
    console.log('Resultado:', JSON.stringify(stats));
  }
  process.exit(0);
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });
