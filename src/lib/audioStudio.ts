// ─────────────────────────────────────────────────────────────
// Estúdio de Áudio: locução, trilha e efeitos sonoros como ferramenta própria.
// Tudo fica em `gen_jobs` (kind 'audio'), na mesma biblioteca que a Montagem lê:
// - trilha (Suno, pela fila da KIE) → audioType 'music';
// - locução (ElevenLabs ou OpenAI) e efeito sonoro (ElevenLabs) → gerados na hora.
// ─────────────────────────────────────────────────────────────

import { creditsForUsd } from './generation';
import type { GenJob } from './generation';
import type { VoiceWord } from './voice';

export type AudioType = 'music' | 'voice' | 'sfx';

export const AUDIO_TYPE_LABEL: Record<AudioType, string> = {
  music: 'Trilha',
  voice: 'Locução',
  sfx: 'Efeito sonoro',
};

/** Trilhas antigas (Suno, antes do Estúdio) não têm o campo: são trilha. */
export const audioTypeOf = (job: Pick<GenJob, 'kind'> & { audioType?: AudioType | null }): AudioType | null =>
  job.kind !== 'audio' ? null : job.audioType || 'music';

// ── Locução avulsa ───────────────────────────────────────────────────────────
/** Texto de até ~3 minutos de fala. */
export const VOICE_STUDIO_TEXT_MAX = 2500;

// ── Efeitos sonoros (ElevenLabs, text-to-sound v3) ───────────────────────────
export const SFX_MODEL = 'eleven_text_to_sound_v3';
export const SFX_PROMPT_MAX = 300;
/** 0 = automática (o gerador escolhe pelo texto). */
export const SFX_DURATIONS = [0, 0.5, 1, 2, 3, 5, 8, 10, 15, 20, 30];
export const SFX_DEFAULT_SECONDS = 3;
/** Fidelidade à descrição: quanto o gerador segue o texto ao pé da letra (0 a 1; padrão da ElevenLabs 0,3). */
export const SFX_DEFAULT_INFLUENCE = 0.3;
/**
 * A ElevenLabs cobra 40 créditos dela por segundo com duração definida e ~200 por pedido na automática;
 * no plano Pro, US$ 0,165 por mil.
 */
const SFX_USD_PER_SECOND = 40 * (0.165 / 1000);
export const sfxCredits = (seconds: number) => creditsForUsd((seconds > 0 ? Math.max(1, seconds) : 5) * SFX_USD_PER_SECOND, 5);

/** Atalhos de efeito: o rótulo em português e a descrição que vai para o gerador (em inglês, que ele entende melhor). */
export const SFX_PRESETS: { label: string; text: string; seconds: number }[] = [
  { label: 'Whoosh de transição', text: 'fast cinematic whoosh transition, airy swoosh passing by', seconds: 1 },
  { label: 'Impacto grave', text: 'deep cinematic boom impact with sub bass hit and short tail', seconds: 2 },
  { label: 'Clique de botão', text: 'clean modern UI button click, crisp and short', seconds: 1 },
  { label: 'Notificação', text: 'pleasant smartphone notification chime, bright and short', seconds: 1 },
  { label: 'Pop de texto', text: 'cartoon pop sound for text appearing on screen, playful bubble pop', seconds: 1 },
  { label: 'Caixa registradora', text: 'cash register cha-ching with coins, satisfying sale sound', seconds: 2 },
  { label: 'Plateia aplaudindo', text: 'small audience applause and cheering, warm and enthusiastic', seconds: 5 },
  { label: 'Riser de tensão', text: 'rising tension riser, building synth sweep ending abruptly', seconds: 5 },
  { label: 'Café da manhã', text: 'busy coffee shop ambience, espresso machine hiss, cups clinking, soft chatter', seconds: 10 },
  { label: 'Chuva na janela', text: 'gentle rain on a window, calm and cozy ambience', seconds: 10 },
];

// ── Legenda .srt a partir do tempo de cada palavra ───────────────────────────
const srtTime = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms % 1000, 3)}`;
};

/** Blocos de até 7 palavras (ou 3 s), quebrando no fim das frases. */
export function srtFromWords(words: VoiceWord[]) {
  const blocks: VoiceWord[][] = [];
  let cur: VoiceWord[] = [];
  for (const w of words) {
    cur.push(w);
    const long = cur.length >= 7 || w.e - cur[0].s >= 3;
    if (long || /[.!?…]$/.test(w.w)) { blocks.push(cur); cur = []; }
  }
  if (cur.length) blocks.push(cur);
  return blocks.map((b, i) => `${i + 1}\n${srtTime(b[0].s)} --> ${srtTime(b[b.length - 1].e)}\n${b.map(w => w.w).join(' ')}\n`).join('\n');
}

// ── Trilha (Suno V6 pela KIE, modo personalizado) ────────────────────────────
export const SUNO_VERSIONS: { id: 'V6' | 'V6_MINI' | 'V6_WILD'; label: string; hint: string }[] = [
  { id: 'V6', label: 'Suno V6', hint: 'o mais completo e fiel ao estilo' },
  { id: 'V6_MINI', label: 'Suno V6 Mini', hint: 'mais rápido' },
  { id: 'V6_WILD', label: 'Suno V6 Wild', hint: 'mais criativo e experimental' },
];
export const MUSIC_LYRICS_MAX = 5000;
export const MUSIC_STYLE_MAX = 1000;

/** Parâmetros do Suno além do estilo, do título e da duração (estes ficam no pedido e no `config`). */
export interface MusicOptions {
  version: 'V6' | 'V6_MINI' | 'V6_WILD';
  /** Sem voz. Com voz, a letra vem em `lyrics`. */
  instrumental: boolean;
  lyrics?: string;
  /** Voz cantada (o Suno trata como preferência, não garantia). */
  vocalGender?: 'm' | 'f';
  /** Quanto seguir o estilo descrito (0 a 1). */
  styleWeight?: number;
  /** Quanto pode fugir do óbvio (0 a 1). */
  weirdness?: number;
  /** Peso do áudio de referência/voz (0 a 1; só com voz). */
  audioWeight?: number;
  /** Variedade: 0 exata, 1 normal, 2 alta, 3 extra, 4 máxima. */
  variety?: number;
}

export const MUSIC_DEFAULTS: MusicOptions = { version: 'V6', instrumental: true };

const unit = (v: unknown) => {
  const n = Number(v);
  return v === '' || v === null || v === undefined || !Number.isFinite(n) ? undefined : Math.min(1, Math.max(0, Math.round(n * 100) / 100));
};

/** Valida os parâmetros do Suno vindos do navegador (o servidor confia só nisto). */
export function sanitizeMusicOptions(raw: any): MusicOptions {
  const version = SUNO_VERSIONS.some(v => v.id === raw?.version) ? raw.version : 'V6';
  const instrumental = raw?.instrumental !== false;
  const lyrics = !instrumental && typeof raw?.lyrics === 'string' ? raw.lyrics.trim().slice(0, MUSIC_LYRICS_MAX) : '';
  const variety = Number(raw?.variety);
  const out: MusicOptions = {
    version, instrumental,
    ...(lyrics ? { lyrics } : {}),
    ...(!instrumental && (raw?.vocalGender === 'm' || raw?.vocalGender === 'f') ? { vocalGender: raw.vocalGender } : {}),
    ...(unit(raw?.styleWeight) !== undefined ? { styleWeight: unit(raw?.styleWeight) } : {}),
    ...(unit(raw?.weirdness) !== undefined ? { weirdness: unit(raw?.weirdness) } : {}),
    ...(!instrumental && unit(raw?.audioWeight) !== undefined ? { audioWeight: unit(raw?.audioWeight) } : {}),
    ...(Number.isInteger(variety) && variety >= 0 && variety <= 4 ? { variety } : {}),
  };
  return out;
}
