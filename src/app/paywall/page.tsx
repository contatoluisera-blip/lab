'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  Check, 
  Zap, 
  LogOut,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { BILLING_CYCLES, BillingCycle, PLAN_CONFIGS, PLAN_PRICES, cycleDiscount, cycleTotal, formatBRL, isAgencyPlan } from '@/lib/planConfig';
import { PLAN_CARDS, PlanCard } from '@/lib/planCards';
import { marketingContext, planValue, track } from '@/lib/client/tracking';

const CYCLE_ORDER: BillingCycle[] = ['monthly', 'quarterly', 'annual'];

export default function PaywallPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // O anual vem marcado, como na página inicial (estudo em docs/projecao-planos.md).
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  const handleInitiatePayment = async (plan: PlanCard) => {
    setIsProcessing(true);
    try {
      track('InitiateCheckout', { value: planValue(plan.id, cycle), currency: 'BRL', content_name: `${plan.id}_${cycle}` });
      const token = await user?.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName: plan.id, cycle, marketing: marketingContext() })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao iniciar pagamento.');
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black/90 flex flex-col items-center py-12 px-4 selection:bg-brand-emerald/30 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-[-20%] right-[10%] w-[60%] h-[60%] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-6xl relative z-10">
        
        {/* Header & Logout */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Bem-vindo ao Creator Lab</h1>
            <p className="text-lg text-gray-400">
              Sua conta gratuita foi criada. Escolha um plano para ativar seu acesso imediato à plataforma.
            </p>
          </div>
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>

        {/* Plans Section */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-neon" />
              Opções de Assinatura
            </h2>
            <div className="flex gap-1 p-1 rounded-full bg-black/40 border border-white/[0.08]" role="tablist" aria-label="Ciclo de cobrança">
              {CYCLE_ORDER.map(c => (
                <button key={c} type="button" role="tab" aria-selected={cycle === c} onClick={() => setCycle(c)}
                  className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-colors', cycle === c ? 'bg-brand-emerald/20 text-white' : 'text-gray-400 hover:text-white')}>
                  {BILLING_CYCLES[c].label}{BILLING_CYCLES[c].discount ? <span className="ml-1 text-brand-mint">{c === 'annual' ? 'até ' : ''}−{Math.round(BILLING_CYCLES[c].discount * 100)}%</span> : null}
                </button>
              ))}
            </div>
          </div>

          {[
            { title: 'Criadores', cards: PLAN_CARDS.filter(p => !isAgencyPlan(p.id)) },
            { title: 'Corporativo: agências e empresas', cards: PLAN_CARDS.filter(p => isAgencyPlan(p.id)) },
          ].map(group => (
          <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{group.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {group.cards.map((plan) => (
              <GlassCard
                key={plan.id}
                glow={plan.featured}
                className={cn(
                  "p-8 flex flex-col h-full relative group transition-all duration-500 hover:scale-[1.02]",
                  plan.featured && "border-brand-neon/30 hover:border-brand-neon/60"
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-neon text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                    Melhor Valor
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{PLAN_CONFIGS[plan.id].label}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{formatBRL(PLAN_PRICES[plan.id][cycle])}</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 mb-4 min-h-[16px]">
                    {cycle === 'monthly' ? 'Cobrado todo mês' : `${formatBRL(cycleTotal(plan.id, cycle))} ${cycle === 'annual' ? 'por ano' : 'a cada 3 meses'} (−${Math.round(cycleDiscount(plan.id, cycle) * 100)}%) · créditos todo mês`}
                  </p>
                  <p className="text-sm text-gray-400 leading-relaxed min-h-[40px]">{plan.description}</p>
                </div>

                <div className="space-y-4 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm group/item">
                      <div className="mt-1 w-4 h-4 rounded-full bg-brand-emerald/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-brand-emerald/20 transition-colors">
                        <Check className="w-2.5 h-2.5 text-brand-emerald" />
                      </div>
                      <span className="text-gray-300 group-hover/item:text-white transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  className="w-full transition-all duration-300"
                  disabled={isProcessing}
                  onClick={() => handleInitiatePayment(plan)}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Contratar Plano
                </Button>
              </GlassCard>
            ))}
          </div>
          </div>
          ))}
        </div>

      </div>
    </div>
  );
}
