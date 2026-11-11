// ─────────────────────────────────────────────────────────────
// Fila de geração de imagens e vídeos
//
// Cada pedido vira um documento em `gen_jobs` (id ordenado pelo tempo).
// Ciclo: queued → submitting → processing → finalizing → completed | failed.
// - O disparador envia no máximo GEN_RATE_LIMIT pedidos a cada 10 s (a KIE aceita 20 por conta;
//   o resto fica para a Foto de Estúdio). O excedente espera na fila, em ordem de chegada.
// - A KIE avisa quando termina (callback). Se o aviso não chegar (ex.: localhost), a consulta
//   de status da tela e a rotina de 1 minuto conferem direto na KIE.
// - Falhou em qualquer etapa: o crédito volta uma única vez.
// ─────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { GenConfig, GenJob, GenMode, GenOutput } from '@/lib/generation';
import { ToolId } from '@/lib/planConfig';
import { buildKiePayload, createKieTask, getKieRecord } from './kie';
import { refundFields } from '@/lib/server/credits';

const KIE_KEY = () => process.env.KIE_AI_API_KEY || '';
export const GEN_RATE_LIMIT = 16;
const WINDOW_MS = 10_000;
const PROCESSING_TIMEOUT_MS = 30 * 60_000;
const SUBMITTING_STALE_MS = 2 * 60_000;
const FINALIZING_STALE_MS = 5 * 60_000;
const RECHECK_MS = 12_000;

const jobs = () => adminDb.collection('gen_jobs') as admin.firestore.CollectionReference;
const now = () => new Date().toISOString();

export interface StoredJob extends GenJob {
  inputPaths: { images: string[]; video?: string | null };
  negativePrompt?: string | null;
  kieTaskId?: string | null;
  expectedKieCredits: number;
  kieCreditsConsumed?: number | null;
  costMismatch?: boolean;
  refunded: boolean;
  chargedCredits: number;
  /** Parte paga com créditos avulsos (volta para o avulso no estorno). */
  chargedExtra?: number;
  tool: ToolId;
  lastCheckedAt?: string | null;
  attempts: number;
  /** Título da trilha (Suno). */
  title?: string | null;
}

/** Id em ordem de criação: permite listar as gerações de alguém pela ordem sem índice composto. */
export function newJobId() {
  return `${Date.now().toString().padStart(14, '0')}-${randomUUID().slice(0, 8)}`;
}

// ── Assinaturas (callback da KIE e rotina agendada) ──────────────────────────
function secret(scope: string) {
  return createHash('sha256').update(`${scope}:${KIE_KEY()}`).digest('hex');
}
export function jobSignature(jobId: string) {
  return createHmac('sha256', secret('gen-callback')).update(jobId).digest('hex').slice(0, 32);
}
export function verifyJobSignature(jobId: string, sig: string | null) {
  if (!sig) return false;
  const a = Buffer.from(jobSignature(jobId));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function dispatchKey() {
  return secret('gen-dispatch').slice(0, 40);
}

function callbackUrl(jobId: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.URL || '').replace(/\/$/, '');
  if (!base || /localhost|127\.0\.0\.1/.test(base)) return undefined; // sem endereço público: a consulta de status cobre
  return `${base}/api/gen/callback?job=${encodeURIComponent(jobId)}&sig=${jobSignature(jobId)}`;
}

// ── Estorno único ────────────────────────────────────────────────────────────
async function failJob(jobId: string, error: string, extra: Record<string, unknown> = {}) {
  const ref = jobs().doc(jobId);
  await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const job = snap.data() as StoredJob;
    if (job.status === 'completed' || job.status === 'failed') return;
    const updates: Record<string, unknown> = { status: 'failed', active: false, error, completedAt: now(), ...extra };
    if (!job.refunded && job.chargedCredits > 0) {
      const userRef = adminDb.collection('users').doc(job.uid);
      tx.update(userRef, { ...refundFields(job.chargedCredits, job.chargedExtra), updatedAt: now() });
      tx.set(userRef.collection('credit_ledger').doc(), {
        tool: job.tool, delta: job.chargedCredits, reason: 'generation_failed', jobId, createdAt: now(),
      });
      updates.refunded = true;
    }
    tx.update(ref, updates);
  });
}

// ── Envio para a KIE ─────────────────────────────────────────────────────────
async function signedRead(path: string) {
  const [url] = await adminStorage.bucket().file(path).getSignedUrl({ action: 'read', expires: Date.now() + 24 * 3600_000 });
  return url as string;
}

async function submit(job: StoredJob) {
  const apiKey = KIE_KEY();
  if (!apiKey) return failJob(job.id, 'A geração está indisponível no momento (chave do provedor ausente). Seu crédito foi devolvido.');

  let imageUrls: string[] = [];
  let videoUrl: string | undefined;
  try {
    imageUrls = await Promise.all((job.inputPaths?.images || []).map(signedRead));
    if (job.inputPaths?.video) videoUrl = await signedRead(job.inputPaths.video);
  } catch (e: any) {
    console.error('[gen] falha ao assinar entradas', job.id, e?.message);
    return failJob(job.id, 'Não foi possível ler os arquivos enviados. Seu crédito foi devolvido; envie de novo.');
  }

  const payload = buildKiePayload(job.modelId, job.mode as GenMode, job.config as GenConfig, {
    prompt: job.prompt, negativePrompt: job.negativePrompt || undefined, imageUrls, videoUrl, title: job.title || undefined,
  });
  const result = await createKieTask(apiKey, payload, callbackUrl(job.id));
  const ref = jobs().doc(job.id);

  if (result.ok) {
    await ref.update({ status: 'processing', kieTaskId: result.taskId, submittedAt: now(), lastCheckedAt: now() });
    return;
  }
  if (result.retry && job.attempts < 5) {
    // Limite da KIE ou instabilidade: volta para a fila, na mesma posição.
    await ref.update({ status: 'queued', attempts: admin.firestore.FieldValue.increment(1) });
    return;
  }
  console.error('[gen] KIE recusou', job.id, result.reason, result.message);
  const message = result.reason === 'provider_quota'
    ? 'O provedor de geração está sem saldo. Já avisamos o suporte. Seu crédito foi devolvido.'
    : result.reason === 'provider_rejected'
      ? 'O provedor recusou este pedido (conteúdo ou arquivo não aceito). Seu crédito foi devolvido; ajuste o prompt ou a imagem.'
      : 'O provedor de geração não respondeu. Seu crédito foi devolvido; tente de novo em instantes.';
  await failJob(job.id, message, { providerReason: result.reason, providerMessage: result.message.slice(0, 300) });
}

/**
 * Envia os pedidos da fila respeitando o limite de 10 s. Seguro para rodar em paralelo:
 * cada envio reserva sua vaga e o pedido numa transação.
 */
export async function dispatchQueue(max = GEN_RATE_LIMIT) {
  const metaRef = adminDb.collection('gen_meta').doc('ratelimit') as admin.firestore.DocumentReference;
  let sent = 0;
  for (let i = 0; i < max; i++) {
    const claimed: StoredJob | null = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
      const t = Date.now();
      const meta = await tx.get(metaRef);
      const stamps: number[] = ((meta.data()?.stamps as number[]) || []).filter(s => s > t - WINDOW_MS);
      if (stamps.length >= GEN_RATE_LIMIT) return null;
      const queued = await tx.get(jobs().where('status', '==', 'queued').limit(50));
      if (queued.empty) return null;
      const oldest = queued.docs.reduce((a: any, b: any) => (a.id < b.id ? a : b));
      tx.update(oldest.ref, { status: 'submitting', submittingAt: new Date(t).toISOString() });
      tx.set(metaRef, { stamps: [...stamps, t] });
      return { id: oldest.id, ...oldest.data() } as StoredJob;
    });
    if (!claimed) break;
    await submit(claimed);
    sent++;
  }
  return sent;
}

// ── Conclusão ────────────────────────────────────────────────────────────────
async function storeOutput(job: StoredJob, url: string, index: number, seconds?: number): Promise<GenOutput> {
  const type: GenOutput['type'] = job.kind === 'video' ? 'video' : job.kind === 'audio' ? 'audio' : 'image';
  const extra = seconds ? { seconds: Math.round(seconds * 100) / 100 } : {};
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const contentType = res.headers.get('content-type') || (type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/png');
    const ext = type === 'video' ? 'mp4' : type === 'audio' ? (contentType.includes('wav') ? 'wav' : 'mp3') : contentType.includes('jpeg') ? 'jpg' : 'png';
    const path = `gen-outputs/${job.uid}/${job.id}/${index}.${ext}`;
    const token = randomUUID();
    const bucket = adminStorage.bucket();
    await bucket.file(path).save(Buffer.from(await res.arrayBuffer()), {
      metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
    });
    return {
      url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
      type,
      stored: true,
      path,
      ...extra,
    };
  } catch (e: any) {
    // Sem cópia, o link da KIE ainda vale por 14 dias.
    console.error('[gen] falha ao copiar resultado', job.id, e?.message);
    return { url, type, stored: false, ...extra };
  }
}

/** Confere a geração na KIE e conclui se terminou. Só uma execução conclui (trava "finalizing"). */
export async function refreshJob(jobId: string) {
  const ref = jobs().doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const job = { id: snap.id, ...snap.data() } as StoredJob;
  if (job.status !== 'processing' || !job.kieTaskId) return job.status;

  const record = await getKieRecord(KIE_KEY(), job.kieTaskId);
  await ref.update({ lastCheckedAt: now() });

  if (record.state === 'fail') {
    await failJob(job.id, 'A geração falhou no provedor. Seu crédito foi devolvido; tente ajustar o prompt.', {
      providerMessage: (record.failMsg || '').slice(0, 300),
    });
    return 'failed';
  }
  // Trilha (Suno): "success" chega antes do MP3 final de cada faixa; espera, sem dar como falha.
  if (record.state !== 'success' || (job.kind === 'audio' && record.incomplete)) {
    const started = Date.parse(job.submittedAt || job.createdAt);
    if (Date.now() - started > PROCESSING_TIMEOUT_MS) {
      await failJob(job.id, 'A geração passou de 30 minutos e foi cancelada. Seu crédito foi devolvido.');
      return 'failed';
    }
    return 'processing';
  }
  if (!record.urls.length) {
    await failJob(job.id, 'O provedor terminou sem devolver o arquivo. Seu crédito foi devolvido.');
    return 'failed';
  }

  const claimed = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const s = await tx.get(ref);
    if (s.data()?.status !== 'processing') return false;
    tx.update(ref, { status: 'finalizing', finalizingAt: now() });
    return true;
  });
  if (!claimed) return 'finalizing';

  const outputs = await Promise.all(record.urls.slice(0, 4).map((u, i) => storeOutput(job, u, i, record.durations?.[i])));
  const consumed = record.creditsConsumed ?? null;
  const costMismatch = consumed != null && consumed > job.expectedKieCredits * 1.15;
  if (costMismatch) console.warn('[gen] consumo acima do previsto', job.id, job.modelId, consumed, job.expectedKieCredits);

  await ref.update({
    status: 'completed', active: false, outputs, completedAt: now(),
    kieCreditsConsumed: consumed, costMismatch,
  });
  return 'completed';
}

/** Rotina de manutenção: destrava pedidos parados e confere os que estão gerando. */
export async function sweep() {
  const t = Date.now();
  const stuck = await jobs().where('status', 'in', ['submitting', 'finalizing']).limit(50).get();
  for (const d of stuck.docs) {
    const data = d.data() as StoredJob & { submittingAt?: string; finalizingAt?: string };
    if (data.status === 'submitting' && t - Date.parse(data.submittingAt || data.createdAt) > SUBMITTING_STALE_MS) {
      await d.ref.update({ status: 'queued' });
    }
    if (data.status === 'finalizing' && t - Date.parse(data.finalizingAt || data.createdAt) > FINALIZING_STALE_MS) {
      await d.ref.update({ status: 'processing' });
    }
  }
  const processing = await jobs().where('status', '==', 'processing').limit(100).get();
  let checked = 0;
  for (const d of processing.docs) {
    const data = d.data() as StoredJob;
    if (t - Date.parse(data.lastCheckedAt || data.createdAt) < RECHECK_MS) continue;
    await refreshJob(d.id).catch(e => console.error('[gen] sweep refresh', d.id, e?.message));
    checked++;
  }
  return { reset: stuck.size, checked };
}

/** Posição de cada pedido na fila (1 = próximo a sair). */
export async function queuePositions(ids: string[]) {
  if (!ids.length) return {};
  const queued = await jobs().where('status', '==', 'queued').select().get();
  const order = queued.docs.map((d: any) => d.id).sort();
  return Object.fromEntries(ids.map(id => [id, order.indexOf(id) + 1 || null]));
}

/** Se o pedido do usuário pode ser atualizado agora (sem consultar a KIE demais). */
export function shouldRecheck(job: StoredJob) {
  return job.status === 'processing' && Date.now() - Date.parse(job.lastCheckedAt || job.createdAt) > RECHECK_MS;
}

export { failJob };
