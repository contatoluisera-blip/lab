// ─────────────────────────────────────────────────────────────
// Montagem de vídeo — tipos e regras compartilhadas
//
// O Projeto de vídeo liga as abas de produção: cada cena guarda o prompt do frame,
// o prompt do movimento, o frame e a cena escolhidos. A Montagem transforma as cenas
// prontas num plano de edição (Edl), que a prévia (navegador) e o render (AWS Lambda)
// desenham com a mesma composição (src/remotion/Montagem.tsx).
//
// O plano é só dados: tempo em frames a 30 fps, clipes citados pelo id da geração
// (nunca por URL). O servidor valida tudo de novo com `sanitizeEdl` antes de renderizar.
// ─────────────────────────────────────────────────────────────

import type { PlanId } from './planConfig';

export const MONTAGEM_FPS = 30;
export const TRANSITION_FRAMES = 12;
export const END_CARD_FRAMES = 2 * MONTAGEM_FPS;
export const MIN_CLIP_FRAMES = 15;
export const MAX_CLIPS = 30;
export const MAX_SCENES = 20;
export const TEXT_MAX = 120;
export const DIRECTION_MAX = 600;

export type MontagemFormat = '9:16' | '4:5' | '16:9';
export const FORMATS: { id: MontagemFormat; label: string; hint: string; width: number; height: number }[] = [
  { id: '9:16', label: 'Vertical 9:16', hint: 'Reels, TikTok, Shorts', width: 1080, height: 1920 },
  { id: '4:5', label: 'Feed 4:5', hint: 'Feed do Instagram', width: 1080, height: 1350 },
  { id: '16:9', label: 'Horizontal 16:9', hint: 'YouTube, apresentações', width: 1920, height: 1080 },
];
export const formatSize = (f: MontagemFormat) => FORMATS.find(x => x.id === f) || FORMATS[0];

/** Duração máxima do vídeo final por plano. */
export const MONTAGEM_MAX_SECONDS: Record<PlanId, number> = { start: 60, pro: 120, elite: 180 };

/** 2 créditos até 60 s, +1 a cada 30 s (custo real estimado: US$ 0,10 a 0,25 por minuto). */
export function montagemCost(frames: number) {
  const seconds = Math.ceil(frames / MONTAGEM_FPS);
  return seconds <= 60 ? 2 : 2 + Math.ceil((seconds - 60) / 30);
}

// ── Projeto ──────────────────────────────────────────────────────────────────
export interface ProjectScene {
  id: string;
  title: string;
  /** Fala ou descrição da cena (vem do roteiro). */
  text: string;
  targetSeconds: number;
  /** Prompt do frame (Gerar imagem) e do movimento (Gerar vídeo), salvos no Gerador de Prompts. */
  framePromptId?: string | null;
  framePrompt?: string | null;
  motionPromptId?: string | null;
  motionPrompt?: string | null;
  /** Versões escolhidas (ids de gen_jobs). */
  frameJobId?: string | null;
  clipJobId?: string | null;
}

export interface VideoProject {
  id: string;
  uid: string;
  title: string;
  goal: string;
  format: MontagemFormat;
  scenes: ProjectScene[];
  edl: Edl | null;
  /** Direção geral de edição para o Claude (ritmo, tom, texto na tela...). */
  editDirection?: string;
  /** Personagens, cenário e estilo fixos (em inglês), repetidos nos prompts para manter as cenas coerentes. */
  styleBible?: string;
  /** Documento de onde o agente de roteiro tirou as cenas. */
  scriptSource?: { name: string; kind: 'pdf' | 'text' } | null;
  /** Observações do agente sobre o fatiamento (cortes, decisões). */
  scriptNotes?: string;
  /** Storyboard (frames em ordem) aprovado: libera a animação em lote. */
  storyboardApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Agente de roteiro ────────────────────────────────────────────────────────
/** Lê o documento, fatia em cenas e escreve os prompts de frame e movimento de cada uma. */
export const SCRIPT_AGENT_CREDITS = 4;
/** PDF de até ~3 MB (vai em base64 no corpo do pedido) e texto de até 60 mil caracteres. */
export const SCRIPT_PDF_MAX_BYTES = 3 * 1024 * 1024;
export const SCRIPT_TEXT_MAX = 60_000;
/** Marca, dentro do stream, o fim com o projeto criado: `\u0000DONE:{"projectId":...}`. */
export const SCRIPT_DONE_MARK = '\u0000DONE:';

/** Endereço de uma aba de produção dentro do projeto (o contexto sobrevive a recarregar). */
export function projectHref(path: string, projectId: string, sceneId?: string | null, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ ...extra, projeto: projectId });
  if (sceneId) params.set('cena', sceneId);
  return `${path}?${params.toString()}`;
}

/** Divide um roteiro em cenas: blocos separados por linha em branco ou marcados com "Cena N". */
export function scenesFromScript(script: string): Pick<ProjectScene, 'title' | 'text'>[] {
  const normalized = script.replace(/\r/g, '').trim();
  if (!normalized) return [];
  const byMarker = normalized.split(/\n(?=\s*(?:cena|scene)\s*\d+)/i);
  const blocks = byMarker.length > 1 ? byMarker : normalized.split(/\n\s*\n/);
  return blocks
    .map(b => b.trim())
    .filter(Boolean)
    .slice(0, MAX_SCENES)
    .map((b, i) => {
      const [first, ...rest] = b.split('\n');
      const marker = first.match(/^\s*(?:cena|scene)\s*\d+\s*[:\-–.]?\s*(.*)$/i);
      if (marker) return { title: marker[1]?.trim() || `Cena ${i + 1}`, text: rest.join('\n').trim() || marker[1]?.trim() || '' };
      return { title: `Cena ${i + 1}`, text: b };
    });
}

// ── Plano de edição ──────────────────────────────────────────────────────────
export type TransitionKind = 'cut' | 'fade' | 'slide';
export const TRANSITIONS: { id: TransitionKind; label: string }[] = [
  { id: 'cut', label: 'Corte seco' },
  { id: 'fade', label: 'Dissolver' },
  { id: 'slide', label: 'Deslizar' },
];
export type TextPosition = 'top' | 'center' | 'bottom';

export interface EdlClip {
  /** Id único dentro do plano (o mesmo clipe pode entrar duas vezes). */
  id: string;
  /** Geração de vídeo (gen_jobs) de onde vem o clipe. */
  jobId: string;
  sceneId: string | null;
  /** Duração do arquivo, em frames (lida da geração). */
  sourceFrames: number;
  /** Corte: frame inicial (incluído) e final (excluído) dentro do arquivo. */
  trimStart: number;
  trimEnd: number;
  muted: boolean;
  /** Transição de entrada (ignorada no primeiro clipe). */
  transition: TransitionKind;
  text: string;
  textPosition: TextPosition;
}

export interface Edl {
  version: 1;
  format: MontagemFormat;
  fps: typeof MONTAGEM_FPS;
  clips: EdlClip[];
  endCard: { enabled: boolean; title: string; subtitle: string };
}

export function emptyEdl(format: MontagemFormat): Edl {
  return { version: 1, format, fps: MONTAGEM_FPS, clips: [], endCard: { enabled: false, title: '', subtitle: '' } };
}

export const clipFrames = (c: EdlClip) => c.trimEnd - c.trimStart;

/** Frames de transição que entram antes do clipe `i` (sobreposição com o anterior). */
export function transitionFramesAt(edl: Edl, i: number) {
  if (i === 0) return 0;
  const c = edl.clips[i];
  if (c.transition === 'cut') return 0;
  return Math.min(TRANSITION_FRAMES, Math.floor(clipFrames(c) / 2), Math.floor(clipFrames(edl.clips[i - 1]) / 2));
}

export function edlDurationFrames(edl: Edl) {
  let total = 0;
  edl.clips.forEach((c, i) => { total += clipFrames(c) - transitionFramesAt(edl, i); });
  if (edl.endCard.enabled) total += END_CARD_FRAMES;
  return Math.max(1, total);
}

/** Duração de um vídeo gerado, em frames, com margem para o arquivo não acabar antes do corte. */
export function sourceFramesFor(durationSeconds: number | undefined) {
  return Math.max(MIN_CLIP_FRAMES, Math.floor((durationSeconds || 5) * MONTAGEM_FPS) - 2);
}

export interface AllowedClip {
  sourceFrames: number;
  sceneId: string | null;
}

const clampInt = (v: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
const cleanText = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, TEXT_MAX) : '');

/**
 * Valida e normaliza um plano vindo do navegador ou do Claude.
 * Só aceita clipes da lista permitida (gerações concluídas do próprio projeto);
 * cortes ficam dentro da duração do arquivo. Lança Error com mensagem em português.
 */
export function sanitizeEdl(raw: any, format: MontagemFormat, allowed: Record<string, AllowedClip>, maxFrames: number): Edl {
  const list: any[] = Array.isArray(raw?.clips) ? raw.clips : [];
  if (!list.length) throw new Error('Coloque pelo menos uma cena na linha do tempo.');
  if (list.length > MAX_CLIPS) throw new Error(`A montagem aceita até ${MAX_CLIPS} clipes.`);
  const seen = new Set<string>();
  const clips: EdlClip[] = list.map((c, i) => {
    const jobId = String(c?.jobId || '');
    const source = allowed[jobId];
    if (!source) throw new Error('Uma das cenas da linha do tempo não está mais disponível. Remova e adicione de novo.');
    let id = String(c?.id || '').slice(0, 40) || `c${i}`;
    if (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);
    const trimStart = clampInt(c?.trimStart, 0, source.sourceFrames - MIN_CLIP_FRAMES);
    const trimEnd = clampInt(c?.trimEnd ?? source.sourceFrames, trimStart + MIN_CLIP_FRAMES, source.sourceFrames);
    const transition: TransitionKind = TRANSITIONS.some(t => t.id === c?.transition) ? c.transition : 'cut';
    const textPosition: TextPosition = ['top', 'center', 'bottom'].includes(c?.textPosition) ? c.textPosition : 'bottom';
    return {
      id, jobId, sceneId: source.sceneId, sourceFrames: source.sourceFrames,
      trimStart, trimEnd, muted: c?.muted !== false, transition, text: cleanText(c?.text), textPosition,
    };
  });
  const endCard = {
    enabled: !!raw?.endCard?.enabled,
    title: cleanText(raw?.endCard?.title),
    subtitle: cleanText(raw?.endCard?.subtitle),
  };
  const edl: Edl = { version: 1, format, fps: MONTAGEM_FPS, clips, endCard };
  const frames = edlDurationFrames(edl);
  if (frames > maxFrames) {
    throw new Error(`O vídeo tem ${Math.ceil(frames / MONTAGEM_FPS)} s e o seu plano permite até ${Math.floor(maxFrames / MONTAGEM_FPS)} s. Corte algumas cenas.`);
  }
  return edl;
}

/** Textos do plano, para passar pela moderação. */
export const edlTexts = (edl: Edl) => [...edl.clips.map(c => c.text), edl.endCard.title, edl.endCard.subtitle].filter(Boolean).join('\n');

// ── Render ───────────────────────────────────────────────────────────────────
export type RenderStatus = 'queued' | 'starting' | 'rendering' | 'finalizing' | 'completed' | 'failed';
export const RENDER_STATUS_LABEL: Record<RenderStatus, string> = {
  queued: 'Na fila',
  starting: 'Iniciando',
  rendering: 'Renderizando',
  finalizing: 'Salvando',
  completed: 'Pronto',
  failed: 'Falhou',
};

export interface RenderJob {
  id: string;
  uid: string;
  projectId: string;
  projectTitle: string;
  status: RenderStatus;
  active: boolean;
  credits: number;
  durationFrames: number;
  format: MontagemFormat;
  progress?: number;
  outputUrl?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
