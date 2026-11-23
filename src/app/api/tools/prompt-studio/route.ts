import Anthropic from '@anthropic-ai/sdk';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { projects } from '@/lib/server/montagem/projects';
import { SCENE_FREE_PROMPTS } from '@/lib/montagem';
import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { PROMPT_STANDARD } from '@/lib/server/prompts/standard';
import { AUTO, MAIN_TEXT, PROMPT_MODES, PromptMode, fieldsForMode, promptImageTarget } from '@/lib/promptStudio';

/**
 * Imagens chegam na ordem dos espaços da tela (a mesma em que vão ser anexadas na geração), com null nos vazios:
 * - Image to Video: [inicial, final, intermediário 1, intermediário 2…];
 * - Image to Image: [base, referência 2, referência 3…];
 * - Reference to Video: [referência 1, referência 2…];
 * - Video to Video: [referência de aparência].
 * Aceita também o formato antigo por papel ({ inicial, final, base, referencia }).
 */
function readImages(mode: PromptMode, raw: unknown): (string | null)[] {
  if (Array.isArray(raw)) return raw.map(v => (typeof v === 'string' && v ? v : null));
  const r = (raw || {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof r[k] === 'string' && r[k] ? (r[k] as string) : null);
  if (mode === 'i2v') return [pick('inicial'), pick('final')];
  if (mode === 'i2i') return [pick('base'), pick('referencia')];
  if (mode === 'v2v') return [pick('referencia')];
  return [];
}

/** Rótulo de cada imagem para a IA, com o número que ela terá no pedido de geração. */
function imageLabel(mode: PromptMode, slot: number, n: number) {
  if (mode === 'i2v') {
    if (slot === 0) return `Imagem ${n} — frame inicial do vídeo (âncora de identidade e composição)`;
    if (slot === 1) return `Imagem ${n} — último frame desejado (o vídeo termina nesta imagem)`;
    return `Imagem ${n} — frame intermediário ${slot - 1} (o vídeo passa por esta imagem, em ordem, entre o inicial e o final)`;
  }
  if (mode === 'i2i') return slot === 0 ? `Imagem ${n} — imagem base a ser editada` : `Imagem ${n} — referência (use o que a descrição pedir dela: pessoa, produto, cenário, estilo, cor ou luz)`;
  if (mode === 'r2v') return `Imagem ${n} — referência para o vídeo (personagem, produto, cenário ou estilo, conforme a descrição)`;
  return 'Imagem de referência — aparência desejada (personagem, estilo ou cenário)';
}

/** O corpo inteiro passa pela função da Netlify (limite de ~6 MB): as imagens somadas ficam abaixo disto. */
const MAX_TOTAL_IMAGE_CHARS = 5_000_000;

/** Quadros tirados do vídeo no navegador (o modelo de texto não lê vídeo): até 4, do início ao fim. */
const MAX_FRAMES = 4;

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = typeof MEDIA_TYPES[number];
/** ~3 MB por imagem em base64; a tela já reduz para no máximo 1600px. */
const MAX_IMAGE_CHARS = 4_000_000;

function parseImage(dataUrl: unknown): { media_type: MediaType; data: string } {
  const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!match) throw new HttpError(400, 'bad_image', 'Imagem inválida. Envie JPG, PNG ou WEBP.');
  if (match[2].length > MAX_IMAGE_CHARS) throw new HttpError(400, 'image_too_large', 'Imagem grande demais. Use uma imagem de até 3 MB.');
  return { media_type: match[1] as MediaType, data: match[2] };
}

/**
 * Esquema da resposta. Com ele, a API garante um JSON válido (structured outputs):
 * aspas em falas ou termos citados vêm sempre escapadas, sem quebrar a leitura no navegador.
 */
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['leituraImagem', 'ficha', 'prompt', 'negativePrompt', 'decisoes', 'perguntas', 'seFalhar'],
  properties: {
    leituraImagem: { type: 'string', description: 'Leitura da imagem em português; string vazia se não houver imagem.' },
    ficha: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['item', 'valor'],
        properties: { item: { type: 'string' }, valor: { type: 'string' } },
      },
    },
    prompt: { type: 'string' },
    negativePrompt: { type: 'string', description: 'String vazia se a plataforma não tiver campo de negative prompt.' },
    decisoes: { type: 'array', items: { type: 'string' } },
    perguntas: { type: 'array', items: { type: 'string' } },
    seFalhar: { type: 'string' },
  },
} as const;

/** Descreve o formulário para a IA: escolhas do usuário x lacunas ("auto"). */
function describeChoices(mode: PromptMode, choices: Record<string, unknown>) {
  const decided: string[] = [];
  const gaps: string[] = [];
  for (const field of fieldsForMode(mode)) {
    const raw = choices?.[field.id];
    const value = Array.isArray(raw)
      ? raw.filter(v => typeof v === 'string' && field.options?.includes(v)).join(', ')
      : typeof raw === 'string' ? raw.trim().slice(0, 300) : '';
    const valid = field.kind === 'select' ? field.options?.includes(value) : value.length > 0;
    if (value && value !== AUTO && valid) decided.push(`- ${field.label}: ${value}`);
    else if (field.kind !== 'text') gaps.push(`- ${field.label}: auto`);
  }
  return { decided, gaps };
}

/**
 * Gerador de Prompts: lê as imagens, aplica o padrão de direção e devolve
 * o prompt em streaming (JSON montado no navegador ao fim), evitando o corte da Netlify.
 */
export const POST = withTool('prompts', async ({ body, user, refund }) => {
  const mode = body.mode as PromptMode;
  if (!PROMPT_MODES.some(m => m.id === mode)) throw new HttpError(400, 'bad_mode', 'Escolha o tipo de prompt.');

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '';
  if (MAIN_TEXT[mode].required && !description) {
    throw new HttpError(400, 'missing_description', `Preencha o campo "${MAIN_TEXT[mode].label}".`);
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (mode === 'v2v') {
    const frames = Array.isArray(body.videoFrames) ? body.videoFrames.slice(0, MAX_FRAMES) : [];
    if (frames.length < 2) throw new HttpError(400, 'missing_video', 'Envie o vídeo de entrada.');
    const meta = body.videoMeta || {};
    const seconds = Number(meta.duration) > 0 ? `${Number(meta.duration).toFixed(1)} s` : 'duração desconhecida';
    const size = Number(meta.width) > 0 ? `${Math.round(meta.width)}x${Math.round(meta.height)}` : 'tamanho desconhecido';
    content.push({ type: 'text', text: `VÍDEO DE ENTRADA (${seconds}, ${size}): ${frames.length} quadros em ordem, do início ao fim.` });
    frames.forEach((f: unknown, i: number) => {
      content.push({ type: 'text', text: `Quadro ${i + 1} de ${frames.length}` });
      content.push({ type: 'image', source: { type: 'base64', ...parseImage(f) } });
    });
  }
  // Mesmo limite de imagens da geração para o modelo da ficha (ou o padrão da aba de geração).
  const target = promptImageTarget(mode, body.choices || {});
  const slots = readImages(mode, body.images).slice(0, target.max);
  if ((mode === 'i2v' || mode === 'i2i' || mode === 'r2v') && !slots[0]) {
    throw new HttpError(400, 'missing_image', mode === 'r2v' ? 'Envie pelo menos uma imagem de referência.' : 'Envie a imagem para este tipo de prompt.');
  }
  const totalChars = slots.reduce((n, v) => n + (v?.length || 0), 0);
  if (totalChars > MAX_TOTAL_IMAGE_CHARS) throw new HttpError(413, 'images_too_large', 'As imagens somadas passaram do limite. Use menos imagens ou arquivos menores.');
  // Numeração igual à ordem em que vão anexadas na geração (Image to Video: inicial, intermediários, final).
  const order = mode === 'i2v' ? [0, ...slots.map((_, i) => i).filter(i => i >= 2), 1] : slots.map((_, i) => i);
  const sent = order.filter(i => slots[i]);
  sent.forEach((slot, idx) => {
    content.push({ type: 'text', text: imageLabel(mode, slot, idx + 1) });
    content.push({ type: 'image', source: { type: 'base64', ...parseImage(slots[slot]) } });
  });
  // Mais de uma imagem: o prompt cita cada uma pelo número, na sintaxe do modelo quando ele tem uma.
  const citeRule = sent.length > 1 && mode !== 'v2v'
    ? [
      '',
      `IMAGENS ANEXADAS NA GERAÇÃO: ${sent.length}, na ordem acima (Imagem 1 a ${sent.length}). O prompt deve usar todas e dizer o papel de cada uma.`,
      target.refSyntax
        ? `Cite cada imagem no prompt com a sintaxe do modelo escolhido: ${target.refSyntax} (a numeração segue a ordem acima).`
        : 'Cite cada imagem no prompt pelo número, em inglês ("image 1", "image 2"…), seguindo a ordem acima.',
    ]
    : [];

  const { decided, gaps } = describeChoices(mode, body.choices || {});
  const modeLabel = PROMPT_MODES.find(m => m.id === mode)!.label;
  content.push({
    type: 'text',
    text: [
      `MODO: ${modeLabel.toUpperCase()}`,
      '',
      `${MAIN_TEXT[mode].label}:`,
      description || '(não informado — deduza da imagem uma ação plausível e registre em "decisoes")',
      '',
      'ESCOLHAS DO USUÁRIO (obrigatórias):',
      decided.length ? decided.join('\n') : '- nenhuma',
      '',
      'LACUNAS (decida pelos Padrões e liste em "decisoes"):',
      gaps.length ? gaps.join('\n') : '- nenhuma',
      ...citeRule,
    ].join('\n'),
  });

  const anthropic = anthropicClient();

  return textStreamResponse(
    async (write) => {
      // A IA pensa antes de escrever: espaços mantêm a conexão viva até o primeiro trecho
      // (o navegador ignora espaços antes do JSON).
      let started = false;
      const keepAlive = setInterval(() => { if (!started) write(' '); }, 4000);
      try {
        const stream = anthropic.beta.messages.stream({
          model: AI_MODELS.anthropicPrompts,
          max_tokens: 16000,
          output_config: { effort: 'medium', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
          betas: ['server-side-fallback-2026-06-01'],
          fallbacks: [{ model: 'claude-opus-4-8' }],
          // O padrão de direção (~6 mil tokens) é igual em todo uso: em cache, a leitura custa 10% do preço
          // quando há outro uso nos 5 minutos seguintes.
          system: [{ type: 'text', text: PROMPT_STANDARD, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content }],
        });
        stream.on('text', (text) => { started = true; write(text); });
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          throw new HttpError(422, 'refused', 'A IA não pôde gerar este prompt. Revise a descrição ou a imagem e tente de novo.');
        }
        if (final.stop_reason === 'max_tokens') {
          throw new HttpError(502, 'truncated', 'A resposta ficou longa demais e foi cortada. Tente de novo com menos detalhes.');
        }
      } finally {
        clearInterval(keepAlive);
      }
      await logPlatformAction(user.uid, user.email ?? undefined, 'prompts', `Gerou prompt ${modeLabel}`);
    },
    async (err) => {
      await refund('provider_failure');
      if (err instanceof HttpError) return { error: `${err.message} Seu crédito foi devolvido.`, code: err.code };
      const e = describeProviderError(err, 'Anthropic');
      return { error: e.message, code: e.code };
    }
  );
}, {
  // Prompt de uma cena da Montagem: grátis até SCENE_FREE_PROMPTS por cena em cada tipo (frame e movimento).
  costAsync: async (body, user) => scenePromptCost(user.uid, body),
});

/** 0 se o prompt é de uma cena do próprio projeto e ainda está na cota grátis (e já conta o uso); senão, preço normal. */
async function scenePromptCost(uid: string, body: any): Promise<number | undefined> {
  if (typeof body?.projectId !== 'string' || typeof body?.sceneId !== 'string' || !/^[\w-]{1,64}$/.test(body.sceneId)) return undefined;
  const kind = body.mode === 't2i' || body.mode === 'i2i' ? 'frame' : 'motion';
  const ref = projects().doc(body.projectId);
  return adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const data = (await tx.get(ref)).data();
    if (!data || data.uid !== uid || !(data.scenes || []).some((sc: { id: string }) => sc.id === body.sceneId)) return undefined;
    const used = data.promptUsage?.[body.sceneId]?.[kind] || 0;
    if (used >= SCENE_FREE_PROMPTS) return undefined;
    tx.update(ref, { [`promptUsage.${body.sceneId}.${kind}`]: used + 1 });
    return 0;
  });
}
