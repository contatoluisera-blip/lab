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
          mode: config.quality === 'std' ? 'std' : config.quality === '4k' ? '4K' : 'pro',
          multi_shots: false,
        },
      };
    case 'veo-fast':
    case 'veo-quality':
    case 'veo-lite':
      return {
        model: 'veo-3-1',
        input: {
          model: modelId === 'veo-quality' ? 'veo3' : modelId === 'veo-lite' ? 'veo3_lite' : 'veo3_fast',
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
    case 'gpt-image-2':
      return {
        model: mode === 'i2i' && inputs.imageUrls.length ? 'gpt-image-2-image-to-image' : 'gpt-image-2-text-to-image',
        input: {
          prompt,
          ...(mode === 'i2i' && inputs.imageUrls.length ? { input_urls: inputs.imageUrls } : {}),
          aspect_ratio: config.aspect || '9:16',
          resolution: config.resolution || '2K',
        },
      };
    case 'seedream-5-pro':
      return {
        model: mode === 'i2i' && inputs.imageUrls.length ? 'seedream/5-pro-image-to-image' : 'seedream/5-pro-text-to-image',
        input: {
          prompt,
          ...(mode === 'i2i' && inputs.imageUrls.length ? { image_urls: inputs.imageUrls } : {}),
          aspect_ratio: config.aspect || '9:16',
          quality: config.resolution === '1K' ? 'basic' : 'high',
          output_format: 'png',
        },
      };
    case 'flux-3-klein':
      return {
        model: mode === 'i2i' && inputs.imageUrls.length ? 'flux-3/klein-edit-image' : 'flux-3/klein-text-to-image',
        input: {
          prompt,
          ...(mode === 'i2i' && inputs.imageUrls.length ? { image_urls: inputs.imageUrls } : {}),
          aspect_ratio: config.aspect || '9:16',
          resolution: config.resolution || '2K',
          output_format: 'png',
          num_images: 1,
        },
      };
    case 'ideogram-v3': {
      const size: Record<string, string> = {
        '9:16': 'portrait_16_9', '3:4': 'portrait_4_3', '1:1': 'square_hd', '4:3': 'landscape_4_3', '16:9': 'landscape_16_9',
      };
      return {
        model: 'ideogram/v3-text-to-image',
        input: {
          prompt: inputs.prompt.slice(0, 2500),
          ...(inputs.negativePrompt ? { negative_prompt: inputs.negativePrompt.slice(0, 1000) } : {}),
          rendering_speed: config.quality || 'BALANCED',
          image_size: size[config.aspect || '9:16'] || 'portrait_16_9',
        },
      };
    }
    case 'imagen4-fast':
      return {
        model: 'google/imagen4-fast',
        input: {
          prompt: inputs.prompt.slice(0, 2500),
          ...(inputs.negativePrompt ? { negative_prompt: inputs.negativePrompt.slice(0, 1000) } : {}),
          aspect_ratio: config.aspect || '9:16',
        },
      };
    case 'kling-turbo': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      return {
        model: i2v ? 'kling/v3-turbo-image-to-video' : 'kling/v3-turbo-text-to-video',
        input: {
          prompt,
          ...(i2v ? { image_urls: inputs.imageUrls.slice(0, 1) } : { aspect_ratio: config.aspect || '9:16' }),
          resolution: config.resolution === '720p' ? '720p' : '1080p',
          duration: String(config.duration === 10 ? 10 : 5),
        },
      };
    }
    case 'kling-4': {
      const [first, last] = mode === 'i2v' ? inputs.imageUrls : [];
      return {
        model: 'kling-4.0/keyframe-to-video',
        input: {
          prompt,
          ...(first ? { first_frame_url: first } : { aspect_ratio: config.aspect || '9:16' }),
          ...(last ? { last_frame_url: last } : {}),
          resolution: config.resolution === '720p' ? '720p' : '1080p',
          duration: config.duration === 10 ? 10 : 5,
        },
      };
    }
    case 'seedance-fast': {
      const [first, last] = mode === 'i2v' ? inputs.imageUrls : [];
      return {
        model: 'bytedance/seedance-2-fast',
        input: {
          prompt,
          ...(first ? { first_frame_url: first } : {}),
          ...(last ? { last_frame_url: last } : {}),
          aspect_ratio: first ? 'adaptive' : config.aspect || '9:16',
          resolution: config.resolution === '480p' ? '480p' : '720p',
          duration: config.duration === 10 ? 10 : 5,
          generate_audio: true,
        },
      };
    }
    case 'grok-imagine': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      const duration = [6, 10, 15].includes(config.duration || 0) ? config.duration! : 6;
      return {
        model: i2v ? 'grok-imagine/image-to-video' : 'grok-imagine/text-to-video',
        input: {
          prompt,
          ...(i2v ? { image_urls: inputs.imageUrls.slice(0, 1), duration: String(duration) } : { aspect_ratio: config.aspect || '9:16', duration }),
          // Nunca o modo "spicy": só o normal.
          mode: 'normal',
          resolution: ['480p', '720p', '1080p'].includes(config.resolution || '') ? config.resolution : '720p',
        },
      };
    }
    case 'pixverse-v6': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      return {
        model: i2v ? 'pixverse-v6-max/image-to-video' : 'pixverse-v6-max/text-to-video',
        input: {
          prompt,
          // No imagem → vídeo a proporção vem da imagem: a KIE recusa aspect_ratio nesse modo.
          ...(i2v ? { image_urls: inputs.imageUrls.slice(0, 1) } : { aspect_ratio: config.aspect || '9:16' }),
          quality: ['540p', '720p', '1080p'].includes(config.resolution || '') ? config.resolution : '1080p',
          duration: config.duration === 10 ? 10 : 5,
          generate_audio_switch: Boolean(config.audio),
        },
      };
    }
    case 'hailuo-23-std':
    case 'hailuo-23-pro': {
      const hd = config.resolution === '1080P';
      return {
        model: modelId === 'hailuo-23-pro' ? 'hailuo/2-3-image-to-video-pro' : 'hailuo/2-3-image-to-video-standard',
        input: {
          prompt,
          image_url: inputs.imageUrls[0],
          resolution: hd ? '1080P' : '768P',
          // 10 s não existe em 1080p.
          duration: hd ? '6' : String(config.duration === 10 ? 10 : 6),
        },
      };
    }
    case 'hailuo-02-pro':
      return {
        model: 'hailuo/02-image-to-video-pro',
        input: {
          prompt,
          image_url: inputs.imageUrls[0],
          ...(inputs.imageUrls[1] ? { end_image_url: inputs.imageUrls[1] } : {}),
        },
      };
    case 'wan-27': {
      const [first, last] = mode === 'i2v' ? inputs.imageUrls : [];
      return {
        model: first ? 'wan/2-7-image-to-video' : 'wan/2-7-text-to-video',
        input: {
          prompt: inputs.prompt.slice(0, 2500),
          ...(inputs.negativePrompt ? { negative_prompt: inputs.negativePrompt.slice(0, 500) } : {}),
          ...(first ? { first_frame_url: first } : { ratio: config.aspect || '9:16' }),
          ...(last ? { last_frame_url: last } : {}),
          resolution: config.resolution === '720p' ? '720p' : '1080p',
          duration: config.duration === 10 ? 10 : 5,
        },
      };
    }
    case 'runway': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      return {
        model: 'runway',
        input: {
          prompt,
          ...(i2v ? { image_url: inputs.imageUrls[0] } : { aspect_ratio: config.aspect || '9:16' }),
          quality: config.resolution === '720p' ? '720p' : '1080p',
          duration: 5,
          watermark: '',
        },
      };
    }
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
