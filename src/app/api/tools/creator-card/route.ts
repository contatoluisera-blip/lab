import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { titulo, nicho, publico, diferencial, servicos } = await req.json();

    if (!titulo || !nicho) {
      return NextResponse.json({ error: 'Título e Nicho são obrigatórios' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY não configurada. Usando mock.");
      return NextResponse.json({
        headline: "Especialista em " + nicho,
        bio: "Bio gerada como fallback. " + diferencial,
        servicosFormatados: servicos
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `Você é um especialista em branding e marketing para criadores de conteúdo e videomakers.
Sua missão é transformar informações brutas de um profissional em textos persuasivos e extremamente profissionais para um "Mídia Kit / Cartão Comercial".

FORMATO OBRIGATÓRIO DE RESPOSTA (JSON Exato):
{
  "headline": "A headline gerada aqui (máximo 6 palavras)",
  "bio": "A bio de 2 a 3 linhas gerada aqui",
  "servicosFormatados": ["Serviço 1 refinado", "Serviço 2 refinado", "Serviço 3 refinado"]
}`;

    const userPrompt = `INFORMAÇÕES FORNECIDAS PELO USUÁRIO:
- Título/Profissão atual: "${titulo}"
- Nicho: "${nicho}"
- Público/Para quem cria: "${publico}"
- Diferencial: "${diferencial}"
- Serviços brutos: "${servicos.join(', ')}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || '{}';
    return NextResponse.json(JSON.parse(responseContent));

  } catch (error) {
    console.error('Erro na API creator-card:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
