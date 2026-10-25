import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireAdmin } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { DEFAULT_SETTINGS, getSettings, startHubRun } from '@/lib/server/hub/collect';
import { processPending, rebuildCatalog } from '@/lib/server/hub/classify';
import { requestOrigin } from '@/lib/server/hub/origin';
import { HUB_SUGGESTED_SOURCES, shortCodeFromUrl } from '@/lib/hub';

export const dynamic = 'force-dynamic';

const sourceId = (type: string, value: string) => `${type}_${value.replace(/^[#@]/, '').trim().toLowerCase()}`;

/** Painel do hub no /admin: fontes, coleta manual por link, fila de aprovação e itens publicados. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();

    switch (body.action) {
      case 'state': {
        const [sources, settings, pending, approved, runs] = await Promise.all([
          adminDb.collection('hub_sources').get(),
          getSettings(),
          adminDb.collection('hub_videos').where('status', '==', 'pending').get(),
          adminDb.collection('hub_catalog').doc('meta').get(),
          adminDb.collection('hub_runs').orderBy('createdAt', 'desc').limit(5).get(),
        ]);
        return NextResponse.json({
          success: true,
          sources: sources.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.nicho.localeCompare(b.nicho)),
          settings,
          pending: pending.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.score - a.score),
          approvedCount: approved.exists ? approved.data()!.count : 0,
          runs: runs.docs.map((d: any) => ({ id: d.id, ...d.data() })),
        });
      }

      case 'addSource': {
        const type = body.type === 'profile' ? 'profile' : 'hashtag';
        const value = String(body.value || '').replace(/^[#@]/, '').trim().toLowerCase();
        const nicho = String(body.nicho || '').trim();
        if (!/^[a-z0-9._áéíóúâêôãõç]{2,40}$/i.test(value) || !nicho) {
          throw new HttpError(400, 'bad_source', 'Informe o nicho e uma hashtag ou @perfil válido.');
        }
        await adminDb.collection('hub_sources').doc(sourceId(type, value)).set({ type, value, nicho, active: true, createdAt: now });
        return NextResponse.json({ success: true });
      }

      case 'seedSources': {
        const batch = adminDb.batch();
        HUB_SUGGESTED_SOURCES.forEach(s => batch.set(adminDb.collection('hub_sources').doc(sourceId(s.type, s.value)), { ...s, active: true, createdAt: now }, { merge: true }));
        await batch.commit();
        return NextResponse.json({ success: true });
      }

      case 'toggleSource':
        await adminDb.collection('hub_sources').doc(String(body.id)).update({ active: !!body.active });
        return NextResponse.json({ success: true });

      case 'removeSource':
        await adminDb.collection('hub_sources').doc(String(body.id)).delete();
        return NextResponse.json({ success: true });

      case 'saveSettings': {
        const minViews = Math.max(0, Math.min(50_000_000, Number(body.minViews) || DEFAULT_SETTINGS.minViews));
        const perSource = Math.max(5, Math.min(100, Number(body.perSource) || DEFAULT_SETTINGS.perSource));
        await adminDb.collection('hub_settings').doc('config').set({ minViews, perSource });
        return NextResponse.json({ success: true });
      }

      // Curadoria manual: o admin cola links; a coleta busca métricas e miniatura, e a IA classifica.
      case 'manual': {
        const links: string[] = String(body.links || '').split(/\s+/).filter(Boolean);
        const codes = Array.from(new Set(links.map(shortCodeFromUrl).filter(Boolean))) as string[];
        if (!codes.length) throw new HttpError(400, 'no_links', 'Cole pelo menos um link de reel ou post do Instagram.');
        if (codes.length > 30) throw new HttpError(400, 'too_many', 'Envie no máximo 30 links por vez.');
        const nicho = String(body.nicho || '').trim() || null;
        const runId = await startHubRun({
          origin: requestOrigin(req),
          kind: 'manual',
          urls: codes.map(c => ({ url: `https://www.instagram.com/p/${c}/`, nicho })),
          resultsType: 'details',
          resultsLimit: 1,
          requestedBy: admin.email || 'admin',
        });
        return NextResponse.json({ success: true, runId, count: codes.length });
      }

      case 'process':
        return NextResponse.json({ success: true, ...(await processPending(6)) });

      case 'review': {
        const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 200).map(String) : [];
        const decision = body.decision === 'approve' ? 'approved' : 'rejected';
        const batch = adminDb.batch();
        ids.forEach(id => batch.update(adminDb.collection('hub_videos').doc(id), { status: decision, reviewedBy: admin.email, reviewedAt: now, ...(decision === 'approved' ? { approvedAt: now } : {}) }));
        await batch.commit();
        const count = decision === 'approved' ? await rebuildCatalog() : undefined;
        return NextResponse.json({ success: true, count });
      }

      // Tira um vídeo publicado do hub (fica como rejeitado para não voltar na próxima coleta).
      case 'unpublish': {
        await adminDb.collection('hub_videos').doc(String(body.id)).update({ status: 'rejected', reviewedBy: admin.email, reviewedAt: now });
        return NextResponse.json({ success: true, count: await rebuildCatalog() });
      }

      default:
        throw new HttpError(400, 'bad_action', 'Ação desconhecida.');
    }
  } catch (error) {
    return errorResponse(error);
  }
}
