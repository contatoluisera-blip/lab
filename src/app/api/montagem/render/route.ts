import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { chargeCredit, refundCredit, ChargeResult } from '@/lib/server/credits';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { MONTAGEM_FPS, MONTAGEM_MAX_SECONDS, edlDurationFrames, edlLetteringPaths, edlTexts, montagemCost, sanitizeEdl } from '@/lib/montagem';
import { isPaidPlan } from '@/lib/planConfig';
import { moderatePrompt } from '@/lib/server/generation/moderation';
import { newJobId } from '@/lib/server/generation/queue';
import { loadOwnedProject, projectClips } from '@/lib/server/montagem/projects';
import { loadProjectBrand } from '@/lib/server/montagem/brand';
import { StoredRender, dispatchRenders } from '@/lib/server/render/queue';
import { lambdaConfig } from '@/lib/server/render/lambda';

export const dynamic = 'force-dynamic';

const ACTIVE_PER_PLAN: Record<string, number> = { start: 1, pro: 2, elite: 3 };

/**
 * Exporta a montagem: refaz a validação do plano no servidor, cobra pelos segundos,
 * coloca na fila de render e tenta iniciar na hora. A tela acompanha pelo Firestore.
 */
export async function POST(req: Request) {
  let charge: ChargeResult | null = null;
  let uid = '';
  try {
    const user = await requireUser(req);
    uid = user.uid;
    if (!lambdaConfig().ready) throw new HttpError(503, 'render_unconfigured', 'A exportação ainda não está disponível. Avisamos assim que liberar.');
    const body = await req.json().catch(() => ({}));
    const project = await loadOwnedProject(uid, body.projectId);

    const profile = (await adminDb.collection('users').doc(uid).get()).data() || {};
    if (profile.genBlocked) throw new HttpError(403, 'gen_blocked', 'Sua conta está impedida de gerar vídeos por violar os termos de uso. Fale com o suporte.');
    const stored = profile.plan as string | undefined;
    const plan = isPaidPlan(stored) ? stored : 'start';

    const clips = await projectClips(uid, project.id);
    const allowed = Object.fromEntries(clips.map(c => [c.jobId, { sourceFrames: c.sourceFrames, sceneId: c.sceneId }]));
    const brand = await loadProjectBrand(uid, project.brandKitId);
    let edl;
    try {
      edl = sanitizeEdl(body.edl ?? project.edl, project.format, allowed, MONTAGEM_MAX_SECONDS[plan] * MONTAGEM_FPS, brand);
    } catch (e: any) {
      throw new HttpError(400, 'bad_edl', e.message);
    }
    const moderation = moderatePrompt(edlTexts(edl));
    if (!moderation.ok) throw new HttpError(422, 'text_blocked', moderation.reason);

    const active = await adminDb.collection('render_jobs').where('uid', '==', uid).where('active', '==', true).get();
    if (active.size >= (ACTIVE_PER_PLAN[plan] || 1)) {
      throw new HttpError(429, 'too_many_active', 'Você já tem uma exportação em andamento. Espere terminar para exportar outra.');
    }

    const durationFrames = edlDurationFrames(edl);
    const credits = montagemCost(durationFrames);
    charge = await chargeCredit(uid, 'montagem', credits);

    const used = new Set(edl.clips.map(c => c.jobId));
    const id = newJobId();
    const job: Omit<StoredRender, 'id'> = {
      uid,
      projectId: project.id,
      projectTitle: project.title,
      status: 'queued',
      active: true,
      credits,
      chargedCredits: charge.charged,
      refunded: false,
      durationFrames,
      format: project.format,
      edl,
      sourcePaths: { ...Object.fromEntries(clips.filter(c => used.has(c.jobId)).map(c => [c.jobId, c.path])), ...edlLetteringPaths(edl, brand) },
      attempts: 0,
      progress: 0,
      error: null,
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection('render_jobs').doc(id).set(job);
    charge = null; // a partir daqui, o estorno é da fila (failRender)

    await logPlatformAction(uid, user.email ?? undefined, 'montagem', `Exportou montagem (${Math.ceil(durationFrames / MONTAGEM_FPS)} s, ${credits} créditos)`);
    await dispatchRenders(2).catch(e => console.error('[render] dispatch após criar', e?.message));
    return NextResponse.json({ success: true, data: { id, credits } });
  } catch (err) {
    if (charge && uid) {
      await refundCredit(uid, 'montagem', charge, 'render_not_created');
      if (charge.trial) await adminDb.collection('users').doc(uid).update({ 'trialUsed.montagem': false }).catch(() => {});
    }
    return errorResponse(err);
  }
}
