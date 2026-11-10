import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';

const SYSTEM = `Você é editor de prompts de geração de imagem e vídeo por IA.
Recebe um prompt pronto que passou do limite de caracteres da plataforma e devolve a MESMA direção, mais enxuta.
Regras:
- Mantenha o idioma, a ordem e todos os blocos rotulados ([SHOT], [ACTION], [LIGHT]...), com os mesmos rótulos.
- Preserve todas as decisões: ação ao longo do tempo (com os tempos), câmera e movimento, lente, luz, áudio, continuidade
  (o que fica idêntico) e falas entre aspas, palavra por palavra.
- Corte só redundância: adjetivos repetidos, restrições ditas duas vezes, descrição do que a imagem de entrada já mostra.
- Não acrescente nada novo. Devolva apenas o prompt, sem comentários, aspas em volta ou markdown.`;

/** Reescreve o prompt para caber em `max` caracteres sem perder a direção; tenta duas vezes mirando abaixo do limite. */
export async function fitPrompt(prompt: string, max: number): Promise<string> {
  let current = prompt;
  for (const target of [Math.round(max * 0.85), Math.round(max * 0.7)]) {
    const response = await anthropicClient().messages.create({
      model: AI_MODELS.anthropicMain,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Limite: ${target} caracteres (o atual tem ${current.length}).\n\nPrompt:\n${current}` }],
    });
    const block = response.content.find(b => b.type === 'text');
    const text = block && block.type === 'text' ? block.text.trim().replace(/^```\w*\n?|\n?```$/g, '').trim() : '';
    if (!text) break;
    if (text.length <= max) return text;
    current = text;
  }
  throw new HttpError(502, 'prompt_fit_failed', 'Não foi possível encurtar o prompt automaticamente. Encurte à mão e tente de novo.');
}
