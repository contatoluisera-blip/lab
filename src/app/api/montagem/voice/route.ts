import { withTool, describeProviderError } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { textStreamResponse } from '@/lib/server/stream';
import { SCRIPT_DONE_MARK } from '@/lib/montagem';
import { VOICE_CREDITS, VoiceSegment, segmentReady, voiceById } from '@/lib/voice';
import { loadOwnedProject, projects } from '@/lib/server/montagem/projects';
import { deleteVoiceFiles, projectVoice, storeVoice, synthesize } from '@/lib/server/montagem/voice';
import { logAiCost } from '@/lib/server/aiCost';
import { moderatePrompt } from '@/lib/server/generation/moderation';

/**
 * Gera a voz dos trechos que mudaram (texto ou voz), 3 por vez, com o tempo de cada palavra.
 * Cobra 1 crédito por geração; se falhar, devolve. Responde em streaming (vários trechos passam do
 * limite de uma resposta comum) e termina com a marca de conclusão.
 */
export const POST = withTool('montagem', async ({ user, body, refund }) => {
  const project = await loadOwnedProject(user.uid, body?.projectId);
  const voice = projectVoice(user.uid, project);
  if (!voice || !voiceById(voice.provider, voice.voiceId)) throw new HttpError(400, 'no_voice', 'Escolha a voz e escreva a locução primeiro.');
  const todo = voice.segments.filter(s => s.text.trim() && !segmentReady(s, voice));
  if (!todo.length) throw new HttpError(400, 'voice_ready', 'A locução já está gerada. Mude um texto ou a voz para gerar de novo.');
  // A fala também vira legenda: passa pela mesma moderação dos textos da tela.
  const moderation = moderatePrompt(todo.map(t => t.text).join('\n'));
  if (!moderation.ok) throw new HttpError(422, 'text_blocked', moderation.reason);

  return textStreamResponse(
    async (write) => {
      const keepAlive = setInterval(() => write(' '), 4000);
      const t0 = Date.now();
      try {
        const done: Record<string, NonNullable<VoiceSegment['audio']>> = {};
        let usd = 0;
        let chars = 0;
        let seconds = 0;
        let next = 0;
        const worker = async () => {
          while (next < todo.length) {
            const seg = todo[next++];
            const text = seg.text.trim();
            const out = await synthesize(voice.provider, voice.voiceId, text, voice.style || '');
            const stored = await storeVoice(user.uid, seg.clipId, out.audio);
            done[seg.clipId] = { ...stored, seconds: Math.round(out.seconds * 100) / 100, words: out.words, provider: voice.provider, voiceId: voice.voiceId, text };
            usd += out.usd; chars += text.length; seconds += out.seconds;
            write(`\nVoz pronta: ${Object.keys(done).length} de ${todo.length}...`);
          }
        };
        await Promise.all([worker(), worker(), worker()]);

        // Grava só o áudio, lendo o projeto na hora: se o texto mudou enquanto gerava, o trecho fica para a próxima.
        const ref = projects().doc(project.id);
        const stale: string[] = [];
        await adminDb.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
          const current = ((await tx.get(ref)).data()?.voice || null) as { segments?: VoiceSegment[] } | null;
          if (!current?.segments) return;
          const segments = current.segments.map(s => {
            const audio = done[s.clipId];
            if (!audio || s.text.trim() !== audio.text) return s;
            if (s.audio?.path) stale.push(s.audio.path);
            return { ...s, audio };
          });
          tx.update(ref, { 'voice.segments': segments, updatedAt: new Date().toISOString() });
        });
        await deleteVoiceFiles(stale);
        await logAiCost({ uid: user.uid, projectId: project.id, step: 'locucao_voz', provider: voice.provider, model: voice.voiceId, usd: Math.round(usd * 10000) / 10000, ms: Date.now() - t0,
          units: { chars, seconds: Math.round(seconds * 10) / 10, segments: todo.length } });
        write(SCRIPT_DONE_MARK + JSON.stringify({ generated: Object.keys(done).length }));
      } finally {
        clearInterval(keepAlive);
      }
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: `${err.message} Seu crédito foi devolvido.`, code: err.code };
      const e = describeProviderError(err, voice.provider === 'openai' ? 'OpenAI' : 'ElevenLabs');
      return { error: e.message, code: e.code };
    }
  );
}, { cost: () => VOICE_CREDITS, logDescription: () => 'Montagem: gerou a locução' });
