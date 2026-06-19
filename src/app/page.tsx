import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Sparkles, 
  Check, 
  HelpCircle, 
  TrendingUp,
  Lightbulb,
  FileCheck,
  MessageSquare,
  History,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Zap,
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  Video,
  Brain,
  CheckCircle2,
  Star,
  PlayCircle
} from 'lucide-react';
import PreListaForm from '@/app/lista/PreListaForm';

const feedbacks = [
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint1.jpeg?alt=media&token=84a37184-0121-45af-93ca-a017124e91e2",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint10.jpeg?alt=media&token=fc755d1d-39df-4c4d-9613-6be8f7009433",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint11.jpeg?alt=media&token=c05cb365-b451-48de-98a5-85520ebf0283",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint12.jpeg?alt=media&token=a78632e2-2ffd-4312-acc4-d333d44c58b7",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint13.jpeg?alt=media&token=6d9abd66-75c2-45e9-9f2b-902f30752b5f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint14.jpeg?alt=media&token=ed7a1b73-3258-4031-8eeb-bb25718f0cb6",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint15.jpeg?alt=media&token=f5d6983a-3fb0-41d0-b969-b2ef635c40e0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint16.jpeg?alt=media&token=672201d1-d6e9-4e7d-a9f5-e4e40d5ea853",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint17.jpeg?alt=media&token=70dd18c0-0dc3-4dea-83af-9f9301d7582a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint18.jpeg?alt=media&token=d81f23ec-20f0-421c-af5c-263556ccad3d",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint2.jpeg?alt=media&token=d63ae003-533c-4e74-9e30-c16a51742ef0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint3.jpeg?alt=media&token=faf8d697-e0d9-4ec3-a869-666aa77dd09a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint4.jpeg?alt=media&token=15673ef5-df6f-44a3-9d42-984f7d6a7dfe",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint5.jpeg?alt=media&token=fe4d00e4-94f7-4e30-88a7-e9e75b566761",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint6.jpeg?alt=media&token=3ea761d0-0877-4f9f-89d9-6ff255ddd246",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint7.jpeg?alt=media&token=adc53f02-08a2-4c99-87c7-531375c5c3cc",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint8.jpeg?alt=media&token=fb28488e-7c54-4ea4-9b08-0cecee11fc1f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint9.jpeg?alt=media&token=1eafdc48-4cb0-4337-8d48-7443b19358ef",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint%2019.jpeg?alt=media&token=c10f71cd-02dc-4f49-b7ba-ae8712b0ca05"
];

const videos3D = [
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=50be0413-d146-4bf7-808d-7357a22afcfa",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7053dfb0-5cb3-493f-8135-edeaa696c5ed",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=2d6aa720-5db7-4529-b230-3fe6ba54b644",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=552167a4-3920-4e63-bfef-6298160641e3"
];

export default function LandingPage() {
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
          <Image src="/logo.png" alt="Creator Lab Logo" width={32} height={32} className="rounded-lg" />
          <Image src="/logo-text.png" alt="Creator Lab" width={192} height={40} className="w-40 md:w-48 object-contain" />
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-brand-mint transition-colors">Ferramentas</a>
          <a href="#formacao" className="hover:text-brand-mint transition-colors">Formação</a>
          <a href="#pre-lista" className="hover:text-brand-mint transition-colors">Pré-lista</a>
          <Link href="/login" className="text-white hover:text-brand-mint transition-colors">Entrar no App</Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 space-y-32">
        
        {/* 1. Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 pt-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full neo-glass text-brand-mint text-xs font-semibold mb-4 border border-brand-emerald/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Sparkles className="w-4 h-4 text-brand-emerald" />
            <span>Do zero ao profissional. Do profissional ao próximo nível.</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Você cria pelo celular.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-jade drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              Chegou a hora de escalar.
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed font-light">
            A <strong className="text-white">Creator Lab</strong> reúne cursos de criação mobile, ferramentas de diagnóstico, orçamento, geração de ideias e um assistente de IA 24h — tudo para você produzir mais, errar menos e cobrar o que o seu trabalho realmente vale.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <a href="#pre-lista">
              <Button size="lg" className="glow-border text-black px-8 flex items-center gap-2">
                Garantir vaga na pré-lista <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="px-8 border border-white/5 hover:bg-white/5">Entrar no App</Button>
            </Link>
          </div>

          {/* Stat bar */}
          <div className="w-full max-w-2xl grid grid-cols-3 gap-4 pt-4">
            {[
              { value: '+ Ticket', label: 'médio por projeto' },
              { value: '- Tempo', label: 'perdido em orçamentos' },
              { value: '360°', label: 'do técnico ao comercial' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl neo-glass border border-white/5 text-center">
                <div className="text-lg font-extrabold text-brand-emerald">{stat.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Video Player */}
          <div className="w-full max-w-4xl mx-auto mt-12 relative group z-20">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-brand-emerald/10 blur-[80px] rounded-full group-hover:bg-brand-emerald/20 transition-all duration-700 pointer-events-none" />
            
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.2)] bg-[#050505] aspect-video">
              <iframe
                id="panda-87b7b00f-d11b-4656-99d7-d5326cdc36f9"
                src="https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=87b7b00f-d11b-4656-99d7-d5326cdc36f9&autoplay=true"
                style={{ border: 'none' }}
                className="w-full h-full"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* 2. Pain point — raw storytelling */}
        <section className="py-8 border-t border-white/5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight leading-snug">
                Você domina a câmera.<br />
                <span className="text-gray-500">Mas o mercado exige muito mais do que isso.</span>
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed font-light">
                Saber filmar, enquadrar e editar pelo celular é o ponto de partida, não o destino. Os criadores que estão faturando mais não são necessariamente os que fazem os vídeos mais bonitos — são os que sabem <strong className="text-white">posicionar, precificar e apresentar o valor do seu trabalho</strong> com clareza e autoridade.
              </p>
              <div className="p-5 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 text-brand-mint text-sm font-semibold leading-relaxed">
                Na Creator Lab você não aprende apenas a criar. Você aprende a operar como um profissional de verdade — e as ferramentas fazem o trabalho pesado enquanto você foca no que importa.
              </div>
            </div>
            
            <GlassCard className="p-8 space-y-5 bg-gradient-to-br from-[#0c0c0c] to-[#050505] border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reconhece alguma dessas situações?</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs text-gray-300 font-mono">
                <div className="flex gap-2.5 items-start p-3 rounded-xl bg-white/3 border border-white/5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>"Quanto eu cobro? Fico inseguro toda vez que um cliente pergunta o preço."</span>
                </div>
                <div className="flex gap-2.5 items-start p-3 rounded-xl bg-white/3 border border-white/5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>"Perco horas criando proposta do zero e o cliente nem lê direito."</span>
                </div>
                <div className="flex gap-2.5 items-start p-3 rounded-xl bg-white/3 border border-white/5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>"Não sei se vale a pena prospectar esse perfil. Fico de olho mesmo."</span>
                </div>
                <div className="flex gap-2.5 items-start p-3 rounded-xl bg-white/3 border border-white/5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>"Entrego vídeos bons, mas continuo recebendo preço de iniciante."</span>
                </div>
                <div className="flex gap-2.5 items-start p-3 rounded-xl bg-white/3 border border-white/5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>"Quero evoluir tecnicamente — 3D, IA — mas não sei por onde começar."</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* 3. Before / After */}
        <section className="py-8 border-t border-white/5 text-center max-w-3xl mx-auto space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Esses gargalos têm nome: <span className="text-brand-emerald">falta de sistema.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              Não é falta de talento. Não é falta de esforço. É que ninguém ensinou você a montar uma operação de criação mobile com método — da técnica ao comercial. A Creator Lab existe exatamente para fechar essa lacuna.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-6 rounded-2xl border border-red-500/15 bg-red-500/5 space-y-4">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest block">Antes da Creator Lab</span>
              <ul className="space-y-2.5 text-xs text-gray-400 leading-relaxed">
                <li className="flex gap-2">❌ Precificação no achismo, cliente barganha fácil</li>
                <li className="flex gap-2">❌ Proposta improvisada no WhatsApp ou Google Docs</li>
                <li className="flex gap-2">❌ Prospecção no "olhômetro" sem dados do perfil</li>
                <li className="flex gap-2">❌ Sem processo de gestão: cliente some, prazo passa</li>
                <li className="flex gap-2">❌ Técnica estagnada, sem evolução para 3D ou IA</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-brand-emerald/15 bg-brand-emerald/5 space-y-4">
              <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest block">Depois da Creator Lab</span>
              <ul className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
                <li className="flex gap-2">✅ Orçamento preciso, baseado em dados, sem insegurança</li>
                <li className="flex gap-2">✅ Proposta em PDF profissional em minutos, não horas</li>
                <li className="flex gap-2">✅ Diagnóstico de perfil real antes de qualquer contato</li>
                <li className="flex gap-2">✅ Gestão de clientes, status e entregas em um só lugar</li>
                <li className="flex gap-2">✅ Aulas de 3D mobile, IA na criação e muito mais</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. What's inside */}
        <section id="features" className="py-8 border-t border-white/5 space-y-14">
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full inline-block">
              A Plataforma
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Tudo o que você precisa para parar de improvisar e começar a escalar
            </h2>
            <p className="text-gray-400 text-sm font-light max-w-2xl mx-auto">
              Ferramentas que trabalham juntas. Cada uma resolve um gargalo real da sua operação como criador mobile.
            </p>
          </div>

          {/* Formation block */}
          <div id="formacao" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-brand-emerald/40" />
              <span className="text-xs uppercase font-bold tracking-widest text-brand-emerald">Formação Técnica</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors border-brand-emerald/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-emerald font-bold uppercase tracking-widest">Do zero ao avançado</span>
                    <h3 className="text-base font-bold text-white mt-1">Aulas & Cursos com Luisera</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Formação completa com Luisera: do básico de gravação mobile à produção cinematográfica pelo celular. Aprenda enquadramento, luz, movimento de câmera, edição profissional no CapCut e BlackMagic Cam. Quem está começando tem o caminho claro. Quem já sabe tem onde evoluir.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors border-brand-emerald/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-emerald font-bold uppercase tracking-widest">Novos cursos</span>
                    <h3 className="text-base font-bold text-white mt-1">3D pelo Celular & IA para Mobile</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Vá além do convencional. Aulas de criação em 3D usando o celular — efeitos, motion e renders que impressionam qualquer cliente. E um curso completo de IA na produção de conteúdo: automatize roteiros, ideias e edições com as ferramentas que estão moldando o futuro da criação mobile.
                </p>
              </GlassCard>
            </div>
          </div>

          {/* Business tools block */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-brand-emerald/40" />
              <span className="text-xs uppercase font-bold tracking-widest text-brand-emerald">Ferramentas de Negócio</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Prospecção inteligente</span>
                    <h3 className="text-base font-bold text-white mt-1">Diagnóstico de Perfil</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Chega de prospectar no escuro. Analise qualquer perfil do Instagram com o @ e receba um diagnóstico completo: engajamento real, consistência de postagens, tom de comunicação, lacunas visuais e oportunidades de conteúdo. Você entra na conversa já sabendo exatamente onde o cliente dói.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fim do achismo</span>
                    <h3 className="text-base font-bold text-white mt-1">Calculadora de Orçamento</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Uma calculadora séria, feita para criador mobile. Informe o tipo de conteúdo, complexidade, deslocamento, uso de equipamento e prazos — e receba um valor justo, detalhado e justificado. Nunca mais o cliente vai te pedir desconto sem você ter um argumento sólido na mão.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Criatividade com contexto</span>
                    <h3 className="text-base font-bold text-white mt-1">Gerador de Ideias</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Com base no diagnóstico do perfil do cliente, a plataforma gera ideias de vídeo alinhadas ao nicho, ao tom e às lacunas identificadas. Cada ideia já vem com estrutura de cena, roteiro sugerido e duração estimada. Você apresenta como estrategista, não como executor.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fechamento profissional</span>
                    <h3 className="text-base font-bold text-white mt-1">Gerador de Proposta Comercial</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Transforme diagnóstico, orçamento e ideias em uma proposta comercial em PDF — personalizada, visualmente bonita e com argumentação sólida. O cliente recebe um documento que explica o problema dele, a solução proposta e o valor que você entrega. Isso fecha contratos.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Operação organizada</span>
                    <h3 className="text-base font-bold text-white mt-1">Gestão de Clientes</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Chega de perder o fio da meada. Acompanhe cada cliente ativo, status das entregas, links de aprovação e histórico de projetos — tudo em um painel integrado. Quanto mais clientes você tiver, mais você vai precisar disso.
                </p>
              </GlassCard>

              <GlassCard className="p-6 space-y-4 hover:border-brand-emerald/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald flex-shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Suporte especializado</span>
                    <h3 className="text-base font-bold text-white mt-1">Assistente de IA</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Um assistente treinado para criadores mobile: CapCut, BlackMagic Cam, Node Video, edição, luz, roteiro, argumentação de venda, negociação com cliente B2B. Pergunte, desbloqueie, avance. Sem precisar de mentor particular para cada dúvida do dia a dia.
                </p>
              </GlassCard>

            </div>
          </div>
        </section>

        {/* 5. Dual journey — Beginners + Experienced */}
        <section className="py-8 border-t border-white/5 space-y-14">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Dois pontos de partida. Um mesmo destino.
            </h2>
            <p className="text-gray-400 text-sm font-light max-w-xl mx-auto">
              A Creator Lab fala igual com quem está começando e com quem já atende clientes. Veja onde você se encaixa.
            </p>
          </div>

          {/* Dual track cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Beginner track */}
            <div className="rounded-3xl border border-brand-emerald/15 bg-gradient-to-br from-brand-emerald/5 to-transparent p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-emerald/15 border border-brand-emerald/25 flex items-center justify-center text-brand-emerald">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-emerald block">Para quem está começando</span>
                  <h3 className="text-lg font-extrabold text-white">Você já inicia na frente.</h3>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                A maioria dos criadores aprende criação durante anos e só depois descobre como vender. Aqui é diferente: você aprende a técnica <em>e</em> os processos de negócio ao mesmo tempo.
              </p>
              <ul className="space-y-3 text-xs text-gray-300">
                {[
                  { icon: '🎬', text: 'Aulas do zero: gravação, enquadramento, luz e edição pelo celular' },
                  { icon: '🧠', text: 'Assistente de IA para tirar dúvidas técnicas no momento certo' },
                  { icon: '💰', text: 'Calculadora de orçamento: você já cobra certo desde o primeiro cliente' },
                  { icon: '📋', text: 'Proposta comercial pronta: não chega improvisando na conversa' },
                  { icon: '🚀', text: 'Cursos de 3D e IA mobile: você avança enquanto outros ainda estão na base' },
                ].map((item) => (
                  <li key={item.text} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-2xl bg-brand-emerald/8 border border-brand-emerald/10 text-brand-mint text-xs font-semibold leading-relaxed">
                Quem começa com sistema não desenvolve os vícios que levam anos para desfazer. Aqui você vai construir certo desde o primeiro dia.
              </div>
            </div>

            {/* Experienced track */}
            <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/3 to-transparent p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Para quem já está no mercado</span>
                  <h3 className="text-lg font-extrabold text-white">Chega de deixar dinheiro na mesa.</h3>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Você já sabe criar. O problema é que a operação ainda depende de improviso — no preço, na proposta, na prospecção. E isso tem um custo invisivel que você paga todo mês.
              </p>
              <ul className="space-y-3 text-xs text-gray-300">
                {[
                  { icon: '🔍', text: 'Diagnóstico de perfil: sabe exatamente o que o cliente precisa antes de falar' },
                  { icon: '📊', text: 'Orçamento justificado: para de perder para quem cobra mais barato' },
                  { icon: '📄', text: 'Proposta em PDF: eleva a percepção de valor na hora certa' },
                  { icon: '🗂️', text: 'Gestão de clientes: operação organizada que suporta mais volume' },
                  { icon: '⚡', text: 'Conteúdo avançado: 3D mobile e IA que separam você da concorrência' },
                ].map((item) => (
                  <li key={item.text} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-2xl bg-white/3 border border-white/8 text-gray-300 text-xs font-semibold leading-relaxed">
                O mercado não vai te pagar mais só porque você faz vídeos melhores. Vai pagar mais quando você apresentar seu trabalho com mais autoridade e clareza.
              </div>
            </div>
          </div>

          {/* Common outcome strip */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-8">
            <div className="text-center mb-8 space-y-2">
              <h3 className="text-xl font-bold text-white">O que muda para os dois</h3>
              <p className="text-gray-500 text-xs">Independente de onde você está, o resultado aponta para o mesmo lugar.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <DollarSign className="w-5 h-5" />, title: 'Ticket mais alto', desc: 'Argumentação embasada que justifica o preço sem descontos' },
                { icon: <Clock className="w-5 h-5" />, title: 'Mais tempo', desc: 'Ferramentas que fazem em minutos o que tomava horas' },
                { icon: <Target className="w-5 h-5" />, title: 'Prospecção certa', desc: 'Dados reais antes de qualquer contato com o cliente' },
                { icon: <Zap className="w-5 h-5" />, title: 'Técnica que diferencia', desc: '3D e IA mobile que a concorrência ainda não sabe fazer' },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-2xl neo-glass border border-white/5 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mx-auto">
                    {item.icon}
                  </div>
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5.5 Feedbacks e Resultados */}
        <section className="py-16 border-t border-white/5 space-y-16 overflow-hidden">
          
          {/* Feedbacks Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-bold uppercase tracking-widest">
              <Star className="w-3.5 h-3.5" /> Comunidade Ativa
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              O que os criadores estão vivendo
            </h2>
            <p className="text-gray-400 text-sm font-light">
              Resultados reais de alunos e profissionais que já aplicaram a metodologia técnica e comercial da formação.
            </p>
          </div>

          {/* Infinite Carousel Feedbacks */}
          <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r before:from-[#050505] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-[#050505] after:to-transparent">
            <style>{`
              @keyframes slide {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-slide {
                animation: slide 50s linear infinite;
              }
              .animate-slide:hover {
                animation-play-state: paused;
              }
            `}</style>
            
            <div className="flex animate-slide gap-6 w-max px-4">
              {/* Duplicated list to create the infinite loop effect */}
              {[...feedbacks, ...feedbacks].map((src, index) => (
                <div key={index} className="w-[200px] h-[320px] sm:w-[240px] sm:h-[380px] flex-shrink-0 relative group rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a0a] flex items-center justify-center p-2">
                  <img 
                    src={src} 
                    alt={`Feedback ${index + 1}`} 
                    className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-brand-emerald/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
                </div>
              ))}
            </div>
          </div>

          {/* Videos 3D Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto px-6 mt-16 pt-8 border-t border-white/5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
              <PlayCircle className="w-3.5 h-3.5" /> Na Prática
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Resultados em 3D pelo celular
            </h2>
            <p className="text-gray-400 text-sm font-light">
              Projetos reais finalizados por alunos dominando as técnicas de 3D Mobile para elevar o nível de suas entregas.
            </p>
          </div>

          {/* 4 Videos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 max-w-6xl mx-auto pb-8">
            {videos3D.map((src, idx) => (
              <div key={idx} className="relative group mx-auto w-full max-w-[260px]">
                {/* Backlight / Retroiluminação */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-emerald/40 via-brand-mint/10 to-brand-jade/40 rounded-[1.5rem] blur-lg opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Video Container */}
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-brand-emerald/20 bg-[#050505] shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />
                  <iframe
                    src={`${src}&autoplay=false`}
                    className="w-full h-full absolute top-0 left-0"
                    style={{ border: 'none' }}
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* 6. Pre-Lista Section */}
        <section id="pre-lista" className="py-8 border-t border-white/5 scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: benefits */}
            <div className="space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full inline-block">
                  Pré-Lista
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Inscreva-se agora.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">
                    Quem chega primeiro,<br />fica melhor.
                  </span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed font-light pt-2">
                  A Creator Lab abre as portas em breve. Os inscritos na pré-lista terão condições que <strong className="text-white">nunca mais serão repetidas</strong> — porque quem acredita no começo merece ser reconhecido.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    tag: 'Desconto de Fundadores',
                    text: 'Acesso com o menor preço que a Creator Lab vai oferecer na história da plataforma.',
                  },
                  {
                    tag: 'Acesso Antecipado',
                    text: 'Você entra antes de todo mundo — e já começa a usar as ferramentas enquanto a abertura oficial não acontece.',
                  },
                  {
                    tag: 'Voz Ativa',
                    text: 'Feedbacks seus moldam o roadmap. Você ajuda a construir o app que vai transformar a sua operação.',
                  },
                ].map(({ tag, text }) => (
                  <div key={tag} className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{tag}</p>
                      <p className="text-xs text-gray-500 font-light leading-relaxed mt-0.5">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Luisera quote */}
              <div className="p-5 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 space-y-3">
                <p className="text-sm text-brand-mint font-semibold italic leading-relaxed">
                  "Criar pelo celular é acessível. Criar bem, de forma consistente e lucrativa — isso exige método. A Creator Lab é esse método."
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">— Luisera, criador mobile e idealizador</p>
              </div>
            </div>

            {/* Right: Form */}
            <PreListaForm />
          </div>
        </section>

        {/* Expert Profile Section */}
        <section className="py-12 md:py-16 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Image column */}
            <div className="col-span-12 md:col-span-5 relative group md:self-stretch md:flex md:flex-col md:justify-stretch">
              <div className="absolute -inset-2 md:-inset-3 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-tr from-brand-emerald/20 via-brand-mint/5 to-brand-jade/25 blur-xl md:blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
              <div className="relative rounded-2xl overflow-hidden border border-brand-emerald/25 bg-gradient-to-b from-[#0a0a0a] to-[#040404] shadow-[0_0_40px_rgba(16,185,129,0.2)] group-hover:border-brand-emerald/40 group-hover:shadow-[0_0_70px_rgba(16,185,129,0.45)] transition-all duration-500 md:flex-1 md:flex md:flex-col">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/imagem%20siteapp.png?alt=media&token=4465413b-007c-491a-a60e-398ce647e398"
                  alt="Luisera - Creator Lab Expert"
                  className="w-full object-cover object-top h-[280px] sm:h-[340px] md:h-full md:min-h-[580px] hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Description column */}
            <div className="col-span-12 md:col-span-7 space-y-5 md:space-y-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full inline-block">
                Quem construiu isso
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Criada por <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">Luisera</span>, a partir de uma dor real.
              </h2>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed font-light">
                <p>
                  Luisera passou pelos mesmos gargalos que você. Anos criando conteúdo mobile de alta qualidade, ensinando técnica para outros criadores, e percebendo que o problema não era a câmera — era a ausência de estrutura de negócio.
                </p>
                <p>
                  A Creator Lab nasceu dessa frustração: não existia um lugar que reunisse formação técnica séria <em>com</em> as ferramentas práticas de quem quer viver de criação mobile com profissionalismo e escala.
                </p>
                <p>
                  Cada feature da plataforma foi desenhada a partir de um gargalo real — vivido por Luisera ou pelos criadores que ele ensinou. Aqui, nada é teórico.
                </p>
              </div>
              <div className="p-4 md:p-5 rounded-2xl bg-brand-emerald/5 border border-brand-emerald/10 text-brand-mint text-sm font-semibold leading-relaxed">
                "O mercado não paga mais por quem grava bem. Paga por quem sabe transformar criação em resultado comercial."
              </div>
              <div className="pt-2">
                <a href="#pre-lista">
                  <Button className="glow-border text-black flex items-center gap-2">
                    Garantir vaga na pré-lista <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] text-center relative z-10">
        <p className="text-gray-600 text-xs">© 2026 Creator Lab. Desenvolvido para criadores profissionais. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}
