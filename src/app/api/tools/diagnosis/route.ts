import { NextResponse } from 'next/server';
import 'proxy-agent'; // Força o Vercel a empacotar o proxy-agent
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

export const maxDuration = 300; 

function extractProfileAndPosts(items: any[]) {
  let profile = null;
  let posts: any[] = [];
  
  if (!items || items.length === 0) return { profile, posts };

  // Muitas vezes o Apify retorna o perfil no primeiro item e os posts em 'latestPosts'
  const firstItem = items[0];
  if (firstItem.followersCount !== undefined) {
    profile = firstItem;
    if (firstItem.latestPosts && Array.isArray(firstItem.latestPosts)) {
      posts = firstItem.latestPosts;
    }
  } else {
    // Se não for um objeto de perfil claro, vamos tentar achar
    profile = items.find(i => i.followersCount !== undefined) || items[0];
    posts = items.filter(i => i.type || i.shortCode);
  }
  return { profile, posts };
}

function calculateEngagement(likes: number, comments: number, followers: number) {
  if (!followers) return 0;
  return ((likes + comments) / followers) * 100;
}

function getMedian(values: number[]) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

function getTrimmedMean(values: number[]) {
  if (values.length <= 2) return getMedian(values);
  values.sort((a, b) => a - b);
  const trimmed = values.slice(1, -1); // remove min and max
  const sum = trimmed.reduce((a, b) => a + b, 0);
  return sum / trimmed.length;
}

const CTA_REGEX = /clique|agende|link|conheça|fale|baixe|orçamento|direct|comente|salve/i;

export async function POST(request: Request) {
  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    const body = await request.json();
    let { handle, tipo_perfil = 'criador' } = body;

    if (!handle) {
      return NextResponse.json({ error: 'Handle do perfil ausente.' }, { status: 400 });
    }
    handle = handle.replace('@', '').trim();

    let profile: any = null;
    let allPosts: any[] = [];
    console.log(`Buscando Apify para ${handle} (Perfil + 120 Posts)...`);

    const [profileRun, postsRun] = await Promise.all([
      apifyClient.actor("apify/instagram-scraper").call({
        addParentData: false,
        directUrls: [`https://www.instagram.com/${handle}/`],
        resultsType: "details",
        searchType: "user"
      }),
      apifyClient.actor("apify/instagram-scraper").call({
        addParentData: false,
        directUrls: [`https://www.instagram.com/${handle}/`],
        resultsLimit: 120,
        resultsType: "posts",
        searchType: "user"
      })
    ]);

    const [profileDataset, postsDataset] = await Promise.all([
      apifyClient.dataset(profileRun.defaultDatasetId).listItems(),
      apifyClient.dataset(postsRun.defaultDatasetId).listItems()
    ]);

    const profileItems = profileDataset.items;
    const postsItems = postsDataset.items;

    if (profileItems && profileItems.length > 0) {
      profile = profileItems.find(i => i.followersCount !== undefined) || profileItems[0];
    }
    
    if (postsItems && postsItems.length > 0) {
      allPosts = postsItems.filter(i => i.type || i.shortCode);
    }

    if (!profile) {
      return NextResponse.json({ error: 'Nenhum dado retornado. Perfil pode ser privado ou inexistente.' }, { status: 400 });
    }

    // 1. Filtrar Posts dos últimos 365 dias (1 ano) para maior raio de busca
    const periodLimit = new Date();
    periodLimit.setDate(periodLimit.getDate() - 365);
    
    const recentPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      return new Date(p.timestamp) >= periodLimit;
    });

    const followers = profile.followersCount || 0;
    
    // --- CÁLCULOS DETERMINÍSTICOS ---

    // Bloco 1: Completude (10 pontos)
    let scoreCompletude = 0;
    if (profile.profilePicUrl) scoreCompletude += 1;
    if (profile.fullName) scoreCompletude += 1;
    if (profile.biography && profile.biography.length > 5) scoreCompletude += 2;
    if (profile.biography && profile.biography.length >= 30 && profile.biography.length <= 150) scoreCompletude += 1;
    if (profile.externalUrl) scoreCompletude += 2;
    if (profile.businessCategoryName) scoreCompletude += 1;
    if (profile.postsCount >= 12) scoreCompletude += 1;
    if (handle.length < 20 && !/\d{4,}/.test(handle)) scoreCompletude += 1;
    
    const completudeFinal = (scoreCompletude / 10) * 100;

    // Bloco 2: Posicionamento (10 pontos)
    let scorePosicionamento = 0;
    const bioStr = (profile.biography || '').toLowerCase();
    if (bioStr.length > 20) scorePosicionamento += 2; // nicho aparente
    if (bioStr.length > 40) scorePosicionamento += 2; // valor
    if (CTA_REGEX.test(bioStr)) scorePosicionamento += 2; // CTA na bio
    if (profile.fullName && profile.fullName.toLowerCase() !== handle.toLowerCase()) scorePosicionamento += 1;
    if (profile.externalUrl) scorePosicionamento += 1;
    
    const postsWithCTA = recentPosts.filter(p => CTA_REGEX.test(p.caption || '')).length;
    if (recentPosts.length > 0 && (postsWithCTA / recentPosts.length) > 0.3) scorePosicionamento += 2;
    
    const posicionamentoFinal = (scorePosicionamento / 10) * 100;

    // Bloco 3: Constância (20 pontos)
    let constanciaFinal = 0;
    let postsPorSemana = 0;
    let recenciaDias = 999;
    
    if (recentPosts.length > 0) {
      postsPorSemana = recentPosts.length / 52.1; // 365 days = ~52.1 weeks
      
      const latestPostDate = new Date(Math.max(...recentPosts.map(p => new Date(p.timestamp).getTime())));
      recenciaDias = Math.floor((new Date().getTime() - latestPostDate.getTime()) / (1000 * 3600 * 24));
      
      let recenciaScore = 0;
      if (recenciaDias <= 7) recenciaScore = 100;
      else if (recenciaDias <= 14) recenciaScore = 75;
      else if (recenciaDias <= 30) recenciaScore = 45;
      else if (recenciaDias <= 60) recenciaScore = 20;

      let frequenciaMeta = tipo_perfil === 'negocio' ? 3 : 3;
      let freqScore = Math.min((postsPorSemana / frequenciaMeta) * 100, 100);
      
      constanciaFinal = (freqScore * 0.7) + (recenciaScore * 0.3);
    }

    // Bloco 4: Engajamento (30 pontos)
    let engajamentoFinal = 0;
    let engajamentoRobusto = 0;
    let topPost = null;
    let worstPost = null;
    
    let totalInteractions = 0;
    let maxInteractions = 0;

    if (recentPosts.length > 0 && followers > 0) {
      const engs = recentPosts.map(p => {
        const likes = p.likesCount || 0;
        const comments = p.commentsCount || 0;
        const eng = calculateEngagement(likes, comments, followers);
        
        totalInteractions += (likes + comments);
        if ((likes + comments) > maxInteractions) maxInteractions = (likes + comments);

        p._eng = eng; // store temporarily
        return eng;
      });

      recentPosts.sort((a,b) => b._eng - a._eng);
      topPost = recentPosts[0];
      worstPost = recentPosts[recentPosts.length - 1];

      const mediana = getMedian(engs);
      const mediaAparada = getTrimmedMean(engs);
      engajamentoRobusto = (mediana * 0.7) + (mediaAparada * 0.3);

      // Benchmarks
      let benchmark = 1.0;
      if (tipo_perfil === 'negocio') {
        if (followers <= 1000) benchmark = 2.0;
        else if (followers <= 5000) benchmark = 1.5;
        else if (followers <= 10000) benchmark = 1.2;
        else if (followers <= 50000) benchmark = 0.9;
        else benchmark = 0.6;
      } else {
        if (followers <= 1000) benchmark = 5.0;
        else if (followers <= 5000) benchmark = 4.5;
        else if (followers <= 10000) benchmark = 4.0;
        else if (followers <= 50000) benchmark = 3.5;
        else if (followers <= 100000) benchmark = 3.0;
        else benchmark = 2.0;
      }

      let engScore = (engajamentoRobusto / benchmark) * 80; // atingir o benchmark = 80 pontos
      if (engScore > 100) engScore = 100;
      
      engajamentoFinal = engScore;
    }

    const concentracaoPostPrincipal = totalInteractions > 0 ? (maxInteractions / totalInteractions) : 0;

    // Bloco 5: Conteúdo e Formatos (15 pontos)
    let conteudoFinal = 0;
    let pctReels = 0;
    if (recentPosts.length > 0) {
      const reelsCount = recentPosts.filter(p => p.type === 'Video' || p.isReel).length;
      const carouselCount = recentPosts.filter(p => p.type === 'Sidecar').length;
      
      pctReels = reelsCount / recentPosts.length;
      
      let formatoScore = 0;
      if ((reelsCount + carouselCount) / recentPosts.length >= 0.5) formatoScore = 100;
      else if ((reelsCount + carouselCount) / recentPosts.length >= 0.2) formatoScore = 60;
      else formatoScore = 30;

      conteudoFinal = formatoScore;
    }

    // Bloco 6: Comentários (15 pontos)
    // Se não tiver comentários detalhados do ator, estimamos pela quantidade/mediana.
    let comentariosFinal = 50; // Neutro por padrão se não tiver payload de texto
    let totalComentarios = recentPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
    
    // (Poderíamos aplicar os RegEx nos últimos comentários se eles vierem no payload do Apify. 
    // Como shu8hvrXbJbY3Eb9W muitas vezes traz 'latestComments', vamos tentar usá-los).
    let comPos = 0, comNeg = 0, comSpam = 0, comCompra = 0;
    let validComments = 0;

    recentPosts.forEach(p => {
      if (p.latestComments && Array.isArray(p.latestComments)) {
        p.latestComments.forEach((c: any) => {
          validComments++;
          const text = (c.text || '').toLowerCase();
          if (/amei|gostei|perfeito|excelente|top|maravilh|recomendo|funcionou|obrigado|salvou/.test(text)) comPos++;
          else if (/ruim|péssimo|não gostei|problema|decepcion|golpe|fraude|nunca mais/.test(text)) comNeg++;
          else if (/quanto|valor|onde|compro|disponível|quero|link|orçamento|agenda/.test(text)) comCompra++;
          else if (/sdv|segue|seguidores|renda extra|link/.test(text)) comSpam++;
        });
      }
    });

    if (validComments > 5) {
      const posPct = comPos / validComments;
      const negPct = comNeg / validComments;
      if (posPct > 0.5) comentariosFinal = 90;
      else if (posPct > 0.2) comentariosFinal = 70;
      if (negPct > 0.1) comentariosFinal -= 20;
      if (comSpam / validComments > 0.2) comentariosFinal -= 20;
    } else {
      // Se não há texto, usa proporção de comentários vs seguidores
      if (totalComentarios / (followers || 1) > 0.01) comentariosFinal = 80;
    }

    if (comentariosFinal < 0) comentariosFinal = 0;
    if (comentariosFinal > 100) comentariosFinal = 100;

    // --- CONFIANÇA ---
    let conf = 0;
    if (recentPosts.length >= 30) conf += 45;
    else if (recentPosts.length > 10) conf += 20;

    if (validComments >= 30) conf += 35;
    else if (totalComentarios > 50) conf += 15; // penaliza um pouco por não ter o texto

    conf += 20; // dados básicos de perfil preenchidos

    // --- NOTA GERAL ---
    const notaFinal = Math.round(
      (completudeFinal * 0.10) +
      (posicionamentoFinal * 0.10) +
      (constanciaFinal * 0.20) +
      (engajamentoFinal * 0.30) +
      (conteudoFinal * 0.15) +
      (comentariosFinal * 0.15)
    );

    let classificacao = 'Crítico';
    if (notaFinal >= 90) classificacao = 'Excelente';
    else if (notaFinal >= 75) classificacao = 'Forte';
    else if (notaFinal >= 60) classificacao = 'Saudável';
    else if (notaFinal >= 40) classificacao = 'Básico';

    // Recomendações
    let recs = [];
    if (completudeFinal < 70) recs.push({ area: "Completude", txt: "Preencha a bio completamente, adicione link e defina categoria comercial."});
    if (posicionamentoFinal < 70) recs.push({ area: "Posicionamento", txt: "Deixe claro o que você faz na bio e inclua chamadas de ação (ex: clique no link)."});
    if (constanciaFinal < 70) recs.push({ area: "Constância", txt: "Aumente a frequência de publicação e evite longos períodos (mais de 7 dias) sem postar."});
    if (engajamentoFinal < 70) recs.push({ area: "Engajamento", txt: "Seu engajamento está abaixo do benchmark. Tente formatos mais imersivos e faça perguntas nas legendas."});
    if (conteudoFinal < 70) recs.push({ area: "Formatos", txt: "Diversifique os formatos. Aumente o uso de Reels (para alcance) e Carrosséis (para salvamento)."});
    
    // --- RESUMO EXECUTIVO E IDENTIDADE (VIA IA OU FALLBACK) ---
    let resumoExecutivo = '';
    let nicho = profile.businessCategoryName || 'Não identificado';
    let tom = 'Neutro';
    let formatoPrincipal = pctReels > 0.5 ? 'Foco em Vídeos Curtos (Reels)' : 'Foco em Carrosséis/Fotos';
    let analiseSentimento = {
      positivo: 50,
      neutro: 40,
      negativo: 10,
      resumo: "Não foi possível analisar os comentários neste momento.",
      amostraTotal: 0,
      porPost: [] as any[]
    };
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const amostraLegendas = recentPosts.slice(0, 10).map(p => p.caption).filter(c => c && c.length > 5).join(' | ').substring(0, 800);
        
        let totalCommentsSampled = 0;
        const comentariosPorPost = recentPosts.slice(0, 15).map(p => {
          const coms = (p.latestComments || []).map((c: any) => c.text).filter(Boolean);
          totalCommentsSampled += coms.length;
          return `Post URL: ${p.url || p.shortCode}\nComentários (${coms.length}):\n${coms.slice(0, 30).join('\n')}`;
        }).join('\n\n').substring(0, 6000);

        const miniPayload = `
        Perfil: @${handle} (${followers} seg)
        Bio: ${profile.biography || 'Não informada'}
        Segmento Oficial: ${profile.businessCategoryName || 'Não informado'}
        Amostra de Legendas Recentes: ${amostraLegendas}
        
        --- COMENTÁRIOS POR POST ---
        ${comentariosPorPost}
        ----------------------------
        
        Nota Final: ${notaFinal}/100 (${classificacao})
        
        INSTRUÇÕES CRÍTICAS PARA O NICHO E SENTIMENTO:
        - O Nicho deve ser estritamente o que está na Bio. Não invente sub-nichos.
        - Analise os comentários e defina as porcentagens GERAIS de sentimento (soma 100).
        - Para cada post na amostra que tenha comentários, gere uma avaliação individual da média do post, e TAMBÉM analise individualmente cada comentário fornecido.
        
        Retorne um objeto JSON contendo estritamente as chaves abaixo:
        1. "resumoExecutivo": Resumo analítico em 1 parágrafo (max 4 frases).
        2. "nicho": Descreva com precisão o nicho baseado NA BIO, SEM ALUCINAR temas não citados.
        3. "tom": O tom da comunicação.
        4. "formatoPrincipal": Formato predominante.
        5. "analiseSentimento": Um objeto JSON com:
           - "positivo", "neutro", "negativo" (numéricos de 0 a 100 somando 100)
           - "resumo": resumo de 2 frases do público
           - "amostraTotal": número exato de comentários analisados (neste caso, ${totalCommentsSampled})
           - "porPost": array de objetos, cada um com:
             {
               "url": "url do post", 
               "amostra": (numero), 
               "positivo": %, "neutro": %, "negativo": %, 
               "resumo": "...",
               "comentariosAvaliados": [
                 { "texto": "texto do comentario", "sentimento": "positivo", "neutro" ou "negativo" }
               ]
             }
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é um auditor comercial de Instagram. Responda apenas com o JSON." },
            { role: "user", content: miniPayload }
          ],
          response_format: { type: "json_object" }
        });
        
        const iaData = JSON.parse(completion.choices[0].message.content || '{}');
        resumoExecutivo = iaData.resumoExecutivo || 'Resumo não gerado.';
        if (iaData.nicho) nicho = iaData.nicho;
        if (iaData.tom) tom = iaData.tom;
        if (iaData.formatoPrincipal) formatoPrincipal = iaData.formatoPrincipal;
        if (iaData.analiseSentimento) analiseSentimento = iaData.analiseSentimento;
      } catch (err) {
        console.error("Falha no OpenAI:", err);
      }
    }
    
    if (!resumoExecutivo) {
      // Fallback determinístico
      resumoExecutivo = `O perfil @${handle} apresenta uma maturidade de nível ${classificacao} (engajamento de ${engajamentoRobusto.toFixed(2)}%). Com frequência de ${postsPorSemana.toFixed(1)} posts por semana, a conta mostra ${recs.length > 0 ? 'oportunidades claras de melhoria em ' + recs.map(r=>r.area).join(', ') : 'consistência excelente'}. Focar no ajuste de formato e CTAs pode destravar ainda mais valor na conversão.`;
    }

    // --- PAYLOAD DE RETORNO ---
    const resultData = {
      notaGeral: notaFinal,
      classificacao,
      confianca: conf,
      resumoExecutivo,
      identidade: {
        nicho,
        tom,
        formatoPrincipal
      },
      analiseSentimento,
      metricas: {
        seguidores: followers,
        postsAnalisados: recentPosts.length,
        postsPorSemana: postsPorSemana.toFixed(1),
        curtidasTotais: totalInteractions - totalComentarios,
        comentariosTotais: totalComentarios,
        engajamentoRobusto: `${engajamentoRobusto.toFixed(2)}%`,
        pctReels: `${(pctReels * 100).toFixed(0)}%`,
        concentracaoViral: `${(concentracaoPostPrincipal * 100).toFixed(0)}%`
      },
      notasBlocos: {
        completude: Math.round(completudeFinal),
        posicionamento: Math.round(posicionamentoFinal),
        constancia: Math.round(constanciaFinal),
        engajamento: Math.round(engajamentoFinal),
        conteudo: Math.round(conteudoFinal),
        comentarios: Math.round(comentariosFinal)
      },
      recomendacoes: recs,
      topPost: topPost ? {
        url: topPost.url || topPost.shortCode,
        tipo: topPost.type,
        data: new Date(topPost.timestamp).toLocaleDateString('pt-BR'),
        engajamento: topPost._eng ? topPost._eng.toFixed(2) + '%' : '-'
      } : null,
      worstPost: worstPost ? {
        url: worstPost.url || worstPost.shortCode,
        tipo: worstPost.type,
        data: new Date(worstPost.timestamp).toLocaleDateString('pt-BR'),
        engajamento: worstPost._eng ? worstPost._eng.toFixed(2) + '%' : '-'
      } : null
    };

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
