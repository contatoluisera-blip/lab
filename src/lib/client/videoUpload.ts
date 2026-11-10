'use client';

// Envio dos vídeos da pessoa para a Montagem: lê duração e tamanho no navegador, tira três
// miniaturas (começo, meio e fim, para o Claude ver o take) e sobe tudo para o Storage com progresso.

import { getDownloadURL, ref as storageRef, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ProjectUpload, UPLOAD_ID_PREFIX, UPLOAD_LIMITS, uploadFolder } from '@/lib/montagem';

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const THUMB_AT = [0.08, 0.5, 0.92];
const THUMB_MAX = 480;

function contentType(file: File) {
  if (VIDEO_TYPES.includes(file.type)) return file.type;
  const ext = file.name.toLowerCase().split('.').pop();
  return ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : ext === 'mp4' ? 'video/mp4' : '';
}

function once(el: HTMLVideoElement, event: string, ms = 15_000) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, ms);
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('error')); };
    const cleanup = () => { clearTimeout(t); el.removeEventListener(event, ok); el.removeEventListener('error', fail); };
    el.addEventListener(event, ok);
    el.addEventListener('error', fail);
  });
}

/** Lê o vídeo no navegador: duração, tamanho e miniaturas. Falha com mensagem em português. */
export async function probeVideo(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  try {
    await once(video, 'loadedmetadata');
    const { duration, videoWidth: width, videoHeight: height } = video;
    if (!width || !height || !Number.isFinite(duration)) {
      throw new Error(`"${file.name}": o navegador não conseguiu ler este vídeo. Se for HEVC (padrão do iPhone), exporte em MP4 H.264 ou use o Safari.`);
    }
    const scale = Math.min(1, THUMB_MAX / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d')!;
    const thumbs: Blob[] = [];
    for (const at of THUMB_AT) {
      video.currentTime = Math.min(duration - 0.05, Math.max(0, duration * at));
      await once(video, 'seeked');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.8));
      if (blob) thumbs.push(blob);
    }
    return { duration, width, height, thumbs };
  } catch (e: any) {
    if (e?.message?.startsWith('"')) throw e;
    throw new Error(`"${file.name}": não foi possível ler este vídeo. Envie MP4, MOV ou WEBM.`);
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Confere tipo e tamanho antes de ler o arquivo. */
export function checkVideoFile(file: File) {
  if (!contentType(file)) return `"${file.name}": envie vídeo MP4, MOV ou WEBM.`;
  if (file.size > UPLOAD_LIMITS.maxBytes) return `"${file.name}" tem ${Math.round(file.size / 1024 / 1024)} MB. O limite é ${UPLOAD_LIMITS.maxBytes / 1024 / 1024} MB por vídeo.`;
  return '';
}

/** Envia um vídeo e as miniaturas; devolve o registro para gravar no projeto. */
export async function uploadProjectVideo(uid: string, file: File, onProgress: (fraction: number) => void): Promise<ProjectUpload> {
  const problem = checkVideoFile(file);
  if (problem) throw new Error(problem);
  const info = await probeVideo(file);
  if (info.duration > UPLOAD_LIMITS.maxSeconds) {
    throw new Error(`"${file.name}" tem ${Math.round(info.duration / 60)} min. O limite é ${UPLOAD_LIMITS.maxSeconds / 60} min por vídeo: corte antes de enviar.`);
  }
  const key = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const type = contentType(file);
  const ext = type === 'video/quicktime' ? 'mov' : type === 'video/webm' ? 'webm' : 'mp4';
  const folder = uploadFolder(uid);

  const thumbs = await Promise.all(info.thumbs.map(async (blob, i) => {
    const path = `${folder}${key}-thumb${i}.jpg`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob, { contentType: 'image/jpeg' });
    return { path, url: await getDownloadURL(ref) };
  }));

  const path = `${folder}${key}.${ext}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, file, { contentType: type });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', s => onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0), reject, () => resolve());
  });

  return {
    id: `${UPLOAD_ID_PREFIX}${key}`,
    name: file.name.replace(/\.[^.]+$/, '').slice(0, 80),
    path,
    url: await getDownloadURL(ref),
    seconds: Math.round(info.duration * 100) / 100,
    width: info.width,
    height: info.height,
    description: '',
    thumbs,
    createdAt: new Date().toISOString(),
  };
}
