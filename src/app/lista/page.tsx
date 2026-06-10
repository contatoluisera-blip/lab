'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  ShieldCheck,
  Mail,
  User,
  ArrowRight,
  BrainCircuit,
  TrendingUp,
  Clapperboard,
  Calculator,
  Lightbulb,
  Clock,
  ChevronDown,
  Flame,
  Phone,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/* ─── Floating particle dots ─────────────────────────────────────────────── */
const Dots = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {[...Array(24)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-brand-emerald/30"
        style={{
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float-dot ${Math.random() * 8 + 6}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
          opacity: Math.random() * 0.7 + 0.2,
        }}
      />
    ))}
  </div>
);

/* ─── Divider ─────────────────────────────────────────────────────────────── */
const Divider = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-20" />
);

/* ─── Ecosystem card ──────────────────────────────────────────────────────── */
function EcosystemCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="relative group p-px rounded-2xl bg-gradient-to-br from-white/5 to-transparent hover:from-brand-emerald/20 transition-all duration-500">
      <div className="rounded-2xl bg-[#070707] p-6 space-y-4 h-full">
        <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/15 flex items-center justify-center text-brand-emerald group-hover:bg-brand-emerald/20 group-hover:border-brand-emerald/30 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-500">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-white font-bold text-base">{title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed font-light">{description}</p>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function PreListaPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
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

  const scrollToForm = () => {
    document.getElementById('pre-lista-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">

      {/* ── Ambient glows ───────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-brand-jade/8 blur-[180px] rounded-full" />
        <div className="absolute top-[40%] right-[-8%] w-[35%] h-[40%] bg-brand-emerald/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[15%] w-[55%] h-[35%] bg-brand-mint/4 blur-[160px] rounded-full" />
      </div>
      <Dots />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl h-16 rounded-2xl neo-glass flex items-center justify-between px-6 md:px-8 border border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Creator Lab" className="w-8 h-8 rounded-lg" />
          <span className="text-white font-bold tracking-tight text-base hidden sm:block">Creator Lab</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse inline-block" />
          Pré-Lista Exclusiva
        </span>
      </header>

      <main className="relative z-10">

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 max-w-4xl mx-auto">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full neo-glass text-brand-mint text-xs font-semibold mb-8 border border-brand-emerald/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
            <Flame className="w-4 h-4 text-brand-emerald" />
            <span>Acesso exclusivo para os primeiros inscritos</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-8">
            Você cria pelo celular.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-jade drop-shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              Chegou a hora de escalar.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed font-light mb-10">
            A <strong className="text-white">Creator Lab</strong> reúne cursos de criação mobile, ferramentas de diagnóstico, orçamento, geração de ideias e um assistente de IA 24h — tudo para você produzir mais, errar menos e cobrar o que o seu trabalho realmente vale.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={scrollToForm}
              className="glow-border bg-brand-emerald text-black font-bold px-8 py-4 rounded-xl text-sm uppercase tracking-wider hover:brightness-110 transition-all duration-300 flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
            >
              Quero entrar na pré-lista <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-500">Gratuito · Sem compromisso · Vagas limitadas</p>
          </div>

          {/* Scroll cue */}
          <div className="mt-20 flex flex-col items-center gap-2 opacity-40 animate-bounce">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Saiba mais</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PAIN POINT — storytelling
        ══════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-snug">
            Criação mobile é poderosa.<br />
            <span className="text-gray-500 font-light">Mas criar com consistência e lucro é outra história.</span>
          </h2>
          <p className="text-gray-400 text-base leading-loose font-light">
            Seja você iniciando agora ou já atendendo clientes, o desafio é o mesmo: transformar o que sai pelo celular em uma operação que cresce, que cobra bem e que não depende de sorte. Técnica se aprende. Processo, estrutura e as ferramentas certas — é aí que a maioria trava.
          </p>
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] text-left space-y-3">
            <p className="text-sm text-gray-300 font-medium mb-4 uppercase tracking-widest text-center text-brand-emerald/70">
              Soa familiar?
            </p>
            {[
              'Não sabe por onde começar a se aperfeiçoar tecnicamente — o YouTube tem muita coisa, mas nada estruturado.',
              'Passa horas pensando num orçamento justo e no final chuta um número.',
              'Tenta enviar uma proposta pelo WhatsApp e o cliente some.',
              'Cada projeto começa do zero porque você não tem um processo.',
              'Aceita qualquer valor porque não sabe como justificar o seu.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-red-500/60 mt-0.5 text-lg leading-none">—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-base text-white font-semibold">
            Isso não é falta de talento. É falta de <span className="text-brand-emerald">formação completa e das ferramentas certas.</span>
          </p>
        </section>

        <Divider />

        {/* ══════════════════════════════════════════════════════
            CREATOR LAB — O QUE É
        ══════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-8 text-center space-y-6">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full inline-block mb-4">
            A Plataforma
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Creator Lab é o seu laboratório de criação <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">
              do primeiro frame até o contrato fechado.
            </span>
          </h2>
          <p className="text-gray-400 text-base font-light max-w-2xl mx-auto leading-relaxed">
            Um ecossistema completo que combina formação técnica de alto nível com ferramentas inteligentes para que cada hora do seu trabalho valha mais — e você consiga atender mais clientes sem perder qualidade.
          </p>

          {/* Ecosystem grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 text-left">
            <EcosystemCard
              icon={Clapperboard}
              title="Cursos de Criação Mobile"
              description="Do primeiro enquadramento à edição com efeito 3D pelo celular. Aulas práticas de captação, luz, edição no CapCut, BlackMagic e Node Video com Luisera."
            />
            <EcosystemCard
              icon={Sparkles}
              title="Diagnóstico de Perfil"
              description="Cole o @ de qualquer cliente e receba uma análise completa de engajamento, consistência e oportunidades — a base para argumentar com dados reais."
            />
            <EcosystemCard
              icon={Calculator}
              title="Calculadora de Orçamento"
              description="Defina os parâmetros do projeto e receba um valor claro, justificado e profissional. Fim do achismo, fim do nervoso na hora de passar o preço."
            />
            <EcosystemCard
              icon={Lightbulb}
              title="Gerador de Ideias"
              description="IA que sugere ideias de vídeos alinhadas ao perfil do cliente. Cada ideia vem com cena, roteiro, estrutura audiovisual e tempo sugerido."
            />
            <EcosystemCard
              icon={BrainCircuit}
              title="Assistente de IA 24h"
              description="Treinado em audiovisual mobile e especialista nas ferramentas que você usa: CapCut, Node Video e lógica de criação pelo celular. Tire dúvidas técnicas, desbloqueie roteiros e evolua mais rápido — disponível a qualquer hora."
            />
            <EcosystemCard
              icon={TrendingUp}
              title="Gestão de Clientes & Ações"
              description="Histórico de diagnósticos, propostas criadas, status de entregas e controle de pagamentos. Toda sua operação centralizada em um painel."
            />
          </div>
        </section>

        <Divider />

        {/* ══════════════════════════════════════════════════════
            OUTCOME — O que muda de verdade
        ══════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              O que muda quando você tem as ferramentas certas
            </h2>
            <p className="text-gray-500 text-sm font-light max-w-xl mx-auto">
              Não é sobre trabalhar mais. É sobre trabalhar com mais precisão para chegar mais longe.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                before: 'Horas criando orçamento, briefing e proposta do zero para cada cliente.',
                after: 'Minutos. Ferramentas integradas fazem o trabalho pesado por você.',
                label: 'Velocidade',
              },
              {
                icon: TrendingUp,
                before: 'Ticket médio estagnado porque você não consegue justificar seu preço.',
                after: 'Cobranças respaldadas por diagnóstico e complexidade. O cliente entende e paga.',
                label: 'Ticket Médio',
              },
              {
                icon: Sparkles,
                before: 'Cada projeto novo é um improviso. Sem processo, sem rastreio, sem histórico.',
                after: 'Método replicável. Você escala sem precisar reinventar a roda toda vez.',
                label: 'Escala',
              },
            ].map(({ icon: Icon, before, after, label }) => (
              <GlassCard key={label} className="p-6 space-y-5 border-white/5 hover:border-brand-emerald/10 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 border border-brand-emerald/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-emerald" />
                  </div>
                  <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest">{label}</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      <span className="text-red-500/70 font-bold uppercase text-[9px] tracking-widest block mb-1">Antes</span>
                      {before}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-emerald/5 border border-brand-emerald/10">
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      <span className="text-brand-emerald font-bold uppercase text-[9px] tracking-widest block mb-1">Depois</span>
                      {after}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <Divider />

        {/* ══════════════════════════════════════════════════════
            PRÉ-LISTA — Benefícios + Form
        ══════════════════════════════════════════════════════ */}
        <section id="pre-lista-form" className="max-w-5xl mx-auto px-6 py-8 scroll-mt-24">
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

                      {/* Name */}
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

                      {/* Email */}
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

                      {/* Instagram */}
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

                      {/* WhatsApp */}
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

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 text-sm font-bold uppercase tracking-wider text-black shadow-[0_0_25px_rgba(16,185,129,0.25)] mt-1"
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
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FOOTER MINIMAL
        ══════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/5 py-12 mt-24 text-center relative z-10">
          <p className="text-gray-700 text-xs">
            © 2026 Creator Lab · Desenvolvido por Luisera para criadores mobile que levam a criação a sério.
          </p>
        </footer>
      </main>

      {/* Float-dot keyframe injected globally */}
      <style>{`
        @keyframes float-dot {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-12px) translateX(6px); opacity: 0.6; }
          66% { transform: translateY(6px) translateX(-8px); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
