// ─────────────────────────────────────────────────────────────
// Hub de Referências — tipos e regras compartilhadas (tela + servidor)
// Os vídeos NÃO são hospedados aqui: guardamos só os dados, a miniatura
// e a análise da IA; o vídeo toca pelo embed oficial do Instagram.
// ─────────────────────────────────────────────────────────────

export const HUB_FORMATS = [
  'Talking head', 'Tutorial / passo a passo', 'POV', 'Trend / áudio em alta', 'Bastidores',
  'Antes e depois', 'Storytelling', 'Humor / esquete', 'Review / unboxing', 'Lista de dicas', 'Vlog', 'Outro',
] as const;

export const HUB_HOOKS = [
  'Pergunta', 'Promessa de resultado', 'Opinião forte / polêmica', 'Curiosidade', 'Erro comum',
  'Visual impactante', 'Identificação', 'Contraintuitivo', 'Outro',
] as const;

/** Nichos e hashtags sugeridos para a primeira carga (editáveis no /admin). */
export const HUB_SUGGESTED_SOURCES: { nicho: string; type: 'hashtag' | 'profile'; value: string }[] = [
  { nicho: 'Criadores de conteúdo', type: 'hashtag', value: 'criadordeconteudo' },
  { nicho: 'Criadores de conteúdo', type: 'hashtag', value: 'dicasdeinstagram' },
  { nicho: 'Gastronomia', type: 'hashtag', value: 'receitasfaceis' },
  { nicho: 'Gastronomia', type: 'hashtag', value: 'gastronomia' },
  { nicho: 'Moda', type: 'hashtag', value: 'lookdodia' },
  { nicho: 'Beleza', type: 'hashtag', value: 'maquiagem' },
  { nicho: 'Beleza', type: 'hashtag', value: 'skincare' },
  { nicho: 'Fitness', type: 'hashtag', value: 'treino' },
  { nicho: 'Negócios locais', type: 'hashtag', value: 'empreendedorismo' },
  { nicho: 'Negócios locais', type: 'hashtag', value: 'pequenosnegocios' },
  { nicho: 'Imóveis', type: 'hashtag', value: 'corretordeimoveis' },
  { nicho: 'Saúde', type: 'hashtag', value: 'nutricao' },
  { nicho: 'Saúde', type: 'hashtag', value: 'odontologia' },
  { nicho: 'Humor', type: 'hashtag', value: 'humorbrasileiro' },
  { nicho: 'Viagem', type: 'hashtag', value: 'viagem' },
  { nicho: 'Tecnologia', type: 'hashtag', value: 'tecnologia' },
];

export interface HubAI {
  nicho: string;
  tema: string;
  formato: string;
  gancho: string;
  tipoGancho: string;
  porqueFuncionou: string;
  resumoVisual: string;
  palavrasChave: string[];
  adequado: boolean;
}

/** Item compacto do catálogo que a tela carrega (hub_catalog). */
export interface HubItem {
  id: string;          // shortCode
  url: string;
  author: string;
  thumb: string;
  views: number;
  likes: number;
  comments: number;
  postedAt: string | null;
  score: number;
  nicho: string;
  tema: string;
  formato: string;
  gancho: string;
  tipoGancho: string;
  porque: string;
  resumo: string;
  kw: string[];
  caption: string;
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Nota de viralidade (0–100): alcance (views em escala log) pesa mais,
 * depois engajamento (curtidas + comentários / views) e quão recente é.
 * 10 mil views ≈ 25 · 100 mil ≈ 50 · 1 milhão ≈ 75 · 10 milhões = 100.
 */
export function viralScore(views: number, likes: number, comments: number, postedAt: string | null) {
  const v = Math.max(0, views);
  const sViews = v > 0 ? clamp(((Math.log10(v) - 3) / 4) * 100) : 0;
  const eng = v > 0 ? (Math.max(0, likes) + Math.max(0, comments)) / v : 0;
  const sEng = clamp((eng / 0.1) * 100);
  const days = postedAt ? (Date.now() - new Date(postedAt).getTime()) / 86_400_000 : 365;
  const sRec = clamp(100 - (days / 180) * 100);
  return Math.round(0.6 * sViews + 0.25 * sEng + 0.15 * sRec);
}

/** Minúsculas e sem acentos, para busca. */
export function normalizeText(s: string) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function hubSearchText(item: HubItem) {
  return normalizeText([item.author, item.nicho, item.tema, item.formato, item.gancho, item.tipoGancho, item.porque, item.resumo, item.kw.join(' '), item.caption].join(' '));
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')} mil`;
  return String(n);
}

/** Extrai o shortCode de um link de post/reel do Instagram. */
export function shortCodeFromUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/);
  return m ? m[1] : null;
}
