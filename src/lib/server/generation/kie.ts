// ─────────────────────────────────────────────────────────────
// KIE AI — montagem dos pedidos e leitura dos resultados da geração
// Campos conferidos em docs.kie.ai (Market API: jobs/createTask e jobs/recordInfo).
// ─────────────────────────────────────────────────────────────

import { GenConfig, GenMode } from '@/lib/generation';
import type { MusicOptions } from '@/lib/audioStudio';

const KIE_BASE = 'https://api.kie.ai/api/v1';

export interface KieInputs {
  prompt: string;
  negativePrompt?: string;
  imageUrls: string[];
  /**
   * Imagem → vídeo: as imagens vêm na ordem [inicial, ...intermediários, final?] e isto diz se a última é o frame final.
   * Pedidos antigos não têm o campo: com 2 imagens, a segunda era o final.
   */
  lastFrame?: boolean;
  videoUrl?: string;
  /** Título da trilha (Suno). */
  title?: string;
  /** Parâmetros do Suno (Gerar Áudio). Sem eles: instrumental no V6. */
  music?: MusicOptions | null;
}

/** Frames de imagem → vídeo: inicial, intermediários (Kling 4.0) e final. */
export function framesOf(inputs: Pick<KieInputs, 'imageUrls' | 'lastFrame'>) {
  const imgs = inputs.imageUrls;
  const hasLast = imgs.length > 1 && (inputs.lastFrame ?? true);
  return {
    first: imgs[0] as string | undefined,
    middle: imgs.slice(1, hasLast ? -1 : undefined),
    last: hasLast ? imgs[imgs.length - 1] : undefined,
  };
}

/**
 * Kling 4.0: cada imagem enviada precisa ser citada no prompt (@first_frame, @keyframe_1, @last_frame,
 * @image_1…). Sem a citação a KIE devolve "Internal Error". Quem escreve o prompt à mão costuma esquecer,
 * então as que faltarem entram numa linha de referências no fim.
 */
export function citeKling(prompt: string, tags: string[]) {
  const missing = tags.filter(t => !new RegExp(`${t}(?![0-9_a-z])`, 'i').test(prompt));
  return missing.length ? `${prompt}\nREFERENCES: ${missing.join(', ')}.` : prompt;
}

/** Corpo do createTask para cada modelo do catálogo. */
export function buildKiePayload(modelId: string, mode: GenMode, config: GenConfig, inputs: KieInputs) {
  // Modelos sem campo de negative prompt recebem as restrições numa linha curta no fim.
  const prompt = inputs.negativePrompt
    ? `${inputs.prompt}\nAvoid: ${inputs.negativePrompt}`.slice(0, 2500)
    : inputs.prompt.slice(0, 2500);
  const f = mode === 'i2v' ? framesOf(inputs) : { first: undefined, middle: [] as string[], last: undefined };
  const firstLast = [f.first, f.last].filter(Boolean) as string[];

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
          ...(firstLast.length ? { image_urls: firstLast } : { aspect_ratio: config.aspect || '9:16' }),
          sound: Boolean(config.audio),
          duration: String(config.duration === 10 ? 10 : 5),
          mode: config.quality === 'std' ? 'std' : config.quality === '4k' ? '4K' : 'pro',
          multi_shots: false,
        },
      };
    case 'suno-v6': {
      // Modo personalizado: estilo + título; instrumental por padrão (a locução entra por cima na Montagem).
      const m = inputs.music || { version: 'V6', instrumental: true };
      return {
        model: 'ai-music-api/generate',
        input: {
          custom_mode: true,
          instrumental: m.instrumental,
          model: m.version,
          style: inputs.prompt.slice(0, 1000),
          title: (inputs.title || 'Trilha Creator Lab').slice(0, 80),
          ...(!m.instrumental && m.lyrics ? { lyrics: m.lyrics.slice(0, 5000) } : {}),
          ...(inputs.negativePrompt ? { negative_tags: inputs.negativePrompt.slice(0, 200) } : {}),
          ...(!m.instrumental && m.vocalGender ? { vocal_gender: m.vocalGender } : {}),
          ...(m.styleWeight !== undefined ? { style_weight: m.styleWeight } : {}),
          ...(m.weirdness !== undefined ? { weirdness_constraint: m.weirdness } : {}),
          ...(!m.instrumental && m.audioWeight !== undefined ? { audio_weight: m.audioWeight } : {}),
          ...(m.variety !== undefined ? { variety: m.variety } : {}),
          duration: Math.min(360, Math.max(10, Number(config.duration) || 30)),
        },
      };
    }
    case 'veo-fast':
    case 'veo-quality':
    case 'veo-lite':
      return {
        model: 'veo-3-1',
        input: {
          model: modelId === 'veo-quality' ? 'veo3' : modelId === 'veo-lite' ? 'veo3_lite' : 'veo3_fast',
          prompt,
          // Referências (1 a 3, só Fast e Lite, 8 s) ou primeiro e último frame (até 2).
          generation_type: mode === 'r2v' && inputs.imageUrls.length ? 'REFERENCE_2_VIDEO'
            : mode === 'i2v' && inputs.imageUrls.length ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'TEXT_2_VIDEO',
          ...(mode === 'r2v' && inputs.imageUrls.length ? { image_urls: inputs.imageUrls.slice(0, 3) } : firstLast.length ? { image_urls: firstLast } : {}),
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
    case 'gpt-image-26':
    case 'gpt-image-26-flare': {
      const v = modelId === 'gpt-image-26' ? 'sunburst' : 'flare';
      const refs = mode === 'i2i' ? inputs.imageUrls.slice(0, 16) : [];
      return {
        model: `gpt-image-2-6/${v}-${refs.length ? 'image-to-image' : 'text-to-image'}`,
        input: {
          prompt,
          ...(refs.length ? { input_urls: refs } : {}),
          aspect_ratio: config.aspect || '9:16',
          resolution: config.resolution || '2K',
          quality: config.quality || 'medium',
          output_format: 'png',
        },
      };
    }
    case 'gpt-image-26-economy': {
      const refs = mode === 'i2i' ? inputs.imageUrls.slice(0, 16) : [];
      return {
        model: `gpt-image-2-6/economy-${refs.length ? 'image-to-image' : 'text-to-image'}`,
        input: { prompt, ...(refs.length ? { input_urls: refs } : {}), aspect_ratio: config.aspect || '9:16', output_format: 'png' },
      };
    }
    case 'nano-banana-21':
      return {
        model: 'nano-banana-2-1',
        input: {
          prompt,
          ...(mode === 'i2i' && inputs.imageUrls.length ? { image_input: inputs.imageUrls.slice(0, 10) } : {}),
          aspect_ratio: config.aspect || '9:16',
          resolution: config.resolution || '2K',
          output_format: 'png',
        },
      };
    case 'seedream-55': {
      const refs = mode === 'i2i' ? inputs.imageUrls.slice(0, 10) : [];
      return {
        model: refs.length ? 'seedream/5-5-image-to-image' : 'seedream/5-5-text-to-image',
        input: { prompt, ...(refs.length ? { image_urls: refs } : {}), aspect_ratio: config.aspect || '9:16', size: config.resolution || '2K', output_format: 'png' },
      };
    }
    case 'seedance-25':
    case 'seedance-25-flash': {
      const { first, last } = f;
      // Referências não se misturam com primeiro e último frame; com frame o formato é sempre o da imagem.
      const refs = mode === 'r2v' ? inputs.imageUrls.slice(0, modelId === 'seedance-25' ? 16 : 10) : [];
      const res = modelId === 'seedance-25'
        ? (['480p', '720p', '1080p'].includes(config.resolution || '') ? config.resolution : '720p')
        : config.resolution === '480p' ? '480p' : '720p';
      return {
        model: modelId === 'seedance-25' ? 'bytedance/seedance-2-5' : 'bytedance/seedance-2-5-flash',
        input: {
          prompt,
          ...(first ? { first_frame_url: first } : {}),
          ...(last ? { last_frame_url: last } : {}),
          ...(refs.length ? { reference_image_urls: refs } : {}),
          aspect_ratio: first ? 'adaptive' : config.aspect || '9:16',
          resolution: res,
          duration: [4, 5, 6, 8, 10, 12, 15].includes(config.duration || 0) ? config.duration : 5,
          generate_audio: true,
        },
      };
    }
    case 'kling-4-flash': {
      const duration = [5, 10, 15, 20].includes(config.duration || 0) ? config.duration : 5;
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'kling-4.0/flash-reference-to-video',
          input: { prompt: citeKling(prompt, inputs.imageUrls.slice(0, 10).map((_, i) => `@image_${i + 1}`)), image_urls: inputs.imageUrls.slice(0, 10), aspect_ratio: config.aspect || '9:16', resolution: '720p', duration },
        };
      }
      return {
        model: 'kling-4.0/flash-keyframe-to-video',
        input: { prompt: f.first ? citeKling(prompt, ['@first_frame']) : prompt, ...(f.first ? { first_frame_url: f.first } : { aspect_ratio: config.aspect || '9:16' }), resolution: '720p', duration },
      };
    }
    case 'wan-30': {
      const { first, last } = f;
      const refs = mode === 'r2v' ? inputs.imageUrls.slice(0, 10) : [];
      return {
        model: 'wan/3-0-video',
        input: {
          prompt,
          ...(first ? { first_frame_url: first } : {}),
          ...(last ? { last_frame_url: last } : {}),
          ...(refs.length ? { reference_image_urls: refs } : {}),
          resolution: ['480P', '720P', '1080P'].includes(config.resolution || '') ? config.resolution : '1080P',
          aspect_ratio: first ? 'adaptive' : config.aspect || '9:16',
          duration: [5, 10, 15, 30].includes(config.duration || 0) ? config.duration : 5,
          audio: config.audio !== false,
        },
      };
    }
    case 'minimax-h3': {
      const { first, last } = f;
      const duration = [6, 10, 15].includes(config.duration || 0) ? config.duration : 6;
      const resolution = config.resolution === '768P' ? '768P' : '2K';
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'minimax-h3/reference-to-video',
          input: { prompt, reference_image_urls: inputs.imageUrls.slice(0, 9), aspect_ratio: config.aspect || '9:16', duration, resolution },
        };
      }
      if (first) {
        return { model: 'minimax-h3/image-to-video', input: { prompt, first_frame_url: first, ...(last ? { last_frame_url: last } : {}), duration, resolution } };
      }
      return { model: 'minimax-h3/text-to-video', input: { prompt, aspect_ratio: config.aspect || '9:16', duration, resolution } };
    }
    case 'happyhorse-11': {
      const duration = [5, 10, 15].includes(config.duration || 0) ? config.duration : 5;
      const resolution = config.resolution === '720p' ? '720p' : '1080p';
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'happyhorse-1-1/reference-to-video',
          input: { prompt, reference_image: inputs.imageUrls.slice(0, 9), aspect_ratio: config.aspect || '9:16', resolution, duration },
        };
      }
      if (f.first) return { model: 'happyhorse-1-1/image-to-video', input: { prompt, image_urls: [f.first], resolution, duration } };
      return { model: 'happyhorse-1-1/text-to-video', input: { prompt, aspect_ratio: config.aspect || '9:16', resolution, duration } };
    }
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
      const duration = config.duration === 10 ? 10 : 5;
      const resolution = config.resolution === '720p' ? '720p' : '1080p';
      // Referências (@image_1…): até 10, sem frames.
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'kling-4.0/reference-to-video',
          input: { prompt: citeKling(prompt, inputs.imageUrls.slice(0, 10).map((_, i) => `@image_${i + 1}`)), image_urls: inputs.imageUrls.slice(0, 10), aspect_ratio: config.aspect || '9:16', resolution, duration },
        };
      }
      // Frames: inicial + intermediários (@keyframe_N, até 8) + final, no máximo 6 em 5 s e 10 em 10 s.
      const maxMiddle = (duration === 10 ? 10 : 6) - (f.first ? 1 : 0) - (f.last ? 1 : 0);
      const middle = f.middle.slice(0, Math.max(0, Math.min(8, maxMiddle)));
      return {
        model: 'kling-4.0/keyframe-to-video',
        input: {
          prompt: citeKling(prompt, [
            ...(f.first ? ['@first_frame'] : []),
            ...middle.map((_, i) => `@keyframe_${i + 1}`),
            ...(f.last ? ['@last_frame'] : []),
          ]),
          ...(f.first ? { first_frame_url: f.first } : { aspect_ratio: config.aspect || '9:16' }),
          ...(middle.length ? { keyframe_urls: middle } : {}),
          ...(f.last ? { last_frame_url: f.last } : {}),
          resolution,
          duration,
        },
      };
    }
    case 'seedance-fast': {
      const { first, last } = f;
      // Referências não se misturam com primeiro e último frame (docs.kie.ai).
      const refs = mode === 'r2v' ? inputs.imageUrls.slice(0, 9) : [];
      return {
        model: 'bytedance/seedance-2-fast',
        input: {
          prompt,
          ...(first ? { first_frame_url: first } : {}),
          ...(last ? { last_frame_url: last } : {}),
          ...(refs.length ? { reference_image_urls: refs } : {}),
          aspect_ratio: first ? 'adaptive' : config.aspect || '9:16',
          resolution: config.resolution === '480p' ? '480p' : '720p',
          duration: config.duration === 10 ? 10 : 5,
          generate_audio: true,
        },
      };
    }
    case 'grok-imagine': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      // Várias imagens viram referências (@image1…); a proporção só vale nesse modo.
      const r2v = mode === 'r2v' && inputs.imageUrls.length > 0;
      const duration = [6, 10, 15].includes(config.duration || 0) ? config.duration! : 6;
      return {
        model: i2v || r2v ? 'grok-imagine/image-to-video' : 'grok-imagine/text-to-video',
        input: {
          prompt,
          ...(r2v ? { image_urls: inputs.imageUrls.slice(0, 7), aspect_ratio: config.aspect || '9:16', duration: String(duration) }
            : i2v ? { image_urls: inputs.imageUrls.slice(0, 1), duration: String(duration) } : { aspect_ratio: config.aspect || '9:16', duration }),
          // Nunca o modo "spicy": só o normal.
          mode: 'normal',
          resolution: ['480p', '720p', '1080p'].includes(config.resolution || '') ? config.resolution : '720p',
        },
      };
    }
    case 'pixverse-v6': {
      const i2v = mode === 'i2v' && inputs.imageUrls.length > 0;
      // Referências pelo V6 Fusion: cada imagem ganha um nome (@img1, @img2…) para o prompt citar.
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'pixverse-v6/reference-to-video',
          input: {
            prompt,
            image_references: inputs.imageUrls.slice(0, 7).map((url, i) => ({ image_url: url, type: 'subject', ref_name: `img${i + 1}` })),
            aspect_ratio: config.aspect || '9:16',
            quality: ['540p', '720p', '1080p'].includes(config.resolution || '') ? config.resolution : '1080p',
            duration: config.duration === 10 ? 10 : 5,
            generate_audio_switch: Boolean(config.audio),
          },
        };
      }
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
          image_url: f.first || inputs.imageUrls[0],
          ...(f.last ? { end_image_url: f.last } : {}),
        },
      };
    case 'wan-27': {
      const { first, last } = f;
      // Referências pelo wan/2-7-r2v: até 5 imagens, citadas no prompt como "image 1", "image 2"…
      if (mode === 'r2v' && inputs.imageUrls.length) {
        return {
          model: 'wan/2-7-r2v',
          input: {
            prompt: inputs.prompt.slice(0, 2500),
            ...(inputs.negativePrompt ? { negative_prompt: inputs.negativePrompt.slice(0, 500) } : {}),
            reference_image: inputs.imageUrls.slice(0, 5),
            aspect_ratio: config.aspect || '9:16',
            resolution: config.resolution === '720p' ? '720p' : '1080p',
            duration: config.duration === 10 ? 10 : 5,
          },
        };
      }
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
  /** Duração de cada arquivo, quando o provedor informa (trilhas do Suno). */
  durations?: (number | undefined)[];
  /**
   * Suno avisa em etapas (texto, primeira faixa, todas): o registro já diz "success" antes de existir
   * o MP3 final de cada faixa. Enquanto faltar algum, o resultado ainda não está pronto.
   */
  incomplete?: boolean;
  failMsg?: string;
  creditsConsumed?: number;
}

/** Suno: as faixas vêm em data[] com audio_url e duration (docs.kie.ai/suno-api/generate-music). */
function collectTracks(obj: any): { url: string; seconds?: number }[] & { incomplete?: boolean } {
  const lists = [obj?.data, obj?.response?.data, Array.isArray(obj) ? obj : null];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const audio = list.filter((t: any) => t && (typeof t.audio_url === 'string' || typeof t.stream_audio_url === 'string' || t.id));
    if (!audio.length) continue;
    const tracks: { url: string; seconds?: number }[] & { incomplete?: boolean } = audio
      .filter((t: any) => typeof t.audio_url === 'string' && t.audio_url)
      .map((t: any) => ({ url: t.audio_url as string, seconds: typeof t.duration === 'number' ? t.duration : undefined }));
    // Faixa listada sem o MP3 final (só o stream): ainda está terminando.
    tracks.incomplete = tracks.length < audio.length;
    return tracks;
  }
  return [];
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
  const fromResult = collectTracks(parsed);
  const tracks = fromResult.length || fromResult.incomplete ? fromResult : collectTracks(d.response ? { data: d.response.data ?? d.response } : null);
  const urls = tracks.length ? tracks.map(t => t.url) : collectUrls(parsed).length ? collectUrls(parsed) : collectUrls(d.response);
  const state = ['waiting', 'queuing', 'generating', 'success', 'fail'].includes(d.state) ? d.state : 'unknown';
  return {
    state,
    urls,
    durations: tracks.length ? tracks.map(t => t.seconds) : undefined,
    incomplete: !!tracks.incomplete || (String(d.model || '').includes('music') && !tracks.length),
    failMsg: d.failMsg || undefined,
    creditsConsumed: typeof d.creditsConsumed === 'number' ? d.creditsConsumed : undefined,
  };
}
