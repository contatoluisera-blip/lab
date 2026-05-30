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

export default function PaywallPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      name: 'Start',
      price: 'R$ 67',
      tier: 1,
      description: 'Ideal para criadores que querem sair do improviso e vender com mais clareza.',
      features: ['20 créditos de IA/mês', 'Diagnóstico de Perfil', 'Calculadora de Orçamento', 'Gerador de Ideias'],
      buttonText: 'Contratar Plano',
      featured: false
    },
    {
      name: 'Pro',
      price: 'R$ 117',
      tier: 2,
      description: 'Para quem quer vender com mais autoridade e organizar melhor sua operação.',
      features: ['50 créditos de IA/mês', 'Acesso completo a todas as ferramentas', 'Gerador de Ideias & Propostas', 'Gestão de Clientes', 'Suporte via e-mail'],
      buttonText: 'Contratar Plano',
      featured: true
    },
    {
      name: 'Elite',
      price: 'R$ 197',
      tier: 3,
      description: 'Para criadores que querem levar a criação mobile para outro patamar.',
      features: ['100 créditos de IA/mês', 'Tudo do plano Pro', 'Cursos e Lives com Luisera', 'Suporte prioritário 24/7', 'Consultoria de marca pessoal'],
      buttonText: 'Contratar Plano',
      featured: false
    }
  ];

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
                  variant="primary"
                  className="w-full transition-all duration-300"
                  disabled={isProcessing}
                  onClick={() => handleInitiatePayment(plan)}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {plan.buttonText}
                </Button>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
