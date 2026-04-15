import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente, objetivo, entregaveis, valorEstimado } = body;

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulando latência da IA (geração de texto mais complexa)

    // Mock Payload
    const mockOutput = {
      emailHeader: `Olá equipe da ${cliente}, tudo bem?\nFoi um prazer entender o momento de mercado de vocês. Desenhei o ecossistema tático abaixo para solucionar nossa meta de ${objetivo}.`,
      estruturaExecutive: [
        `Desafio: A audiência atual precisa ser conectada ao ${objetivo} de forma orgânica, retirando fricções de conversão.`,
        "Solução: Utilizarei um formato focado em alta retenção inicial com linguagem fluida adaptada nativamente à plataforma.",
        "Autoridade: A produção será assinada por mim, englobando todo o funil criativo desde o roteiro à iluminação final."
      ],
      escopoComercial: `Pacote de Entregas Oficiais:\n• ${entregaveis}\n\nInvestimento Total do Acordo de Volume: R$ ${valorEstimado}\nTempo para primeira entrega (D1): 7 dias após briefing finalizado.\nAjustes Permitidos (Timeline Protection): 1 bateria de alterações estruturais.`
    };

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
