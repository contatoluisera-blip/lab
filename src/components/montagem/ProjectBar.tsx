'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, ArrowLeft, X } from 'lucide-react';
import type { ProjectContext } from '@/lib/client/project';
import { projectHref } from '@/lib/montagem';

/**
 * Barra fixa nas abas de produção: em qual projeto e cena a pessoa está, e o caminho de volta.
 * Com `onLinkedChange`, mostra se o resultado vai ser gravado na cena: assim um prompt feito
 * para outra coisa, com a página ainda aberta no projeto, não substitui o da cena sem aviso.
 */
export function ProjectBar({ ctx, step, linked = true, onLinkedChange }: {
  ctx: ProjectContext;
  step: string;
  linked?: boolean;
  onLinkedChange?: (linked: boolean) => void;
}) {
  const { project, scene, sceneIndex } = ctx;
  // Recarrega sem ?projeto=&cena= (o contexto é lido do endereço ao abrir a página).
  const leave = () => { window.location.href = window.location.pathname; };
  return (
    <div className={`sticky top-0 z-30 -mx-1 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border bg-[#06100c]/90 backdrop-blur-xl ${linked ? 'border-brand-emerald/30' : 'border-white/10'}`}>
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
          {scene && onLinkedChange && (
            <label className="mt-1 flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
              <input type="checkbox" checked={linked} onChange={e => onLinkedChange(e.target.checked)} className="accent-emerald-500" />
              {linked ? `O resultado substitui o ${step === 'Prompts' ? 'prompt' : 'prompt e a geração'} da Cena ${sceneIndex + 1}` : 'Não grava nada na cena: uso avulso'}
            </label>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={leave} className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 text-xs font-semibold text-gray-300 hover:text-white">
          <X className="w-3.5 h-3.5" /> Sair do projeto
        </button>
        <Link href={projectHref('/dashboard/montagem', project.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981]">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a montagem
        </Link>
      </div>
    </div>
  );
}
