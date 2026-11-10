// ─────────────────────────────────────────────────────────────
// ID Visual — biblioteca da conta (coleção `brand_kits`)
//
// Cada ID Visual guarda cores, referências de cor, letterings (PNG transparente) e o estilo
// do texto que muda. O projeto de vídeo escolhe uma (`brandKitId`); a edição com Claude
// enxerga os letterings e a composição os desenha por cima do vídeo já animado.
// Este arquivo é só dados e regras: roda no navegador, no servidor e no render.
// ─────────────────────────────────────────────────────────────

export const BRAND_LIMITS = {
  name: 60,
  colors: 8,
  refs: 4,
  letterings: 12,
  kitsPerUser: 20,
  letteringName: 40,
  /** Texto exato e descrição do estilo pedidos ao gerador de lettering. */
  letteringText: 60,
  letteringStyle: 300,
  /** O Claude lê imagens de até 5 MB. */
  letteringMaxBytes: 3.5 * 1024 * 1024,
  refMaxBytes: 4 * 1024 * 1024,
};

export type LetteringRole = 'gancho' | 'titulo' | 'chamada' | 'logo' | 'outro';
export const LETTERING_ROLES: { id: LetteringRole; label: string }[] = [
  { id: 'gancho', label: 'Gancho' },
  { id: 'titulo', label: 'Título' },
  { id: 'chamada', label: 'Chamada' },
  { id: 'logo', label: 'Logo' },
  { id: 'outro', label: 'Outro' },
];

export type BrandFontId = 'inter' | 'montserrat' | 'poppins' | 'anton' | 'bebas' | 'oswald' | 'playfair';
export const BRAND_FONTS: { id: BrandFontId; label: string }[] = [
  { id: 'inter', label: 'Inter' },
  { id: 'montserrat', label: 'Montserrat' },
  { id: 'poppins', label: 'Poppins' },
  { id: 'anton', label: 'Anton (condensada forte)' },
  { id: 'bebas', label: 'Bebas Neue (caixa alta)' },
  { id: 'oswald', label: 'Oswald' },
  { id: 'playfair', label: 'Playfair Display (serifada)' },
];

export interface BrandLettering {
  id: string;
  name: string;
  role: LetteringRole;
  path: string;
  url: string;
  width: number;
  height: number;
  /** O que o lettering escreve, quando se sabe (gerado aqui ou informado). */
  text?: string;
}

export interface BrandColorRef {
  id: string;
  path: string;
  url: string;
  /** Cores dominantes lidas da imagem, oferecidas como sugestão. */
  palette: string[];
}

export interface BrandTextStyle {
  fontId: BrandFontId;
  textColor: string;
  /** Cor da tarja atrás do texto; null = sem tarja. */
  boxColor: string | null;
}

export interface BrandKit {
  id: string;
  uid: string;
  name: string;
  /** A 1ª é o fundo da chamada final; a 2ª, o destaque. */
  colors: string[];
  colorRefs: BrandColorRef[];
  letterings: BrandLettering[];
  textStyle: BrandTextStyle;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TEXT_STYLE: BrandTextStyle = { fontId: 'inter', textColor: '#ffffff', boxColor: '#000000' };

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
export const normalizeHex = (v: string) => {
  const s = v.trim().replace(/^#?/, '#').toLowerCase();
  const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : s;
};

const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map(c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Mantém a cor se ela for legível sobre o fundo; senão, usa branco ou preto. */
export function readableOn(background: string, color: string) {
  if (contrast(background, color) >= 3) return color;
  return contrast(background, '#ffffff') >= contrast(background, '#000000') ? '#ffffff' : '#000000';
}

/** Estilo que a composição usa para desenhar o texto e a chamada final. */
export interface EdlStyle {
  fontId: BrandFontId;
  textColor: string;
  boxColor: string | null;
  background: string;
  endText: string;
  endAccent: string;
}

export function edlStyleFor(kit: Pick<BrandKit, 'colors' | 'textStyle'>): EdlStyle {
  const background = kit.colors[0] || '#050807';
  const accent = kit.colors[1] || '#34d399';
  return {
    fontId: kit.textStyle.fontId,
    textColor: kit.textStyle.textColor,
    boxColor: kit.textStyle.boxColor,
    background,
    endText: readableOn(background, kit.textStyle.textColor),
    endAccent: readableOn(background, accent),
  };
}

/** Texto que acompanha a cena até o Gerador de Prompts, para os frames seguirem a marca. */
export function brandPromptNote(kit: Pick<BrandKit, 'name' | 'colors'>) {
  return kit.colors.length ? `Identidade visual "${kit.name}", paleta de cores obrigatória: ${kit.colors.join(', ')}.` : '';
}

// ── Gerador de lettering ─────────────────────────────────────────────────────
const CHROMAS = [
  { hex: '#00ff00', name: 'chroma green' },
  { hex: '#ff00ff', name: 'magenta' },
  { hex: '#0000ff', name: 'pure blue' },
];

/** Fundo chapado mais distante da paleta: é ele que será recortado depois. */
export function pickChroma(colors: string[]) {
  const score = (hex: string) => {
    const [r, g, b] = rgb(hex);
    return colors.length ? Math.min(...colors.map(c => { const [x, y, z] = rgb(c); return (r - x) ** 2 + (g - y) ** 2 + (b - z) ** 2; })) : 1;
  };
  return [...CHROMAS].sort((a, b) => score(b.hex) - score(a.hex))[0];
}

export function buildLetteringPrompt(opts: { text: string; style: string; colors: string[]; hasRefs: boolean }) {
  const text = opts.text.replace(/["\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  const chroma = pickChroma(opts.colors);
  return [
    'Professional typographic lettering artwork for a video title.',
    `The artwork contains ONLY this exact text, spelled character by character, keeping Portuguese accents, with no other words: "${text}".`,
    opts.style ? `Lettering style: ${opts.style.trim()}.` : 'Lettering style: bold, modern, highly legible.',
    opts.colors.length ? `Use strictly this color palette on the letters: ${opts.colors.join(', ')}.` : '',
    opts.hasRefs ? 'Use the attached images only as references for colors and visual style. Do not copy their content or their text.' : '',
    `Centered composition with the lettering filling most of the frame and a clear margin around it. The whole background is one flat solid ${chroma.name} (${chroma.hex}) with no gradient, texture, scenery, cast shadow or watermark.`,
  ].filter(Boolean).join(' ');
}
