import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { getSettings, hubSecret, sourceUrl, startHubRun } from '@/lib/server/hub/collect';
import { requestOrigin } from '@/lib/server/hub/origin';
import { HttpError } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Inicia a coleta automática de todas as fontes ativas.
 * Chamada pelo botão "Coletar agora" do /admin ou pela rotina semanal da Netlify
 * (que se identifica com a chave derivada em hubSecret()).
 */
export async function POST(req: Request) {
  try {
    let requestedBy = 'rotina-semanal';
    if (req.headers.get('x-hub-key') !== hubSecret()) {
      requestedBy = (await requireAdmin(req)).email || 'admin';
    }

    const snap = await adminDb.collection('hub_sources').where('active', '==', true).get();
    if (snap.empty) throw new HttpError(400, 'no_sources', 'Nenhuma fonte ativa. Cadastre nichos e hashtags no /admin.');
    const settings = await getSettings();

    const urls = snap.docs.map((d: any) => ({ url: sourceUrl(d.data().type, d.data().value), nicho: d.data().nicho as string }));
    const runId = await startHubRun({ origin: requestOrigin(req), kind: 'auto', urls, resultsType: 'posts', resultsLimit: settings.perSource, requestedBy });
    return NextResponse.json({ success: true, runId, sources: urls.length });
  } catch (error) {
    return errorResponse(error);
  }
}
