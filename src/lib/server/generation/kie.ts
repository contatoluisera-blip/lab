// ─────────────────────────────────────────────────────────────
// KIE AI — montagem dos pedidos e leitura dos resultados da geração
// Campos conferidos em docs.kie.ai (Market API: jobs/createTask e jobs/recordInfo).
// ─────────────────────────────────────────────────────────────

import { GenConfig, GenMode } from '@/lib/generation';

const KIE_BASE = 'https://api.kie.ai/api/v1';

export interface KieInputs {
  prompt: string;
  negativePrompt?: string;
  imageUrls: string[];
  videoUrl?: string;
}

/** Corpo do createTask para cada modelo do catálogo. */
export function buildKiePayload(modelId: string, mode: GenMode, config: GenConfig, inputs: KieInputs) {
  // Modelos sem campo de negative prompt recebem as restrições numa linha curta no fim.
  const prompt = inputs.negativePrompt
    ? `${inputs.prompt}\nAvoid: ${inputs.negativePrompt}`.slice(0, 2500)
    : inputs.prompt.slice(0, 2500);

  switch (modelId) {
    case 'nano-banana-2':
    case 'nano-banana-pro':
      return {
        model: modelId,
        input: {
          prompt,
          ...(mode === 'i2i' && inputs.imageUrls.length ? { image_input: inputs.imageUrls } : {}),
          aspect_ratio: config.aspect || '9:16',
          resolution: config.resolution || '2K',
          output_format: 'png',
        },
      };
    case 'kling-3':
      return {
        model: 'kling-3.0/video',
        input: {
          prompt,
          ...(mode === 'i2v' && inputs.imageUrls.length ? { image_urls: inputs.imageUrls.slice(0, 2) } : { aspect_ratio: config.aspect || '9:16' }),
          sound: Boolean(config.audio),
          duration: String(config.duration === 10 ? 10 : 5),
          mode: config.quality === 'std' ? 'std' : 'pro',
          multi_shots: false,
        },
      };
    case 'veo-fast':
    case 'veo-quality':
      return {
        model: 'veo-3-1',
        input: {
          model: modelId === 'veo-quality' ? 'veo3' : 'veo3_fast',
          prompt,
          generation_type: mode === 'i2v' && inputs.imageUrls.length ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'TEXT_2_VIDEO',
          ...(mode === 'i2v' && inputs.imageUrls.length ? { image_urls: inputs.imageUrls.slice(0, 2) } : {}),
          aspect_ratio: config.aspect === '16:9' ? '16:9' : '9:16',
          resolution: config.resolution === '720p' ? '720p' : '1080p',
          duration: 8,
        },
      };
    case 'wan-v2v':
      return {
        model: 'wan/2-6-video-to-video',
        input: {
          prompt,
          video_urls: inputs.videoUrl ? [inputs.videoUrl] : [],
          duration: String(config.duration === 10 ? 10 : 5),
          resolution: config.resolution === '720p' ? '720p' : '1080p',
          multi_shots: false,
          nsfw_checker: true,
        },
      };
    default:
      throw new Error(`Modelo sem integração: ${modelId}`);
  }
}

export type KieCreateResult =
  | { ok: true; taskId: string }
  | { ok: false; retry: boolean; reason: string; message: string };

export async function createKieTask(apiKey: string, payload: Record<string, unknown>, callBackUrl?: string): Promise<KieCreateResult> {
  let res: Response;
  try {
    res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ ...payload, ...(callBackUrl ? { callBackUrl } : {}) }),
    });
  } catch (e: any) {
    return { ok: false, retry: true, reason: 'network', message: String(e?.message || e) };
  }
  const data = await res.json().catch(() => ({} as any));
  if (data?.code === 200 && data?.data?.taskId) return { ok: true, taskId: data.data.taskId };

  // A KIE responde HTTP 200 mesmo com erro: o código real vem em "code".
  const code = Number(data?.code || res.status);
  const msg = String(data?.msg || '');
  if (code === 429 || res.status === 429) return { ok: false, retry: true, reason: 'rate_limit', message: msg || 'limite de pedidos' };
  if (code === 402 || /credit|balance|insufficient/i.test(msg)) return { ok: false, retry: false, reason: 'provider_quota', message: msg };
  if (code === 401) return { ok: false, retry: false, reason: 'provider_auth', message: msg };
  if (code >= 500) return { ok: false, retry: true, reason: 'provider_down', message: msg };
  return { ok: false, retry: false, reason: 'provider_rejected', message: msg || `HTTP ${res.status}` };
}

export interface KieRecord {
  state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail' | 'unknown';
  urls: string[];
  failMsg?: string;
  creditsConsumed?: number;
}

function collectUrls(obj: any): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const candidates = [obj.resultUrls, obj.result_urls, obj.data?.result_urls, obj.data?.resultUrls, obj.info?.resultUrls];
  for (const c of candidates) if (Array.isArray(c) && c.length) return c.filter((u: unknown) => typeof u === 'string');
  return [];
}

export async function getKieRecord(apiKey: string, taskId: string): Promise<KieRecord> {
  const res = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json().catch(() => ({} as any));
  if (data?.code !== 200 || !data?.data) return { state: 'unknown', urls: [] };
  const d = data.data;
  let parsed: any = null;
  try { parsed = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson; } catch { /* sem resultado ainda */ }
  const urls = collectUrls(parsed).length ? collectUrls(parsed) : collectUrls(d.response);
  const state = ['waiting', 'queuing', 'generating', 'success', 'fail'].includes(d.state) ? d.state : 'unknown';
  return {
    state,
    urls,
    failMsg: d.failMsg || undefined,
    creditsConsumed: typeof d.creditsConsumed === 'number' ? d.creditsConsumed : undefined,
  };
}
