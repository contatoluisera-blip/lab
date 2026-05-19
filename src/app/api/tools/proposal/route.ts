import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cliente, objetivo, modoGeração,
      diagnostico, orcamento, 
      profissional 
    } = body;

    let jsonResult;

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY não configurada. Usando mock de fallback.");
      const qtdVideos = orcamento?.video_quantity || orcamento?.video_quantity_total || 'alguns';
      const valorOrcamento = orcamento?.precoRecomendado || orcamento?.valorTotal || "R$ 3.500,00";
      
      jsonResult = {
        capa: {
          titulo: `Plano Estratégico de Autoridade`,
          subtitulo: `Arquitetura de conteúdo desenvolvida para ${cliente}`
        },
        apresentacao: `Olá equipe da ${cliente}. O nosso objetivo transcende a simples produção de vídeos; nós construímos ecossistemas de conversão visual. Atuamos com posicionamento de alto valor para marcas que entendem que a percepção do público dita a precificação do seu serviço.`,
        contexto: diagnostico 
          ? `Analisando a atual presença digital (@${diagnostico.handle || cliente}), notamos um engajamento de ${diagnostico.metricas?.engajamentoRobusto || 'abaixo do benchmark de mercado'}. O objetivo de ${objetivo} está sendo freado por gargalos na retenção algorítmica e na ausência de um funil claro de conteúdo. O público até chega, mas a comunicação atual não gera autoridade suficiente para fechar a venda.`
          : `Para alcançarmos de forma consistente o objetivo de ${objetivo}, precisamos reestruturar a forma como a audiência consome a marca. A ausência de uma engenharia de retenção no conteúdo atual cria fricções na tomada de decisão do cliente.`,
        solucao: `Vamos implementar uma esteira de produção audiovisual estratégica. Não são apenas vídeos bonitos, é neuromarketing aplicado. Utilizaremos ganchos de alta retenção (hooks) e roteiros focados em quebrar objeções nativamente, elevando imediatamente a autoridade percebida da ${cliente}.`,
        escopo: `O acordo prevê a estruturação de um pacote dinâmico focando na produção ponta a ponta dos materiais para distribuição no Instagram/Tiktok.`,
        o_que_esta_incluso: [
          "Roteirização baseada em Engenharia de Retenção",
          "Captação Cinematográfica (4K, Iluminação Profissional)",
          "Edição Vertical com Sound Design e Dinamismo",
          "Consultoria de Posicionamento de Linha Editorial"
        ],
        o_que_nao_esta_incluso: [
          "Gestão de Tráfego Pago ou Impulsionamentos",
          "Gestão e resposta de comentários/directs",
          "Publicações diárias nos stories"
        ],
        processo: [
          { etapa: "1. Imersão e Estratégia", descricao: "Reunião de kickoff para entender a fundo o DNA da marca e mapear os arquétipos e objeções do público." },
          { etapa: "2. Roteirização Magnética", descricao: "Elaboração dos scripts usando fórmulas validadas de retenção (Gatilho -> Desenvolvimento -> CTA)." },
          { etapa: "3. Captação de Alta Fidelidade", descricao: "Dia de gravação otimizado utilizando equipamentos de ponta para garantir qualidade estética impecável." },
          { etapa: "4. Pós-produção Avançada", descricao: "Cortes dinâmicos, correção de cor (Color Grading) e mixagem de áudio para reter a atenção a cada segundo." }
        ],
        investimento: {
          texto_introdutorio: `Entenda este movimento não como um custo, mas como a construção do principal ativo digital da sua empresa. Com base no diagnóstico de complexidade e no escopo de ${qtdVideos} entregáveis dimensionados, chegamos à estruturação abaixo:`,
          valor: valorOrcamento,
          condicoes: "Sinalização de 50% para travamento da agenda de gravação e 50% mediante a aprovação do lote de vídeos."
        },
        proximo_passo: "Caso o escopo e os valores estejam alinhados com o momento da marca, basta responder a este documento com 'DE ACORDO' e enviaremos o contrato digital para darmos o start imediato no onboarding."
      };
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
Você é um Estrategista Comercial Sênior e Copywriter B2B especializado em produção de conteúdo de alto valor (High-Ticket) para Instagram e redes sociais. 
Seu objetivo é transformar os dados fornecidos em uma Proposta Comercial Irrecusável, Profunda e Altamente Persuasiva.

A proposta não deve parecer genérica. Ela deve transpirar autoridade, demonstrando domínio absoluto sobre retenção, algoritmos, conversão e percepção de marca. 
Fuja de clichês amadores (ex: "vou bombar seu instagram"). Use termos de negócios e neuromarketing (ex: "Ecossistema de conversão", "Retenção algorítmica", "Arquitetura de autoridade", "Funil de conteúdo", "Quebra de objeções").

ESTRUTURA OBRIGATÓRIA DA PROPOSTA (Retorne EXATAMENTE este JSON sem marcações markdown extra):
{
  "capa": { 
    "titulo": "Título de alto impacto comercial (ex: Plano Estratégico de Posicionamento e Conversão)", 
    "subtitulo": "Subtítulo personalizado para a marca" 
  },
  "apresentacao": "1 ou 2 parágrafos. Quem somos nós, nossa filosofia de trabalho (foco em negócios e ROI, não apenas vaidade e likes) e o compromisso com os resultados do cliente.",
  "contexto": "Análise PROFUNDA do cenário atual. Utilize os dados do Diagnóstico fornecido para apontar GARGALOS reais. Mostre que entendemos a DOR deles. Seja cirúrgico: se o engajamento está baixo ou a frequência é ruim, explique como isso destrói a percepção da marca perante os clientes deles.",
  "solucao": "A tese da solução. Como a nossa entrega de valor (método, qualidade de captação, roteiro estratégico) ataca exatamente os gargalos citados no contexto. Venda a TRANSFORMAÇÃO.",
  "escopo": "Visão geral estratégica da entrega. Não liste apenas vídeos, explique a inteligência do pacote. (ex: 'Uma esteira de produção focada em vídeos de atração e vídeos de retenção para criar um ecossistema completo').",
  "o_que_esta_incluso": ["Item 1 (ex: Roteirização Magnética baseada em gatilhos mentais)", "Item 2...", "Item 3...", "Item 4..."],
  "o_que_nao_esta_incluso": ["Item 1", "Item 2", "etc"],
  "processo": [
    {"etapa": "Nome da Etapa 1", "descricao": "O que acontece aqui de forma profissional."},
    {"etapa": "Nome da Etapa 2", "descricao": "Detalhes..."},
    {"etapa": "Nome da Etapa 3", "descricao": "Detalhes..."}
  ],
  "investimento": { 
    "texto_introdutorio": "Ancoragem de valor. Explique que o projeto não é um custo, mas a construção do maior ativo digital da empresa deles.", 
    "valor": "COLOQUE AQUI O VALOR EXATO RECOMENDADO NO ORÇAMENTO FORNECIDO", 
    "condicoes": "Ex: Sinalização de 50% para reserva de pauta e 50% na aprovação final do lote." 
  },
  "proximo_passo": "Chamada para ação clara, profissional e sem atrito. O que o Lead deve fazer agora para fechar negócio?"
}

Modo de Geração Selecionado: ${modoGeração}
(Se Premium: Seja exaustivo nos argumentos de autoridade e robustez. Se Profissional: Direto, extremamente tático e elegante. Se Rápido: Mais focado na resolução e na entrega).

DADOS DO CLIENTE E PROJETO:
- Cliente/Marca: ${cliente}
- Objetivo Principal de Negócio: ${objetivo}

DADOS DO DIAGNÓSTICO DO PERFIL (Gargalos atuais e Notas):
${diagnostico ? JSON.stringify(diagnostico, null, 2) : 'Nenhum diagnóstico fornecido. Construa um contexto focado nas dores inerentes do objetivo principal.'}

DADOS DO ORÇAMENTO E PACOTE SIMULADO (Atenção ao Valor e Quantidade):
${orcamento ? JSON.stringify(orcamento, null, 2) : 'Nenhum orçamento fornecido. Invente um escopo padrão de R$ 3.500 para produção B2B.'}

DADOS DO PROFISSIONAL APRESENTANDO A PROPOSTA:
- Nome/Agência: ${profissional?.name || 'Não informado'}
- Email: ${profissional?.email || 'Não informado'}

INSTRUÇÃO FINAL E CRÍTICA:
Você deve escrever textos de altíssimo nível. Demonstre saber como o Instagram funciona tecnicamente e venda a ideia de que o cliente precisa urgente do profissional. NUNCA DEVOLVA ALGO BÁSICO. O resultado deve valer um contrato de milhares de reais.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um Copywriter Executivo especialista em produção audiovisual e social media." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content || '{}';
      jsonResult = JSON.parse(responseContent);
    }

    return NextResponse.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error("Erro no motor de propostas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

