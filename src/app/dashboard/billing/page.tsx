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
  CheckCircle2,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { marketingContext, planValue, track } from '@/lib/client/tracking';
import { formatDate } from '@/lib/accountState';
import {
  BILLING_CYCLES, BillingCycle, PLAN_CONFIGS, PLAN_PRICES, PlanId, TOPUP_PACKS, TOPUP_PRICE_PER_CREDIT, TOPUP_VALID_DAYS, cycleTotal, formatBRL, topupPrice,
} from '@/lib/planConfig';

type PlanCard = { id: PlanId; tier: number; description: string; features: string[]; featured?: boolean };

const PLAN_CARDS: PlanCard[] = [
  { id: 'start', tier: 1, description: 'Ideal para criadores que querem sair do improviso e vender com mais clareza.',
    features: ['20 créditos de IA/mês', 'Diagnóstico de Perfil', 'Calculadora de Orçamento', 'Gerador de Ideias', 'Hub de Referências e Gerador de Prompts'] },
  { id: 'pro', tier: 2, featured: true, description: 'Para quem quer vender com mais autoridade e organizar melhor sua operação.',
    features: ['50 créditos de IA/mês', 'Acesso completo a todas as ferramentas', 'Gerador de Ideias & Propostas', 'Hub de Referências e Gerador de Prompts', 'Gestão de Clientes', 'Suporte via e-mail'] },
  { id: 'elite', tier: 3, description: 'Para criadores que querem levar a criação mobile para outro patamar.',
    features: ['100 créditos de IA/mês', 'Tudo do plano Pro', 'Cursos e Lives com Luisera', 'Suporte prioritário 24/7', 'Consultoria de marca pessoal'] },
  { id: 'agency', tier: 4, description: 'Para agências e empresas que produzem conteúdo em escala para vários clientes.',
    features: ['1.000 créditos de IA/mês', 'Tudo do plano Elite', 'Vídeos de até 5 minutos na Montagem', 'Crédito 24% mais barato que no Elite', 'Atendimento dedicado'] },
];
const TIER: Record<string, number> = { start: 1, pro: 2, elite: 3, agency: 4 };
const CYCLE_ORDER: BillingCycle[] = ['monthly', 'quarterly', 'annual'];

export default function BillingPage() {
  const { user } = useAuth();
  // Plano, saldo e renovação vêm do mesmo estado de conta que a barra lateral e o servidor usam.
  const { account, profileLoading, userProfile, refreshProfile } = useUserProfile();
  const currentTier = account.plan ? TIER[account.plan] : 0;
  const currentCycle = (userProfile?.billingCycle as BillingCycle) || 'monthly';
  const hasStripeSubscription = account.status === 'active' || account.status === 'payment_issue';
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [topupDone, setTopupDone] = useState(false);

  // Volta da Stripe depois de uma recarga: o webhook soma os créditos; recarrega o saldo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('topup') === 'ok') {
      setTopupDone(true);
      const t = setTimeout(() => refreshProfile(), 2500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Histórico de faturas da Stripe
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/stripe/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.invoices) {
          setBillingHistory(data.invoices);
        }
      } catch (e) {
        console.error('Erro ao carregar faturas:', e);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const [isProcessing, setIsProcessing] = useState(false);

  const startCheckout = async (body: Record<string, unknown>) => {
    setIsProcessing(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Erro ao iniciar checkout');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao iniciar pagamento.');
      setIsProcessing(false);
    }
  };

  const handleInitiatePayment = (plan: PlanCard) => {
    track('InitiateCheckout', { value: planValue(plan.id, cycle), currency: 'BRL', content_name: `${plan.id}_${cycle}` });
    startCheckout({ planName: plan.id, cycle, marketing: marketingContext() });
  };

  const handleTopup = (credits: number) => {
    track('InitiateCheckout', { value: topupPrice(credits), currency: 'BRL', content_name: `recarga_${credits}` });
    startCheckout({ topup: credits });
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

  const savePct = (c: BillingCycle) => Math.round(BILLING_CYCLES[c].discount * 100);

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Planos e Faturamento</h1>
        <p className="text-gray-400">Gerencie sua assinatura, visualize seu faturamento e faça upgrade para novas funcionalidades.</p>
      </div>

      {topupDone && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-brand-emerald/30 bg-brand-emerald/10 text-sm text-brand-mint">
          Recarga confirmada! Os créditos entram no seu saldo em instantes e valem {TOPUP_VALID_DAYS} dias.
          <button type="button" onClick={() => setTopupDone(false)} aria-label="Fechar aviso"><X className="w-4 h-4" /></button>
        </div>
      )}

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
                  : account.planLabel ? `Plano Creator ${account.planLabel}` : 'Sem assinatura ativa'}
              </h2>
              {!profileLoading && (
                <>
                  <p className={account.status === 'payment_issue' || account.statusLabel === 'Créditos esgotados' ? 'text-amber-300 mt-1 font-medium' : 'text-brand-mint mt-1 font-medium'}>
                    {account.statusLabel}{account.plan ? ` · ${BILLING_CYCLES[currentCycle].label}` : ''}
                  </p>
                  <p className="text-gray-400 mt-1">{account.renewalLabel}.</p>
                </>
              )}
            </div>

            <div className="relative z-10 max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cota do mês</span>
                <span className="text-brand-mint font-medium">
                  {profileLoading ? '—' : account.plan ? `${account.monthlyCredits} de ${account.planCredits} créditos` : `${account.monthlyCredits} créditos`}
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                  style={{ width: account.planCredits > 0 ? `${Math.min((account.monthlyCredits / account.planCredits) * 100, 100)}%` : '0%' }}
                />
              </div>
              {account.extraCredits > 0 && (
                <p className="text-sm text-gray-300">
                  + <strong className="text-white">{account.extraCredits}</strong> créditos avulsos
                  {account.extraExpiresAt ? <span className="text-gray-500"> · válidos até {formatDate(account.extraExpiresAt)}</span> : null}
                </p>
              )}
            </div>
          </div>

          <div className="p-8 md:w-80 flex flex-col items-center justify-center text-center bg-white/[0.02]">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Valor por mês</p>
              <p className="text-4xl font-extrabold text-white tracking-tight mb-1">
                {account.plan ? formatBRL(PLAN_PRICES[account.plan][currentCycle]) : '—'}
              </p>
              {account.plan && currentCycle !== 'monthly' && (
                <p className="text-xs text-gray-500 mb-4">{formatBRL(cycleTotal(account.plan, currentCycle))} a cada {BILLING_CYCLES[currentCycle].months} meses</p>
              )}
              {hasStripeSubscription && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full text-xs py-2 h-auto mt-3"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recarga avulsa */}
      {account.status === 'active' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand-neon" />
              Recarregar créditos
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Acabou a cota do mês? Compre créditos avulsos: {formatBRL(TOPUP_PRICE_PER_CREDIT)} por crédito, válidos por {TOPUP_VALID_DAYS} dias e usados depois da cota do mês.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {TOPUP_PACKS.map(n => (
              <button key={n} type="button" onClick={() => handleTopup(n)} disabled={isProcessing}
                className="rounded-2xl border border-white/[0.08] bg-black/30 hover:border-brand-emerald/50 hover:bg-brand-emerald/[0.06] p-4 text-left transition-colors disabled:opacity-50">
                <p className="text-2xl font-extrabold text-white tabular-nums">{n.toLocaleString('pt-BR')}</p>
                <p className="text-[11px] text-gray-500">créditos</p>
                <p className="mt-2 text-sm font-semibold text-brand-mint">{formatBRL(topupPrice(n))}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
                {BILLING_CYCLES[c].label}{savePct(c) ? <span className="ml-1 text-brand-mint">−{savePct(c)}%</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLAN_CARDS.map((plan) => {
            const isCurrent = plan.tier === currentTier && cycle === currentCycle;
            const perMonth = PLAN_PRICES[plan.id][cycle];
            return (
              <GlassCard
                key={plan.id}
                glow={plan.featured}
                className={cn(
                  "p-8 flex flex-col h-full relative group transition-all duration-500",
                  isCurrent ? "border-brand-emerald/40 ring-1 ring-brand-emerald/20" : "hover:scale-[1.02]",
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
                    <span className="text-4xl font-bold text-white">{formatBRL(perMonth)}</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 mb-4 min-h-[16px]">
                    {cycle === 'monthly' ? 'Cobrado todo mês' : `${formatBRL(cycleTotal(plan.id, cycle))} ${cycle === 'annual' ? 'por ano' : 'a cada 3 meses'} · créditos todo mês`}
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
                  variant={isCurrent ? "outline" : "primary"}
                  className={cn("w-full transition-all duration-300", isCurrent && "bg-white/5 text-gray-400 border-white/10 cursor-default")}
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleInitiatePayment(plan)}
                >
                  {isCurrent ? 'Plano Atual' : 'Contratar Plano'}
                </Button>
              </GlassCard>
            );
          })}
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
                      {item.pdfUrl ? (
                        <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-mint hover:text-brand-emerald transition-colors text-xs font-medium">
                          <Download className="w-3 h-3" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
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
