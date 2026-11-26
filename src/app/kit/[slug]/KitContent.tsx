'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Sparkles, Wand2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { setGenHandoff } from '@/lib/client/handoff';
import { getModel } from '@/lib/generation';
import type { Kit, KitItem } from '@/lib/kits';

type Blocks = { P: string; R: string };
const storeKey = (slug: string, k: string) => `cl_kit_${slug}_${k}`;
const read = (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* sem armazenamento: vale só nesta visita */ } };
const fill = (p: string, b: Blocks) => p.replaceAll('{P}', b.P.trim()).replaceAll('{R}', b.R.trim());

/** O kit liberado: blocos do personagem, prompts prontos para copiar e o caminho para gerar na Creator Lab. */
export function KitContent({ kit }: { kit: Kit }) {
  const example = useMemo<Blocks>(() => ({
    P: kit.setup?.fields.find(f => f.key === 'P')?.example || '',
    R: kit.setup?.fields.find(f => f.key === 'R')?.example || '',
  }), [kit]);
  // O kit só aparece no navegador (a porta de cadastro vem antes), então dá para ler o que a pessoa
  // escreveu numa visita anterior já no primeiro render.
  const [blocks, setBlocks] = useState<Blocks>(() => ({
    P: read(storeKey(kit.slug, 'P')) ?? example.P,
    R: read(storeKey(kit.slug, 'R')) ?? example.R,
  }));
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

  const update = (key: keyof Blocks, value: string) => {
    setBlocks(b => ({ ...b, [key]: value }));
    write(storeKey(kit.slug, key), value);
  };

  const stepCount = kit.steps.length;
  return (
    <div className="space-y-14">
      {kit.setup && (
        <section aria-labelledby="kit-setup" className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 md:p-7 space-y-5">
          <div className="space-y-2">
            <h2 id="kit-setup" className="text-2xl font-extrabold text-white tracking-tight">Antes de começar</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{kit.setup.intro}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kit.setup.fields.map(f => (
              <label key={f.key} className="grid gap-1.5 min-w-0">
                <span className="font-mono text-xs tracking-wider text-brand-mint">{f.label}</span>
                <span className="text-xs text-gray-500">{f.hint}</span>
                <textarea value={blocks[f.key]} onChange={e => update(f.key, e.target.value)} rows={8} spellCheck={false}
                  className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 p-3 font-mono text-xs leading-relaxed text-gray-200 focus:outline-none focus:border-brand-emerald/50" />
              </label>
            ))}
          </div>
          <button type="button" onClick={() => { update('P', example.P); update('R', example.R); }} className="text-xs text-gray-500 underline hover:text-gray-300">
            Voltar ao exemplo do vídeo
          </button>
        </section>
      )}

      {kit.steps.map((step, i) => {
        const n = i + 1;
        return (
          <section key={step.title} className="space-y-4">
            <header className="flex items-baseline gap-3 border-t border-white/[0.07] pt-6">
              <span className="text-3xl font-extrabold text-brand-mint leading-none tabular-nums">{n}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{step.title}</h2>
            </header>
            <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{step.why}</p>
            <div className="space-y-3">
              {step.items.map(item => <PromptCard key={item.title} kit={kit} item={item} blocks={blocks} onZoom={setZoom} />)}
            </div>
          </section>
        );
      })}

      {kit.assembly && (
        <section className="space-y-4">
          <header className="flex items-baseline gap-3 border-t border-white/[0.07] pt-6">
            <span className="text-3xl font-extrabold text-brand-mint leading-none tabular-nums">{stepCount + 1}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{kit.assembly.title}</h2>
          </header>
          <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">{kit.assembly.why}</p>
          <ol className="grid gap-2.5">
            {kit.assembly.order.map((o, i) => (
              <li key={o.title} className="grid grid-cols-[36px_1fr] gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <span className="text-xl font-extrabold text-brand-mint leading-none">{i + 1}</span>
                <span><b className="block text-white text-sm">{o.title}</b><span className="text-sm text-gray-400">{o.line}</span></span>
              </li>
            ))}
          </ol>
          {kit.assembly.extras?.map(item => <PromptCard key={item.title} kit={kit} item={item} blocks={blocks} onZoom={setZoom} />)}
        </section>
      )}

      {kit.tips && (
        <section className="space-y-4">
          <header className="flex items-baseline gap-3 border-t border-white/[0.07] pt-6">
            <Sparkles className="w-6 h-6 text-brand-mint" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">O que fez diferença</h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kit.tips.map(t => (
              <div key={t.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <b className="block text-brand-mint text-sm mb-1">{t.title}</b>
                <span className="text-sm text-gray-400">{t.line}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {zoom && (
        <div role="dialog" aria-modal="true" aria-label="Imagem ampliada" onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
          <button type="button" aria-label="Fechar" className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"><X className="w-5 h-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.src} alt={zoom.alt} className="max-h-[92vh] max-w-[min(92vw,560px)] rounded-xl" />
        </div>
      )}
    </div>
  );
}

function PromptCard({ kit, item, blocks, onZoom }: { kit: Kit; item: KitItem; blocks: Blocks; onZoom: (z: { src: string; alt: string }) => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const text = edited ?? fill(item.prompt, blocks);
  const model = item.modelId ? getModel(item.modelId) : undefined;
  const img = item.img ? `/kits/${kit.slug}/${item.img}.jpg` : null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* sem permissão: a pessoa seleciona o texto */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Logado: leva o prompt e o modelo para a geração. Sem conta: leva à oferta.
  const generate = () => {
    if (!user) { document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!model) return;
    if (model.kind === 'audio') { router.push('/dashboard/audio'); return; }
    const mode = model.kind === 'image' ? 'i2i' : 'r2v';
    setGenHandoff({ kind: model.kind, mode, prompt: text, modelId: model.id, source: `kit:${kit.slug}` });
    router.push(model.kind === 'image' ? '/dashboard/imagens' : '/dashboard/videos');
  };

  return (
    <article className={`grid gap-4 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 ${img ? 'grid-cols-1 sm:grid-cols-[130px_1fr]' : ''}`}>
      {img && (
        <button type="button" onClick={() => onZoom({ src: img, alt: item.title })} aria-label={`Ampliar ${item.title}`}
          className="w-[110px] sm:w-full aspect-[9/16] rounded-xl overflow-hidden bg-black cursor-zoom-in self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
        </button>
      )}
      <div className="grid gap-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-white">{item.title}</h3>
          <div className="flex flex-wrap gap-2">
            {item.modelId && (
              <button type="button" onClick={generate}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-emerald/40 px-3.5 py-2 text-xs font-bold text-brand-mint hover:bg-brand-emerald/10 transition-colors">
                <Wand2 className="w-3.5 h-3.5" /> Gerar na Creator Lab
              </button>
            )}
            <button type="button" onClick={copy}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${copied ? 'bg-white text-black' : 'bg-gradient-to-b from-brand-mint to-brand-neon text-[#03140d]'}`}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar prompt</>}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="font-mono text-[11px] px-2 py-1 rounded-md border border-brand-emerald/40 text-brand-mint">{item.tool}</span>
          {item.refs?.map(r => <span key={r} className="font-mono text-[11px] px-2 py-1 rounded-md border border-white/[0.08] bg-black/30 text-gray-400">{r}</span>)}
        </div>
        {item.note && <p className="text-xs text-gray-400">{item.note}</p>}
        <textarea value={text} onChange={e => setEdited(e.target.value)} rows={6} spellCheck={false} aria-label={`Prompt: ${item.title}`}
          className="w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 p-3 font-mono text-xs leading-relaxed text-gray-200 focus:outline-none focus:border-brand-emerald/50" />
      </div>
    </article>
  );
}
