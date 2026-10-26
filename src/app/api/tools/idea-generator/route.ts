import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { adminDb } from '@/lib/firebase/admin';
import { IDEAS_STANDARD } from '@/lib/server/ideas/standard';
import { AUTO, DIFICULDADES, IDEA_FIELDS, HUB_HOOKS } from '@/lib/ideaStudio';
import { IDEAS_MAX, ideasCost } from '@/lib/planConfig';

const str = { type: 'string' } as const;

/** Esquema da resposta: a API garante JSON válido (sem "JSON Parse error" no navegador). */
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumoEstrategico', 'decisoes', 'planoDiaria', 'ideias'],
  properties: {
    resumoEstrategico: str,
    decisoes: { type: 'array', items: str },
    planoDiaria: str,
    ideias: {
      type: 'array',
      items: {
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
      },
    },
  },
};

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

/**
 * Gerador de Ideias v2: briefing com decisões + diagnóstico resumido + referências do Hub,
 * roteiro em beats com Claude Opus 5.5, em streaming (JSON montado no navegador ao fim).
 * Custo: 1 crédito até 5 ideias, 2 créditos de 6 a 10.
 */
export const POST = withTool('ideas', async ({ body, user, refund }) => {
  const quantidade = Math.min(IDEAS_MAX, Math.max(1, Math.round(Number(body.quantidade) || 5)));
  const nicho = clip(body.nicho, 120);
  const pedido = clip(body.pedido, 1500);
  if (!nicho && !body.diagnosisId) throw new HttpError(400, 'missing_fields', 'Informe o nicho ou vincule um diagnóstico.');

  const [diagnosis, calculation] = await Promise.all([
    ownedDoc('diagnoses', body.diagnosisId, user.uid),
    ownedDoc('calculations', body.calculationId, user.uid),
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

  const anthropic = anthropicClient();

  return textStreamResponse(
    async (write) => {
      // A IA pensa antes de escrever: espaços mantêm a conexão viva até o primeiro trecho.
      let started = false;
      const keepAlive = setInterval(() => { if (!started) write(' '); }, 4000);
      try {
        const stream = anthropic.beta.messages.stream({
          model: AI_MODELS.anthropicPrompts,
          max_tokens: 32000,
          output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
          betas: ['server-side-fallback-2026-06-01'],
          fallbacks: [{ model: 'claude-opus-4-8' }],
          // O padrão de criação é igual em todo uso: em cache, custa 10% quando há outro uso em 5 minutos.
          system: [{ type: 'text', text: IDEAS_STANDARD, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: parts.join('\n') }],
        });
        stream.on('text', (text) => { started = true; write(text); });
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') throw new HttpError(422, 'refused', 'A IA não pôde gerar essas ideias. Revise o briefing e tente de novo.');
        if (final.stop_reason === 'max_tokens') throw new HttpError(502, 'truncated', 'A resposta ficou longa demais e foi cortada. Peça menos ideias.');
      } finally {
        clearInterval(keepAlive);
      }
      await logPlatformAction(user.uid, user.email ?? undefined, 'idea-generator', `Gerou ${quantidade} ideias${refs.length ? ` com ${refs.length} referência(s) do Hub` : ''}`);
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: `${err.message} Seus créditos foram devolvidos.`, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, { cost: (body) => ideasCost(body?.quantidade) });
