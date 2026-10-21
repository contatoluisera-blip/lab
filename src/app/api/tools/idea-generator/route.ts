import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, openaiClient } from '@/lib/server/ai';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';

function buildPrompts(body: any) {
  const modo = body.modo || 'livre';
  let systemPrompt = `Você é um Diretor de Criação de Conteúdo (Social Media) e Estrategista Sênior focado em Conversão e Retenção para vídeos curtos (Reels/TikTok/Shorts).
Seu objetivo é gerar um Plano Criativo de Conteúdo que seja profundo, acionável, alinhado ao neuromarketing e voltado para negócios. Evite clichês e dancinhas. Foque em AUTORIDADE, EDUCAÇÃO e VENDAS.

REGRA ABSOLUTA DE QUANTIDADE: Você DEVE gerar EXATAMENTE a quantidade de ideias solicitada pelo usuário no array "ideias_geradas". Nunca gere menos ideias do que foi pedido. Se o usuário pedir 8 ideias, gere exatamente 8 objetos dentro de "ideias_geradas". Isso é crítico.

Retorne EXATAMENTE este JSON:
{
  "resumo_estrategico": "Resumo de 1 a 2 parágrafos justificando a linha criativa escolhida com base no problema do cliente e no escopo de produção.",
  "direcao_criativa": "A linha visual, o ritmo e o tom recomendados para essa bateria de conteúdos.",
  "ideias_geradas": [
{
  "titulo": "Título interno da ideia",
  "objetivo_estrategico": "O que esta peça específica visa atingir",
  "gancho": "A exata frase de gancho (hook) inicial, forte e instigante",
  "conceito": "O conceito visual/narrativo do vídeo (ex: B-roll dinâmico narrado, green screen, POV...)",
  "roteiro_base": "Esboço de roteiro com timing aproximado",
  "lista_takes": ["Take 1...", "Take 2..."],
  "direcao_captacao": "Dica prática de como gravar",
  "direcao_edicao": "Dica prática de cortes, ritmo e som",
  "cta": "Chamada para ação verbalizada ou visual",
  "dificuldade_execucao": "Simples, Média ou Complexa",
  "tempo_estimado_gravacao": "Tempo estimado para gravar esta peça isolada",
  "observacao_retencao": "Onde o público pode querer pular e como evitar isso"
}
  ],
  "organizacao_diaria": "Um bloco textual orientando o criador sobre como organizar a gravação de forma eficiente (ex: gravar todos os blocos A primeiro, depois os B-rolls, etc.)",
  "ideias_reserva": [ // Mesma estrutura de ideias_geradas. Crie de 1 a 3 ideias reservas. ]
}`;

  let userPrompt = "";

  if (modo === 'estrategico') {
    const diagnostico = body.diagnostico ? JSON.stringify(body.diagnostico, null, 2) : 'Não informado';
    const orcamento = body.orcamento ? JSON.stringify(body.orcamento, null, 2) : 'Não informado';
    
    userPrompt = `MODO ESTRATÉGICO
Abaixo estão os dados de um Diagnóstico de Perfil realizado no cliente e o Orçamento (Escopo) validado para a produção.
Você DEVE basear todas as ideias para resolver os gargalos (notas ruins) do Diagnóstico, mas LIMITANDO a complexidade e quantidade ao que foi definido no Orçamento.

DADOS DO DIAGNÓSTICO:
${diagnostico}

DADOS DO ORÇAMENTO VENDIDO:
${orcamento}

PARÂMETROS DA RODADA:
- Quantidade EXATA de ideias principais solicitadas (CRÍTICO): ${body.quantidadeIdeias}
- Foco criativo específico dessa rodada: ${body.focoCriativo || 'Equilibrar de acordo com o diagnóstico'}
- Observações restritivas: ${body.observacoes || 'Nenhuma'}`;
  } else {
    userPrompt = `MODO LIVRE
Abaixo estão os dados preenchidos manualmente pelo usuário (briefing). Crie ideias estritamente baseadas nesses direcionamentos.

- Nicho/Segmento: ${body.nicho || 'Não informado'}
- Tipo de Marca/Cliente: ${body.tipoCliente || 'Não informado'}
- Público-Alvo: ${body.publicoAlvo || 'Não informado'}
- Objetivo Principal: ${body.objetivo || 'Não informado'}
- Tema Central: ${body.tema || 'Não informado'}
- Plataforma: ${body.plataforma || 'Instagram Reels'}
- Quantidade EXATA de Ideias solicitadas (CRÍTICO): ${body.quantidadeIdeias || 5}
- Nível de Produção (Recursos): ${body.nivelProducao || 'Não informado'}
- Tom do Conteúdo: ${body.tom || 'Profissional e Engajador'}
- Local da Gravação: ${body.local || 'Livre'}
- Materiais Disponíveis: ${body.materiais || 'Nenhum, criar do zero'}
- Restrições: ${body.restricoes || 'Nenhuma'}
- Chamada para Ação (CTA) Desejada: ${body.cta || 'Sugerir melhor CTA baseado no objetivo'}`;
  }
  return { systemPrompt, userPrompt, modo };
}

/**
 * Gera as ideias em streaming (o modelo escreve direto para o navegador),
 * evitando o corte de 26 s da Netlify em respostas longas.
 */
export const POST = withTool('ideas', async ({ body, user, refund }) => {
  const openai = openaiClient();
  const { systemPrompt, userPrompt, modo } = buildPrompts(body);
  const quantidade = Math.min(Number(body.quantidadeIdeias) || 5, 12);

  return textStreamResponse(
    async (write) => {
      const stream = await openai.chat.completions.create({
        model: AI_MODELS.openaiMain,
        max_tokens: 4096,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) write(delta);
      }
      await logPlatformAction(user.uid, user.email ?? undefined, 'idea-generator', `Gerou ${quantidade} ideias criativas (modo: ${modo})`);
    },
    async (err) => {
      await refund('provider_failure');
      const e = describeProviderError(err, 'OpenAI');
      return { error: e.message, code: e.code };
    }
  );
});
