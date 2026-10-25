import { createHash, randomUUID } from 'crypto';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { describeApifyError, APIFY_ACTOR } from '@/lib/server/diagnosis/analyze';
import { viralScore } from '@/lib/hub';

/**
 * Chave dos chamados automáticos (webhook do Apify e rotina semanal).
 * Derivada do token do Apify, para não exigir mais uma variável de ambiente;
 * a função agendada da Netlify calcula a mesma chave.
 */
export function hubSecret() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new HttpError(503, 'provider_unconfigured', 'O token do Apify não está configurado no servidor.');
  return createHash('sha256').update(`hub:${token}`).digest('hex').slice(0, 40);
}

export interface HubSettings {
  /** Views mínimas para um reel da coleta automática entrar na fila. */
  minViews: number;
  /** Quantos posts buscar por hashtag/perfil em cada coleta. */
  perSource: number;
}

export const DEFAULT_SETTINGS: HubSettings = { minViews: 30_000, perSource: 30 };

export async function getSettings(): Promise<HubSettings> {
  const snap = await adminDb.collection('hub_settings').doc('config').get();
  return { ...DEFAULT_SETTINGS, ...(snap.exists ? snap.data() : {}) };
}

function normalizeUrl(u: string) {
  return u.toLowerCase().split('?')[0].replace(/\/+$/, '');
}

export function sourceUrl(type: 'hashtag' | 'profile', value: string) {
  const v = value.replace(/^[#@]/, '').trim().toLowerCase();
  return type === 'hashtag' ? `https://www.instagram.com/explore/tags/${v}/` : `https://www.instagram.com/${v}/`;
}

/**
 * Dispara uma execução no Apify com webhook avulso: quando termina,
 * o Apify chama /api/hub/apify-webhook e os reels entram na fila.
 */
export async function startHubRun(opts: {
  origin: string;
  kind: 'auto' | 'manual';
  urls: { url: string; nicho: string | null }[];
  resultsType: 'posts' | 'details';
  resultsLimit: number;
  requestedBy: string;
}) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new HttpError(503, 'provider_unconfigured', 'O token do Apify não está configurado no servidor.');

  const webhooks = Buffer.from(JSON.stringify([{
    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
    requestUrl: `${opts.origin}/api/hub/apify-webhook?key=${hubSecret()}`,
  }])).toString('base64');

  const res = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${token}&webhooks=${encodeURIComponent(webhooks)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: opts.urls.map(u => u.url),
      resultsType: opts.resultsType,
      resultsLimit: opts.resultsLimit,
      addParentData: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.id) throw describeApifyError(res.status, data);

  const nichoByUrl: Record<string, string | null> = {};
  for (const u of opts.urls) nichoByUrl[normalizeUrl(u.url)] = u.nicho;

  await adminDb.collection('hub_runs').doc(data.data.id).set({
    kind: opts.kind,
    nichoByUrl,
    status: 'running',
    requestedBy: opts.requestedBy,
    createdAt: new Date().toISOString(),
  });
  return data.data.id as string;
}

/** Guarda a miniatura no Storage (os links do Instagram expiram em poucos dias). */
async function storeThumb(shortCode: string, imageUrl: string): Promise<string | null> {
  if (!adminStorage || !imageUrl) return null;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 2_000_000) return null;
    const bucket = adminStorage.bucket();
    const path = `hub/thumbs/${shortCode}.jpg`;
    const downloadToken = randomUUID();
    await bucket.file(path).save(buffer, {
      metadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000', metadata: { firebaseStorageDownloadTokens: downloadToken } },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
  } catch (e) {
    console.error('[hub] miniatura falhou', shortCode, e);
    return null;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

/**
 * Recebe o resultado de uma execução: filtra reels, calcula a nota de viralidade,
 * guarda a miniatura e cria os itens na fila (status "pending").
 * Itens já existentes não são sobrescritos.
 */
export async function ingestRun(runId: string, datasetId: string) {
  const runRef = adminDb.collection('hub_runs').doc(runId);
  const runSnap = await runRef.get();
  if (!runSnap.exists) return { ingested: 0, reason: 'run_desconhecido' };
  const run = runSnap.data()!;
  if (run.status === 'ingested') return { ingested: 0, reason: 'ja_processado' };

  const token = process.env.APIFY_API_TOKEN!;
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`);
  const items: any[] = await res.json().catch(() => []);
  const settings = await getSettings();
  const manual = run.kind === 'manual';

  // Só vídeos; na coleta automática, só acima do mínimo de views.
  const candidates = (Array.isArray(items) ? items : [])
    .filter(it => it?.shortCode && (it.type === 'Video' || it.productType === 'clips'))
    .map(it => {
      const views = Number(it.videoPlayCount ?? it.videoViewCount ?? 0) || 0;
      const likes = Math.max(0, Number(it.likesCount ?? 0) || 0);
      const comments = Math.max(0, Number(it.commentsCount ?? 0) || 0);
      const postedAt = it.timestamp ? new Date(it.timestamp).toISOString() : null;
      return { it, views, likes, comments, postedAt, score: viralScore(views, likes, comments, postedAt) };
    })
    .filter(c => manual || c.views >= settings.minViews);

  // Ignora o que já está no hub ou na fila.
  const unique = Array.from(new Map(candidates.map(c => [c.it.shortCode, c])).values());
  const existing = new Set<string>();
  for (let i = 0; i < unique.length; i += 100) {
    const refs = unique.slice(i, i + 100).map(c => adminDb.collection('hub_videos').doc(c.it.shortCode));
    if (refs.length) (await adminDb.getAll(...refs)).forEach((s: any) => { if (s.exists) existing.add(s.id); });
  }
  // Teto por execução para caber no tempo de resposta do webhook (as miniaturas são baixadas aqui).
  const fresh = unique.sort((a, b) => b.score - a.score).filter(c => !existing.has(c.it.shortCode)).slice(0, 200);

  const thumbs = await mapLimit(fresh, 12, c => storeThumb(c.it.shortCode, c.it.displayUrl));

  const now = new Date().toISOString();
  for (let i = 0; i < fresh.length; i += 400) {
    const batch = adminDb.batch();
    fresh.slice(i, i + 400).forEach((c, j) => {
      const it = c.it;
      const inputUrl = it.inputUrl ? normalizeUrl(String(it.inputUrl)) : '';
      batch.set(adminDb.collection('hub_videos').doc(it.shortCode), {
        shortCode: it.shortCode,
        url: it.url || `https://www.instagram.com/p/${it.shortCode}/`,
        author: it.ownerUsername || '',
        caption: String(it.caption || '').slice(0, 1500),
        hashtags: Array.isArray(it.hashtags) ? it.hashtags.slice(0, 30) : [],
        views: c.views,
        likes: c.likes,
        comments: c.comments,
        durationSec: Number(it.videoDuration) || null,
        postedAt: c.postedAt,
        score: c.score,
        thumb: thumbs[i + j] || it.displayUrl || '',
        sourceNicho: run.nichoByUrl?.[inputUrl] ?? null,
        source: run.kind,
        autoApprove: manual,
        status: 'pending',
        aiStatus: 'todo',
        runId,
        createdAt: now,
      });
    });
    await batch.commit();
  }

  await runRef.update({ status: 'ingested', ingested: fresh.length, received: items.length, finishedAt: now });
  return { ingested: fresh.length, received: Array.isArray(items) ? items.length : 0 };
}
