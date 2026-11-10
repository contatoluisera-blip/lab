'use client';

// Artes do vídeo (letterings, logos, marca d'água, vinheta): envio em lote direto no projeto.
// Imagens passam pelo mesmo tratamento dos letterings (corte das sobras, PNG leve); vídeos só são lidos e enviados.

import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { prepareLettering } from '@/lib/client/lettering';
import { probeVideo } from '@/lib/client/videoUpload';
import { ASSET_ID_PREFIX, ASSET_LIMITS, ProjectAsset, guessRole, uploadFolder } from '@/lib/montagem';

const VIDEO_EXT: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
const newKey = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 60) || 'Arte';

function videoType(file: File) {
  if (VIDEO_EXT[file.type]) return file.type;
  const ext = file.name.toLowerCase().split('.').pop();
  return ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : ext === 'mp4' ? 'video/mp4' : '';
}
const isImage = (file: File) => /^image\/(png|jpeg|webp)$/.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);

/** Confere tipo e tamanho antes de enviar. */
export function checkAssetFile(file: File) {
  if (isImage(file)) return file.size > ASSET_LIMITS.imageMaxBytes ? `"${file.name}" passa de ${ASSET_LIMITS.imageMaxBytes / 1024 / 1024} MB.` : '';
  if (videoType(file)) return file.size > ASSET_LIMITS.videoMaxBytes ? `"${file.name}" passa de ${ASSET_LIMITS.videoMaxBytes / 1024 / 1024} MB.` : '';
  return `"${file.name}": envie imagem PNG, JPG ou WEBP, ou vídeo MP4, MOV ou WEBM.`;
}

async function putImage(uid: string, blob: Blob) {
  const path = `${uploadFolder(uid)}${newKey()}-arte.png`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: 'image/png' });
  return { path, url: await getDownloadURL(ref) };
}

/** Envia uma arte e devolve o registro para gravar no projeto. */
export async function uploadProjectAsset(uid: string, file: File, onProgress: (fraction: number) => void): Promise<ProjectAsset> {
  const problem = checkAssetFile(file);
  if (problem) throw new Error(problem);
  const base = { id: `${ASSET_ID_PREFIX}${newKey()}`, name: baseName(file), role: guessRole(file.name), text: '', createdAt: new Date().toISOString() };

  if (isImage(file)) {
    const prepared = await prepareLettering(file, { removeBackground: false });
    const stored = await putImage(uid, prepared.blob);
    onProgress(1);
    return { ...base, type: 'image', ...stored, width: prepared.width, height: prepared.height, transparent: prepared.transparent };
  }

  const info = await probeVideo(file);
  if (info.duration > ASSET_LIMITS.videoMaxSeconds) {
    throw new Error(`"${file.name}" tem ${Math.round(info.duration)} s. Marca d'água e vinheta podem ter até ${ASSET_LIMITS.videoMaxSeconds} s.`);
  }
  const type = videoType(file);
  const path = `${uploadFolder(uid)}${newKey()}-arte.${VIDEO_EXT[type]}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, file, { contentType: type });
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', s => onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0), reject, () => resolve());
  });
  return {
    ...base, type: 'video', path, url: await getDownloadURL(ref),
    width: info.width, height: info.height, seconds: Math.round(info.duration * 100) / 100, transparent: type !== 'video/mp4',
  };
}

/** Recorta o fundo de uma arte já enviada: grava uma versão nova e apaga a antiga. */
export async function removeAssetBackground(uid: string, asset: ProjectAsset): Promise<ProjectAsset> {
  const prepared = await prepareLettering(asset.url, { removeBackground: true });
  const stored = await putImage(uid, prepared.blob);
  deleteObject(storageRef(storage, asset.path)).catch(() => {});
  return { ...asset, ...stored, width: prepared.width, height: prepared.height, transparent: prepared.transparent };
}

export async function deleteAssetFile(asset: ProjectAsset) {
  await deleteObject(storageRef(storage, asset.path)).catch(() => {});
}
