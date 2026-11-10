'use client';

import React, { useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { BRAND_FONTS, BRAND_LIMITS, BrandFontId, BrandKit, BrandLettering, LETTERING_ROLES, LetteringRole, isHex, normalizeHex } from '@/lib/brand';

/** Xadrez atrás dos letterings: mostra o que é transparente de verdade. */
export const CHECKER: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  backgroundImage: 'conic-gradient(#3a3a3a 25%, transparent 0 50%, #3a3a3a 0 75%, transparent 0)',
  backgroundSize: '18px 18px',
};

const field = 'w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/50';
const card = 'rounded-2xl border border-white/[0.07] bg-black/30 p-4 md:p-5 space-y-4';
const roleLabel = (r: LetteringRole) => LETTERING_ROLES.find(x => x.id === r)?.label || r;

export function SectionHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{title}</h2>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{hint}</p>
    </div>
  );
}

function ColorField({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} aria-label={label} className="w-9 h-9 shrink-0 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
      <span className="font-mono text-xs text-gray-300">{value}</span>
    </span>
  );
}

export interface BrandKitEditorProps {
  kit: BrandKit;
  busy: string;
  onBack: () => void;
  onDelete: () => void;
  /** Muda a ID Visual; `save` falso guarda só na tela (digitação em andamento). */
  onChange: (patch: Partial<BrandKit>, save?: boolean) => void;
  onCommit: () => void;
  onUploadRef: (file: File) => void;
  /** Vários arquivos de uma vez: os transparentes entram direto; os com fundo passam pela revisão. */
  onUploadLettering: (files: File[]) => void;
  /** Gerador de lettering e revisão, que falam com o servidor. */
  children?: React.ReactNode;
}

/** Tela de uma ID Visual: cores, referências, letterings e estilo do texto. */
export function BrandKitEditor({ kit, busy, onBack, onDelete, onChange, onCommit, onUploadRef, onUploadLettering, children }: BrandKitEditorProps) {
  const [newColor, setNewColor] = useState('#34d399');
  const [typed, setTyped] = useState('');
  const refInput = useRef<HTMLInputElement>(null);
  const letteringInput = useRef<HTMLInputElement>(null);

  const addColor = (raw: string) => {
    const hex = normalizeHex(raw);
    if (!isHex(hex) || kit.colors.includes(hex) || kit.colors.length >= BRAND_LIMITS.colors) return;
    onChange({ colors: [...kit.colors, hex] });
    setTyped('');
  };
  const suggestions = [...new Set(kit.colorRefs.flatMap(r => r.palette))].filter(c => !kit.colors.includes(c)).slice(0, 12);
  const patchLettering = (id: string, patch: Partial<BrandLettering>, save = true) =>
    onChange({ letterings: kit.letterings.map(l => (l.id === id ? { ...l, ...patch } : l)) }, save);
  const typedHex = normalizeHex(typed);

  return (
    <div className="space-y-6 pb-24 max-w-5xl">
      <header className="space-y-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-gray-300 hover:text-white hover:border-brand-emerald/50 hover:bg-brand-emerald/10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar à biblioteca
        </button>
        <div className="flex items-center gap-3">
          <input value={kit.name} maxLength={BRAND_LIMITS.name} onChange={e => onChange({ name: e.target.value }, false)} onBlur={onCommit} aria-label="Nome da ID Visual"
            className="flex-1 min-w-0 bg-transparent text-3xl font-bold text-white tracking-tight outline-none border-b border-transparent focus:border-brand-emerald/40" />
          {busy && <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {busy}</span>}
          <button type="button" onClick={onDelete} aria-label="Apagar ID Visual" className="p-2 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <section className={card} aria-label="Cores">
          <SectionHead title="Cores" hint="A 1ª cor é o fundo da chamada final, e a 2ª é o destaque. Todas vão para o Gerador de Prompts e para os letterings gerados." />
          <div className="flex flex-wrap gap-2">
            {kit.colors.map(c => (
              <span key={c} className="flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
                <span className="font-mono text-[11px] text-gray-300">{c}</span>
                <button type="button" onClick={() => onChange({ colors: kit.colors.filter(x => x !== c) })} aria-label={`Remover a cor ${c}`} className="p-0.5 text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {!kit.colors.length && <p className="text-xs text-gray-500">Nenhuma cor ainda.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="color" value={newColor} onChange={e => { setNewColor(e.target.value); setTyped(e.target.value); }} aria-label="Escolher cor" className="w-9 h-9 shrink-0 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
            <input value={typed} onChange={e => setTyped(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(typed); } }} placeholder="#00ffaa" maxLength={7} aria-label="Código da cor"
              className={`${field} !w-28 font-mono`} />
            <button type="button" onClick={() => addColor(typed)} disabled={!isHex(typedHex) || kit.colors.length >= BRAND_LIMITS.colors}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/25 disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
        </section>

        <section className={card} aria-label="Referências de cor">
          <SectionHead title="Referências de cor" hint={`Até ${BRAND_LIMITS.refs} imagens: manual da marca, post, paleta. Elas guiam o lettering gerado, e as cores dominantes viram sugestões.`} />
          <div className="grid grid-cols-4 gap-2">
            {kit.colorRefs.map(r => (
              <div key={r.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt="Referência de cor" className="w-full h-full object-cover" />
                <button type="button" onClick={() => onChange({ colorRefs: kit.colorRefs.filter(x => x.id !== r.id) })} aria-label="Remover referência" className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-gray-200 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {kit.colorRefs.length < BRAND_LIMITS.refs && (
              <button type="button" onClick={() => refInput.current?.click()} className="aspect-square rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-brand-mint hover:border-brand-emerald/40">
                <ImagePlus className="w-5 h-5" /> <span className="text-[10px]">Enviar</span>
              </button>
            )}
          </div>
          <input ref={refInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUploadRef(f); }} />
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-500">Toque para adicionar à paleta:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(c => <button key={c} type="button" onClick={() => addColor(c)} title={c} aria-label={`Adicionar a cor ${c}`} className="w-7 h-7 rounded-full border border-white/20 hover:scale-110 transition-transform" style={{ background: c }} />)}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className={card} aria-label="Letterings">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHead title="Letterings" hint="Envie vários PNG de uma vez (fundo transparente entra direto; com fundo, você revisa o recorte). O nome do arquivo vira o nome, e palavras como logo, cta ou gancho definem a função." />
          <button type="button" onClick={() => letteringInput.current?.click()} disabled={kit.letterings.length >= BRAND_LIMITS.letterings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/25 disabled:opacity-40">
            <Upload className="w-3.5 h-3.5" /> Enviar letterings
          </button>
        </div>
        <input ref={letteringInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) onUploadLettering(files); }} />
        {kit.letterings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kit.letterings.map(l => (
              <article key={l.id} className="rounded-xl border border-white/[0.07] overflow-hidden">
                <div className="h-32 flex items-center justify-center p-3" style={CHECKER}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.url} alt={l.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-2.5 space-y-2 bg-black/40">
                  <input value={l.name} maxLength={BRAND_LIMITS.letteringName} onChange={e => patchLettering(l.id, { name: e.target.value }, false)} onBlur={onCommit} aria-label="Nome do lettering" className={`${field} !py-1.5 !text-xs`} />
                  <div className="flex items-center gap-2">
                    <select value={l.role} onChange={e => patchLettering(l.id, { role: e.target.value as LetteringRole })} aria-label={`Função de ${l.name}`} className={`${field} !py-1.5 !text-xs`}>
                      {LETTERING_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <button type="button" onClick={() => onChange({ letterings: kit.letterings.filter(x => x.id !== l.id) })} aria-label={`Remover ${roleLabel(l.role)} ${l.name}`} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 p-4 rounded-xl border border-dashed border-white/10">Ainda não há letterings nesta ID Visual. Envie os seus ou gere um abaixo, usando as cores e referências acima.</p>
        )}
        {children}
      </section>

      <section className={card} aria-label="Texto na tela">
        <SectionHead title="Texto na tela" hint="Para as frases que mudam em cada vídeo, que o Claude escreve na edição. Também vale para a chamada final." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <label className="space-y-1.5">
            <span className="text-xs text-gray-400">Fonte</span>
            <select value={kit.textStyle.fontId} onChange={e => onChange({ textStyle: { ...kit.textStyle, fontId: e.target.value as BrandFontId } })} className={field}>
              {BRAND_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs text-gray-400">Cor do texto</span>
            <ColorField value={kit.textStyle.textColor} label="Cor do texto" onChange={hex => onChange({ textStyle: { ...kit.textStyle, textColor: hex } })} />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={kit.textStyle.boxColor !== null} onChange={e => onChange({ textStyle: { ...kit.textStyle, boxColor: e.target.checked ? '#000000' : null } })} className="accent-emerald-400" /> Tarja atrás do texto
            </label>
            {kit.textStyle.boxColor !== null
              ? <ColorField value={kit.textStyle.boxColor} label="Cor da tarja" onChange={hex => onChange({ textStyle: { ...kit.textStyle, boxColor: hex } })} />
              : <p className="text-[11px] text-gray-500 h-9 flex items-center">Sem tarja, o texto ganha uma sombra.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
