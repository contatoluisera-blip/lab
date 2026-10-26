import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { adminDb } from '@/lib/firebase/admin';
import { PLAN_SCHEMA, buildRoundContext, streamStructured } from '@/lib/server/ideas/engine';
import { ideasCost } from '@/lib/planConfig';

/**
 * Gerador de Ideias — etapa 1 (planejamento): cobra os créditos da rodada
 * (1 até 5 ideias, 2 de 6 a 10), gera linha estratégica, decisões, plano da diária
 * e o esboço de cada ideia, e guarda a rodada para a etapa 2 (/expand, sem nova cobrança).
 */
export const POST = withTool('ideas', async ({ body, user, refund }) => {
  const roundId = String(body.roundId || '');
  if (!/^[A-Za-z0-9-]{10,64}$/.test(roundId)) throw new HttpError(400, 'bad_round', 'Identificador da rodada inválido. Recarregue a página.');
  const roundRef = adminDb.collection('idea_rounds').doc(roundId);
  if ((await roundRef.get()).exists) throw new HttpError(409, 'round_exists', 'Esta rodada já foi iniciada. Recarregue a página.');

  const { quantidade, context, refsCount } = await buildRoundContext(body, user.uid);
  await roundRef.set({ userId: user.uid, status: 'planning', quantidade, context, attempts: {}, createdAt: new Date().toISOString() });

  return textStreamResponse(
    async (write) => {
      const text = await streamStructured(write, {
        schema: PLAN_SCHEMA,
        maxTokens: 16000,
        userText: `${context}\n\nETAPA 1 — PLANEJAMENTO. Entregue o plano da rodada com exatamente ${quantidade} esboço(s).`,
      });
      const plan = JSON.parse(text);
      await roundRef.update({ status: 'planned', plan });
      await logPlatformAction(user.uid, user.email ?? undefined, 'idea-generator', `Planejou ${quantidade} ideias${refsCount ? ` com ${refsCount} referência(s) do Hub` : ''}`);
    },
    async (err) => {
      await refund('provider_failure');
      await roundRef.update({ status: 'failed' }).catch(() => {});
      if (err instanceof HttpError) return { error: `${err.message} Seus créditos foram devolvidos.`, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, { cost: (body) => ideasCost(body?.quantidade) });
