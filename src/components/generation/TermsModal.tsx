'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { GEN_TERMS_SUMMARY, GEN_TERMS_VERSION } from '@/lib/genTerms';
import { callTool } from '@/lib/client/api';

/** Aceite dos termos da geração. Aparece antes da primeira geração e a cada nova versão. */
export function TermsModal({ onClose, onAccepted }: { onClose: () => void; onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    setSaving(true);
    setError('');
    try {
      await callTool('/api/gen/terms', { accept: true, version: GEN_TERMS_VERSION });
      onAccepted();
    } catch (e: any) {
      setError(e.message || 'Não foi possível registrar o aceite. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="gen-terms-title">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0f0d] shadow-[0_40px_120px_-30px_rgba(16,185,129,0.45)] overflow-hidden">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/5" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>
        <div className="p-7 space-y-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-brand-emerald/15 text-brand-mint"><ShieldCheck className="w-5 h-5" /></span>
            <div>
              <h2 id="gen-terms-title" className="text-lg font-bold text-white">Antes de gerar</h2>
              <p className="text-xs text-gray-500">Termos de uso da geração de imagens e vídeos</p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {GEN_TERMS_SUMMARY.map(item => (
              <li key={item} className="text-[13px] text-gray-300 leading-relaxed pl-3 border-l-2 border-brand-emerald/40">{item}</li>
            ))}
          </ul>

          <a href="/termos-de-uso/geracao-ia" target="_blank" rel="noopener" className="inline-block text-xs text-brand-mint hover:underline">
            Ler os termos completos
          </a>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-0.5 accent-emerald-500 w-4 h-4" />
            <span className="text-xs text-gray-300 leading-relaxed">
              Li e aceito os termos de uso da geração. Entendo que o mau uso leva ao bloqueio da conta.
            </span>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="button" onClick={accept} disabled={!checked || saving}
            className="w-full h-11 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
