import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, openaiClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';

const systemPrompt = `Você é um especialista em branding e marketing para criadores de conteúdo e videomakers.
Sua missão é transformar informações brutas de um profissional em textos persuasivos e extremamente profissionais para um "Mídia Kit / Cartão Comercial".

FORMATO OBRIGATÓRIO DE RESPOSTA (JSON Exato):
{
  "headline": "A headline gerada aqui (máximo 6 palavras)",
  "bio": "A bio de 2 a 3 linhas gerada aqui",
  "servicosFormatados": ["Serviço 1 refinado", "Serviço 2 refinado", "Serviço 3 refinado"]
}`;

export const POST = withTool('creator-card', async ({ body }) => {
  const { titulo, nicho, publico, diferencial } = body;
  const servicos: string[] = Array.isArray(body.servicos) ? body.servicos.filter(Boolean) : [];
  if (!titulo || !nicho) throw new HttpError(400, 'missing_fields', 'Preencha o título e o nicho antes de gerar.');

  const userPrompt = `INFORMAÇÕES FORNECIDAS PELO USUÁRIO:
- Título/Profissão atual: "${titulo}"
- Nicho: "${nicho}"
- Público/Para quem cria: "${publico || ''}"
- Diferencial: "${diferencial || ''}"
- Serviços brutos: "${servicos.join(', ')}"`;

  const openai = openaiClient();
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.openaiMain,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });
    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (err) {
    throw describeProviderError(err, 'OpenAI');
  }
}, { logDescription: (b) => `Gerou cartão comercial para ${b?.nicho || 'nicho não informado'}` });
