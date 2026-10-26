import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';

const SYSTEM = `Você é copywriter de redes sociais especialista em legendas de Reels para marcas e profissionais brasileiros.
Escreva a legenda do post de um vídeo já roteirizado, em português do Brasil:
- Primeira linha: continua o gancho do vídeo e faz a pessoa abrir o "mais" (sem repetir a fala do gancho palavra por palavra).
- Corpo curto e escaneável (quebras de linha, no máximo 2 emojis), com 1 informação de valor que o vídeo não entrega por completo.
- Feche com o CTA do vídeo, dito de forma natural.
- Respeite as regras do nicho (saúde: sem promessa de resultado; jurídico: sem captação; financeiro: sem promessa de ganho).
- Sem hashtags no texto: as palavras-chave vão à parte, pensadas para a busca do Instagram (termos que o público digita).
- "capa": o texto curto (até 6 palavras) para a capa do Reels no grid.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['texto', 'palavrasChave', 'capa'],
  properties: {
    texto: { type: 'string' },
    palavrasChave: { type: 'array', items: { type: 'string' } },
    capa: { type: 'string' },
  },
};

/** Legenda do post para uma ideia já gerada (1 crédito; custo de IA ~R$ 0,06). */
export const POST = withTool('caption', async ({ body }) => {
  const idea = body.idea;
  if (!idea?.titulo || !Array.isArray(idea?.beats)) throw new HttpError(400, 'missing_idea', 'Gere as ideias antes de pedir a legenda.');

  const roteiro = idea.beats.map((b: any) => `${b.inicio}-${b.fim}s · ${b.fala || b.textoTela || b.visual}`).join('\n').slice(0, 3000);
  const content = [
    `Nicho: ${String(body.nicho || 'não informado').slice(0, 120)}`,
    `Marca / cliente: ${String(body.cliente || 'não informado').slice(0, 120)}`,
    body.compliance ? `Regras do nicho: ${String(body.compliance).slice(0, 200)}` : '',
    `Ideia: ${String(idea.titulo).slice(0, 200)} (${idea.formato}, ${idea.etapaFunil})`,
    `Gancho falado: ${String(idea.ganchos?.falado || '').slice(0, 300)}`,
    `Roteiro:\n${roteiro}`,
    `CTA do vídeo: ${String(idea.cta || '').slice(0, 200)}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await anthropicClient().beta.messages.create({
      model: AI_MODELS.anthropicPrompts,
      max_tokens: 4000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    });
    if (response.stop_reason === 'refusal') throw new HttpError(422, 'refused', 'A IA não pôde escrever esta legenda.');
    const text = response.content.find(b => b.type === 'text');
    if (!text || text.type !== 'text') throw new Error('Resposta sem texto');
    const legenda = JSON.parse(text.text);
    legenda.palavrasChave = (legenda.palavrasChave || []).slice(0, 10);
    return legenda;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw describeProviderError(err, 'Anthropic');
  }
}, { logDescription: (b) => `Gerou legenda para a ideia "${String(b?.idea?.titulo || '').slice(0, 60)}"` });
