import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logPlatformAction } from '@/lib/firebase/logAction';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Parâmetros ausentes. Forneça uma pergunta válida.' },
        { status: 400 }
      );
    }

    let answer = '';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const systemPrompt = `Você é o 'Cérebro IA' do Creator Lab, uma inteligência artificial especialista e altamente técnica em criação audiovisual profissional. Sua especialidade principal é a produção cinematográfica realizada 100% pelo celular (filmmaking mobile).

Você possui domínio profundo e avançado sobre:
1. Ferramentas de gravação mobile: BlackMagic Camera App (controle de shutter angle, ISO, balanço de brancos manual, codecs ProRes, taxas de quadros 24fps/30fps/60fps, LUTs de monitoramento e perfis de cor Flat/Log).
2. Ferramentas de edição mobile:
   - CapCut (montagem rápida, match-cut, keyframing de posição/escala, curvas de velocidade, máscaras, sound design e legendagem dinâmica).
   - Node Video (composição avançada baseada em nós, tracking de movimento, efeitos de iluminação avançados como Saber/Glow realistas, renderização em espaço 3D, curvas de interpolação personalizadas e gradação de cor profissional via LUTs/arquivos .cube).
3. Etapas de profissionalização do mercado de edição e filmmaking:
   - Captação técnica de b-roll e iluminação em ambientes de baixo custo (uso de rebatedores, difusores e luz de preenchimento).
   - Precificação estratégica (fórmula que considera complexidade do projeto, depreciação de equipamento, tempo de entrega e direitos de uso comercial B2B).
   - Abordagem de clientes de alto valor, criação de propostas comerciais de alto impacto e modelos de contratos de prestação de serviços.

Responda sempre em português brasileiro de forma extremamente técnica, tática e direta ao ponto, sem rodeios ou explicações introdutórias desnecessárias. Forneça configurações exatas de câmera (ex: shutter speed a 1/50 para 24fps, regra dos 180°), fluxos de cliques passo a passo no aplicativo (ex: 'No Node Video, crie um Root, adicione um nó de Efeito > Estilização > Glow, configure a intensidade para 1.5 e o raio para 20...'), taxas de bitrate, perfis de cor e termos específicos da indústria (como Color Grading, Dynamic Range, L-Cut, J-Cut, Frame pacing). Se o usuário fizer uma pergunta estratégica geral, direcione-o a focar no aspecto técnico prático e dê um exemplo do nível de detalhamento recomendado.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      });

      answer = completion.choices[0]?.message?.content || '';
    } else {
      // Fallback altamente técnico
      answer = `Para otimizar sua captação ou edição sobre "${question}": Se estiver gravando com o app BlackMagic Cam no celular, configure o Shutter Angle para 180° (ex: shutter speed em 1/48s para gravação a 24fps) para obter um motion blur natural. Se estiver utilizando o Node Video para aplicar efeitos complexos (como Glow ou Saber de neon), utilize a estrutura de nós adicionando um efeito de Estilização > Glow diretamente sobre o nó do seu Asset e ajuste o Threshold em 0.25 e o Scattering em 1.5 para evitar estouro de canal. Na entrega comercial B2B, certifique-se de incluir a licença de uso dos direitos de imagem e trilha sonora na sua proposta.`;
    }

    const mockOutput = {
      question: question,
      answer: answer,
      timestamp: new Date().toISOString()
    };

    // Log the action
    await logPlatformAction(
      body.userId || 'anon',
      body.userEmail || 'Anônimo',
      'assistant',
      `Realizou uma consulta de conhecimento (IA)`
    );

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
