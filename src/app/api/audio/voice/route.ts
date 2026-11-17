import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { SCRIPT_DONE_MARK } from '@/lib/montagem';
import { VOICE_STUDIO_TEXT_MAX } from '@/lib/audioStudio';
import { VoiceProvider, voiceById, voiceCredits } from '@/lib/voice';
import { synthesize } from '@/lib/server/montagem/voice';
import { saveInstantAudio, storeAudio } from '@/lib/server/audio';
import { logAiCost } from '@/lib/server/aiCost';
import { moderatePrompt } from '@/lib/server/generation/moderation';

function readRequest(body: any) {
  const provider: VoiceProvider = body?.provider === 'openai' ? 'openai' : 'elevenlabs';
  const voiceId = String(body?.voiceId || '');
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  return { provider, voiceId, text };
}

/**
 * Estúdio de Áudio: locução avulsa a partir de um texto, com o tempo de cada palavra (legenda .srt
 * e Montagem). Cobra pelo tamanho do texto; se o provedor falhar, devolve. Responde em streaming:
 * textos longos passam do limite de uma resposta comum.
 */
export const POST = withTool('audio', async ({ user, body, charge, refund }) => {
  const { provider, voiceId, text } = readRequest(body);
  const voice = voiceById(provider, voiceId);
  if (!voice) throw new HttpError(400, 'no_voice', 'Escolha uma voz.');
  if (text.length < 2) throw new HttpError(400, 'no_text', 'Escreva o texto da locução.');
  if (text.length > VOICE_STUDIO_TEXT_MAX) throw new HttpError(400, 'text_too_long', `O texto passa de ${VOICE_STUDIO_TEXT_MAX} caracteres. Divida em partes.`);
  const moderation = moderatePrompt(text);
  if (!moderation.ok) throw new HttpError(422, 'text_blocked', moderation.reason);
  const style = typeof body?.style === 'string' ? body.style.slice(0, 200) : '';
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 80) || null : null;

  return textStreamResponse(
    async (write) => {
      const keepAlive = setInterval(() => write(' '), 4000);
      const t0 = Date.now();
      try {
        write('\nGerando a voz...');
        const out = await synthesize(provider, voiceId, text, style);
        write('\nSalvando...');
        const file = await storeAudio(user.uid, out.audio, 'voz');
        const id = await saveInstantAudio(user.uid, charge, 'audio', {
          audioType: 'voice', modelId: `${provider}-tts`, modelName: `${voice.name} · ${provider === 'openai' ? 'OpenAI' : 'ElevenLabs'}`,
          prompt: text, title, credits: voiceCredits(provider, text.length), file, seconds: out.seconds, words: out.words,
          config: { quality: voiceId },
        });
        await logAiCost({ uid: user.uid, step: 'estudio_locucao', provider, model: voiceId, usd: Math.round(out.usd * 10000) / 10000, ms: Date.now() - t0,
          units: { chars: text.length, seconds: Math.round(out.seconds * 10) / 10 } });
        write(SCRIPT_DONE_MARK + JSON.stringify({ id }));
      } finally {
        clearInterval(keepAlive);
      }
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: `${err.message} Seu crédito foi devolvido.`, code: err.code };
      const e = describeProviderError(err, provider === 'openai' ? 'OpenAI' : 'ElevenLabs');
      return { error: e.message, code: e.code };
    }
  );
}, {
  cost: (body) => {
    const { provider, text } = readRequest(body);
    return voiceCredits(provider, Math.min(text.length, VOICE_STUDIO_TEXT_MAX));
  },
  logDescription: () => 'Estúdio de Áudio: gerou locução',
});
