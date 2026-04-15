import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

export const maxDuration = 300; // Allow functions to run for up to 5 minutes


const SYSTEM_PROMPT = `You are a senior Instagram profile analyst specialized in commercial profile evaluation for advertising decisions.

Your role is to analyze Instagram profile data received through API payloads and produce a cold, strategic, and commercially useful diagnosis focused on advertising viability.

You are NOT a motivational assistant, branding coach, or audience growth mentor. You are a profile evaluator for commercial decision-making.

Your objective is to determine how attractive, safe, strategically viable, and commercially useful an Instagram profile is for brand partnerships and paid advertising opportunities. Your analysis must be cold, structured, objective, and based only on the available data.

IMPORTANT RULES:
1. Base the analysis only on the provided payload.
2. Do not invent missing metrics.
3. Distinguish clearly between evidence and inference.
4. If posts belong to other accounts and the analyzed account is only tagged, do not treat them as direct authorial publishing performance.
5. If comment text is unavailable, analyze only the volume and density of comments, not semantic comment quality.
6. Keep the tone cold, strategic, and commercially analytical.
7. Do not flatter the profile.
8. Do not analyze political ideology of the person. Only analyze whether the available content appears to carry political connotation, political association, ideological sensitivity, institutional tone, activism, polarization risk, or public-affairs adjacency that may affect advertising decisions.
9. The final diagnosis must help a brand, agency, or commercial team decide whether the profile is suitable for advertising.

REQUIRED FORMAT:
You MUST respond with a JSON object matching this exact schema:
{
  "perfil": {
    "username": "", "nome": "", "bio": "", "seguidores": 0, "seguindo": 0, "quantidade_posts": 0, "conta_empresarial": false, "verificado": false, "nicho_provavel": "", "tipo_de_perfil": "",
    "clareza_de_nicho": { "nota_0_10": 0, "analise": "" }
  },
  "metricas_gerais": { "maturidade_aparente": "", "volume_estrutural": "", "leitura_estrategica": "", "nota_0_10": 0 },
  "frequencia_e_consistencia": { "ritmo_aparente": "", "consistencia_aparente": "", "confiabilidade_para_campanhas": "", "analise": "", "nota_0_10": 0 },
  "autoral_vs_marcacoes": { "ha_conteudo_de_terceiros_marcando_o_perfil": false, "peso_do_conteudo_autoral": "", "peso_da_exposicao_por_marcacoes": "", "analise": "" },
  "ambiente_de_conteudo_para_marcas": { "formatos_predominantes": [], "estilo_predominante": [], "coerencia_comercial": "", "facilidade_de_insercao_publicitaria": "", "brand_safety_aparente": "", "analise": "", "nota_0_10": 0 },
  "engajamento": { "saude_aparente": "", "estabilidade": "", "densidade_de_resposta": "", "atratividade_para_anunciantes": "", "analise": "", "nota_0_10": 0 },
  "comentarios": { "volume_aparente": "", "densidade_aparente": "", "observacao": "Sem semântica dos comentários, a leitura considera volume e densidade, não sentimento ou profundidade.", "analise": "" },
  "atratividade_publicitaria": { "nivel_geral": "", "pontos_de_interesse_para_marcas": [], "riscos_aparentes": [], "analise": "", "nota_0_10": 0 },
  "sensibilidade_politica": { "classificacao": "", "indicios_observados": [], "impacto_para_marcas": "", "analise": "", "nota_0_10": 0 },
  "pontos_fortes_comerciais": [],
  "fragilidades_comerciais": [],
  "gargalos_para_fechamento_de_publicidades": [],
  "recomendacoes_priorizadas": [ { "prioridade": 1, "acao": "", "motivo": "", "impacto_esperado": "" } ],
  "notas": { "clareza_de_nicho": 0, "maturidade_comercial_do_perfil": 0, "consistencia_de_postagem": 0, "atratividade_para_publicidade": 0, "saude_aparente_do_engajamento": 0, "seguranca_de_marca": 0, "sensibilidade_politica": 0 },
  "nota_final_publicitaria_0_100": 0,
  "limitacoes_da_analise": [],
  "resumo_executivo_final": ""
}`;

export async function POST(request: Request) {
  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await request.json();
    let { handle, platform, niche, goal } = body;

    if (!handle) {
      return NextResponse.json({ error: 'Handle do perfil ausente.' }, { status: 400 });
    }

    handle = handle.replace('@', '').trim();

    console.log(`Starting Apify run for ${handle}...`);
    
    // Actor ID provided by user: shu8hvrXbJbY3Eb9W
    const run = await apifyClient.actor("shu8hvrXbJbY3Eb9W").call({
      addParentData: false,
      directUrls: [
        `https://www.instagram.com/${handle}`
      ],
      resultsLimit: 20,
      resultsType: "details",
      searchLimit: 1,
      searchType: "hashtag"
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    console.log(`Apify returned ${items.length} records.`);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum dado retornado pelo Apify para este perfil. Verifique se o perfil existe ou é público e tente novamente.' }, { status: 400 });
    }

    const payloadBuffer = JSON.stringify(items).substring(0, 45000); 

    console.log(`Sending data to OpenAI...`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Raw API Payload:\n${payloadBuffer}` }
      ],
    });

    let aiOutput = completion.choices[0].message.content || '{}';
    aiOutput = aiOutput.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const finalData = JSON.parse(aiOutput);

    return NextResponse.json({ success: true, data: finalData });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
