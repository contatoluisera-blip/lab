import { adminDb } from '@/lib/firebase/admin';

/**
 * Preço por milhão de tokens (API da Anthropic, tabela de 2026-10). Cache: escrita de 5 min = 1,25x a entrada;
 * leitura pelo preço próprio de cada modelo. Serve para medir o custo real da Montagem e fechar os créditos.
 */
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function claudeCostUsd(model: string, u: ClaudeUsage) {
  const p = PRICES[model] || PRICES['claude-opus-5-5'];
  const usd = (u.input_tokens * p.input + (u.cache_creation_input_tokens || 0) * p.input * 1.25
    + (u.cache_read_input_tokens || 0) * p.cacheRead + u.output_tokens * p.output) / 1_000_000;
  return Math.round(usd * 10000) / 10000;
}

/** Registro de custo por etapa (painel do admin e cálculo de créditos). Falha aqui nunca derruba o pedido. */
export async function logAiCost(entry: { uid: string; projectId?: string | null; step: string; provider: string; model: string; usd: number; units?: Record<string, number>; ms?: number }) {
  await adminDb.collection('montagem_costs').add({ ...entry, createdAt: new Date().toISOString() }).catch((e: any) => console.error('[custo] falha ao registrar', e?.message));
}
