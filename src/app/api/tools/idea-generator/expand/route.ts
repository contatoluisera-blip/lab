import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireUser } from '@/lib/server/auth';
import { describeProviderError, errorResponse } from '@/lib/server/tool';
import { textStreamResponse } from '@/lib/server/stream';
import { IDEA_SCHEMA, IdeaPlan, streamStructured } from '@/lib/server/ideas/engine';

const ROUND_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

/**
 * Gerador de Ideias — etapa 2: roteiro completo de UMA ideia da rodada planejada.
 * Não cobra créditos (já cobrados no planejamento); cada ideia aceita até 3 tentativas.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const index = Math.round(Number(body.index));
    const roundRef = adminDb.collection('idea_rounds').doc(String(body.roundId || '-')) as admin.firestore.DocumentReference;

    const round: { plan: IdeaPlan; context: string; quantidade: number } = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
      const snap = await tx.get(roundRef);
      const r = snap.data();
      if (!snap.exists || r?.userId !== user.uid) throw new HttpError(404, 'round_not_found', 'Rodada não encontrada. Gere as ideias de novo.');
      if (r.status !== 'planned' || !r.plan) throw new HttpError(409, 'round_not_ready', 'O planejamento desta rodada não terminou.');
      if (Date.now() - new Date(r.createdAt).getTime() > ROUND_TTL_MS) throw new HttpError(410, 'round_expired', 'Esta rodada expirou. Gere as ideias de novo.');
      if (!(index >= 0 && index < r.plan.esbocos.length)) throw new HttpError(400, 'bad_index', 'Ideia inválida.');
      const attempts = Number(r.attempts?.[index] || 0);
      if (attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'too_many_attempts', 'Esta ideia já foi tentada 3 vezes. Gere uma nova rodada.');
      tx.update(roundRef, { [`attempts.${index}`]: attempts + 1 });
      return r;
    });

    const { plan } = round;
    const esboco = plan.esbocos[index];
    const others = plan.esbocos.filter((_, i) => i !== index).map((e) => `- ${e.titulo} (${e.formato}; ${e.tipoGancho})`).join('\n');
    const userText = [
      round.context,
      '',
      'PLANO DA RODADA:',
      plan.resumoEstrategico,
      '',
      `ETAPA 2 — ROTEIRO da ideia ${index + 1} de ${plan.esbocos.length}. Desenvolva a estrutura completa, fiel a este esboço:`,
      JSON.stringify(esboco),
      '',
      others ? `As outras ideias da rodada (não repita os ganchos nem os ângulos delas):\n${others}` : '',
    ].join('\n');

    return textStreamResponse(
      async (write) => { await streamStructured(write, { schema: IDEA_SCHEMA, maxTokens: 8000, userText }); },
      async (err) => {
        if (err instanceof HttpError) return { error: err.message, code: err.code };
        const e = describeProviderError(err, 'Anthropic');
        return { error: 'Não foi possível roteirizar esta ideia agora. Tente de novo (sem custo).', code: e.code };
      }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
