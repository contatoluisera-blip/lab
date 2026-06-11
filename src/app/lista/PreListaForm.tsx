'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, Phone, ShieldCheck, Smartphone, User } from 'lucide-react';

export default function PreListaForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    if (!name || !email) {
      setError('Por favor, preencha seu nome e e-mail.');
      setIsSubmitting(false);
      return;
    }
    try {
      await addDoc(collection(db, 'pre_list'), {
        name,
        email,
        instagram,
        whatsapp,
        status: 'registered',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Erro ao registrar:', err);
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-brand-emerald/8 blur-[90px] rounded-[3rem] pointer-events-none" />
      <GlassCard className="relative p-8 space-y-7 bg-gradient-to-br from-[#0c0c0c] to-[#050505] border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {isSuccess ? (
          <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-16 h-16 bg-brand-emerald/10 border border-brand-emerald/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">Você está dentro!</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Fique de olho no seu e-mail. Em breve você vai receber o link de acesso antecipado com o desconto exclusivo de fundador — e vai ser um dos primeiros a entrar no laboratório.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = '/')}
              className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-300 transition-colors mt-2"
            >
              Voltar para a página principal
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Garantir meu lugar na pré-lista</h3>
              <p className="text-xs text-gray-500 font-light">100% gratuito. Sem cartão de crédito. Cancele quando quiser.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full glass-input pl-10 text-sm h-12"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor E-mail"
                  className="w-full glass-input pl-10 text-sm h-12"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Smartphone className="w-4 h-4 text-gray-600" />
                </div>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@SeuInstagram (opcional)"
                  className="w-full glass-input pl-10 text-sm h-12"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp com DDD (opcional)"
                  className="w-full glass-input pl-10 text-sm h-12"
                />
              </div>

              <div className="flex items-start gap-3 mt-4 mb-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-brand-emerald focus:ring-brand-emerald/50 accent-brand-emerald flex-shrink-0 cursor-pointer"
                />
                <label htmlFor="consent" className="text-[11px] text-gray-400 leading-tight cursor-pointer">
                  Concordo em receber atualizações e novidades da Creator Lab por e-mail e WhatsApp.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !consent}
                className={`w-full h-14 text-sm font-bold uppercase tracking-wider text-black mt-1 transition-all ${(!consent || isSubmitting) ? 'opacity-50 cursor-not-allowed shadow-none' : 'shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:brightness-110'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Registrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar na Pré-Lista <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald/60" />
                <span>Seus dados são privados. Zero spam.</span>
              </div>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}
