// Estúdio de Áudio no servidor: guarda o arquivo, registra a geração na biblioteca (gen_jobs)
// e gera efeitos sonoros na ElevenLabs. A locução reaproveita `synthesize` da Montagem.

import { randomUUID } from 'crypto';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { ChargeResult, chargeFields } from '@/lib/server/credits';
import { claudeCostUsd } from '@/lib/server/aiCost';
import { newJobId } from '@/lib/server/generation/queue';
import { SFX_MODEL } from '@/lib/audioStudio';
import type { GenJob } from '@/lib/generation';
import type { ToolId } from '@/lib/planConfig';

/** Guarda o MP3 em gen-outputs/{uid}/audio/ e devolve o link com token. */
export async function storeAudio(uid: string, audio: Buffer, prefix: string) {
  const path = `gen-outputs/${uid}/audio/${prefix}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.mp3`;
  const token = randomUUID();
  const bucket = adminStorage.bucket();
  await bucket.file(path).save(audio, { metadata: { contentType: 'audio/mpeg', metadata: { firebaseStorageDownloadTokens: token } } });
  return { path, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
}

/**
 * Registra uma locução ou efeito já pronto na biblioteca de áudio (mesma coleção das trilhas),
 * para aparecer no Estúdio de Áudio e na Montagem.
 */
export async function saveInstantAudio(uid: string, charge: ChargeResult, tool: ToolId, item: {
  audioType: 'voice' | 'sfx';
  modelId: string;
  modelName: string;
  prompt: string;
  title: string | null;
  credits: number;
  file: { path: string; url: string };
  seconds: number;
  words?: GenJob['words'];
  config?: GenJob['config'];
}) {
  const id = newJobId();
  const now = new Date().toISOString();
  await adminDb.collection('gen_jobs').doc(id).set({
    uid, kind: 'audio', mode: 't2a', audioType: item.audioType,
    modelId: item.modelId, modelName: item.modelName, config: item.config || {},
    prompt: item.prompt, title: item.title, credits: item.credits, ...chargeFields(charge), tool,
    status: 'completed', active: false,
    outputs: [{ url: item.file.url, path: item.file.path, type: 'audio', stored: true, seconds: Math.round(item.seconds * 100) / 100 }],
    ...(item.words?.length ? { words: item.words } : {}),
    inputPaths: { images: [] }, expectedKieCredits: 0, refunded: false, attempts: 0, error: null,
    projectId: null, sceneId: null, createdAt: now, completedAt: now,
  });
  return id;
}

/** O gerador de efeitos entende melhor inglês: traduz a descrição (Claude rápido, frações de centavo). */
export async function sfxPromptInEnglish(text: string) {
  if (/^[\x20-\x7E]+$/.test(text) && !/\b(de|com|um|uma|som|barulho|para)\b/i.test(text)) return { text, usd: 0 };
  const res = await anthropicClient().messages.create({
    model: AI_MODELS.anthropicFast,
    max_tokens: 200,
    system: 'Translate the sound effect description to concise, vivid English for an AI sound effect generator. Keep every sound detail. Output only the English description, no quotes.',
    messages: [{ role: 'user', content: text }],
  });
  const out = res.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim();
  return { text: out || text, usd: claudeCostUsd(AI_MODELS.anthropicFast, res.usage) };
}

/** Gera o efeito na ElevenLabs (40 créditos dela por segundo). */
export async function elevenlabsSfx(text: string, seconds: number, loop: boolean) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new HttpError(503, 'sfx_unconfigured', 'Os efeitos sonoros ainda não estão disponíveis.');
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, duration_seconds: seconds, prompt_influence: 0.45, loop, model_id: SFX_MODEL }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[sfx] ElevenLabs', res.status, detail.slice(0, 300));
    throw new HttpError(502, 'sfx_provider', res.status === 401 || res.status === 402
      ? 'Os efeitos sonoros estão sem saldo no provedor. Já avisamos o suporte.'
      : 'O provedor de efeitos não respondeu. Tente de novo.');
  }
  return Buffer.from(await res.arrayBuffer());
}
