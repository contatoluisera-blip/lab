import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { isPaidPlan } from '@/lib/planConfig';
import { MAX_SCENES, MONTAGEM_MAX_SECONDS, ProjectScene, SCRIPT_AGENT_CREDITS, SCRIPT_DONE_MARK } from '@/lib/montagem';
import { projects } from '@/lib/server/montagem/projects';
import { parseScriptInput, runScriptOutline } from '@/lib/server/montagem/scriptAgent';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const newSceneId = () => crypto.randomUUID().slice(0, 8);

/**
 * Agente de roteiro: lê o documento, separa em cenas (descrição e explicação curta) e cria o Projeto de vídeo.
 * Não escreve prompts: isso fica com o Gerador de Prompts, cena por cena. Responde em streaming (o JSON parcial mostra o progresso) e termina com `SCRIPT_DONE_MARK` + `{ projectId }`.
 * Se falhar, os créditos voltam.
 */
export const POST = withTool('montagem', async ({ user, body, refund, charge }) => {
  const profile = (await adminDb.collection('users').doc(user.uid).get()).data() || {};
  const plan = profile.plan as string | undefined;
  const maxSeconds = isPaidPlan(plan) ? MONTAGEM_MAX_SECONDS[plan] : 60;
  const input = parseScriptInput(body, maxSeconds);

  return textStreamResponse(
    async (write) => {
      // A IA lê o documento antes de escrever: espaços mantêm a conexão viva (o navegador os ignora).
      let started = false;
      const keepAlive = setInterval(() => { if (!started) write(' '); }, 4000);
      let result;
      try {
        result = await runScriptOutline(input, text => { started = true; write(text); });
      } finally {
        clearInterval(keepAlive);
      }
      const cenas = (result.cenas || []).slice(0, MAX_SCENES).filter(c => clean(c.texto, 10).length || clean(c.titulo, 10).length);
      if (!cenas.length) {
        throw new HttpError(422, 'no_scenes', clean(result.observacoes, 300) || 'Não encontramos cenas nesse documento.');
      }
      const scenes: ProjectScene[] = cenas.map((c, i) => ({
        id: newSceneId(),
        title: clean(c.titulo, 60) || `Cena ${i + 1}`,
        text: clean(c.texto, 1200),
        brief: clean(c.explicacao, 200),
        targetSeconds: Math.min(10, Math.max(3, Math.round(Number(c.duracao) || 5))),
      }));
      const at = new Date().toISOString();
      const ref = await projects().add({
        uid: user.uid,
        title: input.title || clean(result.titulo, 80) || 'Projeto sem título',
        goal: clean(result.objetivo, 200),
        format: input.format === 'auto' ? result.formato : input.format,
        scenes,
        edl: null,
        styleBible: clean(result.bibliaVisual, 3000),
        scriptSource: { name: input.file.name, kind: input.file.kind },
        scriptNotes: clean(result.observacoes, 600),
        storyboardApprovedAt: null,
        createdAt: at,
        updatedAt: at,
      });
      await logPlatformAction(user.uid, user.email ?? undefined, 'montagem', `Roteiro com IA: ${scenes.length} cenas (${input.file.kind})`);
      write(SCRIPT_DONE_MARK + JSON.stringify({ projectId: ref.id, sceneIds: scenes.map(sc => sc.id) }));
    },
    async (err) => {
      await refund('provider_failure');
      // Nada foi criado: o teste grátis não conta como usado.
      if (charge.trial) await adminDb.collection('users').doc(user.uid).update({ 'trialUsed.montagem': false }).catch(() => {});
      if (err instanceof HttpError) return { error: `${err.message} Seus créditos foram devolvidos.`, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, { cost: () => SCRIPT_AGENT_CREDITS });
