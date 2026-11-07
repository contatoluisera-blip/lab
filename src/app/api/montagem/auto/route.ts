import * as admin from 'firebase-admin';
import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { DIRECTION_MAX, MONTAGEM_FPS, MONTAGEM_MAX_SECONDS, sanitizeEdl } from '@/lib/montagem';
import { isPaidPlan } from '@/lib/planConfig';
import { loadOwnedProject, projectClips, projects } from '@/lib/server/montagem/projects';
import { autoEdit } from '@/lib/server/montagem/claude';

const DAILY_LIMIT = 30;

/**
 * Primeiro corte com o Claude. Não cobra crédito (o custo entra na exportação),
 * mas tem limite diário por projeto. O plano devolvido já passou pela mesma validação do render.
 */
export const POST = withTool('montagem', async ({ user, body }) => {
  const project = await loadOwnedProject(user.uid, body?.projectId);
  const clips = await projectClips(user.uid, project.id);
  if (!clips.length) throw new HttpError(400, 'no_clips', 'Gere pelo menos uma cena de vídeo neste projeto antes de montar.');

  const today = new Date().toISOString().slice(0, 10);
  const ref = projects().doc(project.id);
  await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const usage = (await tx.get(ref)).data()?.aiUsage || {};
    const count = usage.day === today ? usage.count || 0 : 0;
    if (count >= DAILY_LIMIT) throw new HttpError(429, 'ai_limit', `Você usou as ${DAILY_LIMIT} montagens com IA de hoje neste projeto. Ajuste à mão ou volte amanhã.`);
    tx.update(ref, { aiUsage: { day: today, count: count + 1 } });
  });

  const profile = (await adminDb.collection('users').doc(user.uid).get()).data() || {};
  const plan = profile.plan as string | undefined;
  const maxSeconds = isPaidPlan(plan) ? MONTAGEM_MAX_SECONDS[plan] : 60;
  const direction = typeof body?.direction === 'string' ? body.direction.replace(/\s+/g, ' ').trim().slice(0, DIRECTION_MAX) : '';
  const result = await autoEdit(project, clips, maxSeconds, direction);
  const allowed = Object.fromEntries(clips.map(c => [c.jobId, { sourceFrames: c.sourceFrames, sceneId: c.sceneId }]));
  let edl;
  try {
    edl = sanitizeEdl({ clips: result.clips.map((c, i) => ({ ...c, id: `ai${i}` })), endCard: result.endCard }, project.format, allowed, maxSeconds * MONTAGEM_FPS);
  } catch (e: any) {
    throw new HttpError(502, 'auto_edit_invalid', `A montagem com IA saiu fora das regras (${e.message}). Tente de novo.`);
  }
  return { edl, resumo: result.resumo };
}, { charge: false, logDescription: () => 'Montagem com IA (primeiro corte)' });
