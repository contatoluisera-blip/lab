import Anthropic from '@anthropic-ai/sdk';
import { adminDb } from '@/lib/firebase/admin';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HUB_FORMATS, HUB_HOOKS, HubAI, HubItem } from '@/lib/hub';

const SYSTEM = `Você é analista de conteúdo viral do Instagram para uma plataforma brasileira de criadores.
Recebe os dados de um reel (legenda, hashtags, métricas e a miniatura) e classifica para um hub de referências.
Escreva tudo em português do Brasil, de forma objetiva e útil para quem vai se inspirar.
- nicho: escolha UM da lista de nichos fornecida; se nenhum servir, use "Outro".
- tema: o assunto em até 8 palavras.
- formato e tipoGancho: escolha das listas fornecidas.
- gancho: o que prende a atenção nos primeiros segundos, em 1 frase (deduza da legenda e da miniatura).
- porqueFuncionou: 2 frases sobre o mecanismo do sucesso (gancho, identificação, utilidade, estética, timing).
- resumoVisual: 1 frase descrevendo o que se vê (enquadramento, cenário, sujeito), útil para recriar a estética.
- palavrasChave: 5 a 8 termos de busca em português, minúsculos.
- adequado: false se o conteúdo for sexual, violento, discriminatório, enganoso ou impróprio para um hub profissional.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['nicho', 'tema', 'formato', 'gancho', 'tipoGancho', 'porqueFuncionou', 'resumoVisual', 'palavrasChave', 'adequado'],
  properties: {
    nicho: { type: 'string' },
    tema: { type: 'string' },
    formato: { type: 'string', enum: [...HUB_FORMATS] },
    gancho: { type: 'string' },
    tipoGancho: { type: 'string', enum: [...HUB_HOOKS] },
    porqueFuncionou: { type: 'string' },
    resumoVisual: { type: 'string' },
    palavrasChave: { type: 'array', items: { type: 'string' } },
    adequado: { type: 'boolean' },
  },
};

async function thumbBlock(url: string): Promise<Anthropic.ImageBlockParam | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    if (!/image\/(jpeg|png|webp)/.test(type)) return null;
    const data = Buffer.from(await res.arrayBuffer()).toString('base64');
    return { type: 'image', source: { type: 'base64', media_type: type.split(';')[0] as 'image/jpeg', data } };
  } catch {
    return null;
  }
}

/** Classifica um reel. Lança erro se a IA falhar (o item fica para nova tentativa). */
export async function classifyVideo(video: any, nichos: string[]): Promise<HubAI> {
  const content: Anthropic.ContentBlockParam[] = [];
  const img = await thumbBlock(video.thumb);
  if (img) content.push(img);
  content.push({
    type: 'text',
    text: [
      `Nichos disponíveis: ${[...nichos, 'Outro'].join(' | ')}`,
      video.sourceNicho ? `Nicho de origem da coleta (sugestão): ${video.sourceNicho}` : '',
      `Formatos: ${HUB_FORMATS.join(' | ')}`,
      `Tipos de gancho: ${HUB_HOOKS.join(' | ')}`,
      '',
      `Autor: @${video.author}`,
      `Métricas: ${video.views} views, ${video.likes} curtidas, ${video.comments} comentários, duração ${video.durationSec ?? '?'}s, publicado em ${video.postedAt ?? '?'}`,
      `Hashtags: ${(video.hashtags || []).join(' ')}`,
      `Legenda: ${video.caption || '(sem legenda)'}`,
    ].filter(Boolean).join('\n'),
  });

  const response = await anthropicClient().messages.create({
    model: AI_MODELS.anthropicFast,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') {
    return { nicho: 'Outro', tema: '', formato: 'Outro', gancho: '', tipoGancho: 'Outro', porqueFuncionou: '', resumoVisual: '', palavrasChave: [], adequado: false };
  }
  const text = response.content.find(b => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Resposta da IA sem texto');
  const ai = JSON.parse(text.text) as HubAI;
  ai.palavrasChave = (ai.palavrasChave || []).map(k => k.toLowerCase()).slice(0, 8);
  return ai;
}

/** Nichos cadastrados nas fontes de coleta (lista de opções da IA e dos filtros). */
export async function listNichos(): Promise<string[]> {
  const snap = await adminDb.collection('hub_sources').get();
  return Array.from(new Set(snap.docs.map((d: any) => String(d.data().nicho || '')).filter(Boolean))).sort() as string[];
}

/**
 * Classifica até `limit` itens pendentes ainda sem análise.
 * Itens adicionados manualmente entram direto no hub ao serem classificados.
 */
export async function processPending(limit = 6) {
  const snap = await adminDb.collection('hub_videos').where('aiStatus', '==', 'todo').limit(limit).get();
  if (snap.empty) return { processed: 0, autoApproved: 0 };
  const nichos = await listNichos();
  let autoApproved = 0;

  await Promise.all(snap.docs.map(async (doc: any) => {
    const video = doc.data();
    try {
      const ai = await classifyVideo(video, nichos);
      const approve = video.autoApprove && ai.adequado;
      if (approve) autoApproved++;
      await doc.ref.update({
        ai,
        aiStatus: 'done',
        ...(approve ? { status: 'approved', approvedAt: new Date().toISOString() } : {}),
      });
    } catch (e) {
      console.error('[hub] classificação falhou', doc.id, e);
      const attempts = (video.aiAttempts || 0) + 1;
      await doc.ref.update({ aiAttempts: attempts, ...(attempts >= 3 ? { aiStatus: 'failed' } : {}) });
    }
  }));

  if (autoApproved) await rebuildCatalog();
  return { processed: snap.size, autoApproved };
}

/** Uma página do catálogo cabe com folga no limite de 1 MB de um documento do Firestore. */
const PAGE_SIZE = 700;

/**
 * Remonta o catálogo que a tela lê (hub_catalog): poucas leituras por visita,
 * em vez de uma leitura por vídeo. Chamado a cada aprovação ou remoção.
 */
export async function rebuildCatalog() {
  const snap = await adminDb.collection('hub_videos').where('status', '==', 'approved').get();
  const items: HubItem[] = snap.docs.map((d: any) => {
    const v = d.data();
    const ai: Partial<HubAI> = v.ai || {};
    return {
      id: d.id,
      url: v.url,
      author: v.author || '',
      thumb: v.thumb || '',
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments || 0,
      postedAt: v.postedAt || null,
      score: v.score || 0,
      nicho: ai.nicho || v.sourceNicho || 'Outro',
      tema: ai.tema || '',
      formato: ai.formato || 'Outro',
      gancho: ai.gancho || '',
      tipoGancho: ai.tipoGancho || 'Outro',
      porque: ai.porqueFuncionou || '',
      resumo: ai.resumoVisual || '',
      kw: ai.palavrasChave || [],
      caption: String(v.caption || '').slice(0, 200),
    };
  }).sort((a: HubItem, b: HubItem) => b.score - a.score);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const batch = adminDb.batch();
  for (let p = 0; p < pages; p++) {
    batch.set(adminDb.collection('hub_catalog').doc(`page_${p}`), { items: items.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE) });
  }
  batch.set(adminDb.collection('hub_catalog').doc('meta'), {
    pages,
    count: items.length,
    nichos: Array.from(new Set(items.map(i => i.nicho))).sort(),
    updatedAt: new Date().toISOString(),
  });
  await batch.commit();

  // Remove páginas que sobraram de um catálogo maior.
  const old = await adminDb.collection('hub_catalog').get();
  const stale = old.docs.filter((d: any) => d.id.startsWith('page_') && Number(d.id.slice(5)) >= pages);
  if (stale.length) {
    const del = adminDb.batch();
    stale.forEach((d: any) => del.delete(d.ref));
    await del.commit();
  }
  return items.length;
}
