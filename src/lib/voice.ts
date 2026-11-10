// ─────────────────────────────────────────────────────────────
// Locução da Montagem: vozes, trechos por clipe e a faixa usada pela composição.
// A voz é gerada no servidor (ElevenLabs ou OpenAI) com o tempo de cada palavra;
// o Remotion toca cada trecho no início do clipe e desenha as legendas palavra por palavra.
// ─────────────────────────────────────────────────────────────

export type VoiceProvider = 'elevenlabs' | 'openai';

export interface VoiceOption {
  provider: VoiceProvider;
  id: string;
  name: string;
  hint: string;
}

/** Vozes em PT-BR da conta ElevenLabs da Creator Lab e vozes da OpenAI (falam PT-BR pelas instruções). */
export const VOICES: VoiceOption[] = [
  { provider: 'elevenlabs', id: 'plASsyS7JE6GCAvx9uIc', name: 'Marcio', hint: 'masculina, gancho viral, animada' },
  { provider: 'elevenlabs', id: 'UaeEQHfiDI8l58WWXiwS', name: 'Leonardo', hint: 'masculina, comercial, calorosa' },
  { provider: 'elevenlabs', id: 'hwnuNyWkl9DjdTFykrN6', name: 'Adriano', hint: 'masculina, narrador de histórias' },
  { provider: 'elevenlabs', id: 'YbP0Eq5RE5uOoCEl7F3T', name: 'Weverton', hint: 'masculina, calma' },
  { provider: 'elevenlabs', id: 'Pxxu743NJcLUqO1QxfD6', name: 'Isabela', hint: 'feminina, comercial e institucional' },
  { provider: 'elevenlabs', id: 'Yu6uoFniEUcJhbrF7K1D', name: 'Lari', hint: 'feminina, jovem, anúncios' },
  { provider: 'elevenlabs', id: 'ORgG8rwdAiMYRug8RJwR', name: 'Ana Alice', hint: 'feminina, clara, redes sociais' },
  { provider: 'elevenlabs', id: 'GDzHdQOi6jjf8zaXhCYD', name: 'Raquel', hint: 'feminina, expressiva e enérgica' },
  { provider: 'openai', id: 'coral', name: 'Coral', hint: 'feminina, calorosa' },
  { provider: 'openai', id: 'nova', name: 'Nova', hint: 'feminina, jovem' },
  { provider: 'openai', id: 'shimmer', name: 'Shimmer', hint: 'feminina, suave' },
  { provider: 'openai', id: 'ash', name: 'Ash', hint: 'masculina, firme' },
  { provider: 'openai', id: 'onyx', name: 'Onyx', hint: 'masculina, grave' },
  { provider: 'openai', id: 'echo', name: 'Echo', hint: 'masculina, neutra' },
];

export const voiceById = (provider: VoiceProvider, id: string) => VOICES.find(v => v.provider === provider && v.id === id) || null;

/** Ritmo de fala de Reels em PT-BR: ~2,6 palavras por segundo. */
export const WORDS_PER_SECOND = 2.6;
export const VOICE_TEXT_MAX = 400;
/** Locução gerada para o vídeo todo custa 1 crédito (US$ ~0,02 a 0,20 por minuto, conforme o provedor). */
export const VOICE_CREDITS = 1;

export interface VoiceWord {
  /** Palavra, início e fim em segundos dentro do trecho. */
  w: string;
  s: number;
  e: number;
}

export interface VoiceSegment {
  /** Clipe da linha do tempo onde o trecho começa. */
  clipId: string;
  text: string;
  audio?: {
    path: string;
    url: string;
    seconds: number;
    words: VoiceWord[];
    provider: VoiceProvider;
    voiceId: string;
    /** Texto que gerou este áudio: mudou o texto ou a voz, gera de novo. */
    text: string;
  } | null;
}

export interface ProjectVoice {
  provider: VoiceProvider;
  voiceId: string;
  /** Tom pedido (vai para as instruções da OpenAI e para o roteiro da locução). */
  style?: string;
  segments: VoiceSegment[];
}

/** O áudio do trecho ainda vale (mesmo texto e mesma voz)? */
export const segmentReady = (seg: VoiceSegment, voice: ProjectVoice) =>
  !!seg.audio && seg.audio.text === seg.text.trim() && seg.audio.provider === voice.provider && seg.audio.voiceId === voice.voiceId;

/** Chave do áudio de um trecho em `sources` e em `sourcePaths`. */
export const voiceSourceKey = (clipId: string) => `voice:${clipId}`;

/** Atraso do início da fala dentro do clipe (respiro depois do corte). */
export const VOICE_LEAD_FRAMES = 3;
