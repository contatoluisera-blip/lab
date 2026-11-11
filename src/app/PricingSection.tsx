'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Check, Loader2, Lock, ShieldCheck, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getAttribution, marketingContext, planValue, track } from '@/lib/client/tracking';
import { BILLING_CYCLES, BillingCycle, PLAN_PRICES, PlanId, cycleTotal, formatBRL } from '@/lib/planConfig';

const CYCLE_ORDER: BillingCycle[] = ['monthly', 'quarterly', 'annual'];

export default function PricingSection() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  // O anual vem marcado: é o que mais rende para quem assina (estudo em docs/projecao-planos.md).
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  const plans = [
    {
      id: 'start' as PlanId,
      name: 'Start',
      description: 'Para quem está começando a profissionalizar sua criação e quer ter acesso às principais ferramentas para analisar, precificar e estruturar melhor seus serviços.',
      subText: 'Ideal para criadores que querem sair do improviso e começar a vender com mais clareza.',
      features: [
        'Acesso ao Diagnóstico de Perfil',
        'Acesso à Calculadora de Orçamento',
        'Hub de Referências e Gerador de Prompts',
        'Acesso limitado ao Gerador de Ideias',
        'Acesso limitado ao Gerador de Propostas',
        'Apoio do Assistente de IA básico',
        'Controle básico de Ações'
      ],
      buttonText: 'Começar com o plano Start',
      featured: false
    },
    {
      id: 'elite' as PlanId,
      name: 'Elite',
      description: 'Para quem quer acessar a Creator Lab no nível mais completo, com ferramentas, conteúdos, gestão e suporte estratégico para operar com mais profissionalismo, consistência e visão de crescimento.',
      subText: 'Ideal para criadores, social medias e profissionais que querem levar a criação mobile para outro patamar.',
      features: [
        'Todos os recursos do plano Pro',
        'Suporte estratégico prioritário',
        'Acesso aos Cursos, Aulas e Lives com Luisera',
        'Conteúdos exclusivos de posicionamento B2B',
        'Consultoria de marca pessoal em grupo'
      ],
      buttonText: 'Quero o plano Elite',
      featured: true
    },
    {
      id: 'pro' as PlanId,
      name: 'Pro',
      description: 'Para quem já atende clientes ou quer acelerar sua evolução com mais recursos, mais estrutura e mais capacidade de transformar análises, ideias e orçamentos em propostas comerciais completas.',
      subText: 'Ideal para quem quer vender com mais autoridade e organizar melhor sua operação.',
      features: [
        'Acesso completo a todas as ferramentas',
        'Hub de Referências e Gerador de Prompts',
        'Análises de Perfil Ilimitadas',
        'Gerador de Ideias & Propostas avançados',
        'Apoio do Assistente de IA completo',
        'Histórico e Controle de Ações completo',
        'Gestão de Clientes integrada'
      ],
      buttonText: 'Entrar no plano Pro',
      featured: false
    }
  ];

  const agency = { id: 'agency' as PlanId, name: 'Agência' };
  const cycleNote = (id: PlanId) => cycle === 'monthly' ? 'Cobrado todo mês' : `${formatBRL(cycleTotal(id, cycle))} ${cycle === 'annual' ? 'por ano' : 'a cada 3 meses'} · créditos todo mês`;

  const handleInitiatePayment = (plan: any) => {
    setSelectedPlan(plan);
    setCheckoutError('');
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setCheckoutError('');

    if (!customerName || !customerEmail || !customerPassword) {
      setCheckoutError('Por favor, preencha todos os campos.');
      setIsProcessing(false);
      return;
    }

    if (!termsAccepted) {
      setCheckoutError('Você precisa concordar com os Termos de Uso e a Política de Privacidade para prosseguir.');
      setIsProcessing(false);
      return;
    }

    if (customerPassword.length < 6) {
      setCheckoutError('A senha de acesso deve conter no mínimo 6 caracteres.');
      setIsProcessing(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, customerEmail, customerPassword);
      const user = userCredential.user;

      await updateProfile(user, { displayName: customerName });

      await setDoc(doc(db, 'users', user.uid), {
        name: customerName,
        email: customerEmail,
        plan: 'free',
        credits: 0,
        createdAt: new Date().toISOString(),
        // De onde a pessoa veio (UTM / anúncio / referência), para medir o que traz assinantes.
        acquisition: getAttribution(),
      });
      track('CompleteRegistration', { content_name: selectedPlan.name });
      track('InitiateCheckout', { value: planValue(selectedPlan.id, cycle), currency: 'BRL', content_name: `${selectedPlan.id}_${cycle}` });

      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName: selectedPlan.id, cycle, marketing: marketingContext() })
      });

      const resData = await response.json();

      if (!response.ok || !resData.url) {
        throw new Error(resData.error || 'Erro ao iniciar o Stripe Checkout.');
      }

      window.location.href = resData.url;

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setCheckoutError('Este E-mail já está em uso! Feche esta tela, clique em "Entrar no App" e assine por dentro do painel.');
      } else {
        setCheckoutError(err.message || 'Falha ao criar conta. Tente novamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex justify-center mb-8">
        <div className="flex gap-1 p-1 rounded-full bg-black/40 border border-white/[0.08]" role="tablist" aria-label="Ciclo de cobrança">
          {CYCLE_ORDER.map(c => (
            <button key={c} type="button" role="tab" aria-selected={cycle === c} onClick={() => setCycle(c)}
              className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-colors', cycle === c ? 'bg-brand-emerald/20 text-white' : 'text-gray-400 hover:text-white')}>
              {BILLING_CYCLES[c].label}
              {c === 'annual' ? <span className="ml-1 text-brand-mint">2 meses grátis</span> : BILLING_CYCLES[c].discount ? <span className="ml-1 text-brand-mint">−{Math.round(BILLING_CYCLES[c].discount * 100)}%</span> : null}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <GlassCard 
            key={plan.name}
            glow={plan.featured}
            className={cn(
              "p-8 flex flex-col h-full relative group transition-all duration-500 border-white/5",
              plan.featured ? "border-brand-emerald/30 shadow-[0_10px_30px_rgba(16,185,129,0.15)] md:scale-105" : "hover:border-white/10"
            )}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-emerald text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                Melhor Valor
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-xl font-extrabold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">{formatBRL(PLAN_PRICES[plan.id][cycle])}</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 mb-4">{cycleNote(plan.id)}</p>
              <p className="text-xs text-gray-400 leading-relaxed min-h-[48px]">{plan.description}</p>
            </div>

            <div className="space-y-3.5 flex-1 mb-8">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                  <Check className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-500 mb-4 leading-normal italic text-center">{plan.subText}</p>

            <Button 
              onClick={() => handleInitiatePayment(plan)}
              variant={plan.featured ? "primary" : "outline"}
              className={cn(
                "w-full h-11 uppercase font-bold text-xs tracking-wider transition-all",
                plan.featured && "shadow-[0_0_15px_rgba(16,185,129,0.3)] text-black"
              )}
            >
              {plan.buttonText}
            </Button>
          </GlassCard>
        ))}
      </div>

      {/* Agências e empresas: volume alto, fora da escolha principal */}
      <GlassCard className="mt-6 p-6 md:p-8 border-white/5 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">Para agências e empresas</span>
          <h3 className="text-xl font-extrabold text-white">Plano Agência · 1.000 créditos por mês</h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
            Tudo do Elite com volume para produzir para vários clientes: imagens, vídeos, montagens de até 5 minutos e o crédito 24% mais barato que no Elite.
          </p>
        </div>
        <div className="md:text-right space-y-3 shrink-0">
          <div>
            <span className="text-3xl font-extrabold text-white">{formatBRL(PLAN_PRICES.agency[cycle])}</span>
            <span className="text-gray-500 text-sm">/mês</span>
            <p className="text-[11px] text-gray-500">{cycleNote('agency')}</p>
          </div>
          <Button onClick={() => handleInitiatePayment(agency)} variant="outline" className="h-11 px-6 uppercase font-bold text-xs tracking-wider">
            Assinar o plano Agência
          </Button>
        </div>
      </GlassCard>

      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded">
                  Registro & Pagamento Seguro
                </span>
                <h3 className="text-2xl font-bold text-white mt-2">Assinar Plano {selectedPlan.name} · {BILLING_CYCLES[cycle].label}</h3>
                <p className="text-brand-mint text-sm mt-1">{formatBRL(PLAN_PRICES[selectedPlan.id as PlanId][cycle])}/mês · {cycleNote(selectedPlan.id)}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Crie sua conta para prosseguir com o pagamento seguro no Stripe.
                </p>
              </div>

              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {checkoutError}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-emerald" /> Credenciais de Acesso
                </h4>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu Nome Completo"
                    autoComplete="off"
                    className="w-full glass-input text-xs"
                  />
                  <input 
                    type="email" 
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="E-mail de Login"
                    autoComplete="off"
                    className="w-full glass-input text-xs"
                  />
                  <input 
                    type="password" 
                    required
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="Defina uma Senha (mín. 6 caracteres)"
                    autoComplete="new-password"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-brand-emerald focus:ring-brand-emerald/50 accent-brand-emerald flex-shrink-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-400 leading-tight cursor-pointer">
                  Eu li e concordo com os{' '}
                  <a href="/termos-de-uso" target="_blank" className="text-brand-emerald hover:underline">Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="/politica-de-privacidade" target="_blank" className="text-brand-emerald hover:underline">Política de Privacidade</a>.
                </label>
              </div>

              <div className="p-4 rounded-xl bg-brand-emerald/5 border border-brand-emerald/10 text-gray-300 text-xs leading-relaxed">
                Você será redirecionado(a) para o checkout criptografado oficial do **Stripe** onde poderá escolher a melhor forma de pagamento.
              </div>

              <div className="pt-2">
                <Button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 text-xs font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.3)] text-black"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-black" /> Criando conta e redirecionando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" /> Avançar para Pagamento
                    </span>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 mt-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Ambiente criptografado e homologado pela Stripe Inc.</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
