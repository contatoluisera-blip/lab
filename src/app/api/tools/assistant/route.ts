import { NextResponse } from 'next/server';

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

    // Simulando latência da IA
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock Payload
    const mockAnswer = `Para a sua pergunta sobre "${question}", a recomendação tática ideal é simplificar o roteiro e remover jargões na primeira metade. Trabalhe com ganchos visuais e mantenha as frases curtas para retenção máxima no formato vertical.`;

    const mockOutput = {
      question: question,
      answer: mockAnswer,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: mockOutput });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
