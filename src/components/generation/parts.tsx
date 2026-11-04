'use client';

import React from 'react';
import { Check, Film, ImagePlus, Loader2, X } from 'lucide-react';
import { GenModel, minCredits } from '@/lib/generation';

/** Cabeçalho de etapa da mesa de direção. O número é a ordem real de preenchimento. */
export function StepHeader({ n, title, aside }: { n: number; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full border border-brand-emerald/40 bg-brand-emerald/10 text-brand-mint text-[11px] font-mono font-bold flex items-center justify-center">
          {n}
        </span>
        <h3 className="text-[13px] font-semibold tracking-wide text-white uppercase">{title}</h3>
      </div>
      {aside}
    </div>
  );
}

/** Botão de escolha (proporção, duração, qualidade). */
export function Chip({ active, onClick, children, hint, disabled }: {
  active: boolean; onClick: () => void; children: React.ReactNode; hint?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`group flex flex-col items-center justify-center min-w-[64px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 ${active
        ? 'bg-brand-emerald/15 border-brand-emerald/60 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_8px_24px_-12px_rgba(16,185,129,0.6)]'
        : 'bg-black/30 border-white/[0.07] text-gray-400 hover:text-white hover:border-white/20'}`}
    >
      <span>{children}</span>
      {hint && <span className={`text-[9px] font-medium mt-0.5 ${active ? 'text-brand-mint' : 'text-gray-500'}`}>{hint}</span>}
    </button>
  );
}

/** Retângulo na proporção, para os botões de proporção. */
export function AspectGlyph({ aspect, active }: { aspect: string; active: boolean }) {
  const [w, h] = aspect.split(':').map(Number);
  const scale = 18 / Math.max(w, h);
  return (
    <span
      aria-hidden
      className={`block rounded-[3px] border-[1.5px] mb-1 ${active ? 'border-brand-mint' : 'border-gray-500'}`}
      style={{ width: Math.max(6, w * scale), height: Math.max(6, h * scale) }}
    />
  );
}

export function ModelCard({ model, active, credits, onClick }: { model: GenModel; active: boolean; credits?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative w-full text-left p-4 rounded-2xl border transition-all ${active
        ? 'border-brand-emerald/60 bg-gradient-to-br from-brand-emerald/[0.14] via-brand-jade/[0.08] to-transparent shadow-[0_12px_40px_-18px_rgba(16,185,129,0.7)]'
        : 'border-white/[0.07] bg-black/25 hover:border-white/20'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
            {model.name}
            {model.highlight && <span className="px-1.5 py-0.5 rounded-md bg-brand-emerald/15 border border-brand-emerald/30 text-[9px] font-bold uppercase tracking-wider text-brand-mint">{model.highlight}</span>}
          </p>
          <p className="text-[11px] text-gray-400 leading-snug mt-1">{model.tagline}</p>
        </div>
        <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${active ? 'bg-brand-emerald border-brand-emerald text-black' : 'border-white/20'}`}>
          {active && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {model.badges.map(b => (
          <span key={b} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-300">{b}</span>
        ))}
        <span className="ml-auto font-mono text-[10px] text-brand-mint">
          {active && credits != null ? `${credits} créditos` : `a partir de ${minCredits(model)}`}
        </span>
      </div>
    </button>
  );
}

export interface InputSlotState {
  preview: string;
  /** JPEG para enviar (arquivo novo) */
  dataUrl?: string;
  /** Caminho já no Storage (resultado anterior reaproveitado) */
  path?: string;
}

export function ImageSlot({ label, required, value, onPick, onClear, busy }: {
  label: string; required?: boolean; value?: InputSlotState | null; busy?: boolean;
  onPick: (file?: File) => void; onClear: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 mb-1.5">
        {label}{!required && <span className="text-gray-600"> · opcional</span>}
      </p>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/5] bg-black/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.preview} alt={label} className="w-full h-full object-contain" />
          <button type="button" onClick={onClear}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black" aria-label={`Remover ${label.toLowerCase()}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1.5 aspect-[4/5] rounded-xl border border-dashed border-white/15 bg-black/20 text-gray-500 hover:border-brand-emerald/50 hover:text-brand-mint cursor-pointer transition-colors">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          <span className="text-[10px] text-center px-2">JPG ou PNG</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      )}
    </div>
  );
}

export function VideoSlot({ value, onPick, onClear, busy, note }: {
  value?: { preview: string; duration: number } | null; busy?: boolean; note: string;
  onPick: (file?: File) => void; onClear: () => void;
}) {
  return (
    <div>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50">
          <video src={value.preview} className="w-full max-h-56 object-contain" controls muted playsInline loop />
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 font-mono text-[10px] text-brand-mint">{value.duration.toFixed(1)} s</span>
          <button type="button" onClick={onClear}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black" aria-label="Remover vídeo">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-36 rounded-xl border border-dashed border-white/15 bg-black/20 text-gray-500 hover:border-brand-emerald/50 hover:text-brand-mint cursor-pointer transition-colors">
          {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Film className="w-6 h-6" />}
          <span className="text-[11px] text-center px-4">Envie o vídeo que será transformado</span>
          <span className="text-[10px] text-gray-600 text-center px-4">{note}</span>
          <input type="file" accept="video/mp4,video/quicktime" className="hidden"
            onChange={e => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      )}
    </div>
  );
}
