import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate API delay from AI calling
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response, in reality this would compose a system prompt and call OpenAI
    const mockOutput = {
      title: `O Guia Definitivo sobre ${body.niche || 'Seu Tópico'}`,
      coreConcept: `Um guia dinâmico e altamente visual combinando dicas práticas e B-roll sobre ${body.niche}.`,
      hookSuggestions: [
        `Pare de fazer ${body.niche} errado. Faça isso em vez disso.`,
        `O segredo para dominar ${body.niche} apenas com ${body.gear || 'um celular'}.`
      ],
      structure: [
        "0-3s: Gancho verbal forte + transição push-in.",
        "3-15s: Estabeleça o problema principal visualmente.",
        "15-30s: Apresente exatamente 3 passos acionáveis em rápida sucessão.",
        "30-40s: Forneça uma prova social ou o resultado final do 'antes/depois'.",
        "40-45s: Chamada para ação pedindo para salvar para depois."
      ],
      technicalNotes: [
        "Grave em 4k 60fps",
        "Use a luz natural vindo da janela",
        "Mantenha a câmera estável ou use o tripé",
        "Garanta a clareza do áudio usando um microfone de lapela"
      ]
    };

    // Note: Usage logging to Firestore would occur right here.

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
