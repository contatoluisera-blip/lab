'use client';

// Frames gerados (PNG de até ~8 MB, 2K) são grandes demais para alguns provedores: o Veo recusa com
// "Images size exceeds limit". Antes de usar um resultado guardado como entrada, o navegador reduz para
// JPEG de até 1920 px (o tamanho do vídeo em 1080p) e envia para gen-inputs, como uma imagem enviada à mão.

import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const MAX_SIDE = 1920;

/** Lê a imagem do Storage (o bucket libera leitura com CORS) e devolve o caminho de uma cópia JPEG reduzida. */
export async function compactStoredImage(uid: string, url: string, name: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  // Parâmetro extra: a tela pode ter carregado este arquivo sem CORS, e o cache não serviria para o canvas.
  img.src = /^https?:/.test(url) ? `${url}${url.includes('?') ? '&' : '?'}cors=1` : url;
  await img.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Não foi possível preparar o frame.');
  const path = `gen-inputs/${uid}/${name}.jpg`;
  await uploadBytes(storageRef(storage, path), blob, { contentType: 'image/jpeg' });
  return path;
}
