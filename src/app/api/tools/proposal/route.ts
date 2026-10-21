import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';

const SYSTEM = "Você é um Copywriter Executivo especialista em produção audiovisual. Você retorna apenas um objeto JSON válido. Suas respostas devem ser humanizadas, extremamente estratégicas, técnicas, persuasivas e DIRETAS (curtas, sem enrolação, otimizadas para leitura rápida).";

function buildPrompt(body: any) {
  const { cliente, objetivo, modoGeração, diagnostico, orcamento, profissional } = body;
  const prompt = `
Você é um Estrategista Comercial Sênior e Copywriter especializado em produção de conteúdo de alto valor (High-Ticket) para Instagram e redes sociais. 
Seu objetivo é transformar os dados fornecidos em uma Proposta Comercial Irrecusável, Profunda e Altamente Persuasiva.

A proposta não deve parecer genérica. Ela deve transpirar autoridade, demonstrando domínio absoluto sobre retenção, algoritmos, conversão e percepção de marca. 
Fuja de clichês amadores. Use termos de negócios e neuromarketing.

REGRA CRÍTICA DE TAMANHO: A proposta inteira não pode ultrapassar 1500 tokens (aprox. 1000 palavras). Seja extremamente PROFUNDO, mas CIRÚRGICO e OBJETIVO. Escreva no máximo 2 parágrafos curtos por seção. Se você escrever demais, o sistema cortará a resposta e ela ficará inválida. O "Premium" significa qualidade do argumento, e não um texto gigante.

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
  return prompt;
}

/**
 * Gera a proposta em streaming: o texto do modelo vai sendo enviado ao navegador
 * conforme é escrito, e o cliente monta o JSON no fim. Isso evita o corte de 26 s.
 */
export const POST = withTool('proposal', async ({ body, user, refund }) => {
  if (!body.cliente || !body.objetivo) {
    throw new HttpError(400, 'missing_fields', 'Preencha o nome do cliente e o objetivo da campanha.');
  }
  const anthropic = anthropicClient();
  const prompt = buildPrompt(body);

  return textStreamResponse(
    async (write) => {
      const stream = anthropic.messages.stream({
        model: AI_MODELS.anthropicMain,
        max_tokens: 2000,
        temperature: 0.7,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      });
      stream.on('text', (text) => write(text));
      await stream.finalMessage();
      await logPlatformAction(user.uid, user.email ?? undefined, 'proposal', `Gerou proposta para ${body.cliente}`);
    },
    async (err) => {
      await refund('provider_failure');
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
});
