import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formato, cenario, equipamento, dinamismo } = body;

    if (!formato || !cenario) {
      return NextResponse.json(
        { error: 'Parâmetros ausentes. Forneça o formato e cenário.' },
        { status: 400 }
      );
    }

    // Simulando tempo de processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock Payload
    const mockOutput = {
      iluminacaoAudio: "Para o setup descrito, utilize a luz principal (Key Light) a 45 graus para gerar sombras dramáticas na lateral do rosto e posicione o microfone lapela oculto próximo à gola para reduzir ruídos de ambiente.",
      guiaMovimentos: [
        "Inicie gravando em ângulo contra-plongée (de baixo para cima) para transmitir mais autoridade.",
        "Mova a câmera de forma fluída revelando o elemento principal que você escondeu com as mãos ou corpo na primeira fala."
      ],
      dicasEdicao: [
        "Sincronize as batidas de b-roll com a trilha sonora Lofi/Synthwave.",
        `Garantir um corte seco a cada 2-3 segundos para suprir a exigência do formato ${dinamismo}.`,
        "Adicionar Color Grading frio para ressaltar a pele e o cenário verde."
      ]
    };

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
