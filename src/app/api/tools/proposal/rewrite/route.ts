import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, prompt, context } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
       throw new Error("ANTHROPIC_API_KEY não configurada.");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const aiPrompt = `
Você é um Copywriter Executivo especialista em produção audiovisual. 
Seu objetivo é reescrever o texto fornecido pelo usuário seguindo estritamente as instruções dele.

TEXTO ORIGINAL:
"""
${text}
"""

${context ? `CONTEXTO DA PROPOSTA (Para referência, não modifique isso):\n"""\n${context}\n"""\n` : ''}

INSTRUÇÃO DE REESCRITA (O que o usuário quer mudar):
"${prompt}"

REGRAS:
1. Retorne APENAS o novo texto reescrito. Nada antes, nada depois. Sem aspas iniciais ou comentários como "Aqui está".
2. Mantenha o mesmo tom profissional, a não ser que a instrução peça para mudar.
3. Se for uma lista (itens separados por bala ou etapa), mantenha o formato de lista na resposta (apenas texto simples, use quebras de linha ou hifens se necessário).
`;

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      temperature: 0.7,
      system: "Você é um Copywriter Executivo. Você responde apenas com o texto final reescrito, sem nenhum comentário ou introdução.",
      messages: [
        { role: "user", content: aiPrompt }
      ]
    });

    let responseContent = '';
    if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
      responseContent = msg.content[0].text.trim();
    }
    
    return NextResponse.json({ success: true, data: responseContent });
  } catch (error: any) {
    console.error("Erro na reescrita de proposta:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
