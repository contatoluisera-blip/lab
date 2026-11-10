'use client';

// Tratamento de imagens da ID Visual, feito no navegador: recorte do fundo, corte das sobras,
// redução de tamanho e leitura das cores dominantes. O canvas regrava o arquivo, então só PNG/JPG limpos sobem.

import { BRAND_LIMITS } from '@/lib/brand';
import { dominantColors, hasTransparency, keyOutBackground, trimBounds } from '@/lib/letteringPixels';

export interface PreparedImage {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

async function loadBitmap(source: Blob | string): Promise<HTMLImageElement> {
  const remote = typeof source === 'string' && /^https?:/.test(source);
  // Arquivo já no Storage: lido com CORS (e um parâmetro extra, para não pegar do cache sem CORS) para o canvas poder ler os pixels.
  const url = typeof source === 'string' ? (remote ? `${source}${source.includes('?') ? '&' : '?'}cors=1` : source) : URL.createObjectURL(source);
  const img = new Image();
  if (remote) img.crossOrigin = 'anonymous';
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Não foi possível ler essa imagem. Use PNG, JPG ou WEBP.'));
      img.src = url;
    });
    return img;
  } finally {
    if (typeof source !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Seu navegador não conseguiu tratar a imagem.');
  return { canvas, ctx };
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Não foi possível gravar a imagem.'))), type, quality));

function drawScaled(source: CanvasImageSource, w: number, h: number, max: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  const { canvas, ctx } = canvasOf(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/** Prepara um lettering: opcionalmente recorta o fundo, corta as sobras e fica dentro do limite de tamanho. */
export async function prepareLettering(source: Blob | string, opts: { removeBackground: boolean }): Promise<PreparedImage & { transparent: boolean }> {
  const img = await loadBitmap(source);
  const { canvas, ctx } = drawScaled(img, img.naturalWidth, img.naturalHeight, 2400);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (opts.removeBackground) {
    keyOutBackground(data.data, data.width, data.height);
    ctx.putImageData(data, 0, 0);
  }
  const transparent = hasTransparency(data.data);
  const box = trimBounds(data.data, data.width, data.height);
  if (!box) throw new Error('A imagem ficou vazia depois do recorte. Tente outra versão.');
  const cropped = canvasOf(box.width, box.height);
  cropped.ctx.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);

  for (const max of [1600, 1280, 1024, 800]) {
    const out = drawScaled(cropped.canvas, box.width, box.height, max);
    const blob = await toBlob(out.canvas, 'image/png');
    if (blob.size <= BRAND_LIMITS.letteringMaxBytes) {
      return { blob, previewUrl: URL.createObjectURL(blob), width: out.canvas.width, height: out.canvas.height, transparent };
    }
  }
  throw new Error('Esse lettering é pesado demais mesmo reduzido. Simplifique a arte ou envie menor.');
}

/** Prepara uma referência de cor e lê as cores dominantes. */
export async function prepareColorRef(file: Blob): Promise<PreparedImage & { palette: string[] }> {
  const img = await loadBitmap(file);
  const { canvas } = drawScaled(img, img.naturalWidth, img.naturalHeight, 1280);
  const small = drawScaled(canvas, canvas.width, canvas.height, 96);
  const pixels = small.ctx.getImageData(0, 0, small.canvas.width, small.canvas.height);
  const blob = await toBlob(canvas, 'image/jpeg', 0.86);
  if (blob.size > BRAND_LIMITS.refMaxBytes) throw new Error('Essa referência é pesada demais. Envie uma imagem menor.');
  return { blob, previewUrl: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, palette: dominantColors(pixels.data, 5) };
}

export function dataUrlToBlob(dataUrl: string) {
  const [head, body] = dataUrl.split(',');
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: head.match(/:(.*?);/)?.[1] || 'image/png' });
}
