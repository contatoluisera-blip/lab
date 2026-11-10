import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { ASSET_ID_PREFIX, ASSET_LIMITS, AllowedClip, ProjectAsset, musicSourceKey, UPLOAD_ID_PREFIX, UPLOAD_LIMITS, VideoProject, sourceFramesFor, uploadFolder } from '@/lib/montagem';
import { LETTERING_ROLES } from '@/lib/brand';
import type { StoredJob } from '@/lib/server/generation/queue';

export const projects = () => adminDb.collection('video_projects') as admin.firestore.CollectionReference;

/** Carrega o projeto e confere que é da pessoa. */
export async function loadOwnedProject(uid: string, projectId: unknown): Promise<VideoProject> {
  if (typeof projectId !== 'string' || !projectId || projectId.length > 64) throw new HttpError(400, 'bad_project', 'Projeto inválido.');
  const snap = await projects().doc(projectId).get();
  const data = snap.data();
  if (!snap.exists || data?.uid !== uid) throw new HttpError(404, 'project_missing', 'Projeto não encontrado.');
  return { id: snap.id, ...data } as VideoProject;
}

export interface ProjectClip extends AllowedClip {
  jobId: string;
  path: string;
  seconds: number;
  prompt: string;
  createdAt: string;
  /** Vídeo enviado pela pessoa (não gerado): nome e miniaturas para o Claude. */
  upload?: { name: string; thumbs: string[] };
}

/** Cenas de vídeo concluídas e guardadas do projeto: as únicas que podem entrar na montagem. */
export async function projectClips(uid: string, projectId: string): Promise<ProjectClip[]> {
  const snap = await adminDb.collection('gen_jobs').where('uid', '==', uid).where('projectId', '==', projectId).get();
  const jobs: (StoredJob & { sceneId?: string | null })[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  return jobs
    .filter(j => j.kind === 'video' && j.status === 'completed' && j.outputs?.[0]?.stored && j.outputs[0].path)
    .map(j => ({
      jobId: j.id,
      path: j.outputs[0].path!,
      sceneId: j.sceneId || null,
      seconds: j.config?.duration || 5,
      sourceFrames: sourceFramesFor(j.config?.duration),
      prompt: j.prompt,
      createdAt: j.createdAt,
    }));
}

/**
 * Vídeos enviados pela pessoa, guardados no projeto. O navegador escreve essa lista,
 * então só valem arquivos na pasta da própria pessoa e com duração dentro do limite.
 */
export function uploadClips(uid: string, project: VideoProject): ProjectClip[] {
  const folder = uploadFolder(uid);
  return (project.uploads || [])
    .filter(u => typeof u?.id === 'string' && u.id.startsWith(UPLOAD_ID_PREFIX) && typeof u.path === 'string' && u.path.startsWith(folder) && !u.path.includes('..'))
    .slice(0, UPLOAD_LIMITS.perProject)
    .map(u => {
      const seconds = Math.min(UPLOAD_LIMITS.maxSeconds, Math.max(1, Number(u.seconds) || 1));
      return {
        jobId: u.id,
        path: u.path,
        sceneId: null,
        seconds,
        sourceFrames: sourceFramesFor(seconds),
        prompt: String(u.description || '').slice(0, UPLOAD_LIMITS.descriptionMax),
        createdAt: String(u.createdAt || ''),
        upload: {
          name: String(u.name || 'Vídeo').slice(0, 80),
          // O Claude abre essas URLs: só links do nosso Storage para o próprio arquivo da pessoa.
          thumbs: (u.thumbs || []).filter(t => typeof t?.path === 'string' && t.path.startsWith(folder) && typeof t.url === 'string'
            && t.url.startsWith('https://firebasestorage.googleapis.com/') && t.url.includes(encodeURIComponent(t.path))).map(t => t.url).slice(0, 3),
        },
      };
    });
}

/** Tudo que pode entrar na montagem: cenas geradas do projeto e vídeos enviados. */
export async function allProjectClips(uid: string, project: VideoProject): Promise<ProjectClip[]> {
  return [...await projectClips(uid, project.id), ...uploadClips(uid, project)];
}

/**
 * Artes do vídeo (letterings, logos, marca d'água, vinheta) guardadas no projeto pelo navegador:
 * só valem arquivos na pasta da própria pessoa, com links do nosso Storage para o próprio arquivo.
 */
export function projectAssets(uid: string, project: VideoProject): ProjectAsset[] {
  const folder = uploadFolder(uid);
  return (project.assets || [])
    .filter(a => typeof a?.id === 'string' && a.id.startsWith(ASSET_ID_PREFIX) && (a.type === 'image' || a.type === 'video')
      && typeof a.path === 'string' && a.path.startsWith(folder) && !a.path.includes('..')
      && typeof a.url === 'string' && a.url.startsWith('https://firebasestorage.googleapis.com/') && a.url.includes(encodeURIComponent(a.path)))
    .slice(0, ASSET_LIMITS.perProject)
    .map(a => ({
      id: a.id, type: a.type, path: a.path, url: a.url,
      name: String(a.name || 'Arte').slice(0, 60),
      role: LETTERING_ROLES.some(r => r.id === a.role) ? a.role : 'titulo',
      text: typeof a.text === 'string' ? a.text.slice(0, 120) : '',
      width: Math.max(1, Number(a.width) || 1),
      height: Math.max(1, Number(a.height) || 1),
      seconds: a.type === 'video' ? Math.min(ASSET_LIMITS.videoMaxSeconds, Math.max(0.5, Number(a.seconds) || 3)) : undefined,
      transparent: a.transparent !== false,
      createdAt: String(a.createdAt || ''),
    }));
}

/** Trilhas geradas no projeto (Suno): chave da faixa → caminho no Storage, para validar e assinar no render. */
export async function projectMusic(uid: string, projectId: string): Promise<Record<string, { path: string }>> {
  const snap = await adminDb.collection('gen_jobs').where('uid', '==', uid).where('projectId', '==', projectId).get();
  const out: Record<string, { path: string }> = {};
  for (const d of snap.docs) {
    const j = d.data() as StoredJob;
    if (j.kind !== 'audio' || j.status !== 'completed') continue;
    (j.outputs || []).forEach((o, i) => { if (o.stored && o.path) out[musicSourceKey(d.id, i)] = { path: o.path }; });
  }
  return out;
}
