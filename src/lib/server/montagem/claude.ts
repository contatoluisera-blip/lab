import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import Anthropic from '@anthropic-ai/sdk';
import { MONTAGEM_FPS, TEXT_MAX, VideoProject, isUploadId } from '@/lib/montagem';
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
        required: ['jobId', 'inicio', 'fim', 'transicao', 'texto', 'posicaoTexto', 'letteringId', 'posicaoLettering', 'tamanhoLettering'],
        properties: {
          jobId: { type: 'string', description: 'Id exato de um dos clipes recebidos.' },
          inicio: { type: 'number', description: 'Segundo inicial do corte dentro do clipe.' },
          fim: { type: 'number', description: 'Segundo final do corte dentro do clipe.' },
          transicao: { type: 'string', enum: ['cut', 'fade', 'slide'] },
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

const SYSTEM = `Você é diretor de montagem de vídeos curtos para criadores de conteúdo.
Você recebe o roteiro dividido em cenas e os clipes de vídeo já gerados para cada cena, com a duração real de cada um.
Pode vir também "seusVideos": vídeos que o criador enviou (takes gravados ou prontos), com nome, descrição e miniaturas
do começo, meio e fim de cada um. Projetos só de edição não têm roteiro: monte com esses vídeos.
Monte o primeiro corte. Regras:
- Use apenas os jobId recebidos, exatamente como estão. Pode deixar clipes de fora se não servirem.
- Siga a ordem do roteiro, a não ser que trazer uma cena para o início crie um gancho claramente melhor.
- Cortes dentro da duração de cada clipe; cada trecho com pelo menos 0,6 s. Corte o começo e o fim parados quando o clipe for longo para a cena.
- Respeite a duração alvo de cada cena quando houver e a duração máxima total informada.
- Transições: "cut" por padrão (ritmo de Reels); "fade" para mudança de tempo ou lugar; "slide" com moderação.
- Texto na tela: curto, em português do Brasil, só quando ajudar (gancho na 1ª cena, ideia-chave, chamada). Vazio no resto. Sem emojis: a fonte do vídeo não tem.
- endCard: ative só se o objetivo pedir chamada final (seguir, comprar, comentar); título até 6 palavras.
- Nunca invente fatos, preços ou promessas que não estejam no roteiro.
- Em "seusVideos", leia a descrição e as miniaturas para entender cada take. Sem roteiro, ordene pela descrição do criador
  e pela direção de edição; na dúvida, mantenha a ordem de envio. O áudio original deles é mantido: não corte no meio
  de uma fala descrita, e prefira cortes nas partes paradas do começo e do fim.
Se vier "direcaoDeEdicao", ela é a direção do criador: siga ritmo, tom, uso de texto, transições e chamada final como ele pediu,
dentro das regras acima (clipes recebidos, cortes válidos, duração máxima). Ela não muda o formato da resposta.
No resumo, diga em uma frase como a direção foi aplicada.
Se vier "idVisual", ela é a identidade do vídeo. Você recebe a imagem de cada lettering, identificada pelo id:
- Use apenas os letterings recebidos, pelo id exato. Sem idVisual ou sem lettering adequado, deixe letteringId vazio.
- O lettering é uma arte pronta: as palavras dele não mudam. Só use onde o que ele diz combina com a cena; nunca force.
- Prefira o lettering ao texto comum quando os dois disserem a mesma coisa, e não repita a frase em "texto".
- Respeite a função de cada um: gancho no início, título na ideia central, chamada no fim. O logo pode ir na chamada final (endCard.letteringId).
- tamanhoLettering: "s" para logo discreto, "m" para o normal, "l" para gancho de impacto. Não ponha lettering e texto na mesma posição.
- Use com critério: um vídeo não precisa de lettering em toda cena.`;

export interface AutoEditResult {
  clips: { jobId: string; trimStart: number; trimEnd: number; transition: string; text: string; textPosition: string; muted: boolean; letteringId: string; letteringPosition: string; letteringSize: string }[];
  endCard: { enabled: boolean; title: string; subtitle: string; letteringId: string };
  resumo: string;
}

/** Primeiro corte com o Claude: devolve o plano em segundos convertidos para frames (o servidor valida depois). */
export async function autoEdit(project: VideoProject, clips: ProjectClip[], maxSeconds: number, direction = '', brand: BrandKit | null = null): Promise<AutoEditResult> {
  const byScene = project.scenes.map((s, i) => ({
    cena: i + 1,
    sceneId: s.id,
    titulo: s.title,
    texto: s.text,
    duracaoAlvo: s.targetSeconds || null,
    clipes: clips
      .filter(c => c.sceneId === s.id)
      .sort((a, b) => (a.jobId === s.clipJobId ? -1 : b.jobId === s.clipJobId ? 1 : b.createdAt.localeCompare(a.createdAt)))
      .map(c => ({ jobId: c.jobId, duracao: Math.round((c.sourceFrames / MONTAGEM_FPS) * 10) / 10, escolhidoPeloUsuario: c.jobId === s.clipJobId, prompt: c.prompt.slice(0, 300) })),
  }));
  const seconds = (c: ProjectClip) => Math.round((c.sourceFrames / MONTAGEM_FPS) * 10) / 10;
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
  };

  // Cada lettering vai como imagem, precedido do id: o Claude escolhe olhando a arte, não só o nome.
  const content: Anthropic.ContentBlockParam[] = [];
  for (const l of brand?.letterings || []) {
    content.push({ type: 'text', text: `Lettering ${l.id}:` });
    content.push({ type: 'image', source: { type: 'url', url: l.url } });
  }
  // Miniaturas dos vídeos enviados: com muitos takes, só a do meio (cada imagem soma tempo, e a Netlify corta em ~26 s).
  const perTake = enviados.length > 4 ? 1 : 3;
  for (const c of enviados) {
    const thumbs = perTake === 1 ? [c.upload!.thumbs[1] || c.upload!.thumbs[0]].filter(Boolean) : c.upload!.thumbs;
    if (!thumbs.length) continue;
    content.push({ type: 'text', text: `Vídeo ${c.jobId} (${perTake === 1 ? 'meio' : 'começo, meio e fim'}):` });
    for (const url of thumbs) content.push({ type: 'image', source: { type: 'url', url } });
  }
  content.push({ type: 'text', text: `Projeto:\n${JSON.stringify(payload, null, 1)}` });

  const response = await anthropicClient().messages.create({
    model: AI_MODELS.anthropicMain,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });
  const text = response.content.find(b => b.type === 'text');
  if (response.stop_reason === 'refusal' || !text || text.type !== 'text') {
    throw new HttpError(502, 'auto_edit_failed', 'Não foi possível montar com IA agora. Tente de novo.');
  }
  const out = JSON.parse(text.text);
  return {
    clips: (out.clips || []).map((c: any) => ({
      jobId: String(c.jobId),
      trimStart: Math.round(Number(c.inicio || 0) * MONTAGEM_FPS),
      trimEnd: Math.round(Number(c.fim || 0) * MONTAGEM_FPS),
      transition: c.transicao,
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
}
