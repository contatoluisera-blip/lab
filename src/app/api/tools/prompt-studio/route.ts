import Anthropic from '@anthropic-ai/sdk';
import { withTool, describeProviderError } from '@/lib/server/tool';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { textStreamResponse } from '@/lib/server/stream';
import { logPlatformAction } from '@/lib/firebase/logAction';
import { PROMPT_STANDARD } from '@/lib/server/prompts/standard';
import { AUTO, MAIN_TEXT, PROMPT_MODES, PromptMode, fieldsForMode } from '@/lib/promptStudio';

type ImageRole = 'inicial' | 'final' | 'base' | 'referencia';

const IMAGE_ROLES: Record<PromptMode, { role: ImageRole; label: string; required: boolean }[]> = {
  i2v: [
    { role: 'inicial', label: 'Imagem 1 — frame inicial do vídeo (âncora de identidade e composição)', required: true },
    { role: 'final', label: 'Imagem 2 — último frame desejado (modo primeiro + último frame)', required: false },
  ],
  i2i: [
    { role: 'base', label: 'Imagem 1 — imagem base a ser editada', required: true },
    { role: 'referencia', label: 'Imagem 2 — referência apenas de estilo, cor e luz', required: false },
  ],
  t2i: [],
};

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
  const images = (body.images || {}) as Record<string, unknown>;
  for (const slot of IMAGE_ROLES[mode]) {
    if (!images[slot.role]) {
      if (slot.required) throw new HttpError(400, 'missing_image', 'Envie a imagem para este tipo de prompt.');
      continue;
    }
    content.push({ type: 'text', text: slot.label });
    content.push({ type: 'image', source: { type: 'base64', ...parseImage(images[slot.role]) } });
  }

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
});
