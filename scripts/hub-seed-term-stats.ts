/**
 * Semeia a memória por termo do Hub a partir da última coleta automática (uma vez): baixa de novo
 * o resultado dessa execução no Apify (leitura do dataset, sem custo), conta os repetidos por termo
 * e grava `terms.{termo}` em cada fonte, com a pausa correspondente.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/hub-seed-term-stats.ts           # só mostra
 *   npx tsx --tsconfig tsconfig.json scripts/hub-seed-term-stats.ts --apply   # grava
 */
import { FieldPath } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const norm = (u: string) => { let x = u; try { x = decodeURIComponent(u); } catch { /* */ } return x.toLowerCase().split('?')[0].replace(/\/+$/, ''); };

(async () => {
  const { adminDb } = await import('../src/lib/firebase/admin');
  const { cooldownDays, cleanSourceValue, sourceUrl } = await import('../src/lib/server/hub/collect');
  const token = process.env.APIFY_API_TOKEN!;
  const runSnap = await adminDb.collection('hub_runs').orderBy('createdAt', 'desc').limit(10).get();
  const runDoc = runSnap.docs.find((d: any) => d.get('kind') === 'auto' && d.get('status') === 'ingested')!;
  const run = await fetch(`https://api.apify.com/v2/actor-runs/${runDoc.id}?token=${token}`).then(r => r.json());
  const items: any[] = await fetch(`https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${token}&clean=true`).then(r => r.json());
  const createdAt = runDoc.get('createdAt');
  console.log('execução', runDoc.id, createdAt, '| itens', items.length);

  const sources = await adminDb.collection('hub_sources').where('active', '==', true).get();
  const byUrl: Record<string, { id: string; term: string }> = {};
  sources.docs.forEach((d: any) => { if (d.get('type') !== 'profile') byUrl[norm(sourceUrl('keyword', d.get('value')))] = { id: d.id, term: cleanSourceValue(d.get('value')) }; });

  const codes = Array.from(new Set(items.filter(i => i?.shortCode).map(i => i.shortCode)));
  const before = new Set<string>();
  for (let i = 0; i < codes.length; i += 100) {
    const snaps = await adminDb.getAll(...codes.slice(i, i + 100).map(c => adminDb.collection('hub_videos').doc(c)));
    snaps.forEach((s: any) => { if (s.exists && s.get('runId') !== runDoc.id) before.add(s.id); });
  }
  const per: Record<string, { received: number; repeated: number; fresh: number }> = {};
  const seen = new Set<string>();
  for (const it of items) {
    if (!it?.shortCode || !(it.type === 'Video' || it.productType === 'clips')) continue;
    const u = norm(String(it.inputUrl || ''));
    if (!byUrl[u]) continue;
    const st = (per[u] ||= { received: 0, repeated: 0, fresh: 0 });
    st.received++;
    if (before.has(it.shortCode) || seen.has(it.shortCode)) st.repeated++; else st.fresh++;
    seen.add(it.shortCode);
  }
  for (const [u, src] of Object.entries(byUrl)) {
    const st = per[u] || { received: 0, repeated: 0, fresh: 0 };
    const days = cooldownDays(st.received, st.repeated);
    const until = days ? new Date(Date.parse(createdAt) + days * 86_400_000).toISOString() : null;
    console.log(`${src.term.padEnd(34)} recebidos ${String(st.received).padStart(3)} repetidos ${String(st.repeated).padStart(3)} (${st.received ? Math.round(100 * st.repeated / st.received) : 0}%) → ${until ? `pausa até ${until.slice(0, 10)}` : 'livre'}`);
    if (apply) await adminDb.collection('hub_sources').doc(src.id).update(new FieldPath('terms', src.term), { lastRunAt: createdAt, ...st, cooldownUntil: until });
  }
  console.log(apply ? 'GRAVADO' : 'Simulação: use --apply para gravar.');
})().catch(e => { console.error('ERRO', e.message); process.exit(1); });
