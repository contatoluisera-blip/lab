'use client';

// Contexto do Projeto de vídeo nas abas de produção (Gerador de Prompts, Gerar imagem, Gerar vídeo).
// Vem do endereço (?projeto=<id>&cena=<id>), então sobrevive a recarregar a página.
// O projeto é lido em tempo real; a cena atual pode ser atualizada direto (regras: só o dono).

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import type { ProjectScene, VideoProject } from '@/lib/montagem';

export interface ProjectContext {
  project: VideoProject;
  scene: ProjectScene | null;
  sceneIndex: number;
  updateScene: (patch: Partial<ProjectScene>) => Promise<void>;
  /** Parâmetros para levar o contexto adiante num link. */
  query: Record<string, string>;
}

export function useProjectContext(): ProjectContext | null {
  const { user } = useAuth();
  const [ids] = useState<{ projectId: string; sceneId: string | null } | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search);
    const projectId = p.get('projeto');
    return projectId ? { projectId, sceneId: p.get('cena') } : null;
  });
  const [project, setProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    if (!user || !ids) return;
    return onSnapshot(doc(db, 'video_projects', ids.projectId), snap => {
      const data = snap.data();
      setProject(snap.exists() && data?.uid === user.uid ? ({ id: snap.id, ...data } as VideoProject) : null);
    }, () => setProject(null));
  }, [user, ids]);

  const sceneIndex = project && ids?.sceneId ? project.scenes.findIndex(s => s.id === ids.sceneId) : -1;
  const scene = sceneIndex >= 0 ? project!.scenes[sceneIndex] : null;

  // Lê as cenas na hora de gravar: a resposta da IA pode chegar depois de outra aba mexer no projeto.
  const projectId = project?.id;
  const sceneId = scene?.id;
  const updateScene = useCallback(async (patch: Partial<ProjectScene>) => {
    if (!projectId || !sceneId) return;
    await updateProjectScene(projectId, sceneId, patch);
  }, [projectId, sceneId]);

  if (!project) return null;
  const query: Record<string, string> = { projeto: project.id, ...(scene ? { cena: scene.id } : {}) };
  return { project, scene, sceneIndex, updateScene, query };
}

/** Atualiza uma cena lendo as cenas na hora de gravar (outra aba pode ter mexido no projeto). */
export async function updateProjectScene(projectId: string, sceneId: string, patch: Partial<ProjectScene>) {
  const ref = doc(db, 'video_projects', projectId);
  await runTransaction(db, async tx => {
    const scenes = ((await tx.get(ref)).data()?.scenes || []) as ProjectScene[];
    if (!scenes.some(s => s.id === sceneId)) return;
    tx.update(ref, { scenes: scenes.map(s => (s.id === sceneId ? { ...s, ...patch } : s)), updatedAt: new Date().toISOString() });
  });
}

/** Acrescenta o contexto do projeto a um endereço interno. */
export function withProject(href: string, ctx: ProjectContext | null) {
  if (!ctx) return href;
  const [path, search = ''] = href.split('?');
  const params = new URLSearchParams(search);
  for (const [k, v] of Object.entries(ctx.query)) params.set(k, v);
  return `${path}?${params.toString()}`;
}
