// ─────────────────────────────────────────────────────────────
// Geração de imagens e vídeos — catálogo, opções e preço (fonte única)
// A tela e o servidor leem daqui: o preço mostrado é sempre o cobrado.
// Só entram modelos com preço confirmado na KIE AI (docs.kie.ai, kie.ai/pricing).
// Para mudar preço ou modelo, edite só este arquivo.
// ─────────────────────────────────────────────────────────────

export type GenKind = 'image' | 'video';
export type GenMode = 't2i' | 'i2i' | 't2v' | 'i2v' | 'v2v';

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

export const GEN_MODELS: GenModel[] = [
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
    ],
    audioToggle: true,
    maxImages: { i2v: 2 },
    defaults: { aspect: '9:16', duration: 5, quality: 'pro', audio: false },
    priceUsd: (c) => {
      const perSecond = c.quality === 'std' ? (c.audio ? 0.10 : 0.07) : (c.audio ? 0.135 : 0.09);
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
  type: 'image' | 'video';
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
  imageMaxBytes: 10 * 1024 * 1024,
  videoMaxBytes: 10 * 1024 * 1024,
  videoMinSeconds: 2,
  videoMaxSeconds: 10,
  /** Gerações ativas (na fila ou gerando) por pessoa ao mesmo tempo. */
  activePerUser: 3,
};
