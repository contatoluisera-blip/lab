import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';

export const POST = withTool('proposal', async ({ body }) => {
  const { text, prompt, context } = body;
  if (!text || !prompt) throw new HttpError(400, 'missing_fields', 'Selecione um trecho e diga o que quer mudar.');

  const anthropic = anthropicClient();
  const aiPrompt = `
Você é um Copywriter Executivo especialista em produção audiovisual. 
Seu objetivo é reescrever o texto fornecido pelo usuário seguindo estritamente as instruções dele.

TEXTO ORIGINAL:
"""
${text}
"""

${context ? `CONTEXTO DA PROPOSTA (Para referência, não modifique isso):\n"""\n${context}\n"""\n` : ''}

INSTRUÇÃO DE REESCRITA (O que o usuário quer mudar):
"${prompt}"

REGRAS:
1. Retorne APENAS o novo texto reescrito. Nada antes, nada depois. Sem aspas iniciais ou comentários como "Aqui está".
2. Mantenha o mesmo tom profissional, a não ser que a instrução peça para mudar.
3. Se for uma lista (itens separados por bala ou etapa), mantenha o formato de lista na resposta (apenas texto simples, use quebras de linha ou hifens se necessário).
`;

  try {
    const msg = await anthropic.messages.create({
      model: AI_MODELS.anthropicMain,
      max_tokens: 1500,
      temperature: 0.7,
      system: 'Você é um Copywriter Executivo. Você responde apenas com o texto final reescrito, sem nenhum comentário ou introdução.',
      messages: [{ role: 'user', content: aiPrompt }],
    });
    const first = msg.content?.[0];
    return first && first.type === 'text' ? first.text.trim() : '';
  } catch (err) {
    throw describeProviderError(err, 'Anthropic');
  }
});
