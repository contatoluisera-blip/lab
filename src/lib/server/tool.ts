import { NextResponse } from 'next/server';
import { ToolId } from '@/lib/planConfig';
import { AuthedUser, HttpError, requireUser } from './auth';
import { ChargeResult, chargeCredit, refundCredit } from './credits';
import { logPlatformAction } from '@/lib/firebase/logAction';

export interface ToolContext {
  user: AuthedUser;
  charge: ChargeResult;
  body: any;
  /** Estorna o crédito deste uso (para rotas que respondem em streaming). */
  refund: (reason?: string) => Promise<void>;
}

interface ToolOptions {
  /** Se false, a rota não cobra crédito (ex.: consulta de status). Padrão: true. */
  charge?: boolean;
  /** Descrição curta para o registro em `platform_actions`. */
  logDescription?: (body: any) => string;
}

/** Converte qualquer erro numa resposta JSON em português, sem vazar detalhes internos. */
export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error('[tool] erro inesperado:', message);
  return NextResponse.json(
    { success: false, error: 'Não foi possível concluir agora. Seu crédito foi devolvido. Tente de novo em instantes.', code: 'internal' },
    { status: 500 }
  );
}

/**
 * Envolve uma rota de ferramenta: exige login, cobra crédito numa transação,
 * executa o gerador e devolve o crédito se ele falhar.
 * O handler pode devolver um objeto (vira JSON com `success`, `data`, `credits`)
 * ou uma Response pronta (streaming): nesse caso, o estorno fica por conta de `ctx.refund`.
 */
export function withTool<T>(
  tool: ToolId,
  handler: (ctx: ToolContext) => Promise<T | Response>,
  options: ToolOptions = {}
) {
  const shouldCharge = options.charge !== false;

  return async function POST(req: Request) {
    let user: AuthedUser;
    let charge: ChargeResult | null = null;
    try {
      user = await requireUser(req);
      const body = await req.json().catch(() => ({}));

      if (shouldCharge) charge = await chargeCredit(user.uid, tool);

      const ctx: ToolContext = {
        user,
        charge: charge ?? { charged: 0, trial: false, credits: 0, plan: '' },
        body,
        refund: (reason) => refundCredit(user.uid, tool, charge, reason),
      };

      const result = await handler(ctx);
      if (result instanceof Response) return result;

      if (options.logDescription) {
        await logPlatformAction(user.uid, user.email ?? undefined, tool, options.logDescription(body));
      }

      return NextResponse.json({
        success: true,
        data: result,
        credits: charge ? { charged: charge.charged, trial: charge.trial, remaining: charge.credits } : undefined,
      });
    } catch (err) {
      // A cobrança só existe se passou pela transação; qualquer erro depois dela devolve o crédito.
      if (charge) await refundCredit(user!.uid, tool, charge);
      return errorResponse(err);
    }
  };
}

/** Mensagem legível para erros de provedores de IA (OpenAI, Anthropic). */
export function describeProviderError(err: any, provider: string): HttpError {
  const status = err?.status ?? err?.response?.status;
  const raw: string = err?.error?.message || err?.message || '';
  if (status === 401) return new HttpError(502, 'provider_auth', `A chave da ${provider} foi recusada. Avise o suporte.`);
  if (status === 429 || /quota|billing|insufficient/i.test(raw)) return new HttpError(502, 'provider_quota', `A conta da ${provider} está sem saldo ou no limite. Avise o suporte.`);
  if (status === 404 || /model/i.test(raw) && /not found|does not exist/i.test(raw)) return new HttpError(502, 'provider_model', `O modelo de IA configurado não está mais disponível na ${provider}. Avise o suporte.`);
  return new HttpError(502, 'provider_error', `A ${provider} não respondeu agora. Seu crédito foi devolvido; tente de novo.`);
}
