'use client';

import { auth } from '@/lib/firebase';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'unknown', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new ApiError('Faça login para continuar.', 'unauthenticated', 401);
  const token = await user.getIdToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/** Lê o corpo como JSON; se vier HTML (erro de tempo da Netlify, por exemplo), explica em português. */
async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 502 || res.status === 504 || /timed out|timeout/i.test(text)) {
      throw new ApiError('A geração demorou mais do que o servidor permite. Seu crédito foi devolvido; tente de novo com um pedido menor.', 'timeout', res.status);
    }
    throw new ApiError(`O servidor respondeu de forma inesperada (${res.status}). Tente de novo em instantes.`, 'bad_response', res.status);
  }
}

export interface ToolResponse<T = any> {
  data: T;
  credits?: { charged: number; trial: boolean; remaining: number };
}

/** POST autenticado numa rota de ferramenta. Lança ApiError com mensagem pronta para exibir. */
export async function callTool<T = any>(path: string, body: unknown): Promise<ToolResponse<T>> {
  const res = await fetch(path, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body ?? {}) });
  const json = await parseJson(res);
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error || 'Falha ao processar.', json.code || 'error', res.status);
  }
  return { data: json.data, credits: json.credits };
}

/** GET autenticado. */
export async function getAuthed<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { headers: await authHeaders() });
  const json = await parseJson(res);
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error || 'Falha ao consultar.', json.code || 'error', res.status);
  }
  return json;
}

export const STREAM_ERROR_MARK = '\u0000ERROR:';

/**
 * POST autenticado numa rota que responde em streaming de texto.
 * Chama `onChunk` a cada pedaço e devolve o texto completo.
 * Se o servidor sinalizar erro no meio do stream, lança ApiError.
 */
export async function streamTool(path: string, body: unknown, onChunk?: (partial: string) => void): Promise<string> {
  const res = await fetch(path, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body ?? {}) });

  if (!res.ok || !res.headers.get('content-type')?.includes('text/plain')) {
    const json = await parseJson(res);
    throw new ApiError(json.error || 'Falha ao processar.', json.code || 'error', res.status);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    const mark = full.indexOf(STREAM_ERROR_MARK);
    if (mark >= 0) {
      let payload: any = {};
      try { payload = JSON.parse(full.slice(mark + STREAM_ERROR_MARK.length)); } catch { /* ignore */ }
      throw new ApiError(payload.error || 'A geração foi interrompida. Seu crédito foi devolvido.', payload.code || 'stream_error', 500);
    }
    onChunk?.(full);
  }
  return full;
}

/** Extrai um objeto JSON de uma resposta de modelo (remove cercas ```json e texto ao redor). */
export function parseModelJson<T = any>(text: string): T {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new ApiError('A IA devolveu um formato inesperado. Tente gerar de novo.', 'bad_model_output');
  }
}
