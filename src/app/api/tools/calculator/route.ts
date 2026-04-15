import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipoProjeto, horasCaptação, complexidadePos, direitos } = body;

    // Simulação do tempo de estimativa
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let baseRate = 1500;
    
    if (tipoProjeto === 'Comercial Premium') baseRate += 3000;
    if (tipoProjeto === 'B-Rolls / Cobertura') baseRate -= 500;
    
    // Calcula complexidade de edição
    if (complexidadePos === 'Mediana') baseRate += 800;
    if (complexidadePos === 'Complexa com VFX') baseRate += 2500;
    
    // Adicionais de Direitos
    let multiplier = 1;
    if (direitos === 'Uso Perpétuo') multiplier = 2.5;
    if (direitos === 'Tráfego Pago (1 Ano)') multiplier = 1.8;

    const finalPrice = Math.floor(baseRate * multiplier);

    // Mock Payload
    const mockOutput = {
      valorSugerido: `R$ ${(finalPrice).toLocaleString('pt-BR')}`,
      raciocinio: `A precificação considera o piso base regional para ${tipoProjeto}, somado a ${horasCaptação}h estimadas de captação de imagem. A maior inflexão do custo está atrelada à cessão de direitos de imagem em formato de ${direitos}.`,
      argumentoVenda: "Invista na segurança jurídica de uma cessão de imagem formal e numa execução técnica que garante conversão na ponta. Meu custo cobre end-to-end do seu desgaste logístico."
    };

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
