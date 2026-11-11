// ─────────────────────────────────────────────────────────────
// Fila de renderização da Montagem (mesmo desenho de generation/queue.ts)
//
// Cada exportação vira um documento em `render_jobs`.
// Ciclo: queued → starting → rendering → finalizing → completed | failed.
// - No máximo RENDER_CONCURRENCY renders ao mesmo tempo na AWS; o excedente espera, em ordem.
// - A Remotion avisa quando termina (webhook assinado). Sem aviso, a tela e a rotina de 1 minuto consultam.
// - O MP4 é copiado do S3 para o Firebase Storage (renders/{uid}/{jobId}.mp4).
// - Falhou em qualquer etapa: o crédito volta uma única vez.
// ─────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { Edl, RenderJob } from '@/lib/montagem';
import { lambdaConfig, lambdaProgress, signedLambdaOutput, startLambdaRender } from './lambda';
import { refundFields } from '@/lib/server/credits';

export const RENDER_CONCURRENCY = 5;
const STARTING_STALE_MS = 2 * 60_000;
const RENDERING_TIMEOUT_MS = 15 * 60_000;
const FINALIZING_STALE_MS = 5 * 60_000;

export interface StoredRender extends RenderJob {
  edl: Edl;
  /** Caminhos no Storage de cada geração usada (jobId → path). */
  sourcePaths: Record<string, string>;
  chargedCredits: number;
  chargedExtra?: number;
  refunded: boolean;
  renderId?: string | null;
  bucketName?: string | null;
  serveUrl?: string | null;
  outputPath?: string | null;
  costUsd?: number | null;
  startedAt?: string | null;
  finalizingAt?: string | null;
  attempts: number;
}

const renders = () => adminDb.collection('render_jobs') as admin.firestore.CollectionReference;
const now = () => new Date().toISOString();

export async function failRender(jobId: string, error: string, extra: Record<string, unknown> = {}) {
  const ref = renders().doc(jobId);
  await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const job = snap.data() as StoredRender;
    if (job.status === 'completed' || job.status === 'failed') return;
    const updates: Record<string, unknown> = { status: 'failed', active: false, error, completedAt: now(), ...extra };
    if (!job.refunded && job.chargedCredits > 0) {
      const userRef = adminDb.collection('users').doc(job.uid);
      tx.update(userRef, { ...refundFields(job.chargedCredits, job.chargedExtra), updatedAt: now() });
      tx.set(userRef.collection('credit_ledger').doc(), {
        tool: 'montagem', delta: job.chargedCredits, reason: 'render_failed', jobId, createdAt: now(),
      });
      updates.refunded = true;
    }
    tx.update(ref, updates);
  });
}

async function signedRead(path: string) {
  const [url] = await adminStorage.bucket().file(path).getSignedUrl({ action: 'read', expires: Date.now() + 24 * 3600_000 });
  return url as string;
}

async function start(job: StoredRender) {
  const cfg = lambdaConfig();
  if (!cfg.ready) return failRender(job.id, 'A exportação está indisponível no momento. Seu crédito foi devolvido.');
  let sources: Record<string, string>;
  try {
    const entries = await Promise.all(Object.entries(job.sourcePaths).map(async ([id, path]) => [id, await signedRead(path)] as const));
    sources = Object.fromEntries(entries);
  } catch (e: any) {
    console.error('[render] falha ao assinar arquivos', job.id, e?.message);
    return failRender(job.id, 'Não foi possível ler as cenas do projeto. Seu crédito foi devolvido.');
  }
  try {
    const { renderId, bucketName } = await startLambdaRender(job.id, { edl: job.edl, sources });
    await renders().doc(job.id).update({ status: 'rendering', renderId, bucketName, serveUrl: cfg.serveUrl, startedAt: now(), progress: 0 });
  } catch (e: any) {
    console.error('[render] Lambda recusou', job.id, e?.message);
    if (job.attempts < 3 && /rate|TooManyRequests|throttl/i.test(String(e?.message))) {
      await renders().doc(job.id).update({ status: 'queued', attempts: admin.firestore.FieldValue.increment(1) });
      return;
    }
    await failRender(job.id, 'O servidor de vídeo não respondeu. Seu crédito foi devolvido; tente de novo em instantes.', { providerMessage: String(e?.message || '').slice(0, 300) });
  }
}

/** Inicia os renders da fila respeitando o limite de simultâneos. Seguro para rodar em paralelo. */
export async function dispatchRenders(max = RENDER_CONCURRENCY) {
  let started = 0;
  for (let i = 0; i < max; i++) {
    const claimed: StoredRender | null = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
      const running = await tx.get(renders().where('status', 'in', ['starting', 'rendering']).limit(RENDER_CONCURRENCY));
      if (running.size >= RENDER_CONCURRENCY) return null;
      const queued = await tx.get(renders().where('status', '==', 'queued').limit(50));
      if (queued.empty) return null;
      const oldest = queued.docs.reduce((a: any, b: any) => (a.id < b.id ? a : b));
      tx.update(oldest.ref, { status: 'starting', startingAt: now() });
      return { id: oldest.id, ...oldest.data() } as StoredRender;
    });
    if (!claimed) break;
    await start(claimed);
    started++;
  }
  return started;
}

/** Copia o MP4 do S3 para o Firebase Storage e conclui. Só uma execução conclui (trava "finalizing"). */
export async function finishRender(jobId: string, outKey: string, outBucket: string, costUsd: number | null) {
  const ref = renders().doc(jobId);
  const claimed = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const snap = await tx.get(ref);
    const job = snap.data() as StoredRender | undefined;
    if (!job || job.status !== 'rendering') return null;
    tx.update(ref, { status: 'finalizing', finalizingAt: now(), progress: 1 });
    return { ...job, id: snap.id } as StoredRender;
  });
  if (!claimed) return;
  try {
    const url = await signedLambdaOutput(outBucket, outKey);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const path = `renders/${claimed.uid}/${jobId}.mp4`;
    const token = randomUUID();
    const bucket = adminStorage.bucket();
    await bucket.file(path).save(Buffer.from(await res.arrayBuffer()), {
      metadata: { contentType: 'video/mp4', metadata: { firebaseStorageDownloadTokens: token } },
    });
    await ref.update({
      status: 'completed', active: false, completedAt: now(), outputPath: path, costUsd,
      outputUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
    });
  } catch (e: any) {
    console.error('[render] falha ao salvar', jobId, e?.message);
    await failRender(jobId, 'O vídeo ficou pronto, mas não conseguimos salvá-lo. Seu crédito foi devolvido; exporte de novo.');
  }
}

/** Consulta o andamento na AWS e conclui ou falha. */
export async function refreshRender(jobId: string) {
  const snap = await renders().doc(jobId).get();
  if (!snap.exists) return null;
  const job = { id: snap.id, ...snap.data() } as StoredRender;
  if (job.status !== 'rendering' || !job.renderId || !job.bucketName) return job.status;
  const p = await lambdaProgress(job.renderId, job.bucketName);
  if (p.failed) {
    await failRender(job.id, 'A renderização falhou. Seu crédito foi devolvido; tente de novo.', { providerMessage: String(p.error || '').slice(0, 300), costUsd: p.costUsd });
    return 'failed';
  }
  if (p.done && p.outKey && p.outBucket) {
    await finishRender(job.id, p.outKey, p.outBucket, p.costUsd);
    return 'completed';
  }
  if (job.startedAt && Date.now() - Date.parse(job.startedAt) > RENDERING_TIMEOUT_MS) {
    await failRender(job.id, 'A renderização demorou demais. Seu crédito foi devolvido; tente de novo.');
    return 'failed';
  }
  await renders().doc(job.id).update({ progress: Math.round(p.progress * 100) / 100 });
  return 'rendering';
}

/** Rotina de 1 minuto: destrava travados, confere os que renderizam e esvazia a fila. */
export async function sweepRenders() {
  if (!lambdaConfig().ready) return { skipped: true };
  const active = await renders().where('active', '==', true).limit(100).get();
  const t = Date.now();
  let checked = 0;
  for (const d of active.docs) {
    const job = { id: d.id, ...d.data() } as StoredRender & { startingAt?: string };
    if (job.status === 'starting' && job.startingAt && t - Date.parse(job.startingAt) > STARTING_STALE_MS) {
      await d.ref.update({ status: 'queued' });
    } else if (job.status === 'finalizing' && job.finalizingAt && t - Date.parse(job.finalizingAt) > FINALIZING_STALE_MS) {
      await d.ref.update({ status: 'rendering' });
      await refreshRender(job.id).catch(() => {});
    } else if (job.status === 'rendering') {
      await refreshRender(job.id).catch(e => console.error('[render] sweep', job.id, e?.message));
      checked++;
    }
  }
  const started = await dispatchRenders();
  return { checked, started };
}
