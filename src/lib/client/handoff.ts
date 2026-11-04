'use client';

// Passagem entre ferramentas sem recarregar a página (navegação do Next mantém este módulo vivo).
// Ex.: Gerador de Prompts → Gerar vídeo leva o prompt, a imagem inicial e o vídeo de entrada.
// Se a página for recarregada, o handoff se perde e a tela de geração pede os arquivos de novo.

import type { GenKind, GenMode } from '@/lib/generation';

export interface GenHandoff {
  kind: GenKind;
  mode: GenMode;
  prompt: string;
  negativePrompt?: string;
  promptId?: string | null;
  /** Imagens como data URL (JPEG), na ordem: frame inicial/base, depois final/referência. */
  images?: string[];
  /** Resultados anteriores já guardados (ex.: animar uma imagem gerada). */
  storedImages?: { preview: string; path: string }[];
  video?: File | null;
  /** Modelo sugerido pela ficha do Gerador de Prompts, se for um dos nossos. */
  modelId?: string | null;
  source: string;
}

let pending: GenHandoff | null = null;

export function setGenHandoff(h: GenHandoff) {
  pending = h;
}

export function takeGenHandoff(kind: GenKind): GenHandoff | null {
  if (!pending || pending.kind !== kind) return null;
  const h = pending;
  pending = null;
  return h;
}
