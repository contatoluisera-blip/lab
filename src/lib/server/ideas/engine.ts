import { adminDb } from '@/lib/firebase/admin';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { IDEAS_STANDARD } from '@/lib/server/ideas/standard';
import { AUTO, DIFICULDADES, IDEA_FIELDS, HUB_HOOKS } from '@/lib/ideaStudio';
import { IDEAS_MAX } from '@/lib/planConfig';

// ─────────────────────────────────────────────────────────────
// Motor do Gerador de Ideias, em duas etapas para caber no limite de tempo
// de cada resposta da Netlify: 1) planejamento da rodada; 2) roteiro de cada
// ideia em paralelo (uma chamada por ideia).
// ─────────────────────────────────────────────────────────────

const str = { type: 'string' } as const;

/** Esquema de uma ideia completa (etapa 2). */
export const IDEA_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'pilar', 'etapaFunil', 'formato', 'duracaoSeg', 'ganchos', 'beats', 'retencao', 'cta', 'takes', 'edicao', 'porqueFunciona', 'execucao', 'referenciaUsada'],
  properties: {
    titulo: str, pilar: str, etapaFunil: str, formato: str,
    duracaoSeg: { type: 'integer' },
    ganchos: {
      type: 'object', additionalProperties: false, required: ['falado', 'textoTela', 'visual', 'tipo'],
      properties: { falado: str, textoTela: str, visual: str, tipo: { type: 'string', enum: [...HUB_HOOKS] } },
    },
    beats: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['inicio', 'fim', 'visual', 'fala', 'textoTela', 'som'],
        properties: { inicio: { type: 'number' }, fim: { type: 'number' }, visual: str, fala: str, textoTela: str, som: str },
      },
    },
    retencao: { type: 'object', additionalProperties: false, required: ['loopAberto', 'virada', 'recompensa'], properties: { loopAberto: str, virada: str, recompensa: str } },
    cta: str,
    takes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['numero', 'descricao', 'plano', 'angulo', 'movimento', 'local'],
        properties: { numero: { type: 'integer' }, descricao: str, plano: str, angulo: str, movimento: str, local: str },
      },
    },
    edicao: { type: 'object', additionalProperties: false, required: ['ritmo', 'legendas', 'trilha', 'efeitos'], properties: { ritmo: str, legendas: str, trilha: str, efeitos: str } },
    porqueFunciona: str,
    execucao: {
      type: 'object', additionalProperties: false, required: ['dificuldade', 'tempoGravacao', 'riscos'],
      properties: { dificuldade: { type: 'string', enum: [...DIFICULDADES] }, tempoGravacao: str, riscos: str },
    },
    referenciaUsada: str,
  },
};

/** Esquema do planejamento da rodada (etapa 1). */
export const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumoEstrategico', 'decisoes', 'planoDiaria', 'esbocos'],
  properties: {
    resumoEstrategico: str,
    decisoes: { type: 'array', items: str },
    planoDiaria: str,
    esbocos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'formato', 'etapaFunil', 'pilar', 'duracaoSeg', 'angulo', 'tipoGancho', 'referencia'],
        properties: {
          titulo: str, formato: str, etapaFunil: str, pilar: str,
          duracaoSeg: { type: 'integer' },
          angulo: str,
          tipoGancho: { type: 'string', enum: [...HUB_HOOKS] },
          referencia: str,
        },
      },
    },
  },
};

export interface IdeaPlan {
  resumoEstrategico: string;
  decisoes: string[];
  planoDiaria: string;
  esbocos: { titulo: string; formato: string; etapaFunil: string; pilar: string; duracaoSeg: number; angulo: string; tipoGancho: string; referencia: string }[];
}

const clip = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Só o que importa do diagnóstico: notas, gargalos e recomendações (o JSON completo tem ~4 mil tokens de ruído). */
function compactDiagnosis(d: any) {
  const r = d?.resultado_json || {};
  return {
    perfil: d?.handle ? `@${d.handle}` : undefined,
    notaGeral: r.notaGeral,
    classificacao: r.classificacao,
    resumo: r.resumoExecutivo,
    identidade: r.identidade,
    notasBlocos: r.notasBlocos,
    metricas: r.metricas,
    recomendacoes: r.recomendacoes,
    melhorPost: r.topPost,
    piorPost: r.worstPost,
  };
}

function compactCalculation(c: any) {
  return {
    cliente: c?.clientName,
    servico: c?.service_type,
    quantidadeVideos: c?.video_quantity,
    precoRecomendado: c?.precoRecomendado,
    detalhes: JSON.stringify(c?.resultado_json ?? {}).slice(0, 1500),
  };
}

async function ownedDoc(collection: string, id: unknown, uid: string) {
  if (typeof id !== 'string' || !id) return null;
  const snap = await adminDb.collection(collection).doc(id).get();
  return snap.exists && snap.data()?.userId === uid ? snap.data() : null;
}

/** Monta o briefing da rodada (texto enviado à IA) a partir do pedido e dos dados do usuário. */
export async function buildRoundContext(body: any, uid: string) {
  const quantidade = Math.min(IDEAS_MAX, Math.max(1, Math.round(Number(body.quantidade) || 5)));
  const nicho = clip(body.nicho, 120);
  const pedido = clip(body.pedido, 1500);
  if (!nicho && !body.diagnosisId) throw new HttpError(400, 'missing_fields', 'Informe o nicho ou vincule um diagnóstico.');

  const [diagnosis, calculation] = await Promise.all([
    ownedDoc('diagnoses', body.diagnosisId, uid),
    ownedDoc('calculations', body.calculationId, uid),
  ]);

  // Referências do Hub (até 3 reels aprovados).
  const refIds: string[] = Array.isArray(body.hubRefs) ? body.hubRefs.filter((x: unknown) => typeof x === 'string').slice(0, 3) : [];
  const refs = refIds.length
    ? (await adminDb.getAll(...refIds.map(id => adminDb.collection('hub_videos').doc(id))))
        .filter((s: any) => s.exists && s.data().status === 'approved')
        .map((s: any) => {
          const v = s.data(); const ai = v.ai || {};
          return { autor: `@${v.author}`, views: v.views, nicho: ai.nicho, formato: ai.formato, tema: ai.tema, gancho: ai.gancho, tipoGancho: ai.tipoGancho, porqueFuncionou: ai.porqueFuncionou, estetica: ai.resumoVisual };
        })
    : [];

  // Briefing: escolhas do usuário x lacunas.
  const choices = (body.choices || {}) as Record<string, unknown>;
  const decided: string[] = [];
  const gaps: string[] = [];
  for (const f of IDEA_FIELDS) {
    const value = clip(choices[f.id], 300);
    const valid = f.kind === 'select' ? f.options?.includes(value) : value.length > 0;
    if (value && value !== AUTO && valid) decided.push(`- ${f.label}: ${value}`);
    else if (f.kind === 'select') gaps.push(`- ${f.label}: auto`);
  }

  const parts = [
    `QUANTIDADE DE IDEIAS: ${quantidade}`,
    `CLIENTE / PROJETO: ${clip(body.cliente, 120) || 'não informado'}`,
    `NICHO: ${nicho || '(deduza do diagnóstico)'}`,
    `PÚBLICO: ${clip(body.publico, 200) || 'auto'}`,
    `PEDIDO / TEMA DA RODADA: ${pedido || '(livre — escolha os temas mais estratégicos)'}`,
    '',
    'ESCOLHAS DO USUÁRIO (obrigatórias):',
    decided.length ? decided.join('\n') : '- nenhuma',
    '',
    'LACUNAS (decida e registre em "decisoes"):',
    gaps.length ? gaps.join('\n') : '- nenhuma',
  ];
  if (diagnosis) parts.push('', 'DIAGNÓSTICO DO PERFIL (resumo):', JSON.stringify(compactDiagnosis(diagnosis)));
  if (calculation) parts.push('', 'ORÇAMENTO VENDIDO (escopo a respeitar):', JSON.stringify(compactCalculation(calculation)));
  if (refs.length) parts.push('', 'REFERÊNCIAS DO HUB (reels que viralizaram — use o mecanismo, nunca copie):', JSON.stringify(refs));


  return { quantidade, context: parts.join('\n'), refsCount: refs.length };
}

/**
 * Chama o Claude em streaming com esquema JSON garantido e o padrão de criação em cache.
 * Envia espaços enquanto a IA pensa (o navegador ignora espaços antes do JSON).
 */
export async function streamStructured(write: (t: string) => void, opts: { schema: Record<string, unknown>; userText: string; maxTokens: number }) {
  let started = false;
  const keepAlive = setInterval(() => { if (!started) write(' '); }, 4000);
  let text = '';
  try {
    const stream = anthropicClient().beta.messages.stream({
      model: AI_MODELS.anthropicPrompts,
      max_tokens: opts.maxTokens,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: opts.schema } },
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      system: [{ type: 'text', text: IDEAS_STANDARD, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: opts.userText }],
    });
    stream.on('text', (t) => { started = true; text += t; write(t); });
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new HttpError(422, 'refused', 'A IA não pôde gerar este conteúdo. Revise o briefing e tente de novo.');
    if (final.stop_reason === 'max_tokens') throw new HttpError(502, 'truncated', 'A resposta ficou longa demais e foi cortada.');
  } finally {
    clearInterval(keepAlive);
  }
  return text;
}
