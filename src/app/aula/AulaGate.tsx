'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, GraduationCap, Loader2, Lock, Mail, PlayCircle, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { marketingContext, track } from '@/lib/client/tracking';

const UNLOCK_KEY = 'cl_aula_liberada';

function readUnlocked() {
  try { return window.localStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
}
function saveUnlocked() {
  try { window.localStorage.setItem(UNLOCK_KEY, '1'); } catch { /* navegação privada: libera só nesta visita */ }
}

/**
 * Porta da página da aula: antes do vídeo, nome, e-mail e aceite para receber materiais.
 * Quem já liberou neste aparelho, ou está logado, vai direto para a aula.
 * `guide` é o guia da Creator Lab mostrado abaixo do formulário enquanto a aula está fechada.
 */
export function AulaGate({ guide, children }: { guide: React.ReactNode; children: React.ReactNode }) {
  const { user } = useAuth();
  // Liberação guardada neste aparelho (no servidor, sempre fechada).
  const stored = useSyncExternalStore(() => () => {}, readUnlocked, () => false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (user || stored || justUnlocked) return <>{children}</>;

  return (
    <main className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-24 space-y-24 md:space-y-32">
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 text-[11px] font-bold uppercase tracking-widest text-brand-mint">
            <PlayCircle className="w-3.5 h-3.5" /> Aula gratuita · 13 minutos
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
            Libere a aula e veja o que dá para criar <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">com uma ideia simples.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Deixe seu nome e e-mail para assistir agora. Logo abaixo, um guia rápido do que a Creator Lab faz por você.
          </p>
          <div className="flex items-start gap-3 text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 max-w-xl mx-auto lg:mx-0">
            <GraduationCap className="w-5 h-5 text-brand-mint shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong className="text-white">Bônus no seu e-mail:</strong> uma aula mostrando como os personagens são criados dentro da Creator Lab, do primeiro frame ao vídeo pronto.
            </p>
          </div>
        </div>
        <LeadForm onDone={() => { saveUnlocked(); setJustUnlocked(true); window.scrollTo({ top: 0 }); }} />
      </section>

      {guide}

      <section className="text-center space-y-5">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight text-balance">Pronto para ver na prática?</h2>
        <a href="#liberar" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-b from-brand-mint to-brand-neon text-[#03140d] font-bold hover:brightness-110 transition">
          <Lock className="w-4 h-4" /> Liberar minha aula
        </a>
      </section>
    </main>
  );
}

function LeadForm({ onDone }: { onDone: () => void }) {
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
    if (!consent) { setError('Marque o aceite para receber a aula e os materiais.'); return; }
    setSending(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/aula/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, consent, website, keyword: params.get('k') || params.get('palavra') || '', marketing: marketingContext() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível liberar agora.');
      track('Lead', { content_name: 'aula' });
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
      <form onSubmit={submit} className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] backdrop-blur-xl p-6 md:p-8 space-y-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Assistir à aula agora</h2>
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
            Quero receber a aula e os materiais da Creator Lab por e-mail. Posso cancelar quando quiser.{' '}
            <a href="/politica-de-privacidade" target="_blank" className="text-brand-emerald hover:underline">Política de privacidade</a>.
          </span>
        </label>
        <Button type="submit" disabled={sending || !consent}
          className={`w-full h-14 rounded-full text-sm font-bold text-black transition-all ${(!consent || sending) ? 'opacity-50 cursor-not-allowed shadow-none' : 'shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:brightness-110'}`}>
          {sending
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Liberando...</span>
            : <span className="flex items-center justify-center gap-2">Liberar a aula <ArrowRight className="w-5 h-5" /></span>}
        </Button>
        <p className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald/60" /> Seus dados ficam com a gente. Zero spam.
        </p>
        <ul className="grid grid-cols-1 gap-1.5 pt-2 border-t border-white/5">
          {['Aula completa liberada na hora', 'Aula de criação de personagens no e-mail', 'Condição exclusiva para assinar depois da aula'].map(t => (
            <li key={t} className="flex items-center gap-2 text-xs text-gray-400"><CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" /> {t}</li>
          ))}
        </ul>
      </form>
    </div>
  );
}
