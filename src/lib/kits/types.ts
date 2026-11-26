/** Um prompt do kit: {P} e {R} são trocados pelos blocos que a pessoa escreve na página. */
export interface KitItem {
  title: string;
  /** Imagem de exemplo em /public/kits/{slug}/{img}.jpg */
  img?: string;
  refs?: string[];
  /** Modelo usado, como aparece para a pessoa (ex.: "Seedance 2.5 · 720p"). */
  tool: string;
  /** Modelo do catálogo da Creator Lab (src/lib/generation.ts), para o botão de gerar. */
  modelId?: string;
  note?: string;
  prompt: string;
}

export interface Kit {
  slug: string;
  eyebrow: string;
  title: string;
  accent?: string;
  lead: string;
  video?: string;
  poster?: string;
  tools: { label: string; value: string }[];
  /** Tela de cadastro antes do kit. */
  gate: { headline: string; sub: string; perks: string[] };
  setup?: { intro: string; fields: { key: 'P' | 'R'; label: string; hint: string; example: string }[] };
  steps: { title: string; why: string; items: KitItem[] }[];
  assembly?: { title: string; why: string; order: { title: string; line: string }[]; extras?: KitItem[] };
  tips?: { title: string; line: string }[];
}
