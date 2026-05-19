import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const modo = body.modo || 'livre';

    let jsonResult;

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY não configurada. Usando mock de fallback.");
      
      jsonResult = {
        resumo_estrategico: "Como você não configurou a OPENAI_API_KEY, este é um Plano Criativo demonstrativo (Mock). As ideias geradas visam aumentar a retenção através de dicas dinâmicas.",
        direcao_criativa: "Foco em vídeos curtos e dinâmicos, explorando dor e solução imediata com transições rápidas.",
        ideias_geradas: [
          {
            titulo: "O maior erro ao começar (Gancho da Dor)",
            objetivo_estrategico: "Gerar identificação e autoridade rápida.",
            gancho: "Você provavelmente está fazendo [X] errado e perdendo [Y].",
            conceito: "Mostrar o erro comum de forma visual, cruzar os braços e balançar a cabeça, depois mostrar a solução prática em tela dividida.",
            roteiro_base: "1. [Gancho] 2. [Explicação do erro] 3. [Apresentação do método certo] 4. [CTA]",
            lista_takes: ["Take de frustração (b-roll)", "Take falando direto pra câmera (A-roll)", "Take mostrando a tela/solução (b-roll)"],
            direcao_captacao: "Grave o A-roll em um tripé bem iluminado. O B-roll deve ser com a câmera na mão para gerar dinamismo.",
            direcao_edicao: "Cortes secos (Jump cuts). Adicione sound effects (whoosh) quando mostrar a solução.",
            cta: "Salve este vídeo para não esquecer na hora de aplicar.",
            dificuldade_execucao: "Simples",
            tempo_estimado_gravacao: "15 minutos",
            observacao_retencao: "O gancho visual forte nos primeiros 3 segundos é essencial."
          }
        ],
        organizacao_diaria: "Grave os takes falando para a câmera (A-roll) primeiro. Depois, faça os B-rolls de erro e acerto seguidos para otimizar tempo e iluminação.",
        ideias_reserva: []
      };

    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content || '{}';
      jsonResult = JSON.parse(responseContent);
    }

    return NextResponse.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error("Erro na rota idea-generator:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
