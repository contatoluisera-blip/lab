'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Check, 
  Zap, 
  History,
  ShieldCheck,
  Star,
  Download,
  X,
  Copy,
  QrCode,
  FileText,
  Loader2,
  Calendar,
  User,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PLAN_CONFIGS, PlanId } from '@/lib/planConfig';

export default function BillingPage() {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState(0); // 0 = loading/no plan
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load real plan from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const plan = (data.plan || '').toLowerCase();
          setCurrentPlanName(plan);
          setUserCredits(data.credits ?? null);
          // Map plan name to tier number
          if (plan === 'elite') setCurrentTier(3);
          else if (plan === 'pro') setCurrentTier(2);
          else if (plan === 'start') setCurrentTier(1);
          else setCurrentTier(0);
        }
      } catch (e) {
        console.error('Erro ao carregar perfil de faturamento:', e);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');


  const plans = [
    {
      name: 'Start',
      price: 'R$ 67',
      tier: 1,
      description: 'Ideal para criadores que querem sair do improviso e vender com mais clareza.',
      features: ['20 créditos de IA/mês', 'Diagnóstico de Perfil', 'Calculadora de Orçamento', 'Gerador de Ideias'],
      buttonText: 'Fazer Upgrade',
      featured: false
    },
    {
      name: 'Pro',
      price: 'R$ 117',
      tier: 2,
      description: 'Para quem quer vender com mais autoridade e organizar melhor sua operação.',
      features: ['50 créditos de IA/mês', 'Acesso completo a todas as ferramentas', 'Gerador de Ideias & Propostas', 'Gestão de Clientes', 'Suporte via e-mail'],
      buttonText: 'Seu Plano',
      featured: true
    },
    {
      name: 'Elite',
      price: 'R$ 197',
      tier: 3,
      description: 'Para criadores que querem levar a criação mobile para outro patamar.',
      features: ['100 créditos de IA/mês', 'Tudo do plano Pro', 'Cursos e Lives com Luisera', 'Suporte prioritário 24/7', 'Consultoria de marca pessoal'],
      buttonText: 'Fazer Upgrade',
      featured: false
    }
  ];

  const [billingHistory, setBillingHistory] = useState([
    { id: '1', date: '15 Abr, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242', plan: 'Creator Pro' },
    { id: '2', date: '15 Mar, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242', plan: 'Creator Pro' },
    { id: '3', date: '15 Fev, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242', plan: 'Creator Pro' },
  ]);

  const handleInitiatePayment = async (plan: any) => {
    setIsProcessing(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName: plan.name })
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

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao acessar o portal');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao acessar o portal de assinaturas.');
      setIsProcessing(false);
    }
  };

  // Pagar.me modal logic removed in favor of Stripe Checkout.

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Planos e Faturamento</h1>
        <p className="text-gray-400">Gerencie sua assinatura, visualize seu faturamento e faça upgrade para novas funcionalidades.</p>
      </div>

      {/* Current Plan Overview */}
      <GlassCard className="!p-0 overflow-hidden border-brand-emerald/20">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-8 flex-1 flex flex-col justify-between gap-6 relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-32 h-32 text-brand-emerald" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-emerald">Status da Conta</span>
              </div>
              <h2 className="text-3xl font-bold text-white">
                {profileLoading
                  ? 'Carregando...'
                  : currentTier === 0
                  ? 'Sem Plano Ativo'
                  : `Plano Creator ${currentTier === 3 ? 'Elite' : currentTier === 2 ? 'Pro' : 'Start'}`
                }
              </h2>
              <p className="text-gray-400 mt-1">
                Sua assinatura renova em {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </div>

            <div className="relative z-10 max-w-sm">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Créditos desta fatura</span>
                <span className="text-brand-mint font-medium">
                  {userCredits !== null ? `${userCredits}/${PLAN_CONFIGS[currentPlanName as PlanId]?.credits || 20} créditos restantes` : '—'}
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                  style={{ width: userCredits !== null ? `${Math.min((userCredits / (PLAN_CONFIGS[currentPlanName as PlanId]?.credits || 20)) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="p-8 md:w-80 flex flex-col items-center justify-center text-center bg-white/[0.02]">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Valor Mensal</p>
              <p className="text-4xl font-extrabold text-white tracking-tight mb-4">
                {currentTier === 3 ? 'R$ 197,00' : currentTier === 2 ? 'R$ 117,00' : currentTier === 1 ? 'R$ 67,00' : '—'}
              </p>
              {currentTier > 0 && (
                <Button 
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full text-xs py-2 h-auto"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Plans Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-neon" />
            Opções de Assinatura
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <GlassCard 
              key={plan.name}
              glow={plan.featured}
              className={cn(
                "p-8 flex flex-col h-full relative group transition-all duration-500",
                plan.tier === currentTier ? "border-brand-emerald/40 ring-1 ring-brand-emerald/20" : "hover:scale-[1.02]",
                plan.featured && "border-brand-neon/30 hover:border-brand-neon/60"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-neon text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                  Melhor Valor
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
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
                variant={plan.tier === currentTier ? "outline" : "primary"}
                className={cn(
                  "w-full transition-all duration-300",
                  plan.tier === currentTier && "bg-white/5 text-gray-400 border-white/10 cursor-default"
                )}
                disabled={plan.tier === currentTier}
                onClick={() => handleInitiatePayment(plan)}
              >
                {plan.tier === currentTier ? 'Plano Atual' : 'Contratar Plano'}
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-brand-emerald" />
          Histórico de Faturamento
        </h2>
        <GlassCard className="!p-0 overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 font-semibold text-gray-300">Data</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Plano</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Valor</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Pagamento</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-300 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {billingHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-gray-300">{item.date}</td>
                    <td className="px-6 py-4 text-gray-400">{item.plan}</td>
                    <td className="px-6 py-4 text-white font-medium">{item.amount}</td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-xs">{item.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-brand-emerald/10 text-brand-emerald text-[10px] font-bold uppercase tracking-wider border border-brand-emerald/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-2 text-brand-mint hover:text-brand-emerald transition-colors text-xs font-medium">
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Pagar.me modal removed */}
    </div>
  );
}
