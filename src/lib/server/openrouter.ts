// ─────────────────────────────────────────────────────────────
// OpenRouter: API única para texto (formato OpenAI) e vídeo assíncrono.
// Estudo e ordem de provedores: docs/provedores-ia.md, seção 6.
// Ainda não entra na fila de geração: serve para testes e para a futura troca de provedor.
// ─────────────────────────────────────────────────────────────

const BASE = 'https://openrouter.ai/api/v1';

function key() {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY não configurada.');
  return k;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith('http') ? path : `${BASE}${path.replace(/^\/api\/v1/, '')}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      'Content-Type': 'application/json',
      'X-Title': 'Creator Lab',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

// ── Texto ────────────────────────────────────────────────────────────────────
export interface OpenRouterChat {
  text: string;
  model: string;
  provider?: string;
  usage: { prompt_tokens: number; completion_tokens: number; cost?: number };
  ms: number;
}

export async function openrouterChat(model: string, messages: { role: 'system' | 'user' | 'assistant'; content: string }[], maxTokens = 800): Promise<OpenRouterChat> {
  const t0 = Date.now();
  const json = await call<any>('/chat/completions', { method: 'POST', body: JSON.stringify({ model, messages, max_tokens: maxTokens }) });
  return {
    text: json.choices?.[0]?.message?.content ?? '',
    model: json.model,
    provider: json.provider,
    usage: json.usage || { prompt_tokens: 0, completion_tokens: 0 },
    ms: Date.now() - t0,
  };
}

/** Ids de modelos de texto disponíveis (ex.: filtrar os `anthropic/`). */
export async function openrouterModels(): Promise<string[]> {
  const json = await call<{ data: { id: string }[] }>('/models');
  return (json.data || []).map(m => m.id);
}

// ── Vídeo ────────────────────────────────────────────────────────────────────
export type OpenRouterVideoStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface OpenRouterVideoJob {
  id: string;
  generation_id?: string;
  status: OpenRouterVideoStatus;
  urls?: string[];
  unsigned_urls?: string[];
  expires_at?: number;
  usage?: { cost: number | null; is_byok: boolean };
  error?: unknown;
}

export interface OpenRouterVideoRequest {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  generate_audio?: boolean;
  /** Primeiro quadro (image-to-video): só URL pública HTTPS. */
  firstFrameUrl?: string;
  /** Webhook HTTPS (assinado com o segredo do workspace). */
  callbackUrl?: string;
}

export async function createOpenRouterVideo(req: OpenRouterVideoRequest): Promise<OpenRouterVideoJob> {
  const body: Record<string, unknown> = {
    model: req.model,
    prompt: req.prompt,
    ...(req.duration ? { duration: req.duration } : {}),
    ...(req.resolution ? { resolution: req.resolution } : {}),
    ...(req.aspect_ratio ? { aspect_ratio: req.aspect_ratio } : {}),
    generate_audio: req.generate_audio ?? false,
    ...(req.firstFrameUrl ? { frame_images: [{ type: 'image_url', image_url: { url: req.firstFrameUrl }, frame_type: 'first_frame' }] } : {}),
    ...(req.callbackUrl ? { callback_url: req.callbackUrl } : {}),
  };
  return call<OpenRouterVideoJob>('/videos', { method: 'POST', body: JSON.stringify(body) });
}

export const getOpenRouterVideo = (id: string) => call<OpenRouterVideoJob>(`/videos/${encodeURIComponent(id)}`);

/** Baixa o vídeo pronto (mp4). */
export async function downloadOpenRouterVideo(id: string, index = 0): Promise<Buffer> {
  const res = await fetch(`${BASE}/videos/${encodeURIComponent(id)}/content?index=${index}`, { headers: { Authorization: `Bearer ${key()}` } });
  if (!res.ok) throw new Error(`OpenRouter ${res.status} ao baixar o vídeo`);
  return Buffer.from(await res.arrayBuffer());
}

/** Custo real cobrado (US$) de uma geração, pelo id da geração. */
export async function openrouterGenerationCost(generationId: string): Promise<{ total_cost: number; provider_name?: string } | null> {
  const json = await call<{ data?: { total_cost: number; provider_name?: string } }>(`/generation?id=${encodeURIComponent(generationId)}`).catch(() => null);
  return json?.data ?? null;
}
