import { NextResponse } from 'next/server';
import { hubSecret, ingestRun } from '@/lib/server/hub/collect';

export const dynamic = 'force-dynamic';

/** O Apify chama esta rota quando uma coleta do hub termina com sucesso. */
export async function POST(req: Request) {
  if (new URL(req.url).searchParams.get('key') !== hubSecret()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const payload = await req.json().catch(() => ({}));
  const runId = payload?.resource?.id || payload?.eventData?.actorRunId;
  const datasetId = payload?.resource?.defaultDatasetId;
  if (!runId || !datasetId) return NextResponse.json({ error: 'payload sem execução' }, { status: 400 });

  try {
    const result = await ingestRun(runId, datasetId);
    return NextResponse.json({ received: true, ...result });
  } catch (e) {
    console.error('[hub] falha ao receber coleta', runId, e);
    // 500 faz o Apify tentar de novo.
    return NextResponse.json({ error: 'falha ao processar' }, { status: 500 });
  }
}
