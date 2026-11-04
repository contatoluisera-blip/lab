import { withTool } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { calculateBudget } from '@/lib/budget/engine';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumo', 'itens', 'margem', 'defesa', 'alertas'],
  properties: {
    resumo: { type: 'string', description: 'Duas ou três frases sobre a lógica do preço.' },
    itens: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['label', 'explicacao'],
        properties: { label: { type: 'string' }, explicacao: { type: 'string' } },
      },
    },
    margem: { type: 'string', description: 'Leitura de custos x margem: o que pesa mais e quanto sobra.' },
    defesa: { type: 'string', description: 'Como apresentar o preço ao cliente, em 2 a 4 frases.' },
    alertas: { type: 'array', items: { type: 'string' }, description: 'Até 3 riscos ou ajustes que valem atenção.' },
  },
} as const;

const SYSTEM = `Você explica orçamentos de produção audiovisual para criadores que trabalham pelo celular e com IA.
Você recebe um orçamento JÁ CALCULADO por um motor matemático. Regras:
- Nunca recalcule, nunca invente nem altere valores. Use apenas os números recebidos, exatamente como estão.
- Explique cada item em linguagem simples (1 a 2 frases): o que é e por que entra no preço.
- Em "margem", compare custos (IA, estrutura, extras, impostos) com o que fica para o criador, usando os números de "analise".
- Em "defesa", dê argumentos para o cliente baseados em valor e no trabalho real (direção, curadoria, tentativas descartadas), sem prometer resultado.
- Em "alertas", aponte riscos concretos: margem baixa, custo de geração alto, muitas tentativas, prazo curto, direitos de uso. Lista vazia se não houver.
- Português do Brasil, direto, sem jargão.`;

/**
 * Explica um orçamento com IA: a conta é refeita no servidor pelo motor determinístico
 * (os números não vêm do navegador nem da IA) e a IA só escreve as explicações.
 */
export const POST = withTool('calculator', async ({ body }) => {
  const budget = calculateBudget(body?.input || {});
  const payload = {
    modo: budget.mode,
    precos: { minimo: budget.precoMinimo, recomendado: budget.precoRecomendado, premium: budget.precoPremium, porVideo: budget.precoPorVideo },
    detalhamento: budget.detalhamento.map(d => ({ label: d.label, valor: d.valor, desc: d.desc })),
    analise: budget.analise,
  };

  const response = await anthropicClient().messages.create({
    model: AI_MODELS.anthropicFast,
    max_tokens: 3000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Orçamento calculado:\n${JSON.stringify(payload, null, 1)}` }],
  });
  const text = response.content.find(b => b.type === 'text');
  if (response.stop_reason === 'refusal' || !text || text.type !== 'text') {
    throw new HttpError(502, 'explain_failed', 'Não foi possível gerar a explicação agora. Tente de novo.');
  }
  return JSON.parse(text.text);
}, { logDescription: () => 'Explicação do orçamento com IA' });
