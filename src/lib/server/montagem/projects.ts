import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { AllowedClip, UPLOAD_ID_PREFIX, UPLOAD_LIMITS, VideoProject, sourceFramesFor, uploadFolder } from '@/lib/montagem';
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
