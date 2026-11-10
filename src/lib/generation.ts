// ─────────────────────────────────────────────────────────────
// Geração de imagens e vídeos — catálogo, opções e preço (fonte única)
// A tela e o servidor leem daqui: o preço mostrado é sempre o cobrado.
// Só entram modelos com preço confirmado na KIE AI (docs.kie.ai, kie.ai/pricing).
// Para mudar preço ou modelo, edite só este arquivo.
// ─────────────────────────────────────────────────────────────

export type GenKind = 'image' | 'video' | 'audio';
export type GenMode = 't2i' | 'i2i' | 't2v' | 'i2v' | 'v2v' | 't2a';

/** Versão dos termos de uso da geração. Mudou o texto? Suba a versão: todos aceitam de novo. */
export const GEN_TERMS_VERSION = '2026-11-04';

/**
 * Regra de preço (estudo de viabilidade, 04/11/2026):
 * - custo em reais = custo em dólar × câmbio com IOF e taxas do cartão internacional;
 * - cada crédito cobrado cobre no máximo R$ 0,67 de custo (40% do que um crédito rende no Elite).
 */
export const USD_TO_BRL = 5.72;
export const MAX_COST_PER_CREDIT_BRL = 0.67;
/** A KIE vende créditos a US$ 0,005 cada: serve para conferir o consumo real de cada geração. */
export const KIE_USD_PER_CREDIT = 0.005;

export function creditsForUsd(usd: number) {
  return Math.max(1, Math.ceil((usd * USD_TO_BRL) / MAX_COST_PER_CREDIT_BRL - 1e-9));
}

export interface GenConfig {
  aspect?: string;
  resolution?: string;
  duration?: number;
  quality?: string;
  audio?: boolean;
}

export interface GenOption<T extends string | number = string> {
  value: T;
  label: string;
  hint?: string;
}

export interface GenModel {
  id: string;
  kind: GenKind;
  name: string;
  tagline: string;
  badges: string[];
  modes: GenMode[];
  aspects?: GenOption[];
  resolutions?: GenOption[];
  durations?: GenOption<number>[];
  qualities?: GenOption[];
  /** Áudio opcional (liga e desliga). */
  audioToggle?: boolean;
  /** Áudio sempre gerado pelo modelo. */
  nativeAudio?: boolean;
  /** Imagens de entrada aceitas em cada modo. */
  maxImages?: Partial<Record<GenMode, number>>;
  defaults: GenConfig;
  /** Preço em dólar da configuração escolhida (tabela oficial da KIE). */
  priceUsd: (c: GenConfig) => number;
  /**
   * Escada de preço por qualidade, em créditos: cada nível acima custa mais, mesmo quando
   * o custo do provedor quase não muda. O cobrado é o maior entre isto e a regra de custo.
   */
  tierCredits?: (c: GenConfig) => number;
  /** Empresa do modelo (agrupa a lista). */
  family?: string;
  /** Aparece entre os recomendados, antes de "ver todos". */
  featured?: boolean;
  /** Selo curto de destaque (ex.: "Mais barato"). */
  highlight?: string;
  /** Ajusta combinações que o provedor não aceita (ex.: 10 s não existe em 1080p). */
  constrain?: (c: GenConfig) => GenConfig;
}

const IMAGE_ASPECTS: GenOption[] = [
  { value: '9:16', label: '9:16', hint: 'Reels e Stories' },
  { value: '4:5', label: '4:5', hint: 'Feed' },
  { value: '1:1', label: '1:1', hint: 'Quadrado' },
  { value: '16:9', label: '16:9', hint: 'Horizontal' },
  { value: '3:4', label: '3:4', hint: 'Retrato' },
  { value: '21:9', label: '21:9', hint: 'Cinema' },
];

const VIDEO_ASPECTS: GenOption[] = [
  { value: '9:16', label: '9:16', hint: 'Reels e Stories' },
  { value: '16:9', label: '16:9', hint: 'Horizontal' },
  { value: '1:1', label: '1:1', hint: 'Quadrado' },
];

const BASE_MODELS: GenModel[] = [
  {
    id: 'nano-banana-2',
    kind: 'image',
    name: 'Nano Banana 2',
    tagline: 'Rápido e fiel ao prompt. O melhor custo para frames, testes e volume.',
    badges: ['Até 4K', 'Edita com referência'],
    modes: ['t2i', 'i2i'],
    aspects: IMAGE_ASPECTS,
    resolutions: [
      { value: '1K', label: '1K', hint: 'Teste' },
      { value: '2K', label: '2K', hint: 'Entrega' },
      { value: '4K', label: '4K', hint: 'Impressão' },
    ],
    maxImages: { i2i: 4 },
    defaults: { aspect: '9:16', resolution: '2K' },
    priceUsd: (c) => ({ '1K': 0.04, '2K': 0.06, '4K': 0.09 } as Record<string, number>)[c.resolution || '2K'] ?? 0.09,
    tierCredits: (c) => ({ '1K': 1, '2K': 2, '4K': 3 } as Record<string, number>)[c.resolution || '2K'] ?? 3,
  },
  {
    id: 'nano-banana-pro',
    kind: 'image',
    name: 'Nano Banana Pro',
    tagline: 'O modelo mais caro e mais capaz: máximo detalhe, textos legíveis e composições complexas.',
    badges: ['Premium', 'Texto na imagem', 'Alto detalhe'],
    modes: ['t2i', 'i2i'],
    aspects: IMAGE_ASPECTS,
    resolutions: [
      { value: '1K', label: '1K', hint: 'Teste' },
      { value: '2K', label: '2K', hint: 'Entrega' },
      { value: '4K', label: '4K', hint: 'Impressão' },
    ],
    maxImages: { i2i: 4 },
    defaults: { aspect: '9:16', resolution: '2K' },
    priceUsd: (c) => (c.resolution === '4K' ? 0.12 : 0.09),
    tierCredits: (c) => ({ '1K': 2, '2K': 3, '4K': 4 } as Record<string, number>)[c.resolution || '2K'] ?? 4,
  },
  {
    id: 'kling-3',
    kind: 'video',
    name: 'Kling 3.0',
    tagline: 'Movimento natural e física convincente. Primeiro e último frame.',
    badges: ['Até 10 s', 'Áudio opcional', 'Último frame'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    durations: [
      { value: 5, label: '5 s' },
      { value: 10, label: '10 s' },
    ],
    qualities: [
      { value: 'std', label: 'Padrão', hint: '720p' },
      { value: 'pro', label: 'Pro', hint: '1080p' },
      { value: '4k', label: '4K', hint: 'Ultra' },
    ],
    audioToggle: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', duration: 5, quality: 'pro', audio: false },
    priceUsd: (c) => {
      const perSecond = c.quality === '4k' ? 0.335 : c.quality === 'std' ? (c.audio ? 0.10 : 0.07) : (c.audio ? 0.135 : 0.09);
      return perSecond * (c.duration === 10 ? 10 : 5);
    },
  },
  {
    id: 'veo-fast',
    kind: 'video',
    name: 'Veo 3.1 Fast',
    tagline: 'Google Veo com som e fala nativos. Ótimo para cenas com diálogo.',
    badges: ['Áudio e fala nativos', '8 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS.filter(a => a.value !== '1:1'),
    resolutions: [
      { value: '720p', label: '720p', hint: 'Teste' },
      { value: '1080p', label: '1080p', hint: 'Entrega' },
    ],
    durations: [{ value: 8, label: '8 s' }],
    nativeAudio: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 8 },
    priceUsd: (c) => (c.resolution === '720p' ? 0.30 : 0.325),
    tierCredits: (c) => (c.resolution === '720p' ? 3 : 4),
  },
  {
    id: 'veo-quality',
    kind: 'video',
    name: 'Veo 3.1 Quality',
    tagline: 'A versão de máxima qualidade do Veo, para a entrega final.',
    badges: ['Qualidade máxima', 'Áudio e fala nativos', '8 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS.filter(a => a.value !== '1:1'),
    resolutions: [
      { value: '720p', label: '720p' },
      { value: '1080p', label: '1080p', hint: 'Entrega' },
    ],
    durations: [{ value: 8, label: '8 s' }],
    nativeAudio: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 8 },
    priceUsd: (c) => (c.resolution === '720p' ? 1.25 : 1.275),
    tierCredits: (c) => (c.resolution === '720p' ? 11 : 12),
  },
  {
    id: 'wan-v2v',
    kind: 'video',
    name: 'Wan 2.6',
    tagline: 'Transforma um vídeo seu mantendo o movimento: estilo, cenário, personagem.',
    badges: ['Vídeo para vídeo', 'Até 10 s'],
    modes: ['v2v'],
    resolutions: [
      { value: '720p', label: '720p', hint: 'Teste' },
      { value: '1080p', label: '1080p', hint: 'Entrega' },
    ],
    durations: [
      { value: 5, label: '5 s' },
      { value: 10, label: '10 s' },
    ],
    defaults: { resolution: '1080p', duration: 5 },
    priceUsd: (c) => {
      const table = c.resolution === '720p' ? { 5: 0.35, 10: 0.70 } : { 5: 0.53, 10: 1.05 };
      return table[c.duration === 10 ? 10 : 5];
    },
  },
];

const perSec = (table: Record<string, number>, key: string | undefined, fallback: string, seconds: number) =>
  (table[key || fallback] ?? table[fallback]) * seconds;

const DUR_5_10: GenOption<number>[] = [{ value: 5, label: '5 s' }, { value: 10, label: '10 s' }];

/**
 * Motores adicionais da KIE (preço e campos conferidos em docs.kie.ai e nas páginas de preço, nov/2026).
 * Ficaram de fora os que têm preço ambíguo na própria KIE (Seedance 2 padrão, Imagen 4 Ultra,
 * Seedream 4.5, Wan 2.7 vídeo para vídeo) até a KIE publicar o valor por configuração.
 */
const EXTRA_MODELS: GenModel[] = [
  // ── Imagem ────────────────────────────────────────────────
  {
    id: 'gpt-image-2', kind: 'image', family: 'OpenAI', featured: true,
    name: 'GPT Image 2',
    tagline: 'O modelo de imagem da OpenAI: entende pedidos longos e acerta texto e layout.',
    badges: ['Texto e layout', 'Até 16 referências'],
    modes: ['t2i', 'i2i'],
    aspects: IMAGE_ASPECTS.filter(a => a.value !== '4:5').concat([{ value: '4:3', label: '4:3', hint: 'Clássico' }]),
    resolutions: [{ value: '1K', label: '1K', hint: 'Teste' }, { value: '2K', label: '2K', hint: 'Entrega' }, { value: '4K', label: '4K', hint: 'Impressão' }],
    maxImages: { i2i: 4 },
    defaults: { aspect: '9:16', resolution: '2K' },
    priceUsd: (c) => ({ '1K': 0.03, '2K': 0.05, '4K': 0.08 } as Record<string, number>)[c.resolution || '2K'] ?? 0.08,
    tierCredits: (c) => ({ '1K': 1, '2K': 2, '4K': 3 } as Record<string, number>)[c.resolution || '2K'] ?? 3,
  },
  {
    id: 'seedream-5-pro', kind: 'image', family: 'ByteDance', featured: true,
    name: 'Seedream 5.0 Pro',
    tagline: 'Fotorrealismo forte e edição com até 10 referências, da ByteDance.',
    badges: ['Fotorrealismo', 'Edita com referência'],
    modes: ['t2i', 'i2i'],
    aspects: IMAGE_ASPECTS.filter(a => a.value !== '4:5').concat([{ value: '4:3', label: '4:3', hint: 'Clássico' }]),
    resolutions: [{ value: '1K', label: '1K', hint: 'Teste' }, { value: '2K', label: '2K', hint: 'Entrega' }],
    maxImages: { i2i: 4 },
    defaults: { aspect: '9:16', resolution: '2K' },
    // + até 3 imagens extras de referência a US$ 0,0025 (a primeira é grátis)
    priceUsd: (c) => (c.resolution === '1K' ? 0.035 : 0.07) + 0.0075,
    tierCredits: (c) => (c.resolution === '1K' ? 1 : 2),
  },
  {
    id: 'flux-3-klein', kind: 'image', family: 'Black Forest Labs', highlight: 'Mais barato',
    name: 'FLUX 3 Klein',
    tagline: 'Rapidíssimo e barato: ideal para testar composição antes de gastar na versão final.',
    badges: ['Até 4K', 'Edita com referência'],
    modes: ['t2i', 'i2i'],
    aspects: IMAGE_ASPECTS.concat([{ value: '4:3', label: '4:3', hint: 'Clássico' }]).filter(a => a.value !== '4:5'),
    resolutions: [{ value: '1K', label: '1K', hint: 'Teste' }, { value: '2K', label: '2K', hint: 'Entrega' }, { value: '4K', label: '4K', hint: 'Impressão' }],
    maxImages: { i2i: 4 },
    defaults: { aspect: '9:16', resolution: '2K' },
    priceUsd: (c) => ({ '1K': 0.008, '2K': 0.0125, '4K': 0.0325 } as Record<string, number>)[c.resolution || '2K'] ?? 0.0325,
    tierCredits: (c) => (c.resolution === '4K' ? 2 : 1),
  },
  {
    id: 'ideogram-v3', kind: 'image', family: 'Ideogram',
    name: 'Ideogram V3',
    tagline: 'O melhor para tipografia, logotipos, capas e peças com texto.',
    badges: ['Tipografia', 'Design'],
    modes: ['t2i'],
    aspects: [
      { value: '9:16', label: '9:16', hint: 'Reels e Stories' }, { value: '3:4', label: '3:4', hint: 'Retrato' },
      { value: '1:1', label: '1:1', hint: 'Quadrado' }, { value: '4:3', label: '4:3', hint: 'Clássico' }, { value: '16:9', label: '16:9', hint: 'Horizontal' },
    ],
    qualities: [{ value: 'TURBO', label: 'Turbo', hint: 'Rápido' }, { value: 'BALANCED', label: 'Equilibrado' }, { value: 'QUALITY', label: 'Qualidade', hint: 'Final' }],
    defaults: { aspect: '9:16', quality: 'BALANCED' },
    priceUsd: (c) => ({ TURBO: 0.0175, BALANCED: 0.035, QUALITY: 0.05 } as Record<string, number>)[c.quality || 'BALANCED'] ?? 0.05,
    tierCredits: (c) => (c.quality === 'QUALITY' ? 2 : 1),
  },
  {
    id: 'imagen4-fast', kind: 'image', family: 'Google',
    name: 'Imagen 4 Fast',
    tagline: 'O Imagen do Google em versão rápida: boa fidelidade por um custo baixo.',
    badges: ['Rápido', 'Negative prompt'],
    modes: ['t2i'],
    aspects: [
      { value: '9:16', label: '9:16', hint: 'Reels e Stories' }, { value: '3:4', label: '3:4', hint: 'Retrato' },
      { value: '1:1', label: '1:1', hint: 'Quadrado' }, { value: '4:3', label: '4:3', hint: 'Clássico' }, { value: '16:9', label: '16:9', hint: 'Horizontal' },
    ],
    defaults: { aspect: '9:16' },
    priceUsd: () => 0.02,
  },

  // ── Vídeo ─────────────────────────────────────────────────
  {
    id: 'veo-lite', kind: 'video', family: 'Google', highlight: 'Veo mais barato',
    name: 'Veo 3.1 Lite',
    tagline: 'O Veo com som e fala nativos pela metade do preço do Fast.',
    badges: ['Áudio e fala nativos', '8 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS.filter(a => a.value !== '1:1'),
    resolutions: [{ value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: [{ value: 8, label: '8 s' }],
    nativeAudio: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 8 },
    priceUsd: (c) => (c.resolution === '720p' ? 0.15 : 0.175),
    tierCredits: (c) => (c.resolution === '720p' ? 2 : 3),
  },
  {
    id: 'kling-turbo', kind: 'video', family: 'Kling', featured: true,
    name: 'Kling 3.0 Turbo',
    tagline: 'O Kling mais rápido, com som sempre ligado. Ótimo para volume.',
    badges: ['Áudio nativo', 'Até 10 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: DUR_5_10,
    nativeAudio: true,
    maxImages: { i2v: 1 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 5 },
    priceUsd: (c) => perSec({ '720p': 0.09, '1080p': 0.1125 }, c.resolution, '1080p', c.duration === 10 ? 10 : 5),
  },
  {
    id: 'kling-4', kind: 'video', family: 'Kling', highlight: 'Mais novo',
    name: 'Kling 4.0',
    tagline: 'A geração mais nova do Kling: movimento e coerência de cena em outro nível.',
    badges: ['Primeiro e último frame', 'Até 10 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: DUR_5_10,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 5 },
    priceUsd: (c) => perSec({ '720p': 0.1425, '1080p': 0.2125 }, c.resolution, '1080p', c.duration === 10 ? 10 : 5),
  },
  {
    id: 'seedance-fast', kind: 'video', family: 'ByteDance', featured: true,
    name: 'Seedance 2 Fast',
    tagline: 'O Seedance da ByteDance: cenas cinematográficas com áudio, primeiro e último frame.',
    badges: ['Áudio nativo', 'Primeiro e último frame'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '480p', label: '480p', hint: 'Rascunho' }, { value: '720p', label: '720p', hint: 'Entrega' }],
    durations: DUR_5_10,
    nativeAudio: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '720p', duration: 5 },
    priceUsd: (c) => perSec({ '480p': 0.059, '720p': 0.124 }, c.resolution, '720p', c.duration === 10 ? 10 : 5),
  },
  {
    id: 'grok-imagine', kind: 'video', family: 'xAI', highlight: 'Mais barato',
    name: 'Grok Imagine',
    tagline: 'O vídeo da xAI, com áudio sempre ligado e o menor custo por segundo.',
    badges: ['Áudio nativo', 'Até 15 s'],
    modes: ['t2v', 'i2v'],
    aspects: [...VIDEO_ASPECTS, { value: '2:3', label: '2:3', hint: 'Retrato' }],
    resolutions: [{ value: '480p', label: '480p', hint: 'Rascunho' }, { value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: [{ value: 6, label: '6 s' }, { value: 10, label: '10 s' }, { value: 15, label: '15 s' }],
    nativeAudio: true,
    maxImages: { i2v: 1 },
    defaults: { aspect: '9:16', resolution: '720p', duration: 6 },
    priceUsd: (c) => perSec({ '480p': 0.012, '720p': 0.0225, '1080p': 0.04 }, c.resolution, '720p', c.duration || 6),
  },
  {
    id: 'pixverse-v6', kind: 'video', family: 'PixVerse',
    name: 'PixVerse V6 Max',
    tagline: 'Efeitos e estilos virais com ótimo custo, áudio opcional.',
    badges: ['Até 1080p', 'Áudio opcional'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '540p', label: '540p', hint: 'Rascunho' }, { value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: DUR_5_10,
    audioToggle: true,
    maxImages: { i2v: 1 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 5, audio: false },
    priceUsd: (c) => {
      const t = c.audio ? { '540p': 0.044, '720p': 0.06, '1080p': 0.112 } : { '540p': 0.036, '720p': 0.044, '1080p': 0.088 };
      return perSec(t, c.resolution, '1080p', c.duration === 10 ? 10 : 5);
    },
  },
  {
    id: 'hailuo-23-std', kind: 'video', family: 'MiniMax',
    name: 'Hailuo 2.3',
    tagline: 'Movimento expressivo de pessoas e animação a partir de uma imagem.',
    badges: ['Imagem → vídeo', '6 ou 10 s'],
    modes: ['i2v'],
    resolutions: [{ value: '768P', label: '768p', hint: 'Teste' }, { value: '1080P', label: '1080p', hint: 'Só 6 s' }],
    durations: [{ value: 6, label: '6 s' }, { value: 10, label: '10 s' }],
    maxImages: { i2v: 1 },
    defaults: { resolution: '768P', duration: 6 },
    constrain: (c) => (c.resolution === '1080P' ? { ...c, duration: 6 } : c),
    priceUsd: (c) => (c.resolution === '1080P' ? 0.26 : c.duration === 10 ? 0.26 : 0.15),
  },
  {
    id: 'hailuo-23-pro', kind: 'video', family: 'MiniMax',
    name: 'Hailuo 2.3 Pro',
    tagline: 'A versão Pro do Hailuo, com mais detalhe e consistência.',
    badges: ['Imagem → vídeo', 'Pro'],
    modes: ['i2v'],
    resolutions: [{ value: '768P', label: '768p', hint: 'Teste' }, { value: '1080P', label: '1080p', hint: 'Só 6 s' }],
    durations: [{ value: 6, label: '6 s' }, { value: 10, label: '10 s' }],
    maxImages: { i2v: 1 },
    defaults: { resolution: '1080P', duration: 6 },
    constrain: (c) => (c.resolution === '1080P' ? { ...c, duration: 6 } : c),
    priceUsd: (c) => (c.resolution === '1080P' ? 0.39 : c.duration === 10 ? 0.45 : 0.22),
  },
  {
    id: 'hailuo-02-pro', kind: 'video', family: 'MiniMax',
    name: 'Hailuo 02 Pro',
    tagline: 'Primeiro e último frame em 1080p, sem áudio. Transições precisas.',
    badges: ['Primeiro e último frame', '6 s · 1080p'],
    modes: ['i2v'],
    durations: [{ value: 6, label: '6 s' }],
    maxImages: { i2v: 2 },
    defaults: { duration: 6 },
    priceUsd: () => 0.285,
  },
  {
    id: 'wan-27', kind: 'video', family: 'Alibaba',
    name: 'Wan 2.7',
    tagline: 'O Wan mais recente: bom movimento, negative prompt e primeiro e último frame.',
    badges: ['Primeiro e último frame', 'Até 10 s'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: DUR_5_10,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 5 },
    priceUsd: (c) => perSec({ '720p': 0.08, '1080p': 0.12 }, c.resolution, '1080p', c.duration === 10 ? 10 : 5),
  },
  {
    id: 'runway', kind: 'video', family: 'Runway', highlight: 'Rápido',
    name: 'Runway',
    tagline: 'Clipes curtos de 5 s, rápidos e baratos, para testar movimento e câmera.',
    badges: ['5 s', 'Sem áudio'],
    modes: ['t2v', 'i2v'],
    aspects: VIDEO_ASPECTS,
    resolutions: [{ value: '720p', label: '720p', hint: 'Teste' }, { value: '1080p', label: '1080p', hint: 'Entrega' }],
    durations: [{ value: 5, label: '5 s' }],
    maxImages: { i2v: 1 },
    defaults: { aspect: '9:16', resolution: '1080p', duration: 5 },
    priceUsd: (c) => (c.resolution === '720p' ? 0.06 : 0.15),
    tierCredits: (c) => (c.resolution === '720p' ? 1 : 2),
  },
];

/** Empresa de cada modelo da base original. */
const BASE_FAMILY: Record<string, { family: string; featured?: boolean; highlight?: string }> = {
  'nano-banana-2': { family: 'Google', featured: true },
  'nano-banana-pro': { family: 'Google', featured: true, highlight: 'Premium' },
  'kling-3': { family: 'Kling', featured: true },
  'veo-fast': { family: 'Google', featured: true },
  'veo-quality': { family: 'Google', highlight: 'Qualidade máxima' },
  'wan-v2v': { family: 'Alibaba', featured: true },
};

/**
 * Trilha sonora da Montagem: Suno V6 na KIE, instrumental, com a duração pedida (10 a 360 s).
 * Preço oficial (kie.ai/suno-api): 12 créditos KIE = US$ 0,06 por pedido, que devolve mais de uma versão.
 */
const AUDIO_MODELS: GenModel[] = [
  {
    id: 'suno-v6', kind: 'audio', family: 'Suno', featured: true,
    name: 'Suno V6',
    tagline: 'Trilha instrumental no clima e na duração do vídeo.',
    badges: ['Instrumental', 'Até 6 min'],
    modes: ['t2a'],
    durations: [15, 30, 45, 60, 90, 120, 180].map(v => ({ value: v, label: `${v} s` })),
    defaults: { duration: 30 },
    priceUsd: () => 0.06,
    tierCredits: () => 1,
  },
];

export const GEN_MODELS: GenModel[] = [
  ...BASE_MODELS.map(m => ({ ...m, ...BASE_FAMILY[m.id] })),
  ...EXTRA_MODELS,
  ...AUDIO_MODELS,
];

export const GEN_MODES: Record<GenKind, { id: GenMode; label: string; description: string }[]> = {
  image: [
    { id: 't2i', label: 'Criar do zero', description: 'A imagem nasce só do prompt.' },
    { id: 'i2i', label: 'Com referência', description: 'Edite uma foto ou use imagens como referência.' },
  ],
  video: [
    { id: 'i2v', label: 'Imagem → vídeo', description: 'Anime um frame seu, com primeiro e último quadro.' },
    { id: 't2v', label: 'Texto → vídeo', description: 'A cena nasce só do prompt.' },
    { id: 'v2v', label: 'Vídeo → vídeo', description: 'Transforme um vídeo mantendo o movimento.' },
  ],
  audio: [
    { id: 't2a', label: 'Trilha', description: 'Música instrumental a partir do clima e do estilo.' },
  ],
};

export function getModel(id: string) {
  return GEN_MODELS.find(m => m.id === id) || null;
}

export function modelsFor(kind: GenKind, mode: GenMode) {
  return GEN_MODELS.filter(m => m.kind === kind && m.modes.includes(mode));
}

function pick<T extends string | number>(options: GenOption<T>[] | undefined, value: unknown, fallback: T | undefined) {
  if (!options?.length) return undefined;
  return options.find(o => o.value === value)?.value ?? fallback ?? options[0].value;
}

/** Normaliza a configuração para os valores aceitos pelo modelo (o servidor confia só nisto). */
export function normalizeConfig(model: GenModel, raw: GenConfig = {}): GenConfig {
  const config: GenConfig = {
    aspect: pick(model.aspects, raw.aspect, model.defaults.aspect),
    resolution: pick(model.resolutions, raw.resolution, model.defaults.resolution),
    duration: pick(model.durations, Number(raw.duration), model.defaults.duration),
    quality: pick(model.qualities, raw.quality, model.defaults.quality),
    audio: model.audioToggle ? Boolean(raw.audio ?? model.defaults.audio) : model.nativeAudio ? true : undefined,
  };
  if (model.constrain) Object.assign(config, model.constrain(config));
  // Só as opções que o modelo tem (o Firestore não aceita campos vazios).
  for (const key of Object.keys(config) as (keyof GenConfig)[]) if (config[key] === undefined) delete config[key];
  return config;
}

export function quote(model: GenModel, config: GenConfig) {
  const c = normalizeConfig(model, config);
  const usd = model.priceUsd(c);
  const credits = Math.max(creditsForUsd(usd), model.tierCredits?.(c) ?? 0);
  return { usd, credits, kieCredits: Math.round(usd / KIE_USD_PER_CREDIT) };
}

/** Menor custo em créditos do modelo, para o "a partir de". */
export function minCredits(model: GenModel) {
  let min = Infinity;
  const res = model.resolutions?.map(r => r.value) ?? [undefined];
  const dur = model.durations?.map(d => d.value) ?? [undefined];
  const qual = model.qualities?.map(q => q.value) ?? [undefined];
  for (const resolution of res) for (const duration of dur) for (const quality of qual) {
    min = Math.min(min, quote(model, { resolution, duration, quality, audio: false }).credits);
  }
  return min;
}

export type GenStatus = 'queued' | 'submitting' | 'processing' | 'finalizing' | 'completed' | 'failed';

export interface GenOutput {
  url: string;
  type: 'image' | 'video' | 'audio';
  /** Duração em segundos (trilhas). */
  seconds?: number;
  /** Guardado no Storage da Creator Lab (sem prazo) ou só no link da KIE (14 dias). */
  stored: boolean;
  /** Caminho no Storage: permite reaproveitar o resultado como entrada (ex.: animar uma imagem). */
  path?: string;
}

export interface GenJob {
  id: string;
  uid: string;
  kind: GenKind;
  mode: GenMode;
  modelId: string;
  modelName: string;
  config: GenConfig;
  prompt: string;
  credits: number;
  status: GenStatus;
  active: boolean;
  outputs: GenOutput[];
  /** Miniaturas das entradas (imagens de referência), para mostrar no histórico. */
  inputPreviews?: string[];
  error?: string | null;
  promptId?: string | null;
  /** Projeto de vídeo e cena de origem (Montagem). */
  projectId?: string | null;
  sceneId?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  completedAt?: string | null;
}

export const STATUS_LABEL: Record<GenStatus, string> = {
  queued: 'Na fila',
  submitting: 'Enviando',
  processing: 'Gerando',
  finalizing: 'Finalizando',
  completed: 'Pronto',
  failed: 'Falhou',
};

/** Limites de entrada (iguais na tela e no servidor). */
export const GEN_LIMITS = {
  promptMax: 2500,
  /** Tamanho que o Gerador de Prompts mira: sobra espaço para o "Avoid: ..." que alguns modelos recebem no fim. */
  promptTarget: 2000,
  imageMaxBytes: 10 * 1024 * 1024,
  videoMaxBytes: 10 * 1024 * 1024,
  videoMinSeconds: 2,
  videoMaxSeconds: 10,
  /** Gerações ativas (na fila ou gerando) por pessoa ao mesmo tempo. */
  activePerUser: 3,
};
