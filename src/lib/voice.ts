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
  gender: 'f' | 'm';
  /** OpenAI: voz que só existe no GPT-4o mini TTS (o TTS-1 e o TTS-1 HD recusam). */
  miniOnly?: boolean;
}

const el = (id: string, name: string, gender: 'f' | 'm', hint: string): VoiceOption => ({ provider: 'elevenlabs', id, name, gender, hint });
const oa = (id: string, name: string, gender: 'f' | 'm', hint: string, miniOnly = false): VoiceOption => ({ provider: 'openai', id, name, gender, hint, ...(miniOnly ? { miniOnly } : {}) });

/**
 * Vozes em PT-BR. ElevenLabs: as da conta da Creator Lab e as mais usadas da biblioteca pública
 * (sotaque brasileiro, uso comercial liberado e preço normal; a biblioteca funciona direto pela API).
 * OpenAI: todas as vozes do gpt-4o-mini-tts (falam PT-BR pelas instruções). As primeiras são as padrão.
 */
export const VOICES: VoiceOption[] = [
  // ElevenLabs · conta da Creator Lab
  el('plASsyS7JE6GCAvx9uIc', 'Marcio', 'm', 'gancho viral, animada'),
  el('UaeEQHfiDI8l58WWXiwS', 'Leonardo', 'm', 'comercial, calorosa'),
  el('hwnuNyWkl9DjdTFykrN6', 'Adriano', 'm', 'narrador de histórias'),
  el('YbP0Eq5RE5uOoCEl7F3T', 'Weverton', 'm', 'calma'),
  el('Pxxu743NJcLUqO1QxfD6', 'Isabela', 'f', 'comercial e institucional'),
  el('Yu6uoFniEUcJhbrF7K1D', 'Lari', 'f', 'jovem, anúncios'),
  el('ORgG8rwdAiMYRug8RJwR', 'Ana Alice', 'f', 'clara, redes sociais'),
  el('GDzHdQOi6jjf8zaXhCYD', 'Raquel', 'f', 'expressiva e enérgica'),
  el('E9hPCbqBRCgB3UEiCUuE', 'A. Medeiros', 'm', 'clara, calma e amigável'),
  el('IGmfzACCDHYu8YfQJuVi', 'Jonas', 'm', 'empática e calma'),
  el('IKpiSijWzlhOL6uX83EH', 'Will', 'm', 'pausada, segura, didática'),
  el('ycxdm1PRMs962FxyyuJ0', 'Otto', 'm', 'intimidadora, personagem'),
  // ElevenLabs · biblioteca pública (pt-BR)
  el('33B4UnXyTNbgLmdEDh5P', 'Keren', 'f', 'doce, vibrante, histórias'),
  el('r2fkFV8WAqXq2AqBpgJT', 'Amandoca', 'f', 'divertida, redes sociais'),
  el('RGymW84CSmfVugnA5tvA', 'Roberta', 'f', 'suave e confiante'),
  el('MZxV5lN3cv7hi1376O0m', 'Ana Dias', 'f', 'envolvente, narração'),
  el('oJebhZNaPllxk6W0LSBA', 'Carla', 'f', 'histórias infantis, alegre'),
  el('7iqXtOF3wl3pomwXFY7G', 'Fernanda', 'f', 'formal e educada'),
  el('oi8rgjIfLgJRsQ6rbZh3', 'Amanda Kelly', 'f', 'doce e acolhedora'),
  el('lWq4KDY8znfkV0DrK8Vb', 'Yasmin Alves', 'f', 'leve e clara'),
  el('GM2UA3fbsIaLHcswCDX9', 'Nina', 'f', 'conversa, confiante'),
  el('cyD08lEy76q03ER1jZ7y', 'Scheila', 'f', 'séria e direta'),
  el('GOkMqfyKMLVUcYfO2WbB', 'Jenifer', 'f', 'casual, conversa'),
  el('iScHbNW8K33gNo3lGgbo', 'Marianne', 'f', 'doce e calma, redes sociais'),
  el('CstacWqMhJQlnfLPxRG4', 'Will Grave', 'm', 'grave, suave, narração'),
  el('rpNe0HOx7heUulPiOEaG', 'Diego', 'm', 'locutor confiante, anúncios'),
  el('Qrdut83w0Cr152Yb4Xn3', 'Paulo', 'm', 'expressiva, educativa'),
  el('9pDzHy2OpOgeXM8SeL0t', 'Borges', 'm', 'lenta, calma, TV'),
  el('tS45q0QcrDHqHoaWdCDR', 'Lax', 'm', 'engraçada, sarcástica'),
  el('EeTjZnu1OfgjhGKT6ywY', 'Lax Sussurro', 'm', 'sussurrada, ASMR'),
  el('WFSxKvz27RguNRD3Phoq', 'Wesley Bessa', 'm', 'narração, personagens'),
  el('YNOujSUmHtgN6anjqXPf', 'Victor Power', 'm', 'sábia, dramática'),
  el('7lu3ze7orhWaNeSPowWx', 'Lucas', 'm', 'cativante, redes sociais'),
  el('4za2kOXGgUd57HRSQ1fn', 'Lendário', 'm', 'empolgada, hype'),
  el('bJrNspxJVFovUxNBQ0wh', 'Marcelo Costa', 'm', 'articulada, narração'),
  el('7i7dgyCkKt4c16dLtwT3', 'David', 'm', 'grave e rouca'),
  el('6pQlwCgfwffNdI3jjzM6', 'Fernando Borges', 'm', 'urgente, notícia'),
  el('5p9IbzcK4R8rN1fpGdMF', 'Davi', 'm', 'amigável e calorosa'),
  el('YU8EsJtXFMyKMxYtheDk', 'Mário', 'm', 'animada, redes sociais'),
  el('zNEsdgTUa3ndwKry8Xcq', 'Elvis', 'm', 'ressonante e grave'),
  el('xWdpADtEio43ew1zGxUQ', 'Matheus Santos', 'm', 'amigável, conversa'),
  el('eUAnqvLQWNX29twcYLUM', 'Dyego', 'm', 'apresentador de jornal'),
  // ElevenLabs · biblioteca pública (pt-BR), mais usadas · adicionadas em 19/11/2026
  el('vibfi5nlk3hs8Mtvf9Oy', 'Ana Serena', 'f', 'relaxada e clara, narração'),
  el('FIEA0c5UHH9JnvWaQrXS', 'Michele', 'f', 'calma e acolhedora, explicativa'),
  el('hd5xzUNI8bF3Lvk3KkTO', 'Juliana Barbieri', 'f', 'expressiva, YouTube'),
  el('JPaHP82NTgRbDP91t8zP', 'Geni', 'f', 'atendente realista, leitura de script'),
  el('YfD2qVn2wwK9QFehYxSa', 'Larissa', 'f', 'paulistana, versátil'),
  el('dX7gRq1dIvLTgUaWpEFn', 'Rafael Valente', 'm', 'suave e cativante, narração'),
  el('kd1lRcSdRGIfyKxQKjmH', 'Ale Garcia', 'm', 'descontraída, redes sociais'),
  el('n2aB5UDlpf5USMJH7Qst', 'Gilson Lima', 'm', 'articulada, notícias e histórias'),
  el('IlrWo5tGgTuxNTHyGhWD', 'Vagner de Souza', 'm', 'afiada, sarcástica, dublagem'),
  el('SVgp5d1fyFQRW1eQbwkq', 'Lucas Sereno', 'm', 'natural, calma e firme'),
  el('NQ10OlqJ7vYH6XwegHSW', 'Lucke', 'm', 'direta e neutra, conversa'),
  el('JNI7HKGyqNaHqfihNoCi', 'Rener', 'm', 'jovem paulistano, simpática'),
  el('UPTmB6OygMADpd4LOwE5', 'Vinicius Bergamo', 'm', 'jovem, educada e delicada'),
  el('Jvj2FoZHFrWICKQxQXqy', 'Samuel', 'm', 'calorosa e confiante'),
  el('ZAYPVq9zNssSHWCf6pko', 'Roberto Barbieri', 'm', 'suave, audiolivro'),
  el('Jx7J2Fi5Ssla82TsW3YE', 'Cassio', 'm', 'séria e intensa'),
  el('X3j2R63Qu4Gdv6dsU2hB', 'Moutella', 'm', 'madura, mentor'),
  el('6dHxv8ke5peKaO9xM46v', 'Gustavo Jannuzzi', 'm', 'grave e impactante'),
  el('jLIW7D3ar1H9coBmNcVS', 'Conrado Bueno', 'm', 'direta, fitness'),
  el('SAA76GSoxwYgqvFLpT5j', 'Anderson Carlos', 'm', 'sotaque nordestino, animada'),
  el('mBxe7tYxRAMLpIP3fPEp', 'Noel', 'm', 'senhor rouco, Papai Noel'),
  // OpenAI
  oa('coral', 'Coral', 'f', 'calorosa'),
  oa('nova', 'Nova', 'f', 'jovem'),
  oa('shimmer', 'Shimmer', 'f', 'suave'),
  oa('sage', 'Sage', 'f', 'serena'),
  oa('marin', 'Marin', 'f', 'natural, nova geração', true),
  oa('alloy', 'Alloy', 'f', 'neutra'),
  oa('ash', 'Ash', 'm', 'firme'),
  oa('onyx', 'Onyx', 'm', 'grave'),
  oa('echo', 'Echo', 'm', 'neutra'),
  oa('ballad', 'Ballad', 'm', 'expressiva', true),
  oa('verse', 'Verse', 'm', 'versátil', true),
  oa('fable', 'Fable', 'm', 'narrador'),
  oa('cedar', 'Cedar', 'm', 'natural, nova geração', true),
];

/** Modelos de voz da ElevenLabs com português (custo relativo: 1 = preço cheio, 0,5 = metade). */
export const ELEVEN_TTS_MODELS: { id: string; label: string; hint: string; cost: number; tags: boolean; style: boolean; boost: boolean; maxChars: number }[] = [
  { id: 'eleven_v3', label: 'Eleven v3', hint: 'emoções por tags: [happy], [whispers], [laughs]…', cost: 1, tags: true, style: false, boost: false, maxChars: 5000 },
  { id: 'eleven_v4', label: 'Eleven v4', hint: 'o mais novo, expressivo', cost: 1, tags: true, style: false, boost: false, maxChars: 10000 },
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2', hint: 'estável, com controle de estilo', cost: 1, tags: false, style: true, boost: true, maxChars: 10000 },
  { id: 'eleven_v4_turbo', label: 'Eleven v4 Turbo', hint: 'rápido, metade do custo', cost: 0.5, tags: false, style: false, boost: false, maxChars: 10000 },
  { id: 'eleven_v3_conversational', label: 'v3 Conversacional', hint: 'tom de conversa, metade do custo', cost: 0.5, tags: true, style: false, boost: true, maxChars: 5000 },
  { id: 'eleven_turbo_v2_5', label: 'Turbo v2.5', hint: 'rápido, metade do custo', cost: 0.5, tags: false, style: false, boost: false, maxChars: 40000 },
  { id: 'eleven_flash_v2_5', label: 'Flash v2.5', hint: 'o mais rápido, metade do custo', cost: 0.5, tags: false, style: false, boost: false, maxChars: 40000 },
];
export const ELEVEN_DEFAULT_MODEL = 'eleven_multilingual_v2';
export const elevenModel = (id: unknown) => ELEVEN_TTS_MODELS.find(m => m.id === id) || ELEVEN_TTS_MODELS.find(m => m.id === ELEVEN_DEFAULT_MODEL)!;

/** Modelos de voz da OpenAI. */
export const OPENAI_TTS_MODELS: { id: string; label: string; hint: string; instructions: boolean; speed: boolean }[] = [
  { id: 'gpt-4o-mini-tts', label: 'GPT-4o mini TTS', hint: 'segue instruções de tom e emoção', instructions: true, speed: false },
  { id: 'tts-1-hd', label: 'TTS-1 HD', hint: 'alta qualidade, controle de velocidade', instructions: false, speed: true },
  { id: 'tts-1', label: 'TTS-1', hint: 'rápido, controle de velocidade', instructions: false, speed: true },
];
export const openaiModel = (id: unknown) => OPENAI_TTS_MODELS.find(m => m.id === id) || OPENAI_TTS_MODELS[0];
/** A voz funciona neste modelo? (vozes novas da OpenAI só no GPT-4o mini TTS). */
export const voiceFitsModel = (v: VoiceOption, model: string | undefined) => v.provider !== 'openai' || !v.miniOnly || openaiModel(model).instructions;

/** Ajustes da voz (todos opcionais; o provedor usa o padrão da voz quando falta). */
export interface VoiceOptions {
  /** ElevenLabs: id do modelo; OpenAI: id do modelo. */
  model?: string;
  stability?: number;
  similarity?: number;
  style?: number;
  speakerBoost?: boolean;
  /** ElevenLabs 0,7 a 1,2; OpenAI (TTS-1) 0,25 a 4. */
  speed?: number;
  seed?: number;
  normalization?: 'auto' | 'on' | 'off';
}

const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== null ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : undefined;
};

/** Valida os ajustes vindos do navegador conforme o provedor e o modelo. */
export function sanitizeVoiceOptions(provider: VoiceProvider, raw: any): VoiceOptions {
  if (provider === 'openai') {
    const m = openaiModel(raw?.model);
    return { model: m.id, ...(m.speed && num(raw?.speed, 0.25, 4) !== undefined ? { speed: num(raw?.speed, 0.25, 4) } : {}) };
  }
  const m = elevenModel(raw?.model);
  const seed = Number(raw?.seed);
  const out: VoiceOptions = {
    model: m.id,
    stability: num(raw?.stability, 0, 1),
    similarity: num(raw?.similarity, 0, 1),
    style: m.style ? num(raw?.style, 0, 1) : undefined,
    speakerBoost: m.boost && typeof raw?.speakerBoost === 'boolean' ? raw.speakerBoost : undefined,
    speed: num(raw?.speed, 0.7, 1.2),
    seed: Number.isInteger(seed) && seed >= 0 && seed <= 4294967295 ? seed : undefined,
    normalization: ['auto', 'on', 'off'].includes(raw?.normalization) ? raw.normalization : undefined,
  };
  for (const k of Object.keys(out) as (keyof VoiceOptions)[]) if (out[k] === undefined) delete out[k];
  return out;
}

export const voiceById = (provider: VoiceProvider, id: string) => VOICES.find(v => v.provider === provider && v.id === id) || null;

/** Ritmo de fala de Reels em PT-BR: ~2,6 palavras por segundo. */
export const WORDS_PER_SECOND = 2.6;
export const VOICE_TEXT_MAX = 400;
/**
 * Preço da locução pelo tamanho do texto gerado agora:
 * - ElevenLabs: pelo custo do plano Pro (US$ 0,165 por mil caracteres) vezes o custo do modelo
 *   (turbo e flash cobram metade): ~8 por 30 s e ~15 por 60 s no preço cheio;
 * - OpenAI: GPT-4o mini TTS 5 créditos (US$ ~0,02 por minuto); TTS-1 HD e TTS-1 pelos caracteres (US$ 30 e 15 por milhão).
 */
export const VOICE_MIN_CREDITS = 5;
const ELEVENLABS_USD_PER_CHAR = 0.165 / 1000;
const OPENAI_USD_PER_CHAR: Record<string, number> = { 'tts-1-hd': 30 / 1e6, 'tts-1': 15 / 1e6 };
const creditsFromUsd = (usd: number) => Math.max(VOICE_MIN_CREDITS, Math.ceil((usd * 5.72) / 0.067 - 1e-9)); // câmbio e teto de src/lib/generation.ts
export function voiceCredits(provider: VoiceProvider, chars: number, model?: string) {
  const n = Math.max(0, chars);
  if (provider === 'openai') {
    const perChar = OPENAI_USD_PER_CHAR[model || ''];
    // + transcrição do próprio áudio para o tempo das palavras (US$ 0,006 por minuto, ~900 caracteres por minuto).
    return perChar ? creditsFromUsd(n * perChar + (n / 900) * 0.006) : VOICE_MIN_CREDITS;
  }
  return creditsFromUsd(n * ELEVENLABS_USD_PER_CHAR * elevenModel(model).cost);
}

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
