import * as admin from 'firebase-admin';
import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { textStreamResponse } from '@/lib/server/stream';
import { AUTO_EDIT_CREDITS, AUTO_EDIT_FREE, DIRECTION_MAX, MONTAGEM_FPS, MONTAGEM_MAX_SECONDS, SCRIPT_DONE_MARK, sanitizeEdl } from '@/lib/montagem';
import { isPaidPlan } from '@/lib/planConfig';
import { allProjectClips, loadOwnedProject, projectAssets, projects } from '@/lib/server/montagem/projects';
import { autoEdit } from '@/lib/server/montagem/claude';
import { loadProjectBrand } from '@/lib/server/montagem/brand';
import { logAiCost } from '@/lib/server/aiCost';

const DAILY_LIMIT = 30;

/**
 * Montagem com o Claude (rascunho e revisão, vendo os quadros de cada clipe). As primeiras
 * AUTO_EDIT_FREE rodadas de cada projeto são grátis; depois, cada uma cobra AUTO_EDIT_CREDITS
 * (custo real de R$ 0,50 a 0,86). Também tem limite diário por projeto. Responde em streaming: as duas
 * passadas passam do limite de tempo de uma resposta comum. No fim vem a marca de conclusão com o plano,
 * já validado pelas mesmas regras do render.
 */
export const POST = withTool('montagem', async ({ user, body, refund }) => {
  const project = await loadOwnedProject(user.uid, body?.projectId);
  const clips = await allProjectClips(user.uid, project);
  if (!clips.length) throw new HttpError(400, 'no_clips', 'Gere ou envie pelo menos um vídeo neste projeto antes de montar.');

  const today = new Date().toISOString().slice(0, 10);
  const ref = projects().doc(project.id);
  await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const usage = (await tx.get(ref)).data()?.aiUsage || {};
    const count = usage.day === today ? usage.count || 0 : 0;
    if (count >= DAILY_LIMIT) throw new HttpError(429, 'ai_limit', `Você usou as ${DAILY_LIMIT} montagens com IA de hoje neste projeto. Ajuste à mão ou volte amanhã.`);
    tx.update(ref, { 'aiUsage.day': today, 'aiUsage.count': count + 1, 'aiUsage.total': admin.firestore.FieldValue.increment(1) });
  });

  const profile = (await adminDb.collection('users').doc(user.uid).get()).data() || {};
  const plan = profile.plan as string | undefined;
  const maxSeconds = isPaidPlan(plan) ? MONTAGEM_MAX_SECONDS[plan] : 60;
  const direction = typeof body?.direction === 'string' ? body.direction.replace(/\s+/g, ' ').trim().slice(0, DIRECTION_MAX) : '';
  const brand = await loadProjectBrand(user.uid, project.brandKitId);
  const assets = projectAssets(user.uid, project);

  return textStreamResponse(
    async (write) => {
      // Mantém a conexão viva enquanto o Claude pensa (o navegador ignora tudo antes da marca de conclusão).
      const keepAlive = setInterval(() => write(' '), 4000);
      try {
        const run = await autoEdit(project, clips, maxSeconds, direction, brand, assets, stage => write(`\n${stage}...`));
        const allowed = Object.fromEntries(clips.map(c => [c.jobId, { sourceFrames: c.sourceFrames, sceneId: c.sceneId }]));
        let edl;
        try {
          // Ids novos a cada montagem: a locução de uma montagem antiga não cai no clipe errado.
          const stamp = Date.now().toString(36).slice(-5);
          edl = sanitizeEdl({ clips: run.result.clips.map((c, i) => ({ ...c, id: `ai${stamp}${i}` })), endCard: run.result.endCard }, project.format, allowed, maxSeconds * MONTAGEM_FPS, brand, assets);
        } catch (e: any) {
          throw new HttpError(502, 'auto_edit_invalid', `A montagem com IA saiu fora das regras (${e.message}). Tente de novo.`);
        }
        await logAiCost({
          uid: user.uid, projectId: project.id, step: 'montagem_ia', provider: 'anthropic', model: run.model, usd: run.usd, ms: run.ms,
          units: { inputTokens: run.usage.input, outputTokens: run.usage.output, cacheRead: run.usage.cacheRead, cacheWrite: run.usage.cacheWrite, images: run.images, clips: edl.clips.length },
        });
        write(SCRIPT_DONE_MARK + JSON.stringify({ edl, resumo: run.result.resumo }));
      } finally {
        clearInterval(keepAlive);
      }
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: err.message, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, {
  // Cobra pelo total de rodadas já feitas no projeto (as que deram erro antes de começar não contam).
  costAsync: async (body, user) => {
    const doc = typeof body?.projectId === 'string' ? await projects().doc(body.projectId).get() : null;
    const data = doc?.exists ? doc.data() : null;
    if (!data || data.uid !== user.uid) return 0; // a rota recusa o projeto logo em seguida
    return (data.aiUsage?.total || 0) < AUTO_EDIT_FREE ? 0 : AUTO_EDIT_CREDITS;
  },
  logDescription: () => 'Montagem com IA (rascunho e revisão)',
});
