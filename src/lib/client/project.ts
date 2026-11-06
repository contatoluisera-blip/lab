'use client';

// Contexto do Projeto de vídeo nas abas de produção (Gerador de Prompts, Gerar imagem, Gerar vídeo).
// Vem do endereço (?projeto=<id>&cena=<id>), então sobrevive a recarregar a página.
// O projeto é lido em tempo real; a cena atual pode ser atualizada direto (regras: só o dono).

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
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

  const updateScene = useCallback(async (patch: Partial<ProjectScene>) => {
    if (!project || !scene) return;
    const scenes = project.scenes.map(s => (s.id === scene.id ? { ...s, ...patch } : s));
    await updateDoc(doc(db, 'video_projects', project.id), { scenes, updatedAt: new Date().toISOString() });
  }, [project, scene]);

  if (!project) return null;
  const query: Record<string, string> = { projeto: project.id, ...(scene ? { cena: scene.id } : {}) };
  return { project, scene, sceneIndex, updateScene, query };
}

/** Acrescenta o contexto do projeto a um endereço interno. */
export function withProject(href: string, ctx: ProjectContext | null) {
  if (!ctx) return href;
  const [path, search = ''] = href.split('?');
  const params = new URLSearchParams(search);
  for (const [k, v] of Object.entries(ctx.query)) params.set(k, v);
  return `${path}?${params.toString()}`;
}
