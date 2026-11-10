import { anthropicClient } from '@/lib/server/ai';
import { claudeCostUsd } from '@/lib/server/aiCost';
import { HttpError } from '@/lib/server/auth';
import Anthropic from '@anthropic-ai/sdk';
import { CLIP_MOTIONS, MONTAGEM_FPS, ProjectAsset, TEXT_ANIMS, TEXT_MAX, TRANSITIONS, VideoProject, assetLetterings, isUploadId } from '@/lib/montagem';
import { BRAND_FONTS, BrandKit, LETTERING_ROLES } from '@/lib/brand';
import type { ProjectClip } from './projects';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['clips', 'endCard', 'resumo'],
  properties: {
    clips: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['jobId', 'inicio', 'fim', 'transicao', 'movimento', 'texto', 'posicaoTexto', 'animacaoTexto', 'letteringId', 'posicaoLettering', 'tamanhoLettering'],
        properties: {
          jobId: { type: 'string', description: 'Id exato de um dos clipes recebidos.' },
          inicio: { type: 'number', description: 'Segundo inicial do corte dentro do clipe.' },
          fim: { type: 'number', description: 'Segundo final do corte dentro do clipe.' },
          transicao: { type: 'string', enum: TRANSITIONS.map(t => t.id) },
          movimento: { type: 'string', enum: CLIP_MOTIONS.map(m => m.id) },
          animacaoTexto: { type: 'string', enum: TEXT_ANIMS.map(a => a.id) },
          texto: { type: 'string', description: `Texto curto na tela (até ${TEXT_MAX} caracteres) ou vazio.` },
          posicaoTexto: { type: 'string', enum: ['top', 'center', 'bottom'] },
          letteringId: { type: 'string', description: 'Id exato de um lettering da ID Visual, ou vazio.' },
          posicaoLettering: { type: 'string', enum: ['top', 'center', 'bottom'] },
          tamanhoLettering: { type: 'string', enum: ['s', 'm', 'l'] },
        },
      },
    },
    endCard: {
      type: 'object',
      additionalProperties: false,
      required: ['enabled', 'title', 'subtitle', 'letteringId'],
      properties: { enabled: { type: 'boolean' }, title: { type: 'string' }, subtitle: { type: 'string' }, letteringId: { type: 'string', description: 'Id exato de um lettering da ID Visual (ex.: o logo), ou vazio.' } },
    },
    resumo: { type: 'string', description: 'Uma ou duas frases explicando as escolhas da montagem.' },
  },
} as const;

const SYSTEM = () => `Você é diretor de montagem de vídeos curtos para criadores de conteúdo.
Você recebe o roteiro dividido em cenas e os clipes de vídeo já gerados para cada cena, com a duração real de cada um.
Pode vir também "seusVideos": vídeos que o criador enviou (takes gravados ou prontos), com nome e descrição.
Projetos só de edição não têm roteiro: monte com esses vídeos.
Você VÊ cada clipe por uma folha de 6 quadros em ordem, com o segundo de cada quadro. Use os quadros para decidir:
onde cortar (fuja de trecho parado, deformado, borrado ou fora do assunto), que movimento aplicar (plano parado pede
zoom ou pan; plano já em movimento, "none") e onde pôr texto e lettering sem cobrir rosto nem o assunto principal.
Monte o primeiro corte. Regras:
- Use apenas os jobId recebidos, exatamente como estão. Pode deixar clipes de fora se não servirem.
- Siga a ordem do roteiro, a não ser que trazer uma cena para o início crie um gancho claramente melhor.
- Cortes dentro da duração de cada clipe; cada trecho com pelo menos 0,6 s. Corte o começo e o fim parados quando o clipe for longo para a cena.
- Respeite a duração alvo de cada cena quando houver e a duração máxima total informada.
- Transições (entrada de cada clipe): ${TRANSITIONS.map(t => `"${t.id}" = ${t.hint}`).join('; ')}.
  Corte seco é a base; use as outras só onde a mudança pede, no máximo 2 ou 3 tipos por vídeo.
- Movimento (zoom/pan sobre o clipe): ${CLIP_MOTIONS.map(m => `"${m.id}" = ${m.hint}`).join('; ')}.
  Varie entre clipes vizinhos; plano já com câmera em movimento costuma ficar melhor com "none".
- Animação do texto: ${TEXT_ANIMS.map(a => `"${a.id}" = ${a.hint}`).join('; ')}.
- Texto na tela: curto, em português do Brasil, só quando ajudar (gancho na 1ª cena, ideia-chave, chamada). Vazio no resto. Sem emojis: a fonte do vídeo não tem.
- endCard: ative só se o objetivo pedir chamada final (seguir, comprar, comentar); título até 6 palavras.
- Nunca invente fatos, preços ou promessas que não estejam no roteiro.
- Em "seusVideos", leia a descrição e as miniaturas para entender cada take. Sem roteiro, ordene pela descrição do criador
  e pela direção de edição; na dúvida, mantenha a ordem de envio. O áudio original deles é mantido: não corte no meio
  de uma fala descrita, e prefira cortes nas partes paradas do começo e do fim.
Se vier "direcaoDeEdicao", ela é a direção do criador: siga ritmo, tom, uso de texto, transições e chamada final como ele pediu,
dentro das regras acima (clipes recebidos, cortes válidos, duração máxima). Ela não muda o formato da resposta.
No resumo, diga em uma frase como a direção foi aplicada.
Se vier "idVisual", ela é a identidade do vídeo. "artesDoVideo" são letterings e logos enviados para este vídeo específico
(valem como letterings, e têm prioridade sobre os da idVisual quando disserem a mesma coisa). Você recebe a imagem de cada um, identificada pelo id:
- Use apenas os letterings recebidos (idVisual ou artesDoVideo), pelo id exato. Sem lettering adequado, deixe letteringId vazio.
- O lettering é uma arte pronta: as palavras dele não mudam. Só use onde o que ele diz combina com a cena; nunca force.
- Prefira o lettering ao texto comum quando os dois disserem a mesma coisa, e não repita a frase em "texto".
- Respeite a função de cada um: gancho no início, título na ideia central, chamada no fim. O logo pode ir na chamada final (endCard.letteringId).
- tamanhoLettering: "s" para logo discreto, "m" para o normal, "l" para gancho de impacto. Não ponha lettering e texto na mesma posição.
- Use com critério: um vídeo não precisa de lettering em toda cena.`;

export interface AutoEditResult {
  clips: { jobId: string; trimStart: number; trimEnd: number; transition: string; motion: string; textAnim: string; text: string; textPosition: string; muted: boolean; letteringId: string; letteringPosition: string; letteringSize: string }[];
  endCard: { enabled: boolean; title: string; subtitle: string; letteringId: string };
  resumo: string;
}

/** Modelo e esforço da montagem (trocáveis por variável de ambiente, sem deploy de código). */
const EDIT_MODEL = process.env.ANTHROPIC_MODEL_EDIT || 'claude-opus-5-5';
const EDIT_EFFORT = (process.env.ANTHROPIC_EDIT_EFFORT || 'medium') as 'low' | 'medium' | 'high';
/** Teto de imagens por pedido: cada uma soma tempo e custo. */
const MAX_IMAGES = 60;

const REVIEW = (draft: string) => `Agora revise o seu rascunho abaixo como editor sênior, olhando de novo os quadros de cada clipe:
1. Os 2 primeiros segundos prendem a atenção? Se não, troque o clipe de abertura, o corte ou o texto.
2. Cada corte começa e termina num bom quadro (sem trecho parado, deformado, borrado ou fora do assunto)?
3. O ritmo combina com o formato e com a direção de edição (clipes curtos em Reels; mais respiro em tom cinematográfico)?
4. Movimentos e transições variam sem exagero e fazem sentido para cada plano?
5. Texto curto, sem repetir o que o lettering já diz, e numa posição que não cobre rosto nem o assunto principal?
6. Duração total dentro do máximo, e a chamada final coerente com o objetivo?
Corrija o que for preciso e devolva o plano final completo, no mesmo formato. No resumo, diga em uma frase como a direção foi
aplicada e o que a revisão mudou.

Rascunho:
${draft}`;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

/**
 * Baixa as imagens aqui e manda embutidas: o download feito pela API às vezes estoura o tempo
 * ("The request timed out while trying to download the file"). Se o download falhar, a imagem segue como link.
 */
async function inlineImages(content: Anthropic.Beta.BetaContentBlockParam[]) {
  await Promise.all(content.map(async (block, i) => {
    if (block.type !== 'image' || block.source.type !== 'url') return;
    try {
      const res = await fetch(block.source.url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const type = (res.headers.get('content-type') || '').split(';')[0] as typeof IMAGE_TYPES[number];
      if (!IMAGE_TYPES.includes(type)) return;
      const data = Buffer.from(await res.arrayBuffer());
      if (data.length > 3.5 * 1024 * 1024) return;
      content[i] = { type: 'image', source: { type: 'base64', media_type: type, data: data.toString('base64') } };
    } catch { /* segue como link */ }
  }));
}

export interface AutoEditRun {
  result: AutoEditResult;
  model: string;
  usd: number;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
  images: number;
  ms: number;
}

/**
 * Montagem com o Claude em duas passadas (rascunho e revisão), vendo uma folha de quadros de cada clipe.
 * O material (imagens e projeto) fica em cache entre as passadas: a revisão paga só uma fração da leitura.
 * Devolve o plano em frames (o servidor valida depois) e o custo real das duas chamadas.
 */
export async function autoEdit(project: VideoProject, clips: ProjectClip[], maxSeconds: number, direction = '', brand: BrandKit | null = null,
  assets: ProjectAsset[] = [], onStage: (stage: string) => void = () => {}): Promise<AutoEditRun> {
  const t0 = Date.now();
  const artes = assetLetterings(assets).slice(0, 20);
  const seconds = (c: ProjectClip) => Math.round((c.sourceFrames / MONTAGEM_FPS) * 10) / 10;
  const byScene = project.scenes.map((s, i) => ({
    cena: i + 1,
    sceneId: s.id,
    titulo: s.title,
    texto: s.text,
    papel: s.brief || null,
    duracaoAlvo: s.targetSeconds || null,
    clipes: clips
      .filter(c => c.sceneId === s.id)
      .sort((a, b) => (a.jobId === s.clipJobId ? -1 : b.jobId === s.clipJobId ? 1 : b.createdAt.localeCompare(a.createdAt)))
      .map(c => ({ jobId: c.jobId, duracao: seconds(c), escolhidoPeloUsuario: c.jobId === s.clipJobId, prompt: c.prompt.slice(0, 300) })),
  }));
  const soltos = clips.filter(c => !c.upload && (!c.sceneId || !project.scenes.some(s => s.id === c.sceneId)))
    .map(c => ({ jobId: c.jobId, duracao: seconds(c), prompt: c.prompt.slice(0, 300) }));
  const enviados = clips.filter(c => c.upload);
  const seusVideos = enviados.map(c => ({ jobId: c.jobId, nome: c.upload!.name, duracao: seconds(c), descricao: c.prompt || null }));

  const payload = {
    titulo: project.title,
    objetivo: project.goal || null,
    direcaoDeEdicao: direction || null,
    formato: project.format,
    duracaoMaximaSegundos: maxSeconds,
    cenas: byScene,
    clipesSemCena: soltos,
    seusVideos,
    idVisual: brand ? {
      nome: brand.name,
      cores: brand.colors,
      fonteDoTexto: BRAND_FONTS.find(f => f.id === brand.textStyle.fontId)?.label,
      letterings: brand.letterings.map(l => ({ id: l.id, nome: l.name, funcao: LETTERING_ROLES.find(r => r.id === l.role)?.label, texto: l.text || null, proporcao: Math.round((l.width / l.height) * 100) / 100 })),
    } : null,
    artesDoVideo: artes.length ? artes.map(l => ({ id: l.id, nome: l.name, funcao: LETTERING_ROLES.find(r => r.id === l.role)?.label, texto: l.text || null, proporcao: Math.round((l.width / l.height) * 100) / 100 })) : null,
  };

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  let images = 0;
  const pushImage = (label: string, url: string) => {
    if (images >= MAX_IMAGES) return;
    content.push({ type: 'text', text: label });
    content.push({ type: 'image', source: { type: 'url', url } });
    images++;
  };
  // Clipes primeiro: a folha de quadros mostra 6 momentos em ordem, com o segundo de cada um.
  // Prioridade: a versão escolhida (ou mais nova) de cada cena e os vídeos enviados; versões extras sem folha.
  const priority = new Set<string>([
    ...byScene.map(s => s.clipes[0]?.jobId).filter(Boolean) as string[],
    ...enviados.map(c => c.jobId),
  ]);
  for (const c of [...clips].sort((a, b) => Number(priority.has(b.jobId)) - Number(priority.has(a.jobId)))) {
    const label = c.upload ? `vídeo enviado "${c.upload.name}"` : `cena ${project.scenes.findIndex(s => s.id === c.sceneId) + 1 || '?'}`;
    if (c.sheet) pushImage(`Clipe ${c.jobId} (${label}, ${seconds(c)} s): 6 quadros em ordem, com o segundo de cada um.`, c.sheet);
    else if (c.upload?.thumbs.length) c.upload.thumbs.forEach((u, i) => pushImage(`Clipe ${c.jobId} (${label}), quadro ${i + 1} de ${c.upload!.thumbs.length}:`, u));
  }
  // Cada lettering vai como imagem, precedido do id: o Claude escolhe olhando a arte, não só o nome.
  for (const l of [...(brand?.letterings || []), ...artes]) pushImage(`Lettering ${l.id}:`, l.url);
  content.push({ type: 'text', text: `Projeto:\n${JSON.stringify(payload, null, 1)}`, cache_control: { type: 'ephemeral' } });
  await inlineImages(content);

  const client = anthropicClient();
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let usd = 0;
  let model = EDIT_MODEL;
  const run = async (extra: string | null) => {
    const stream = client.beta.messages.stream({
      model: EDIT_MODEL,
      max_tokens: 16000,
      output_config: { effort: EDIT_EFFORT, format: { type: 'json_schema', schema: SCHEMA } },
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      system: [{ type: 'text', text: SYSTEM(), cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: extra ? [...content, { type: 'text', text: extra }] : content }],
    });
    const final = await stream.finalMessage();
    model = final.model;
    const u = final.usage;
    usage.input += u.input_tokens; usage.output += u.output_tokens;
    usage.cacheRead += u.cache_read_input_tokens || 0; usage.cacheWrite += u.cache_creation_input_tokens || 0;
    usd += claudeCostUsd(final.model, u);
    if (final.stop_reason === 'refusal') throw new HttpError(422, 'auto_edit_refused', 'A IA não pôde montar este vídeo. Revise os textos e tente de novo.');
    if (final.stop_reason === 'max_tokens') throw new HttpError(502, 'auto_edit_truncated', 'A montagem ficou longa demais. Tente com menos clipes.');
    const text = final.content.find(b => b.type === 'text');
    if (!text || text.type !== 'text') throw new HttpError(502, 'auto_edit_failed', 'Não foi possível montar com IA agora. Tente de novo.');
    return text.text;
  };

  onStage('Montando o primeiro corte');
  const draft = await run(null);
  onStage('Revisando o corte');
  let out: any;
  try {
    out = JSON.parse(await run(REVIEW(draft)));
  } catch (e) {
    // A revisão falhou: o rascunho já é um plano válido.
    if (e instanceof HttpError && e.code === 'auto_edit_refused') throw e;
    console.error('[montagem] revisão falhou, usando o rascunho', (e as Error)?.message);
    out = JSON.parse(draft);
  }

  const result: AutoEditResult = {
    clips: (out.clips || []).map((c: any) => ({
      jobId: String(c.jobId),
      trimStart: Math.round(Number(c.inicio || 0) * MONTAGEM_FPS),
      trimEnd: Math.round(Number(c.fim || 0) * MONTAGEM_FPS),
      transition: c.transicao,
      motion: c.movimento,
      textAnim: c.animacaoTexto,
      text: c.texto || '',
      textPosition: c.posicaoTexto,
      // Clipes gerados entram mudos; vídeos enviados mantêm o áudio original (fala, ambiente).
      muted: !isUploadId(String(c.jobId)),
      letteringId: String(c.letteringId || ''),
      letteringPosition: c.posicaoLettering,
      letteringSize: c.tamanhoLettering,
    })),
    endCard: out.endCard,
    resumo: String(out.resumo || ''),
  };
  return { result, model, usd: Math.round(usd * 10000) / 10000, usage, images, ms: Date.now() - t0 };
}
