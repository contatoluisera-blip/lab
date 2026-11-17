// Coleta do Hub: escolhe o termo da vez de cada fonte (fora de pausa, com variações quando o termo
// satura) e dispara as execuções no Apify. Usada pela rota /api/hub/collect e por scripts/hub-collect-now.ts.

import { adminDb } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { APIFY_ACTOR } from '@/lib/server/diagnosis/analyze';
import { HubSourceType } from '@/lib/hub';
import { SEARCH_ACTOR, TermStats, cleanSourceValue, getSettings, pickTerm, sourceUrl, startHubRun, termAvailable } from './collect';
import { MAX_VARIANTS, newSearchVariants } from './variants';

export async function startCollection(opts: { origin: string; requestedBy: string; webhook?: boolean }) {
  const { origin, requestedBy } = opts;
  const snap = await adminDb.collection('hub_sources').where('active', '==', true).get();
  if (snap.empty) throw new HttpError(400, 'no_sources', 'Nenhuma fonte ativa. Cadastre nichos e hashtags no /admin.');
  const settings = await getSettings();

  type Source = { id: string; type: HubSourceType; value: string; nicho: string; variants?: string[]; terms?: Record<string, TermStats> };
  const sources: Source[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  const keywords = sources.filter(s => s.type !== 'profile');
  const profiles = sources.filter(s => s.type === 'profile');
  const runIds: string[] = [];

  // Palavras-chave: um termo por fonte, fora de pausa. Termo saturado (só reels repetidos) dá lugar
  // a uma variação do mesmo nicho; sem nenhuma livre, o Claude sugere novas (até MAX_VARIANTS).
  const picks: { source: Source; term: string }[] = [];
  const paused: { value: string; until: string | null }[] = [];
  for (const source of keywords) {
    let { term, candidates } = pickTerm(source);
    if (!term && (source.variants?.length || 0) < MAX_VARIANTS) {
      const empty = candidates.filter(t => source.terms?.[t] && !source.terms[t].received);
      const fresh = await newSearchVariants(source.nicho, source.value, candidates, empty);
      if (fresh.length) {
        source.variants = [...(source.variants || []), ...fresh].slice(0, MAX_VARIANTS);
        await adminDb.collection('hub_sources').doc(source.id).update({ variants: source.variants });
        term = pickTerm(source).term;
      }
    }
    if (term) picks.push({ source, term });
    else {
      const next = candidates.map(t => source.terms?.[t]?.cooldownUntil).filter(Boolean).sort()[0] || null;
      paused.push({ value: source.value, until: next });
    }
  }
  if (picks.length) {
    runIds.push(await startHubRun({
      origin, kind: 'auto', requestedBy, webhook: opts.webhook, actor: SEARCH_ACTOR,
      input: { search: picks.map(p => p.term).join(', '), searchType: 'popular', searchLimit: settings.perSource },
      urls: picks.map(p => ({ url: sourceUrl('keyword', p.term), nicho: p.source.nicho, sourceId: p.source.id, term: p.term })),
    }));
  }

  // Perfis de referência: só reels publicados depois da última coleta do perfil (nada repetido na origem).
  const liveProfiles = profiles.filter(p => termAvailable(p.terms?.[cleanSourceValue(p.value)]));
  if (liveProfiles.length) {
    const last = liveProfiles.map(p => p.terms?.[cleanSourceValue(p.value)]?.lastRunAt);
    const since = last.every(Boolean) ? last.sort()[0]!.slice(0, 10) : null;
    const urls = liveProfiles.map(s => ({ url: sourceUrl('profile', s.value), nicho: s.nicho, sourceId: s.id, term: cleanSourceValue(s.value) }));
    runIds.push(await startHubRun({
      origin, kind: 'auto', requestedBy, webhook: opts.webhook, actor: APIFY_ACTOR,
      input: { directUrls: urls.map(u => u.url), resultsType: 'reels', resultsLimit: settings.perSource, addParentData: false, ...(since ? { onlyPostsNewerThan: since } : {}) },
      urls,
    }));
  }
  for (const p of profiles.filter(p => !liveProfiles.includes(p))) paused.push({ value: `@${p.value}`, until: p.terms?.[cleanSourceValue(p.value)]?.cooldownUntil || null });

  if (!runIds.length) {
    throw new HttpError(409, 'all_paused', 'Todas as fontes estão em pausa porque só trariam reels repetidos. Cadastre novos nichos ou palavras-chave, ou espere a pausa acabar.');
  }
  return { runIds, sources: picks.length + liveProfiles.length, terms: picks.map(p => p.term), paused };
}
