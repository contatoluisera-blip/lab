// Locução da Montagem no servidor: o Claude escreve o texto falado de cada clipe e a voz é gerada
// (ElevenLabs ou OpenAI) com o tempo de cada palavra, guardada no Storage da Creator Lab.

import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { adminStorage } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { anthropicClient, openaiClient } from '@/lib/server/ai';
import { claudeCostUsd } from '@/lib/server/aiCost';
import { Edl, MONTAGEM_FPS, VideoProject, clipFrames, uploadFolder } from '@/lib/montagem';
import { UNIT_COST_USD } from '@/lib/platformCosts';
import { ProjectVoice, VOICE_TEXT_MAX, VoiceOptions, VoiceProvider, VoiceWord, WORDS_PER_SECOND, elevenModel, openaiModel } from '@/lib/voice';

const ELEVEN_MODEL = 'eleven_multilingual_v2';
/** Custo de referência por mil caracteres e por minuto (src/lib/platformCosts.ts). */
const ELEVEN_USD_PER_1K = UNIT_COST_USD.elevenlabsPer1kChars;

// ── Texto da locução ─────────────────────────────────────────────────────────
const SCRIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['trechos', 'observacao'],
  properties: {
    trechos: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['clipId', 'texto'],
        properties: { clipId: { type: 'string' }, texto: { type: 'string', description: 'Fala deste clipe, ou vazio para deixar o clipe respirar.' } },
      },
    },
    observacao: { type: 'string', description: 'Uma frase sobre o tom e as escolhas da locução.' },
  },
} as const;

const SCRIPT_SYSTEM = `Você é roteirista de locução para vídeos curtos (Reels, TikTok, Shorts) em português do Brasil.
Recebe a linha do tempo do vídeo: cada clipe com a duração, o que a cena mostra e o texto que já aparece na tela.
Escreva a fala de cada clipe para um locutor gravar. Regras:
- Fala natural, de gente, no tom pedido; frases curtas; nada de linguagem de anúncio antigo.
- Cada fala cabe na duração do clipe: no máximo ${WORDS_PER_SECOND} palavras por segundo (ex.: 4 s → até 10 palavras). Prefira ficar abaixo.
- A primeira fala é o gancho: prende nos primeiros segundos.
- Não leia o texto da tela palavra por palavra; a fala complementa o que se vê.
- Pode deixar um clipe sem fala (texto vazio) quando a imagem fala por si ou para dar respiro; o último pode trazer a chamada.
- Números e siglas escritos como se falam ("três", "dois mil e vinte e seis"). Sem emojis, sem hashtags, sem indicações de cena.
- Nunca invente fatos, preços ou promessas que não estejam no roteiro ou no objetivo.
Use exatamente os clipId recebidos.`;

export async function writeVoiceScript(project: VideoProject, edl: Edl, style: string) {
  const clips = edl.clips.map(c => {
    const scene = project.scenes.find(s => s.id === c.sceneId);
    const upload = (project.uploads || []).find(u => u.id === c.jobId);
    return {
      clipId: c.id,
      duracao: Math.round((clipFrames(c) / MONTAGEM_FPS) * 10) / 10,
      maxPalavras: Math.floor((clipFrames(c) / MONTAGEM_FPS) * WORDS_PER_SECOND),
      cena: scene ? `${scene.title}. ${scene.text}`.slice(0, 500) : upload ? `Vídeo enviado: ${upload.name}. ${upload.description}`.slice(0, 500) : null,
      textoNaTela: c.text || null,
    };
  });
  const payload = { titulo: project.title, objetivo: project.goal || null, tom: style || 'natural e envolvente', clipes: clips, chamadaFinal: edl.endCard.enabled ? edl.endCard.title : null };
  const response = await anthropicClient().beta.messages.create({
    model: process.env.ANTHROPIC_MODEL_EDIT || 'claude-opus-5-5',
    max_tokens: 8000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCRIPT_SCHEMA } },
    betas: ['server-side-fallback-2026-06-01'],
    fallbacks: [{ model: 'claude-opus-4-8' }],
    system: SCRIPT_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(payload, null, 1) }],
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === 'refusal') throw new HttpError(422, 'voice_refused', 'A IA não pôde escrever esta locução. Revise os textos do vídeo.');
  const text = response.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new HttpError(502, 'voice_script_failed', 'Não foi possível escrever a locução agora. Tente de novo.');
  const out = JSON.parse(text.text);
  const ids = new Set(edl.clips.map(c => c.id));
  const segments = (out.trechos || [])
    .filter((t: any) => ids.has(String(t.clipId)))
    .map((t: any) => ({ clipId: String(t.clipId), text: String(t.texto || '').replace(/\s+/g, ' ').trim().slice(0, VOICE_TEXT_MAX), audio: null }));
  return { segments, note: String(out.observacao || ''), usd: claudeCostUsd(response.model, response.usage), model: response.model, usage: response.usage };
}

// ── Voz ──────────────────────────────────────────────────────────────────────
/**
 * ElevenLabs devolve o tempo de cada caractere: junta em palavras (mantém a pontuação colada).
 * Tags de emoção do v3/v4 ([happy], [whispers]…) não são faladas: ficam fora da legenda.
 */
function wordsFromAlignment(a: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }): VoiceWord[] {
  const words: VoiceWord[] = [];
  let cur: VoiceWord | null = null;
  let inTag = false;
  a.characters.forEach((ch, i) => {
    if (ch === '[') { inTag = true; return; }
    if (inTag) { if (ch === ']') inTag = false; return; }
    if (/\s/.test(ch)) { if (cur) words.push(cur); cur = null; return; }
    if (!cur) cur = { w: '', s: a.character_start_times_seconds[i], e: a.character_end_times_seconds[i] };
    cur.w += ch;
    cur.e = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words.map(w => ({ w: w.w, s: Math.round(w.s * 1000) / 1000, e: Math.round(w.e * 1000) / 1000 }));
}

async function elevenlabs(voiceId: string, text: string, opts: VoiceOptions = {}) {
  const model = elevenModel(opts.model || ELEVEN_MODEL);
  const settings = {
    ...(opts.stability !== undefined ? { stability: opts.stability } : {}),
    ...(opts.similarity !== undefined ? { similarity_boost: opts.similarity } : {}),
    ...(opts.style !== undefined ? { style: opts.style } : {}),
    ...(opts.speakerBoost !== undefined ? { use_speaker_boost: opts.speakerBoost } : {}),
    ...(opts.speed !== undefined ? { speed: opts.speed } : {}),
  };
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new HttpError(503, 'voice_unconfigured', 'A locução com ElevenLabs ainda não está disponível.');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, model_id: model.id, language_code: 'pt',
      ...(Object.keys(settings).length ? { voice_settings: settings } : {}),
      ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
      ...(opts.normalization ? { apply_text_normalization: opts.normalization } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.audio_base64) {
    console.error('[voz] ElevenLabs', res.status, JSON.stringify(data).slice(0, 300));
    throw new HttpError(502, 'voice_provider', res.status === 401 || res.status === 402 ? 'A locução está sem saldo no provedor. Já avisamos o suporte.' : 'O provedor de voz não respondeu. Tente de novo.');
  }
  const words = data.alignment ? wordsFromAlignment(data.alignment) : [];
  const seconds = words.length ? words[words.length - 1].e + 0.15 : text.length / 14;
  return { audio: Buffer.from(data.audio_base64, 'base64'), words, seconds, usd: (text.length / 1000) * ELEVEN_USD_PER_1K * model.cost };
}

/**
 * A transcrição erra nomes e marcas ("Creator Lab" vira "Curlab"): a legenda usa sempre as palavras
 * do texto original e aproveita da transcrição só o tempo, pela posição relativa de cada letra.
 */
export function retimeWords(text: string, heard: VoiceWord[]): VoiceWord[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!heard.length || !tokens.length) return [];
  const size = (w: string) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length);
  // Pontos de ancoragem: (fração do texto falado, segundo) no início e no fim de cada palavra ouvida.
  const heardTotal = heard.reduce((n, w) => n + size(w.w), 0);
  const anchors: [number, number][] = [];
  let acc = 0;
  for (const w of heard) {
    anchors.push([acc / heardTotal, w.s]);
    acc += size(w.w);
    anchors.push([acc / heardTotal, w.e]);
  }
  const at = (f: number) => {
    for (let i = 1; i < anchors.length; i++) {
      const [f0, t0] = anchors[i - 1], [f1, t1] = anchors[i];
      if (f <= f1) return f1 === f0 ? t1 : t0 + ((f - f0) / (f1 - f0)) * (t1 - t0);
    }
    return anchors[anchors.length - 1][1];
  };
  const total = tokens.reduce((n, w) => n + size(w), 0);
  let pos = 0;
  let prevEnd = 0;
  return tokens.map(w => {
    const s = Math.max(prevEnd, at(pos / total));
    pos += size(w);
    const e = Math.max(s + 0.05, at(pos / total));
    prevEnd = Math.round(e * 1000) / 1000;
    return { w, s: Math.round(s * 1000) / 1000, e: prevEnd };
  });
}

async function openai(voiceId: string, text: string, style: string, opts: VoiceOptions = {}) {
  const client = openaiClient();
  const model = openaiModel(opts.model);
  const speech = await client.audio.speech.create({
    model: model.id, voice: voiceId, input: text, response_format: 'mp3',
    ...(model.instructions ? { instructions: `Fale em português do Brasil, com sotaque brasileiro natural. Tom: ${style || 'natural e envolvente, ritmo de Reels'}.` } : {}),
    ...(model.speed && opts.speed !== undefined ? { speed: opts.speed } : {}),
  });
  const audio = Buffer.from(await speech.arrayBuffer());
  // A OpenAI não devolve o tempo das palavras: a transcrição do próprio áudio dá.
  const tr: any = await client.audio.transcriptions.create({
    file: new File([audio], 'voz.mp3', { type: 'audio/mpeg' }), model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['word'], language: 'pt',
    prompt: text.slice(0, 800),
  });
  const heard: VoiceWord[] = (tr.words || []).map((w: any) => ({ w: String(w.word), s: Math.round(w.start * 1000) / 1000, e: Math.round(w.end * 1000) / 1000 }));
  const words = retimeWords(text, heard);
  const seconds = Number(tr.duration) || (words.length ? words[words.length - 1].e + 0.15 : text.length / 14);
  const usd = model.instructions ? (seconds / 60) * UNIT_COST_USD.openaiVoicePerMinute
    : text.length * (model.id === 'tts-1-hd' ? 30 : 15) / 1e6 + (seconds / 60) * 0.006;
  return { audio, words, seconds, usd };
}

export async function synthesize(provider: VoiceProvider, voiceId: string, text: string, style: string, opts: VoiceOptions = {}) {
  return provider === 'elevenlabs' ? elevenlabs(voiceId, text, opts) : openai(voiceId, text, style, opts);
}

/** Guarda o MP3 na pasta da pessoa e devolve o link com token. */
export async function storeVoice(uid: string, clipId: string, audio: Buffer) {
  const path = `${uploadFolder(uid)}voice-${clipId.replace(/[^a-zA-Z0-9_-]/g, '')}-${randomUUID().slice(0, 8)}.mp3`;
  const token = randomUUID();
  const bucket = adminStorage.bucket();
  await bucket.file(path).save(audio, { metadata: { contentType: 'audio/mpeg', metadata: { firebaseStorageDownloadTokens: token } } });
  return { path, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
}

export async function deleteVoiceFiles(paths: string[]) {
  const bucket = adminStorage.bucket();
  await Promise.all(paths.map(p => bucket.file(p).delete().catch(() => {})));
}

/** Locução vinda do projeto (o navegador escreve o texto): só valem áudios na pasta da pessoa. */
export function projectVoice(uid: string, project: VideoProject): ProjectVoice | null {
  const v = project.voice;
  if (!v || !Array.isArray(v.segments)) return null;
  const folder = uploadFolder(uid);
  return {
    provider: v.provider === 'openai' ? 'openai' : 'elevenlabs',
    voiceId: String(v.voiceId || ''),
    style: typeof v.style === 'string' ? v.style.slice(0, 200) : '',
    segments: v.segments.slice(0, 60).map(s => ({
      clipId: String(s.clipId || ''),
      text: String(s.text || '').slice(0, VOICE_TEXT_MAX),
      audio: s.audio && typeof s.audio.path === 'string' && s.audio.path.startsWith(folder) && !s.audio.path.includes('..') ? s.audio : null,
    })),
  };
}
