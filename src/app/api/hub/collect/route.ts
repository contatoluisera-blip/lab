import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { SEARCH_ACTOR, cleanSourceValue, getSettings, hubSecret, sourceUrl, startHubRun } from '@/lib/server/hub/collect';
import { APIFY_ACTOR } from '@/lib/server/diagnosis/analyze';
import { HubSourceType } from '@/lib/hub';
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

    const sources: { type: HubSourceType; value: string; nicho: string }[] = snap.docs.map((d: any) => d.data());
    const keywords = sources.filter(s => s.type !== 'profile');
    const profiles = sources.filter(s => s.type === 'profile');
    const origin = requestOrigin(req);
    const runIds: string[] = [];

    // Palavras-chave: reels em alta (uma execução para todas, separadas por vírgula).
    if (keywords.length) {
      runIds.push(await startHubRun({
        origin, kind: 'auto', requestedBy, actor: SEARCH_ACTOR,
        input: { search: keywords.map(s => cleanSourceValue(s.value)).join(', '), searchType: 'popular', searchLimit: settings.perSource },
        urls: keywords.map(s => ({ url: sourceUrl('keyword', s.value), nicho: s.nicho })),
      }));
    }
    // Perfis de referência: reels mais recentes de cada perfil.
    if (profiles.length) {
      const urls = profiles.map(s => ({ url: sourceUrl('profile', s.value), nicho: s.nicho }));
      runIds.push(await startHubRun({
        origin, kind: 'auto', requestedBy, actor: APIFY_ACTOR,
        input: { directUrls: urls.map(u => u.url), resultsType: 'reels', resultsLimit: settings.perSource, addParentData: false },
        urls,
      }));
    }
    return NextResponse.json({ success: true, runIds, sources: sources.length });
  } catch (error) {
    return errorResponse(error);
  }
}
