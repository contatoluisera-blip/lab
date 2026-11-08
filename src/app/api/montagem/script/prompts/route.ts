import * as admin from 'firebase-admin';
import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { textStreamResponse } from '@/lib/server/stream';
import { MAX_SCENES, ProjectScene, SCRIPT_DONE_MARK, SCRIPT_PROMPT_BATCH } from '@/lib/montagem';
import { loadOwnedProject, projects } from '@/lib/server/montagem/projects';
import { writeScenePrompts } from '@/lib/server/montagem/scriptAgent';

export const dynamic = 'force-dynamic';

/** Pedidos de prompts por projeto e por dia: cobre o roteiro inteiro algumas vezes (refazer, cenas novas). */
const DAILY_LIMIT = MAX_SCENES * 2;

/**
 * Agente de roteiro, etapa 2: escreve o prompt do frame e o do movimento de até
 * `SCRIPT_PROMPT_BATCH` cenas e grava na cena. Sem custo de crédito (entra nos créditos da etapa 1),
 * com limite diário por projeto. Termina com `SCRIPT_DONE_MARK` + `{ written: [ids] }`.
 */
export const POST = withTool('montagem', async ({ user, body }) => {
  const project = await loadOwnedProject(user.uid, body?.projectId);
  const asked: string[] = Array.isArray(body?.sceneIds) ? body.sceneIds.map(String) : [];
  const overwrite = body?.overwrite === true;
  const ids = asked
    .filter(id => project.scenes.some(s => s.id === id && (overwrite || !s.framePrompt || !s.motionPrompt)))
    .slice(0, SCRIPT_PROMPT_BATCH);
  if (!ids.length) throw new HttpError(400, 'nothing_to_write', 'Essas cenas já têm prompts.');

  const today = new Date().toISOString().slice(0, 10);
  const ref = projects().doc(project.id);
  await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const usage = (await tx.get(ref)).data()?.aiUsage || {};
    const count = usage.promptsDay === today ? usage.promptsCount || 0 : 0;
    if (count >= DAILY_LIMIT) throw new HttpError(429, 'ai_limit', 'Você atingiu o limite de prompts com IA de hoje neste projeto. Volte amanhã ou escreva no Gerador de Prompts.');
    tx.update(ref, { 'aiUsage.promptsDay': today, 'aiUsage.promptsCount': count + 1 });
  });

  return textStreamResponse(
    async (write) => {
      const keepAlive = setInterval(() => write(' '), 4000);
      let out;
      try {
        out = await writeScenePrompts(
          { title: project.title, goal: project.goal, format: project.format, styleBible: project.styleBible || '' },
          project.scenes.map(s => ({ id: s.id, title: s.title, text: s.text, targetSeconds: s.targetSeconds })),
          ids,
        );
      } finally {
        clearInterval(keepAlive);
      }
      const byId = new Map(out.filter(c => ids.includes(c.id) && c.promptFrame?.trim()).map(c => [c.id, c]));
      // Grava em cima das cenas atuais (a pessoa pode ter mexido no projeto enquanto a IA escrevia).
      await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
        const scenes = ((await tx.get(ref)).data()?.scenes || []) as ProjectScene[];
        tx.update(ref, {
          scenes: scenes.map(s => {
            const c = byId.get(s.id);
            return c ? { ...s, framePrompt: c.promptFrame.trim().slice(0, 2500), framePromptId: null, motionPrompt: (c.promptMovimento || '').trim().slice(0, 2500), motionPromptId: null } : s;
          }),
          updatedAt: new Date().toISOString(),
        });
      });
      write(SCRIPT_DONE_MARK + JSON.stringify({ written: [...byId.keys()] }));
    },
    async (err) => {
      if (err instanceof HttpError) return { error: err.message, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, { charge: false });
