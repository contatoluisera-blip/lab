'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { marketingContext, track } from '@/lib/client/tracking';
import type { Kit } from '@/lib/kits';

const keyFor = (slug: string) => `cl_kit_${slug}`;

function readUnlocked(slug: string) {
  // Links dos e-mails (?acesso=email): a pessoa já deixou o e-mail, talvez em outro aparelho.
  if (new URLSearchParams(window.location.search).get('acesso') === 'email') return true;
  try { return window.localStorage.getItem(keyFor(slug)) === '1'; } catch { return false; }
}

/**
 * Porta do kit: nome, e-mail e aceite antes dos prompts. Quem já liberou neste aparelho,
 * chegou pelo link do e-mail ou está logado vai direto ao kit.
 */
export function KitGate({ kit, children }: { kit: Kit; children: React.ReactNode }) {
  const { user } = useAuth();
  const stored = useSyncExternalStore(() => () => {}, () => readUnlocked(kit.slug), () => false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (user || stored || justUnlocked) return <>{children}</>;

  const thumbs = kit.steps.flatMap(s => s.items).filter(i => i.img).slice(0, 6);
  const total = kit.steps.reduce((n, s) => n + s.items.length, 0) + (kit.assembly?.extras?.length || 0);

  return (
    <main className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-8 md:pt-12 pb-24 space-y-20">
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.75fr_1fr] gap-8 lg:gap-10 items-center">
        <div className="space-y-5 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 text-[11px] font-bold uppercase tracking-widest text-brand-mint">
            <Sparkles className="w-3.5 h-3.5" /> {kit.eyebrow}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05] text-balance">
            {kit.title} {kit.accent && <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">{kit.accent}</span>}
          </h1>
          <p className="text-base text-gray-400 leading-relaxed">{kit.gate.sub}</p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-2">
            {kit.tools.map(t => (
              <span key={t.label} className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300">
                <b className="text-brand-mint font-semibold">{t.label}</b> {t.value}
              </span>
            ))}
          </div>
        </div>
        {kit.video && (
          <div className="mx-auto w-full max-w-[260px] rounded-[28px] overflow-hidden border border-white/10 bg-black aspect-[9/16] shadow-[0_30px_80px_-30px_rgba(16,185,129,0.6)]">
            <video src={kit.video} poster={kit.poster} autoPlay muted loop playsInline aria-label="O vídeo do kit" className="w-full h-full object-cover" />
          </div>
        )}
        <KitLeadForm kit={kit} onDone={() => {
          try { window.localStorage.setItem(keyFor(kit.slug), '1'); } catch { /* navegação privada: libera só nesta visita */ }
          setJustUnlocked(true);
          window.scrollTo({ top: 0 });
        }} />
      </section>

      {/* Prévia do que está dentro */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {total} prompts, <span className="text-brand-mint">na ordem em que foram gerados.</span>
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {kit.steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <span className="font-extrabold text-brand-mint text-xl leading-none w-6 shrink-0">{i + 1}</span>
              <span>
                <b className="block text-white text-sm">{s.title}</b>
                <span className="text-xs text-gray-500">{s.items.length} {s.items.length === 1 ? 'prompt' : 'prompts'}</span>
              </span>
            </li>
          ))}
        </ol>
        {thumbs.length > 0 && (
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 blur-[6px] opacity-60 select-none pointer-events-none" aria-hidden>
              {thumbs.map(t => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={t.img} src={`/kits/${kit.slug}/${t.img}.jpg`} alt="" className="w-full aspect-[9/16] object-cover rounded-xl" />
              ))}
            </div>
            <a href="#liberar" className="absolute inset-0 m-auto h-fit w-fit inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-b from-brand-mint to-brand-neon text-[#03140d] font-bold text-sm">
              <Lock className="w-4 h-4" /> Liberar o kit
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

function KitLeadForm({ kit, onDone }: { kit: Kit; onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // armadilha para robôs: campo invisível
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) { setError('Preencha seu nome e e-mail.'); return; }
    if (!consent) { setError('Marque o aceite para receber o kit e os materiais.'); return; }
    setSending(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/kit/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: kit.slug, name, email, consent, website, keyword: params.get('k') || params.get('palavra') || '', marketing: marketingContext() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível liberar agora.');
      track('Lead', { content_name: `kit_${kit.slug}` });
      onDone();
    } catch (err: any) {
      setError(err.message || 'Não foi possível liberar agora. Tente de novo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="liberar" className="relative scroll-mt-10">
      <div className="absolute -inset-4 bg-brand-emerald/15 blur-[80px] rounded-[40px] pointer-events-none" />
      <form onSubmit={submit} className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] backdrop-blur-xl p-6 md:p-7 space-y-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">{kit.gate.headline}</h2>
          <p className="text-xs text-gray-500">Gratuito. Você também recebe o link no e-mail.</p>
        </div>
        <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] w-px h-px opacity-0" />
        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        <label className="relative block">
          <span className="sr-only">Seu nome</span>
          <User className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoComplete="given-name" className="w-full glass-input pl-10 text-sm h-12" />
        </label>
        <label className="relative block">
          <span className="sr-only">Seu melhor e-mail</span>
          <Mail className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu melhor e-mail" autoComplete="email" className="w-full glass-input pl-10 text-sm h-12" />
        </label>
        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 accent-brand-emerald shrink-0 cursor-pointer" />
          <span className="text-[11px] text-gray-400 leading-snug">
            Quero receber o kit e os materiais da Creator Lab por e-mail. Posso cancelar quando quiser.{' '}
            <a href="/politica-de-privacidade" target="_blank" className="text-brand-emerald hover:underline">Política de privacidade</a>.
          </span>
        </label>
        <Button type="submit" disabled={sending || !consent}
          className={`w-full h-14 rounded-full text-sm font-bold text-black transition-all ${(!consent || sending) ? 'opacity-50 cursor-not-allowed shadow-none' : 'shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:brightness-110'}`}>
          {sending
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Liberando...</span>
            : <span className="flex items-center justify-center gap-2">Liberar o kit <ArrowRight className="w-5 h-5" /></span>}
        </Button>
        <p className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald/60" /> Seus dados ficam com a gente. Zero spam.
        </p>
        <ul className="grid grid-cols-1 gap-1.5 pt-2 border-t border-white/5">
          {kit.gate.perks.map(t => (
            <li key={t} className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" /> {t}</li>
          ))}
        </ul>
      </form>
    </div>
  );
}
