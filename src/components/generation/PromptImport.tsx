'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { X, Loader2, Clapperboard, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { PROMPT_MODES, PromptMode, PromptResult } from '@/lib/promptStudio';

export interface SavedPrompt {
  id: string;
  mode: PromptMode;
  description: string;
  choices: Record<string, string | string[]>;
  result: PromptResult;
  createdAt: string;
}

/** Gaveta com os prompts salvos no Gerador de Prompts, só os que servem para esta aba. */
export function PromptImport({ uid, modes, onPick, onClose, createHref }: {
  uid: string;
  modes: PromptMode[];
  onPick: (p: SavedPrompt) => void;
  onClose: () => void;
  createHref: string;
}) {
  const [items, setItems] = useState<SavedPrompt[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'prompts'), where('userId', '==', uid)))
      .then(snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<SavedPrompt, 'id'>) }))
          .filter(p => modes.includes(p.mode) && p.result?.prompt)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          .slice(0, 30);
        setItems(list);
      })
      .catch(() => setError('Não foi possível carregar seus prompts.'));
  }, [uid, modes]);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="prompt-import-title" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-[#080c0a] border-l border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 id="prompt-import-title" className="text-base font-bold text-white">Importar prompt</h2>
            <p className="text-xs text-gray-500">Do seu histórico no Gerador de Prompts</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/5" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!items && !error && <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-brand-mint" /></div>}
          {error && <p className="text-sm text-red-400 p-4">{error}</p>}
          {items?.length === 0 && (
            <div className="text-center py-12 px-6 space-y-3">
              <Clapperboard className="w-8 h-8 text-brand-emerald/40 mx-auto" />
              <p className="text-sm text-gray-400">Você ainda não tem prompts deste tipo salvos.</p>
            </div>
          )}
          {items?.map(p => (
            <button key={p.id} type="button" onClick={() => onPick(p)}
              className="w-full text-left p-4 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-brand-emerald/50 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-mint">
                {PROMPT_MODES.find(m => m.id === p.mode)?.label} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-sm text-white mt-1 line-clamp-2">{p.description || 'Sem descrição'}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-2 line-clamp-2">{p.result.prompt}</p>
            </button>
          ))}
        </div>

        <a href={createHref} className="m-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 hover:border-brand-emerald/70 transition-colors">
          <span>
            <span className="block text-sm font-semibold text-white">Criar um prompt com direção</span>
            <span className="block text-[11px] text-gray-400">Abre o Gerador de Prompts no modo certo</span>
          </span>
          <ArrowRight className="w-4 h-4 text-brand-mint" />
        </a>
      </div>
    </div>
  );
}
