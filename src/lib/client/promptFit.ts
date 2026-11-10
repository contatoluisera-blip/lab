'use client';

import { callTool } from '@/lib/client/api';
import { GEN_LIMITS } from '@/lib/generation';

/**
 * Garante que o prompt cabe no limite das plataformas. Modelos sem campo de negative recebem
 * "Avoid: ..." no fim, então o espaço do negative sai do limite. Prompt que já cabe volta igual.
 */
export async function ensurePromptFits(prompt: string, negativePrompt = '') {
  const room = GEN_LIMITS.promptMax - (negativePrompt.trim() ? negativePrompt.trim().length + 8 : 0);
  const max = Math.max(1500, room);
  if (prompt.length <= max) return prompt;
  const res = await callTool<{ prompt: string }>('/api/tools/prompt-fit', { prompt, max });
  return res.data.prompt;
}
