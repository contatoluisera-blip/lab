import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { GEN_LIMITS } from '@/lib/generation';
import { fitPrompt } from '@/lib/server/prompts/fit';

/**
 * Encurta um prompt que passou do limite das plataformas (2.500 caracteres), mantendo blocos e decisões.
 * Não cobra: corrige o tamanho de um prompt que a própria ferramenta escreveu.
 */
export const POST = withTool('prompts', async ({ body }) => {
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) throw new HttpError(400, 'missing_prompt', 'Prompt vazio.');
  if (prompt.length > 12_000) throw new HttpError(400, 'prompt_too_long', 'Prompt grande demais para encurtar.');
  const max = Math.min(GEN_LIMITS.promptMax, Math.max(1000, Number(body?.max) || GEN_LIMITS.promptMax));
  if (prompt.length <= max) return { prompt };
  return { prompt: await fitPrompt(prompt, max) };
}, { charge: false, logDescription: () => 'Gerador de Prompts: encurtou prompt longo' });
