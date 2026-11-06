import { AI_MODELS, anthropicClient } from '@/lib/server/ai';
import { HttpError } from '@/lib/server/auth';
import { MONTAGEM_FPS, TEXT_MAX, VideoProject } from '@/lib/montagem';
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
        required: ['jobId', 'inicio', 'fim', 'transicao', 'texto', 'posicaoTexto'],
        properties: {
          jobId: { type: 'string', description: 'Id exato de um dos clipes recebidos.' },
          inicio: { type: 'number', description: 'Segundo inicial do corte dentro do clipe.' },
          fim: { type: 'number', description: 'Segundo final do corte dentro do clipe.' },
          transicao: { type: 'string', enum: ['cut', 'fade', 'slide'] },
          texto: { type: 'string', description: `Texto curto na tela (até ${TEXT_MAX} caracteres) ou vazio.` },
          posicaoTexto: { type: 'string', enum: ['top', 'center', 'bottom'] },
        },
      },
    },
    endCard: {
      type: 'object',
      additionalProperties: false,
      required: ['enabled', 'title', 'subtitle'],
      properties: { enabled: { type: 'boolean' }, title: { type: 'string' }, subtitle: { type: 'string' } },
    },
    resumo: { type: 'string', description: 'Uma ou duas frases explicando as escolhas da montagem.' },
  },
} as const;

const SYSTEM = `Você é diretor de montagem de vídeos curtos para criadores de conteúdo.
Você recebe o roteiro dividido em cenas e os clipes de vídeo já gerados para cada cena, com a duração real de cada um.
Monte o primeiro corte. Regras:
- Use apenas os jobId recebidos, exatamente como estão. Pode deixar clipes de fora se não servirem.
- Siga a ordem do roteiro, a não ser que trazer uma cena para o início crie um gancho claramente melhor.
- Cortes dentro da duração de cada clipe; cada trecho com pelo menos 0,6 s. Corte o começo e o fim parados quando o clipe for longo para a cena.
- Respeite a duração alvo de cada cena quando houver e a duração máxima total informada.
- Transições: "cut" por padrão (ritmo de Reels); "fade" para mudança de tempo ou lugar; "slide" com moderação.
- Texto na tela: curto, em português do Brasil, só quando ajudar (gancho na 1ª cena, ideia-chave, chamada). Vazio no resto.
- endCard: ative só se o objetivo pedir chamada final (seguir, comprar, comentar); título até 6 palavras.
- Nunca invente fatos, preços ou promessas que não estejam no roteiro.`;

export interface AutoEditResult {
  clips: { jobId: string; trimStart: number; trimEnd: number; transition: string; text: string; textPosition: string; muted: boolean }[];
  endCard: { enabled: boolean; title: string; subtitle: string };
  resumo: string;
}

/** Primeiro corte com o Claude: devolve o plano em segundos convertidos para frames (o servidor valida depois). */
export async function autoEdit(project: VideoProject, clips: ProjectClip[], maxSeconds: number): Promise<AutoEditResult> {
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
  const soltos = clips.filter(c => !c.sceneId || !project.scenes.some(s => s.id === c.sceneId))
    .map(c => ({ jobId: c.jobId, duracao: Math.round((c.sourceFrames / MONTAGEM_FPS) * 10) / 10, prompt: c.prompt.slice(0, 300) }));

  const payload = {
    titulo: project.title,
    objetivo: project.goal || null,
    formato: project.format,
    duracaoMaximaSegundos: maxSeconds,
    cenas: byScene,
    clipesSemCena: soltos,
  };

  const response = await anthropicClient().messages.create({
    model: AI_MODELS.anthropicMain,
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Projeto:\n${JSON.stringify(payload, null, 1)}` }],
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
      muted: true,
    })),
    endCard: out.endCard,
    resumo: String(out.resumo || ''),
  };
}
