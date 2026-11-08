import Anthropic from '@anthropic-ai/sdk';
import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { PROMPT_STANDARD } from '@/lib/server/prompts/standard';
import { FORMATS, MAX_SCENES, MontagemFormat, SCRIPT_PDF_MAX_BYTES, SCRIPT_TEXT_MAX } from '@/lib/montagem';

// Agente de roteiro: lê o documento (PDF ou texto), fatia em cenas e escreve, para cada uma,
// o prompt do frame (texto → imagem) e o do movimento (imagem → vídeo) no padrão da Creator Lab.

const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'objetivo', 'formato', 'bibliaVisual', 'cenas', 'observacoes'],
  properties: {
    titulo: { type: 'string' },
    objetivo: { type: 'string' },
    formato: { type: 'string', enum: FORMATS.map(f => f.id) },
    bibliaVisual: { type: 'string', description: 'Em inglês: personagens, cenário, estilo, paleta e luz fixos do vídeo.' },
    cenas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'texto', 'duracao'],
        properties: {
          titulo: { type: 'string' },
          texto: { type: 'string', description: 'Fala, narração ou ação da cena, em português.' },
          duracao: { type: 'number', description: 'Segundos da cena no vídeo final (3 a 10).' },
        },
      },
    },
    observacoes: { type: 'string', description: 'Em português: decisões tomadas, cortes de roteiro e pontos de atenção (1 a 3 frases).' },
  },
} as const;

const PROMPTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['cenas'],
  properties: {
    cenas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'promptFrame', 'promptMovimento'],
        properties: {
          id: { type: 'string', description: 'Id exato da cena recebida.' },
          promptFrame: { type: 'string', description: 'Prompt texto → imagem, em inglês.' },
          promptMovimento: { type: 'string', description: 'Prompt imagem → vídeo, em inglês.' },
        },
      },
    },
  },
} as const;

// Do padrão do Gerador de Prompts, só as seções de escrita: imagem → vídeo e texto → imagem.
const standardStart = PROMPT_STANDARD.indexOf('# MODO IMAGE TO VIDEO');
const standardEnd = PROMPT_STANDARD.indexOf('# MODO IMAGE TO IMAGE');
const STANDARD_EXCERPT = standardStart >= 0 && standardEnd > standardStart ? PROMPT_STANDARD.slice(standardStart, standardEnd) : '';

// O trabalho é dividido em etapas curtas: a função da Netlify é encerrada se uma chamada demora demais.
// 1) fatiamento: cenas + bíblia visual (saída curta); 2) prompts, de poucas cenas por vez, em paralelo.

const SYSTEM_OUTLINE = `Você é o agente de roteiro da Creator Lab, uma plataforma brasileira de criação de vídeos com IA.
Você recebe um roteiro (documento) e, às vezes, um descritivo do criador. Fatie o roteiro em cenas prontas para produção.
Cada cena vira 1 frame (imagem gerada do zero) e depois 1 clipe curto (imagem → vídeo, de 5 a 10 s) a partir desse frame.

Regras:
- Uma cena = um plano contínuo que cabe num clipe de 3 a 10 s. Fala longa vira mais de uma cena; linhas curtas no mesmo plano viram uma só.
- Siga a ordem do roteiro. Não invente acontecimentos, falas, marcas, preços ou promessas.
- titulo: até 6 palavras, descreve o plano. texto: a fala, narração ou ação da cena em português, fiel ao roteiro (rubricas podem ser resumidas), incluindo o que se vê.
- duracao: segundos da cena no vídeo final, de 3 a 10, coerente com o tempo de leitura da fala (cerca de 2,5 palavras por segundo).
- A soma das durações não passa da duração máxima informada. Se o roteiro não couber, priorize o essencial e explique em observacoes.
- No máximo ${MAX_SCENES} cenas.
- bibliaVisual (em inglês): a descrição fixa do vídeo, que será repetida em todos os prompts de imagem: cada personagem (idade aparente, rosto, cabelo, roupa), cenários recorrentes, estilo visual, paleta e luz. Siga o descritivo do criador; o que faltar, decida de forma coerente com o roteiro.
- Formato: use o informado pelo criador; se vier "auto", deduza (Reels, TikTok e Shorts → 9:16; feed → 4:5; YouTube → 16:9).
- titulo do projeto até 60 caracteres; objetivo até 160 (o que o vídeo quer causar em quem assiste).
- Se o documento não for um roteiro nem a descrição de um vídeo, devolva cenas vazias e explique em observacoes.`;

const SYSTEM_PROMPTS = `Você é o diretor de prompts da Creator Lab. Recebe a bíblia visual de um vídeo e algumas cenas do roteiro
(com a cena anterior e a seguinte como contexto). Para cada cena recebida, escreva dois prompts em inglês:
- promptFrame: texto → imagem no padrão "TEXT TO IMAGE" abaixo, no enquadramento do formato do projeto, mostrando o primeiro instante do plano.
  Os modelos de imagem não lembram de uma geração para outra: repita, literalmente, os trechos da bíblia visual que aparecem na cena.
  Sem letreiros ou texto escrito na imagem, a não ser que o roteiro exija.
- promptMovimento: imagem → vídeo no padrão "IMAGE TO VIDEO" abaixo, para a duração da cena. Descreva só o que muda a partir do frame
  (ação, câmera, ritmo); não redescreva a aparência. Se um personagem em cena fala, coloque a fala em português do Brasil entre aspas
  e indique "Brazilian Portuguese". Narração em off não entra no prompt.
Devolva uma entrada por cena recebida, com o id exato. Não invente acontecimentos fora do texto da cena.

O padrão de escrita de prompts da Creator Lab vem a seguir. Use-o só como guia de escrita;
ignore o que ele diz sobre formulário, ficha técnica, campos ou formato de resposta: aqui a resposta é o JSON pedido.

${STANDARD_EXCERPT}`;

export interface ScriptInput {
  file: { kind: 'pdf'; name: string; data: string } | { kind: 'text'; name: string; text: string };
  description: string;
  format: MontagemFormat | 'auto';
  title: string;
  maxSeconds: number;
}

export interface ScriptOutline {
  titulo: string;
  objetivo: string;
  formato: MontagemFormat;
  bibliaVisual: string;
  cenas: { titulo: string; texto: string; duracao: number }[];
  observacoes: string;
}

/** Valida o pedido vindo do navegador. */
export function parseScriptInput(body: any, maxSeconds: number): ScriptInput {
  const raw = body?.file;
  const name = typeof raw?.name === 'string' ? raw.name.slice(0, 120) : 'roteiro';
  let file: ScriptInput['file'];
  if (raw?.kind === 'pdf') {
    const data = typeof raw.data === 'string' ? raw.data : '';
    if (!/^[A-Za-z0-9+/=]+$/.test(data) || !data.startsWith('JVBER')) throw new HttpError(400, 'bad_pdf', 'Esse PDF não pôde ser lido. Envie de novo.');
    if (data.length > Math.ceil(SCRIPT_PDF_MAX_BYTES / 3) * 4 + 8) throw new HttpError(400, 'pdf_too_large', 'O PDF passa de 3 MB. Exporte sem imagens ou envie em DOCX.');
    file = { kind: 'pdf', name, data };
  } else if (raw?.kind === 'text') {
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (text.length < 20) throw new HttpError(400, 'empty_script', 'Não encontramos texto nesse arquivo.');
    if (text.length > SCRIPT_TEXT_MAX) throw new HttpError(400, 'script_too_long', 'O roteiro é longo demais (mais de 60 mil caracteres). Divida em partes.');
    file = { kind: 'text', name, text };
  } else {
    throw new HttpError(400, 'missing_script', 'Envie o roteiro em PDF, DOCX, TXT ou MD.');
  }
  const format = FORMATS.some(f => f.id === body?.format) ? body.format as MontagemFormat : 'auto';
  return {
    file,
    format,
    description: typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : '',
    title: typeof body?.title === 'string' ? body.title.trim().slice(0, 80) : '',
    maxSeconds,
  };
}

async function streamJson<T>(params: { system: string; schema: object; content: Anthropic.Beta.BetaContentBlockParam[]; maxTokens: number; effort: 'low' | 'medium' }, onText?: (text: string) => void): Promise<T> {
  const stream = anthropicClient().beta.messages.stream({
    model: AI_MODELS.anthropicMain,
    max_tokens: params.maxTokens,
    output_config: { effort: params.effort, format: { type: 'json_schema', schema: params.schema as any } },
    // O sistema é igual em todo uso: em cache, a leitura custa 10% do preço.
    system: [{ type: 'text', text: params.system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: params.content }],
  });
  if (onText) stream.on('text', onText);
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') throw new HttpError(422, 'refused', 'A IA não pôde trabalhar com esse roteiro. Revise o conteúdo e tente de novo.');
  if (final.stop_reason === 'max_tokens') throw new HttpError(502, 'truncated', 'A resposta ficou longa demais e foi cortada. Divida o roteiro em partes.');
  const block = final.content.find(b => b.type === 'text');
  if (!block || block.type !== 'text') throw new HttpError(502, 'script_failed', 'A IA não respondeu. Tente de novo.');
  return JSON.parse(block.text) as T;
}

/** Etapa 1: lê o documento e devolve as cenas e a bíblia visual (sem os prompts). */
export function runScriptOutline(input: ScriptInput, onText: (text: string) => void) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.file.kind === 'pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.file.data }, title: input.file.name });
  } else {
    content.push({ type: 'text', text: `ROTEIRO (arquivo "${input.file.name}"):\n\n${input.file.text}` });
  }
  content.push({
    type: 'text',
    text: [
      `Formato do projeto: ${input.format}`,
      `Duração máxima do vídeo final: ${input.maxSeconds} s`,
      `Título sugerido pelo criador: ${input.title || '(nenhum: crie um)'}`,
      '',
      'Descritivo do criador (direção, personagens, estilo, público):',
      input.description || '(nenhum)',
    ].join('\n'),
  });
  return streamJson<ScriptOutline>({ system: SYSTEM_OUTLINE, schema: OUTLINE_SCHEMA, content, maxTokens: 8000, effort: 'low' }, onText);
}

export interface PromptScene { id: string; title: string; text: string; targetSeconds: number }

/** Etapa 2: prompts de frame e movimento de poucas cenas (com as vizinhas como contexto). */
export async function writeScenePrompts(project: { title: string; goal: string; format: MontagemFormat; styleBible: string }, all: PromptScene[], ids: string[]) {
  const pos = (id: string) => all.findIndex(s => s.id === id);
  const describe = (s: PromptScene | undefined, i: number) => (s ? `Cena ${i + 1} (${s.targetSeconds || 5} s): ${s.title}. ${s.text}` : null);
  const blocks = ids.map(id => {
    const i = pos(id);
    return [
      `### id: ${id}`,
      describe(all[i], i),
      all[i - 1] ? `Antes: ${describe(all[i - 1], i - 1)}` : 'Antes: (início do vídeo)',
      all[i + 1] ? `Depois: ${describe(all[i + 1], i + 1)}` : 'Depois: (fim do vídeo)',
    ].join('\n');
  });
  const text = [
    `Projeto: ${project.title}${project.goal ? ` — objetivo: ${project.goal}` : ''}`,
    `Formato: ${project.format}`,
    '',
    'BÍBLIA VISUAL:',
    project.styleBible || '(não definida: mantenha personagens e estilo coerentes entre as cenas)',
    '',
    'CENAS PARA ESCREVER:',
    blocks.join('\n\n'),
  ].join('\n');
  const out = await streamJson<{ cenas: { id: string; promptFrame: string; promptMovimento: string }[] }>(
    { system: SYSTEM_PROMPTS, schema: PROMPTS_SCHEMA, content: [{ type: 'text', text }], maxTokens: 8000, effort: 'medium' });
  return out.cenas || [];
}
