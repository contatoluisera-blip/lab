import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cliente, objetivo, modoGeração,
      diagnostico, orcamento, 
      profissional 
    } = body;

    let jsonResult;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY não configurada. Usando mock de fallback.");
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

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const prompt = `
Você é um Estrategista Comercial Sênior e Copywriter especializado em produção de conteúdo de alto valor (High-Ticket) para Instagram e redes sociais. 
Seu objetivo é transformar os dados fornecidos em uma Proposta Comercial Irrecusável, Profunda e Altamente Persuasiva.

A proposta não deve parecer genérica. Ela deve transpirar autoridade, demonstrando domínio absoluto sobre retenção, algoritmos, conversão e percepção de marca. 
Fuja de clichês amadores (ex: "vou bombar seu instagram"). Use termos de negócios e neuromarketing (ex: "Ecossistema de conversão", "Retenção algorítmica", "Arquitetura de autoridade", "Funil de conteúdo", "Quebra de objeções").

ESTRUTURA OBRIGATÓRIA DA PROPOSTA (Retorne EXATAMENTE este JSON sem marcações markdown extra ou blocos de código \`\`\`json):
{
  "capa": { 
    "titulo": "Título de alto impacto comercial (ex: Plano Estratégico de Posicionamento e Conversão)", 
    "subtitulo": "Subtítulo personalizado para a marca" 
  },
  "apresentacao": "1 ou 2 parágrafos. Quem somos nós, nossa filosofia de trabalho (foco em negócios e ROI, não apenas vaidade e likes) e o compromisso com os resultados do cliente.",
  "contexto": "Análise PROFUNDA do cenário atual. Utilize os dados do Diagnóstico fornecido para apontar GARGALOS reais. Mostre que entendemos a DOR deles. Seja cirúrgico: se o engajamento está baixo ou a frequência é ruim, explique como isso destrói a percepção da marca perante os clientes deles.",
  "solucao": "A tese da solução. Como a nossa entrega de valor (método, qualidade de captação, roteiro estratégico) ataca exatamente os gargalos citados no contexto. Venda a TRANSFORMAÇÃO.",
  "escopo": "Visão geral estratégica da entrega. Não liste apenas vídeos, explique a inteligência do pacote. É OBRIGATÓRIO explicitar a QUANTIDADE EXATA de entregas (ex: 'Uma esteira contendo a produção de 8 vídeos verticais...').",
  "o_que_esta_incluso": ["Item 1 (Ex: Produção de 8 vídeos verticais)", "Item 2...", "Item 3...", "Item 4..."],
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

DADOS DO CLIENTE / PARA QUEM ESTAMOS VENDENDO (ELES):
- Nome da Empresa/Cliente: ${cliente}
- Objetivo Principal de Negócio: ${objetivo}

DADOS DA SUA AGÊNCIA / QUEM VOCÊ É (NÓS):
- Nome do Profissional/Agência: ${profissional?.name || 'Não informado'}
- Email: ${profissional?.email || 'Não informado'}

DADOS DO DIAGNÓSTICO DO PERFIL (Gargalos atuais e Notas):
${diagnostico ? JSON.stringify(diagnostico, null, 2) : 'Nenhum diagnóstico fornecido. Construa um contexto focado nas dores inerentes do objetivo principal.'}

DADOS DO ORÇAMENTO E PACOTE SIMULADO (Atenção ao Valor e Quantidade):
${orcamento ? JSON.stringify(orcamento, null, 2) : 'Nenhum orçamento fornecido. Invente um escopo padrão de R$ 3.500 para produção de conteúdo.'}

INSTRUÇÕES CRÍTICAS E DE ROLEPLAY:
1. IDENTIDADE E PERSPECTIVA: Você é "${profissional?.name}". Escreva ABSOLUTAMENTE TUDO em primeira pessoa (Eu ou Nós). Nunca escreva de forma impessoal, abstrata ou em terceira pessoa. Comunique-se de "Profissional para Cliente". Exemplo do que FAZER: "Eu vou estruturar o seu conteúdo", "Nosso método vai curar sua dor". Exemplo do que NÃO FAZER: "O profissional estruturará", "A produção em vídeo curará".
2. TONS E OBJETIVOS: Demonstre saber como a percepção visual afeta o fechamento de vendas. Venda a ideia de que o cliente precisa de você imediatamente.
3. ESTILO DE ESCRITA: Humanizado, estratégico, técnico, altamente persuasivo e DIRETO (curto, sem enrolação e fácil de ler).
4. O output OBRIGATORIAMENTE deve ser um JSON válido e cru (raw), sem estar envelopado em marcações de bloco markdown.
`;

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.7,
        system: "Você é um Copywriter Executivo especialista em produção audiovisual. Você retorna apenas um objeto JSON válido. Suas respostas devem ser humanizadas, extremamente estratégicas, técnicas, persuasivas e DIRETAS (curtas, sem enrolação, otimizadas para leitura rápida).",
        messages: [
          { role: "user", content: prompt }
        ]
      });

      let responseContent = '{}';
      if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
        responseContent = msg.content[0].text.trim();
        // Fallback cleanup in case Claude wraps it in ```json anyway
        if (responseContent.startsWith('```json')) {
           responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
      }
      
      jsonResult = JSON.parse(responseContent);
    }

    return NextResponse.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error("Erro no motor de propostas:", error);
    // Retornando 200 com success: false para evitar que a Netlify sobreponha o JSON de erro com uma página HTML 500
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}

