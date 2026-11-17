import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { SCRIPT_DONE_MARK } from '@/lib/montagem';
import { SFX_DEFAULT_INFLUENCE, SFX_DEFAULT_SECONDS, SFX_DURATIONS, SFX_MODEL, SFX_PROMPT_MAX, sfxCredits } from '@/lib/audioStudio';
import { elevenlabsSfx, saveInstantAudio, sfxPromptInEnglish, storeAudio } from '@/lib/server/audio';
import { logAiCost } from '@/lib/server/aiCost';
import { moderatePrompt } from '@/lib/server/generation/moderation';

/** Duração de um MP3 CBR de 128 kbps (o formato pedido à ElevenLabs), para a duração automática. */
const mp3Seconds = (audio: Buffer) => Math.max(0.5, Math.round((audio.length * 8) / 128_000 * 10) / 10);

const secondsOf = (body: any) => {
  const n = Number(body?.seconds);
  return SFX_DURATIONS.includes(n) ? n : SFX_DEFAULT_SECONDS;
};

/**
 * Estúdio de Áudio: efeito sonoro a partir de uma descrição (ElevenLabs, text-to-sound).
 * Cobra pela duração; se o provedor falhar, devolve. A descrição vai em inglês para o gerador.
 */
export const POST = withTool('audio', async ({ user, body, charge, refund }) => {
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  if (text.length < 3) throw new HttpError(400, 'no_text', 'Descreva o efeito sonoro.');
  if (text.length > SFX_PROMPT_MAX) throw new HttpError(400, 'text_too_long', `Use até ${SFX_PROMPT_MAX} caracteres.`);
  const moderation = moderatePrompt(text);
  if (!moderation.ok) throw new HttpError(422, 'text_blocked', moderation.reason);
  const seconds = secondsOf(body);
  const loop = body?.loop === true;
  const inf = Number(body?.influence);
  const influence = Number.isFinite(inf) ? Math.min(1, Math.max(0, Math.round(inf * 100) / 100)) : SFX_DEFAULT_INFLUENCE;
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 80) || null : null;

  return textStreamResponse(
    async (write) => {
      const keepAlive = setInterval(() => write(' '), 4000);
      const t0 = Date.now();
      try {
        const english = typeof body?.english === 'string' && body.english.trim() ? { text: body.english.trim().slice(0, SFX_PROMPT_MAX), usd: 0 } : await sfxPromptInEnglish(text);
        write('\nGerando o efeito...');
        const audio = await elevenlabsSfx(english.text, seconds || null, loop, influence);
        const file = await storeAudio(user.uid, audio, 'sfx');
        const id = await saveInstantAudio(user.uid, charge, 'audio', {
          audioType: 'sfx', modelId: 'elevenlabs-sfx', modelName: 'ElevenLabs Sound Effects',
          prompt: text, title: title || text.slice(0, 60), credits: sfxCredits(seconds), file, seconds: seconds || mp3Seconds(audio),
          config: { ...(seconds ? { duration: seconds } : {}), ...(loop ? { quality: 'loop' } : {}) }, extra: { sfx: { english: english.text, seconds: seconds || 'auto', loop, influence } },
        });
        await logAiCost({ uid: user.uid, step: 'estudio_efeito', provider: 'elevenlabs', model: SFX_MODEL, ms: Date.now() - t0,
          usd: Math.round(((seconds ? seconds * 40 : 200) * (0.165 / 1000) + english.usd) * 10000) / 10000, units: { seconds, elevenCredits: seconds ? seconds * 40 : 200 } });
        write(SCRIPT_DONE_MARK + JSON.stringify({ id, prompt: english.text }));
      } finally {
        clearInterval(keepAlive);
      }
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: `${err.message} Seu crédito foi devolvido.`, code: err.code };
      const e = describeProviderError(err, 'ElevenLabs');
      return { error: e.message, code: e.code };
    }
  );
}, {
  cost: (body) => sfxCredits(secondsOf(body)),
  logDescription: () => 'Estúdio de Áudio: gerou efeito sonoro',
});
