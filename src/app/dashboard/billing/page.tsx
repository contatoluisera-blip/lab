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

  // State for checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form states (empty by default — user fills their own data)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

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

  const handleInitiatePayment = (plan: any) => {
    setSelectedPlan(plan);
    setPaymentMethod('credit_card');
    setCheckoutError('');
    setPaymentSuccess(false);
    setSuccessData(null);
    setIsCheckoutOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setCheckoutError('');

    // Pre-validation
    if (!customerName || !customerEmail || !customerDocument || !customerPhone) {
      setCheckoutError('Por favor, preencha todos os dados cadastrais.');
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !cardHolderName || !cardExpMonth || !cardExpYear || !cardCvv) {
        setCheckoutError('Por favor, preencha todos os dados do cartão de crédito.');
        setIsProcessing(false);
        return;
      }
    }

    try {
      const payload = {
        planName: selectedPlan.name,
        price: selectedPlan.price.replace('R$', '').trim(),
        paymentMethod,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument,
          phone: customerPhone
        },
        cardData: paymentMethod === 'credit_card' ? {
          number: cardNumber,
          holderName: cardHolderName,
          expMonth: cardExpMonth,
          expYear: cardExpYear,
          cvv: cardCvv,
          installments: cardInstallments
        } : undefined
      };

      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erro de comunicação com Pagar.me.');
      }

      setSuccessData(resData.data);
      setPaymentSuccess(true);

      // On successful credit card purchase, instantly update plan state and mock billing history
      if (paymentMethod === 'credit_card') {
        setCurrentTier(selectedPlan.tier);
        
        // Append to history table
        const newInvoice = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
          amount: `${selectedPlan.price},00`,
          status: 'Pago',
          method: `•••• ${cardNumber.slice(-4) || '3210'}`,
          plan: `Creator ${selectedPlan.name}`
        };
        setBillingHistory([newInvoice, ...billingHistory]);
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Falha ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

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
              <p className="text-4xl font-extrabold text-white tracking-tight">
                {currentTier === 3 ? 'R$ 197,00' : currentTier === 2 ? 'R$ 117,00' : currentTier === 1 ? 'R$ 67,00' : '—'}
              </p>
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

      {/* Checkout Modal Overlay */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            {!paymentSuccess ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                {/* Header */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded">
                    Checkout Seguro via Pagar.me
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-2">Plano Creator {selectedPlan.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Você pagará <span className="text-white font-semibold">{selectedPlan.price},00</span> /mês. Cancele quando quiser.
                  </p>
                </div>

                {checkoutError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {checkoutError}
                  </div>
                )}

                {/* Section 1: Billing info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. Dados do Comprador</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nome Completo"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="E-mail"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        required
                        value={customerDocument}
                        onChange={(e) => setCustomerDocument(e.target.value)}
                        placeholder="CPF"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Telefone Celular"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Payment Method */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Forma de Pagamento</h4>
                  
                  {/* Selector Tabs */}
                  <div className="flex p-1 bg-black/50 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all",
                        paymentMethod === 'credit_card' 
                          ? 'bg-brand-emerald text-black font-bold shadow-[0_2px_10px_rgba(16,185,129,0.3)]' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all",
                        paymentMethod === 'pix' 
                          ? 'bg-brand-emerald text-black font-bold shadow-[0_2px_10px_rgba(16,185,129,0.3)]' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <QrCode className="w-3.5 h-3.5" /> PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('boleto')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all",
                        paymentMethod === 'boleto' 
                          ? 'bg-brand-emerald text-black font-bold shadow-[0_2px_10px_rgba(16,185,129,0.3)]' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <FileText className="w-3.5 h-3.5" /> Boleto
                    </button>
                  </div>

                  {/* Dynamic Fields */}
                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-3">
                      <div>
                        <input 
                          type="text" 
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="Número do Cartão (Ex: 5427 2182 7654 3210)"
                          className="w-full glass-input text-xs font-mono"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Dica: Para simular no Pagar.me use o número de teste acima.
                        </span>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          required
                          value={cardHolderName}
                          onChange={(e) => setCardHolderName(e.target.value)}
                          placeholder="Nome impresso no Cartão"
                          className="w-full glass-input text-xs uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <input 
                            type="text" 
                            required
                            maxLength={2}
                            value={cardExpMonth}
                            onChange={(e) => setCardExpMonth(e.target.value)}
                            placeholder="Mês (MM)"
                            className="w-full glass-input text-xs text-center"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            required
                            maxLength={4}
                            value={cardExpYear}
                            onChange={(e) => setCardExpYear(e.target.value)}
                            placeholder="Ano (AAAA)"
                            className="w-full glass-input text-xs text-center"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="CVV"
                            className="w-full glass-input text-xs text-center font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <select
                          value={cardInstallments}
                          onChange={(e) => setCardInstallments(e.target.value)}
                          className="w-full glass-input text-xs appearance-none bg-black/40"
                        >
                          <option value="1" className="bg-[#0d0d0d]">1x de {selectedPlan.price},00 (Sem juros)</option>
                          <option value="2" className="bg-[#0d0d0d]">2x de R$ {(parseFloat(selectedPlan.price.replace('R$', '').trim()) / 2).toFixed(2)} (Sem juros)</option>
                          <option value="3" className="bg-[#0d0d0d]">3x de R$ {(parseFloat(selectedPlan.price.replace('R$', '').trim()) / 3).toFixed(2)} (Sem juros)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="p-4 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 text-gray-300 text-xs leading-relaxed">
                      O pagamento via **PIX** é processado na hora. Após a geração da cobrança, você receberá um QR Code e um código copia-e-cola que poderá pagar através do app do seu banco.
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-300 text-xs leading-relaxed">
                      O **Boleto Bancário** será gerado com vencimento para daqui a 3 dias. Lembrete: pagamentos via boleto demoram de **1 a 2 dias úteis** para compensar e liberar o plano no sistema.
                    </div>
                  )}
                </div>

                {/* Footer Submit */}
                <div className="pt-2">
                  <Button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-12 text-sm font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-black" /> Processando no Pagar.me...
                      </span>
                    ) : (
                      <span>
                        {paymentMethod === 'credit_card' ? 'Confirmar Assinatura' : paymentMethod === 'pix' ? 'Gerar Código PIX' : 'Gerar Boleto'}
                      </span>
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 mt-4">
                    <Shield className="w-3 h-3 text-brand-emerald" />
                    <span>Seus dados estão protegidos por criptografia de ponta a ponta.</span>
                  </div>
                </div>
              </form>
            ) : (
              /* Success States */
              <div className="text-center space-y-6 py-4">
                
                {/* 1. Credit Card Success */}
                {paymentMethod === 'credit_card' && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-brand-emerald/15 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Assinatura Ativada!</h3>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                        Seu pagamento foi aprovado pelo gateway Pagar.me. O plano **Creator {selectedPlan.name}** está ativo na sua conta.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-xs space-y-2 max-w-xs mx-auto">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transação ID:</span>
                        <span className="text-gray-300 font-mono">{successData?.orderId?.substring(0, 12)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plano:</span>
                        <span className="text-white font-medium">Creator {selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Cobrado:</span>
                        <span className="text-brand-mint font-semibold">{selectedPlan.price},00</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsCheckoutOpen(false)}
                      className="px-8"
                    >
                      Começar a Usar
                    </Button>
                  </>
                )}

                {/* 2. PIX Success */}
                {paymentMethod === 'pix' && (
                  <>
                    <div className="w-12 h-12 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mx-auto">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Escaneie o código PIX</h3>
                      <p className="text-gray-400 text-xs">
                        A liberação da assinatura é imediata após a confirmação.
                      </p>
                    </div>

                    {/* QR Code Container */}
                    {successData?.paymentInfo?.qrCodeUrl && (
                      <div className="bg-white p-4 rounded-2xl max-w-[200px] mx-auto border-4 border-brand-emerald/20 shadow-lg">
                        <img 
                          src={successData.paymentInfo.qrCodeUrl} 
                          alt="PIX QR Code" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Copy and Paste Box */}
                    {successData?.paymentInfo?.qrCode && (
                      <div className="space-y-2 max-w-sm mx-auto">
                        <span className="text-[10px] text-gray-500 text-left block font-semibold uppercase">Código Copia e Cola:</span>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={successData.paymentInfo.qrCode}
                            className="w-full glass-input text-xs font-mono py-2 px-3 select-all bg-black/40"
                          />
                          <button
                            onClick={() => handleCopy(successData.paymentInfo.qrCode)}
                            className="bg-brand-emerald text-black p-2.5 rounded-xl hover:bg-brand-emerald/80 transition-colors flex-shrink-0"
                          >
                            {copied ? <Check className="w-4 h-4 font-bold" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        {copied && <span className="text-[10px] text-brand-emerald block text-center">Código copiado para a área de transferência!</span>}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        onClick={() => setIsCheckoutOpen(false)}
                        variant="outline"
                        className="px-8"
                      >
                        Fechar Janela
                      </Button>
                    </div>
                  </>
                )}

                {/* 3. Boleto Success */}
                {paymentMethod === 'boleto' && (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white">Boleto Emitido com Sucesso!</h3>
                      <p className="text-gray-400 text-xs">
                        Baixe o PDF ou copie o código de barras para pagamento.
                      </p>
                    </div>

                    {/* Download PDF Button */}
                    {successData?.paymentInfo?.pdf && (
                      <div className="py-2">
                        <a 
                          href={successData.paymentInfo.pdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-brand-emerald hover:bg-brand-emerald/80 text-black font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                          <Download className="w-4 h-4" /> Visualizar Boleto (PDF)
                        </a>
                      </div>
                    )}

                    {/* Copy Barcode Code */}
                    {successData?.paymentInfo?.lineCode && (
                      <div className="space-y-2 max-w-sm mx-auto">
                        <span className="text-[10px] text-gray-500 text-left block font-semibold uppercase font-mono">Linha Digitável:</span>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={successData.paymentInfo.lineCode}
                            className="w-full glass-input text-xs font-mono py-2 px-3 select-all bg-black/40"
                          />
                          <button
                            onClick={() => handleCopy(successData.paymentInfo.lineCode)}
                            className="bg-brand-emerald text-black p-2.5 rounded-xl hover:bg-brand-emerald/80 transition-colors flex-shrink-0"
                          >
                            {copied ? <Check className="w-4 h-4 font-bold" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        {copied && <span className="text-[10px] text-brand-emerald block text-center">Código copiado para a área de transferência!</span>}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        onClick={() => setIsCheckoutOpen(false)}
                        variant="outline"
                        className="px-8"
                      >
                        Fechar Janela
                      </Button>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
