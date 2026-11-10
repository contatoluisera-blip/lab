import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';
import type { BrandFontId } from '../lib/brand';

// Fontes do texto na tela: as mesmas na prévia e no render. O subconjunto latino cobre os acentos do português.
const subsets = ['latin'] as const;

export const FONTS: Record<BrandFontId, { family: string; weight: number }> = {
  inter: { family: loadInter('normal', { weights: ['800'], subsets: [...subsets] }).fontFamily, weight: 800 },
  montserrat: { family: loadMontserrat('normal', { weights: ['800'], subsets: [...subsets] }).fontFamily, weight: 800 },
  poppins: { family: loadPoppins('normal', { weights: ['800'], subsets: [...subsets] }).fontFamily, weight: 800 },
  anton: { family: loadAnton('normal', { weights: ['400'], subsets: [...subsets] }).fontFamily, weight: 400 },
  bebas: { family: loadBebas('normal', { weights: ['400'], subsets: [...subsets] }).fontFamily, weight: 400 },
  oswald: { family: loadOswald('normal', { weights: ['700'], subsets: [...subsets] }).fontFamily, weight: 700 },
  playfair: { family: loadPlayfair('normal', { weights: ['800'], subsets: [...subsets] }).fontFamily, weight: 800 },
};
