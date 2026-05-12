'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Check, 
  Zap, 
  History,
  ShieldCheck,
  Star,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const currentTier = 2; // Pro level

  const plans = [
    {
      name: 'Start',
      price: 'R$ 39',
      tier: 1,
      description: 'Ideal para quem está começando a criar conteúdo.',
      features: ['10 créditos de IA/mês', 'Acesso a ferramentas básicas', 'Suporte via comunidade'],
      buttonText: 'Faça Upgrade',
      active: false,
      disabled: false,
      featured: false
    },
    {
      name: 'Pro',
      price: 'R$ 79',
      tier: 2,
      description: 'O equilíbrio perfeito para criadores ativos.',
      features: ['100 créditos de IA/mês', 'Acesso a todas as ferramentas', 'Histórico ilimitado', 'Suporte via e-mail'],
      buttonText: 'Seu Plano',
      active: true,
      disabled: true,
      featured: false
    },
    {
      name: 'Elite',
      price: 'R$ 149',
      tier: 3,
      description: 'Para quem quer dominar o mercado e escalar.',
      features: ['Créditos Ilimitados', 'Acesso antecipado a novas ferramentas', 'Suporte prioritário 24/7', 'Consultoria de branding'],
      buttonText: 'Fazer Upgrade',
      active: false,
      disabled: false,
      featured: true
    }
  ];

  const history = [
    { id: '1', date: '15 Abr, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242' },
    { id: '2', date: '15 Mar, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242' },
    { id: '3', date: '15 Fev, 2024', amount: 'R$ 79,00', status: 'Pago', method: '•••• 4242' },
  ];

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
              <h2 className="text-3xl font-bold text-white">Plano Creator Pro</h2>
              <p className="text-gray-400 mt-1">Sua assinatura Pro renova em 15 de Maio, 2024.</p>
            </div>

            <div className="relative z-10 max-w-sm">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Créditos desta fatura</span>
                <span className="text-brand-mint font-medium">42 / 100 usados</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                  style={{ width: '42%' }}
                />
              </div>
            </div>
          </div>

          <div className="p-8 md:w-80 flex flex-col items-center justify-center text-center bg-white/[0.02]">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest font-bold">Valor Mensal</p>
              <p className="text-4xl font-extrabold text-white tracking-tight">R$ 79,00</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Plans Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-neon" />
            Opções de Upgrade
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <GlassCard 
              key={plan.name}
              glow={plan.featured}
              className={cn(
                "p-8 flex flex-col h-full relative group transition-all duration-500",
                plan.active ? "border-brand-emerald/40 ring-1 ring-brand-emerald/20" : "hover:scale-[1.02]",
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

              {plan.tier >= currentTier ? (
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full transition-all duration-300",
                    plan.tier === currentTier && "bg-white/5 text-gray-400 border-white/10 cursor-default"
                  )}
                  disabled={plan.tier === currentTier}
                >
                  {plan.tier === currentTier ? 'Plano Atual' : 'Fazer Upgrade'}
                </Button>
              ) : (
                <div className="h-[46px]" /> // Placeholder for alignment
              )}
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
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-gray-300">{item.date}</td>
                    <td className="px-6 py-4 text-gray-400">Creator Pro</td>
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
    </div>
  );
}
