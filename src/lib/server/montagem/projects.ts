import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError } from '@/lib/server/auth';
import { AllowedClip, VideoProject, sourceFramesFor } from '@/lib/montagem';
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
