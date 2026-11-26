import type { Kit } from './types';
import { LOOP_ILUSAO } from './loop-ilusao';

/** Kits publicados em /kit/{slug}. Para lançar um kit novo: um arquivo de dados aqui e as mídias em /public/kits/{slug}. */
export const KITS: Record<string, Kit> = {
  [LOOP_ILUSAO.slug]: LOOP_ILUSAO,
};

export const getKit = (slug: string) => KITS[slug] ?? null;
export type { Kit, KitItem } from './types';
