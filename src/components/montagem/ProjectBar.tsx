'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, ArrowLeft } from 'lucide-react';
import type { ProjectContext } from '@/lib/client/project';
import { projectHref } from '@/lib/montagem';

/** Barra fixa nas abas de produção: em qual projeto e cena a pessoa está, e o caminho de volta. */
export function ProjectBar({ ctx, step }: { ctx: ProjectContext; step: string }) {
  const { project, scene, sceneIndex } = ctx;
  return (
    <div className="sticky top-0 z-30 -mx-1 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-brand-emerald/30 bg-[#06100c]/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30 flex items-center justify-center">
          <Clapperboard className="w-4 h-4 text-brand-mint" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-mint">Projeto de vídeo · {step}</p>
          <p className="text-sm text-white font-semibold truncate">
            {project.title}
            {scene && <span className="text-gray-400 font-normal"> · Cena {sceneIndex + 1} de {project.scenes.length}: {scene.title}</span>}
          </p>
        </div>
      </div>
      <Link href={projectHref('/dashboard/montagem', project.id)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981]">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a montagem
      </Link>
    </div>
  );
}
