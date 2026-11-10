'use client';

// Folha de quadros de um clipe (6 quadros em ordem, numa grade 3x2): é como o Claude "vê" o clipe
// na montagem. Feita no navegador (o bucket libera leitura com CORS) e guardada no Storage uma vez só.

import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { uploadFolder } from '@/lib/montagem';

const COLS = 3;
const ROWS = 2;
const CELL_MAX = 360;

function once(el: HTMLVideoElement, event: string, ms = 20_000) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, ms);
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('error')); };
    const cleanup = () => { clearTimeout(t); el.removeEventListener(event, ok); el.removeEventListener('error', fail); };
    el.addEventListener(event, ok);
    el.addEventListener('error', fail);
  });
}

/** Gera a folha de quadros do vídeo e devolve o arquivo guardado. */
export async function makeClipSheet(uid: string, clipId: string, videoUrl: string): Promise<{ path: string; url: string }> {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  // Parâmetro extra: a tela já tocou este vídeo sem CORS, e o cache não serviria para o canvas.
  video.src = `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}cors=1`;
  try {
    await once(video, 'loadedmetadata');
    const { duration, videoWidth: w, videoHeight: h } = video;
    if (!w || !h || !Number.isFinite(duration)) throw new Error('vídeo ilegível');
    const scale = Math.min(1, CELL_MAX / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw * COLS;
    canvas.height = ch * ROWS;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const n = COLS * ROWS;
    for (let i = 0; i < n; i++) {
      video.currentTime = Math.min(duration - 0.05, Math.max(0.02, (duration * (i + 0.5)) / n));
      await once(video, 'seeked');
      const x = (i % COLS) * cw;
      const y = Math.floor(i / COLS) * ch;
      ctx.drawImage(video, x, y, cw, ch);
      // Número e tempo do quadro, para o Claude citar o segundo exato do corte.
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(x, y, 74, 22);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${i + 1} · ${video.currentTime.toFixed(1)}s`, x + 6, y + 16);
    }
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (!blob) throw new Error('falha ao gravar');
    // Nome único: a regra do Storage não deixa regravar um arquivo.
    const path = `${uploadFolder(uid)}sheet-${clipId.replace(/[^a-zA-Z0-9_-]/g, '')}-${crypto.randomUUID().slice(0, 6)}.jpg`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob, { contentType: 'image/jpeg' });
    return { path, url: await getDownloadURL(ref) };
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}
