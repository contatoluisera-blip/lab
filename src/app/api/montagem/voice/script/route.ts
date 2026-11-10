import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { emptyEdl } from '@/lib/montagem';
import { voiceById } from '@/lib/voice';
import { loadOwnedProject, projects } from '@/lib/server/montagem/projects';
import { deleteVoiceFiles, projectVoice, writeVoiceScript } from '@/lib/server/montagem/voice';
import { logAiCost } from '@/lib/server/aiCost';

/**
 * O Claude escreve a fala de cada clipe da linha do tempo (salva no projeto), no tempo de cada clipe.
 * Não cobra crédito: o crédito da locução sai na geração da voz.
 */
export const POST = withTool('montagem', async ({ user, body }) => {
  const project = await loadOwnedProject(user.uid, body?.projectId);
  const edl = project.edl || emptyEdl(project.format);
  if (!edl.clips.length) throw new HttpError(400, 'no_clips', 'Monte a linha do tempo antes de escrever a locução.');
  const provider = body?.provider === 'openai' ? 'openai' : 'elevenlabs';
  const voiceId = String(body?.voiceId || '');
  if (!voiceById(provider, voiceId)) throw new HttpError(400, 'bad_voice', 'Escolha uma voz.');
  const style = typeof body?.style === 'string' ? body.style.replace(/\s+/g, ' ').trim().slice(0, 200) : '';

  const out = await writeVoiceScript(project, edl, style);
  // Áudios antigos que não servem mais (texto novo) saem do Storage.
  const previous = projectVoice(user.uid, project);
  const stale = (previous?.segments || []).filter(s => s.audio).map(s => s.audio!.path);
  await projects().doc(project.id).update({ voice: { provider, voiceId, style, segments: out.segments }, updatedAt: new Date().toISOString() });
  await deleteVoiceFiles(stale);
  await logAiCost({ uid: user.uid, projectId: project.id, step: 'locucao_texto', provider: 'anthropic', model: out.model, usd: out.usd,
    units: { inputTokens: out.usage.input_tokens, outputTokens: out.usage.output_tokens, segments: out.segments.length } });
  return { segments: out.segments, note: out.note };
}, { charge: false, logDescription: () => 'Montagem: escreveu a locução com IA' });
