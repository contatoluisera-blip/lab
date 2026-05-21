'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Sparkles, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  Mail, 
  KeyRound, 
  CreditCard, 
  QrCode, 
  FileText, 
  Loader2, 
  Copy, 
  Download,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  FileCode,
  FileCheck,
  MessageSquare,
  History,
  Briefcase,
  GraduationCap,
  X,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function LandingPage() {
  const router = useRouter();

  // State for checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState(''); // Needed for account creation
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');

  // Real Minimum Test toggle
  const [isRealMinimumTest, setIsRealMinimumTest] = useState(false);

  const plans = [
    {
      name: 'Start',
      price: 'R$ 67',
      description: 'Para quem está começando a profissionalizar sua criação e quer ter acesso às principais ferramentas para analisar, precificar e estruturar melhor seus serviços.',
      subText: 'Ideal para criadores que querem sair do improviso e começar a vender com mais clareza.',
      features: [
        'Acesso ao Diagnóstico de Perfil',
        'Acesso à Calculadora de Orçamento',
        'Acesso limitado ao Gerador de Ideias',
        'Acesso limitado ao Gerador de Propostas',
        'Apoio do Assistente de IA básico',
        'Controle básico de Ações'
      ],
      buttonText: 'Começar com o plano Start',
      featured: false
    },
    {
      name: 'Pro',
      price: 'R$ 117',
      description: 'Para quem já atende clientes ou quer acelerar sua evolução com mais recursos, mais estrutura e mais capacidade de transformar análises, ideias e orçamentos em propostas comerciais completas.',
      subText: 'Ideal para quem quer vender com mais autoridade e organizar melhor sua operação.',
      features: [
        'Acesso completo a todas as ferramentas',
        'Análises de Perfil Ilimitadas',
        'Gerador de Ideias & Propostas avançados',
        'Apoio do Assistente de IA completo',
        'Histórico e Controle de Ações completo',
        'Gestão de Clientes integrada'
      ],
      buttonText: 'Entrar no plano Pro',
      featured: true
    },
    {
      name: 'Elite',
      price: 'R$ 197',
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
      featured: false
    }
  ];

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

    // Pre-validations
    if (!customerName || !customerEmail || !customerPassword || !customerDocument || !customerPhone) {
      setCheckoutError('Por favor, preencha todos os campos obrigatórios e defina sua senha.');
      setIsProcessing(false);
      return;
    }

    if (customerPassword.length < 6) {
      setCheckoutError('A senha de acesso deve conter no mínimo 6 caracteres.');
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
      // Determine final price (normal price or minimum R$ 1,00 for real checkout test)
      const chargePrice = isRealMinimumTest ? '1.00' : selectedPlan.price.replace('R$', '').trim();

      // Send everything (including password) to the backend
      // The backend creates the Firebase user + Firestore profile via Admin SDK
      const payload = {
        planName: selectedPlan.name,
        price: chargePrice,
        paymentMethod,
        customer: {
          name: customerName,
          email: customerEmail,
          password: customerPassword,   // used server-side only
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erro no processamento do Pagar.me.');
      }

      // Backend returned a Firebase customToken — sign the user in automatically
      if (resData.data?.customToken) {
        await signInWithCustomToken(auth, resData.data.customToken);
      }

      setSuccessData(resData.data);
      setPaymentSuccess(true);
    } catch (err: any) {
      setCheckoutError(err.message || 'Falha ao processar pagamento ou criar conta.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">
      
      {/* Glow Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-jade/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[30%] h-[50%] bg-brand-emerald/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-brand-mint/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl h-16 rounded-2xl neo-glass flex items-center justify-between px-8 border border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Creator Lab Logo" className="w-8 h-8 rounded-lg" />
          <img src="/logo-text.png" alt="Creator Lab" className="w-40 md:w-48 object-contain" />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-brand-mint transition-colors">Recursos</a>
          <a href="#pricing" className="hover:text-brand-mint transition-colors">Preços</a>
          <Link href="/login" className="text-white hover:text-brand-mint transition-colors">Entrar no App</Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 space-y-32">
        
        {/* 1. Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 pt-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full neo-glass text-brand-mint text-xs font-semibold mb-4 border border-brand-emerald/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Sparkles className="w-4 h-4 text-brand-emerald" />
            <span>O Sistema Operacional de Inteligência para Criadores Mobile</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Produza <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-jade drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Melhor.</span><br />
            Cobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Mais.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed font-light">
            Criar conteúdo pelo celular deixou de ser apenas uma habilidade criativa. Hoje, o mercado exige algo maior: análise, estratégia, proposta, organização, clareza comercial e capacidade de transformar uma simples ideia em um projeto que o cliente entenda, valorize e queira pagar.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <a href="#pricing">
              <Button size="lg" className="glow-border text-black px-8">Ver Planos e Assinar</Button>
            </a>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="px-8 border border-white/5 hover:bg-white/5">Entrar no App</Button>
            </Link>
          </div>
        </section>

        {/* 2. Manifesto Introduction */}
        <section className="py-8 border-t border-white/5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight leading-snug">
                A Creator Lab nasceu para isso.
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed font-light">
                Uma plataforma que reúne, em um só lugar, ferramentas práticas, técnicas e inteligentes para ajudar criadores mobile, social medias, videomakers e produtores de conteúdo a trabalharem com mais profissionalismo — da análise do perfil até a proposta final enviada ao cliente.
              </p>
              <div className="p-5 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 text-brand-mint text-sm font-semibold">
                Aqui, você não fica preso apenas à execução. Você aprende a pensar como estrategista, cobrar como profissional e entregar com clareza.
              </div>
            </div>
            
            <GlassCard className="p-8 space-y-6 bg-gradient-to-br from-[#0c0c0c] to-[#050505] border-white/5">
              <h3 className="text-lg font-bold text-white">
                O problema não é só criar vídeos bons. <br/>
                <span className="text-brand-emerald">O problema é transformar sua criação em um serviço valorizado.</span>
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Muitos criadores sabem gravar, editar e entregar conteúdos visualmente bonitos. Mas, na hora de fechar um cliente, surgem as dúvidas comerciais.
              </p>
              <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-300 font-mono">
                <div className="flex gap-2 items-center opacity-75"><HelpCircle className="w-3.5 h-3.5 text-brand-neon" /> “Quanto eu devo cobrar?”</div>
                <div className="flex gap-2 items-center opacity-75"><HelpCircle className="w-3.5 h-3.5 text-brand-neon" /> “O perfil desse cliente realmente tem potencial?”</div>
                <div className="flex gap-2 items-center opacity-75"><HelpCircle className="w-3.5 h-3.5 text-brand-neon" /> “Que tipo de conteúdo eu proporia?”</div>
                <div className="flex gap-2 items-center opacity-75"><HelpCircle className="w-3.5 h-3.5 text-brand-neon" /> “Como justifico meu orçamento?”</div>
                <div className="flex gap-2 items-center opacity-75"><HelpCircle className="w-3.5 h-3.5 text-brand-neon" /> “Como envio uma proposta profissional?”</div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* 3. The Improvisation Problem */}
        <section className="py-8 border-t border-white/5 text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">E, no fim, o criador acaba improvisando.</h2>
          <p className="text-gray-400 text-sm leading-relaxed font-light">
            Analisa o perfil “no olho”. Passa preço com insegurança. Cria ideias sem estratégia. Manda proposta pelo WhatsApp de qualquer jeito. E perde autoridade antes mesmo de começar o projeto.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-5 rounded-2xl border border-red-500/10 bg-red-500/5 space-y-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest block">O Velho Improviso</span>
              <p className="text-xs text-gray-300 leading-relaxed">Achismo, planilhas confusas, perda de tempo criando orçamentos do zero e propostas informais enviadas por áudio ou chat.</p>
            </div>
            <div className="p-5 rounded-2xl border border-brand-emerald/10 bg-brand-emerald/5 space-y-2">
              <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest block">A Solução Creator Lab</span>
              <p className="text-xs text-gray-300 leading-relaxed">Operação profissional baseada em dados, com ferramentas dedicadas e processos integrados de ponta a ponta.</p>
            </div>
          </div>
        </section>

        {/* 4. The Tool Stack */}
        <section id="features" className="py-8 border-t border-white/5 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">O que você encontra dentro da Creator Lab</h2>
            <p className="text-gray-400 text-sm font-light">Uma plataforma integrada para quem quer parar de parecer amador.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tool 1 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Diagnóstico de Perfil</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Antes de vender conteúdo, você precisa entender o cenário do cliente. Analise qualquer perfil do Instagram usando apenas o @. Extraia dados como engajamento, consistência, tom de comunicação, problemas e oportunidades de melhoria para embasar seus argumentos.
              </p>
            </GlassCard>

            {/* Tool 2 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Calculadora de Orçamento</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Cobrar no “achismo” é uma das formas mais rápidas de desvalorizar seu trabalho. Nossa calculadora considera parâmetros do projeto para gerar um valor claro, objetivo e justificado de esforço, complexidade e valor profissional.
              </p>
            </GlassCard>

            {/* Tool 3 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Gerador de Ideias</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Gere ideias de vídeos alinhadas ao perfil analisado e ao orçamento gerado. Cada sugestão detalha cena, texto/roteiro, estrutura audiovisual e tempo sugerido, agindo como um braço direito criativo e estratégico.
              </p>
            </GlassCard>

            {/* Tool 4 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">4. Gerador de Proposta</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Conecte tudo e transforme o diagnóstico, o orçamento e as ideias em uma proposta comercial clara e organizada em PDF prontinha para enviar. O cliente entende o problema, a solução e percebe seu valor estratégico.
              </p>
            </GlassCard>

            {/* Tool 5 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">5. Assistente de IA</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Um assistente de IA focado em filmmaking (CapCut, BlackMagic Cam, Node Video) e business B2B para tirar dúvidas rápidas, destravar roteiros, sugerir técnicas de edição e estruturar argumentos de negociação.
              </p>
            </GlassCard>

            {/* Tool 6 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">6. Controle de Ações</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Visualize e gerencie seu histórico de ações dentro do laboratório. Acesse diagnósticos passados, propostas criadas e orçamentos calculados a qualquer momento com total rastreabilidade.
              </p>
            </GlassCard>

            {/* Tool 7 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">7. Gestão de Clientes</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Painel para gerenciar clientes ativos, acompanhar entregas, marcar status de vídeos, anexar links de aprovação de materiais e monitorar pagamentos. Tudo organizado em um local exclusivo.
              </p>
            </GlassCard>

            {/* Tool 8 */}
            <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">8. Cursos, aulas e lives com Luisera</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Acesso completo a videoaulas e lives gravadas pelo Luisera sobre técnicas avançadas de gravação, luz, enquadramento e edição pelo celular. Enquanto as ferramentas executam, as aulas ensinam você a pensar.
              </p>
            </GlassCard>

          </div>
        </section>

        {/* 5. Target Audience & Transformation */}
        <section className="py-8 border-t border-white/5 grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Para quem é a Creator Lab?</h3>
            <p className="text-gray-400 text-xs leading-relaxed font-light">
              Criadores mobile que querem cobrar melhor, social medias em busca de propostas mais fortes, produtores de conteúdo e videomakers que desejam vender estratégia, não apenas edição pelo celular. Tanto para iniciantes quanto para quem já atende clientes e precisa de estrutura e processos claros.
            </p>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-brand-emerald" /> Criadores Mobile</div>
              <div className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-brand-emerald" /> Social Medias & Freelancers</div>
              <div className="flex gap-2 items-center"><Check className="w-3.5 h-3.5 text-brand-emerald" /> Videomakers & Produtores</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">O que muda na sua rotina?</h3>
            <div className="space-y-3.5 text-xs text-gray-400">
              <p>📉 <strong className="text-white">Antes:</strong> Orçamentos com insegurança, propostas desorganizadas, diagnósticos superficiais baseados no "olho" e perda de clientes antes de começar.</p>
              <p>📈 <strong className="text-brand-emerald">Depois:</strong> Argumentação embasada em dados brutos, precificação justificada por complexidade, propostas em PDF premium e gestão profissional das entregas.</p>
            </div>
          </div>
        </section>

        {/* 6. Pricing Section (Cards) */}
        <section id="pricing" className="py-8 border-t border-white/5 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full">
              Assinatura Premium
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Escolha seu plano</h2>
            <p className="text-gray-400 text-sm font-light">Tenha acesso a todo o laboratório no nível ideal para sua operação.</p>
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
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
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
        </section>

        {/* Expert Profile Section */}
        <section className="py-12 md:py-16 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Image column — compact on mobile, full-height on desktop */}
            <div className="col-span-12 md:col-span-5 relative group md:self-stretch md:flex md:flex-col md:justify-stretch">
              {/* Ambient Glow — reduced on mobile to avoid bleed */}
              <div className="absolute -inset-2 md:-inset-3 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-tr from-brand-emerald/20 via-brand-mint/5 to-brand-jade/25 blur-xl md:blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

              {/* Image Card */}
              <div className="relative rounded-2xl overflow-hidden border border-brand-emerald/25 bg-gradient-to-b from-[#0a0a0a] to-[#040404] shadow-[0_0_40px_rgba(16,185,129,0.2)] group-hover:border-brand-emerald/40 group-hover:shadow-[0_0_70px_rgba(16,185,129,0.45)] transition-all duration-500 md:flex-1 md:flex md:flex-col">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/imagem%20siteapp.png?alt=media&token=4465413b-007c-491a-a60e-398ce647e398"
                  alt="Luisera - Creator Lab Expert"
                  className="w-full object-cover object-top h-[280px] sm:h-[340px] md:h-full md:min-h-[580px] hover:scale-[1.03] transition-transform duration-700"
                />
              </div>
            </div>

            {/* Description column */}
            <div className="col-span-12 md:col-span-7 space-y-5 md:space-y-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full inline-block">
                O Idealizador
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Criada por <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">Luisera</span>, para criadores que querem jogar em outro nível
              </h2>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed font-light">
                <p>
                  A Creator Lab foi desenvolvida a partir da experiência prática do Luisera, criador mobile que ensina profissionais a produzirem vídeos de alta qualidade usando apenas o celular, unindo técnica audiovisual, edição, posicionamento e visão comercial.
                </p>
                <p>
                  Depois de anos criando, ensinando e entendendo as maiores dificuldades de quem trabalha com conteúdo mobile, Luisera reuniu na plataforma as ferramentas que gostaria que todo criador tivesse antes de atender clientes: diagnóstico de perfil, precificação inteligente, geração de ideias, propostas comerciais, gestão de entregas e aprendizado contínuo.
                </p>
                <p>
                  A Creator Lab nasce dessa visão: ajudar o criador mobile a deixar de operar no improviso e começar a trabalhar com método, clareza e autoridade.
                </p>
              </div>
              <div className="p-4 md:p-5 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 text-brand-mint text-sm font-semibold leading-relaxed">
                "Porque o mercado não valoriza apenas quem cria bons vídeos. Valoriza quem sabe transformar criação em estratégia."
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] text-center relative z-10">
        <p className="text-gray-600 text-xs">© 2026 Creator Lab. Desenvolvido para criadores profissionais. Todos os direitos reservados.</p>
      </footer>

      {/* Checkout & Auto Registration Modal Overlay */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Close */}
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success View */}
            {paymentSuccess ? (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-brand-emerald/15 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Conta Criada & Plano Ativo!</h3>
                  <p className="text-gray-300 text-xs leading-relaxed max-w-sm mx-auto">
                    Seu pagamento via Pagar.me foi recebido com sucesso. Criamos sua credencial de acesso tático e salvamos suas permissões no banco de dados.
                  </p>
                </div>

                {/* Account details */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-xs space-y-2.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">E-mail de Operação:</span>
                    <span className="text-white font-medium">{customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano Ativo:</span>
                    <span className="text-brand-emerald font-bold uppercase">Creator {selectedPlan.name}</span>
                  </div>
                  {paymentMethod === 'pix' && successData?.paymentInfo?.qrCode && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">PIX Copia e Cola (Aprovação imediata):</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={successData.paymentInfo.qrCode}
                          className="w-full glass-input text-[10px] font-mono py-1.5 px-2 select-all bg-black/40"
                        />
                        <button
                          onClick={() => handleCopy(successData.paymentInfo.qrCode)}
                          className="bg-brand-emerald text-black p-2 rounded-lg hover:bg-brand-emerald/80 transition-colors flex-shrink-0"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'boleto' && successData?.paymentInfo?.pdf && (
                    <div className="pt-2 border-t border-white/5 text-center">
                      <a 
                        href={successData.paymentInfo.pdf} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand-mint hover:underline font-bold"
                      >
                        <Download className="w-3 h-3" /> Baixar PDF do Boleto
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link href="/login">
                    <Button className="px-8 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      Acessar Plataforma <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Payment & Account Creation Form */
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-0.5 rounded">
                    Registro & Cobrança Segura
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">Assinar Plano {selectedPlan.name}</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Crie sua conta e pague {selectedPlan.price},00/mês para desbloquear todo o laboratório.
                  </p>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {checkoutError}
                  </div>
                )}

                {/* Section 1: User Account details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-emerald" /> 1. Configurar Credencial de Acesso
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="email" 
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="E-mail de Login"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        required
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        placeholder="Senha (mín. 6 dígitos)"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        required
                        value={customerDocument}
                        onChange={(e) => setCustomerDocument(e.target.value)}
                        placeholder="CPF (Ex: 12345678909)"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="WhatsApp (Ex: 11999999999)"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Payment Method */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-emerald" /> 2. Pagamento via Pagar.me
                  </h4>
                  
                  {/* Selector Tabs */}
                  <div className="flex p-1 bg-black/50 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all",
                        paymentMethod === 'credit_card' 
                          ? 'bg-brand-emerald text-black font-bold' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all",
                        paymentMethod === 'pix' 
                          ? 'bg-brand-emerald text-black font-bold' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('boleto')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all",
                        paymentMethod === 'boleto' 
                          ? 'bg-brand-emerald text-black font-bold' 
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      Boleto
                    </button>
                  </div>

                  {/* Credit Card inputs */}
                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-3">
                      <div>
                        <input 
                          type="text" 
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="Número do Cartão (Simulador: 5427 2182 7654 3210)"
                          className="w-full glass-input text-xs font-mono"
                        />
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
                        </select>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="p-4 rounded-xl bg-brand-emerald/5 border border-brand-emerald/10 text-gray-300 text-xs">
                      A aprovação por Pix é instantânea. O código de pagamento será gerado assim que você confirmar o registro.
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs">
                      O boleto será emitido com vencimento para 3 dias úteis. A liberação ocorre em até 48h úteis após o pagamento.
                    </div>
                  )}
                </div>

                {/* Real Case Minimum Test Option */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-white block">Ativar Teste de Caso Real</span>
                    <span className="text-[9px] text-gray-500 block">Reduz a cobrança no Pagar.me para o valor mínimo de R$ 1,00 para teste real.</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isRealMinimumTest}
                    onChange={(e) => setIsRealMinimumTest(e.target.checked)}
                    className="w-4 h-4 accent-brand-emerald cursor-pointer rounded"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-12 text-xs font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.3)] text-black"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-black" /> Processando cobrança e criando conta...
                      </span>
                    ) : (
                      <span>
                        {isRealMinimumTest ? 'Assinar por R$ 1,00 (Teste)' : `Confirmar Assinatura (${selectedPlan.price},00)`}
                      </span>
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 mt-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                    <span>Ambiente criptografado e homologado pela Pagar.me.</span>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
