import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Flame, PlayCircle, Quote, Rocket } from 'lucide-react';
import { Eyebrow, ExamplesSection, HeroHeadline, HeroMosaic, HowItWorksSection, OneAppSection, SectionTitle, ToolsSection } from '@/components/landing/sections';
import PreListaForm from './PreListaForm';
import ScrollButton from './ScrollButton';

const BENEFITS = [
  { tag: 'Desconto de Fundadores', text: 'Acesso com o menor preço que a Creator Lab vai oferecer na história da plataforma.' },
  { tag: 'Acesso Antecipado', text: 'Você entra antes de todo mundo e já começa a usar as ferramentas enquanto a abertura oficial não acontece.' },
  { tag: 'Voz Ativa', text: 'Seus feedbacks moldam o roadmap. Você ajuda a construir o app que vai transformar a sua operação.' },
];

const MODELS = ['Kling 4.0', 'Google Veo 3.1', 'Seedance 2', 'Nano Banana Pro', 'GPT Image 2', 'Seedream 5', 'Hailuo 2.3', 'Wan 2.7', 'Runway', 'Claude'];

/** Captação de leads: o mesmo visual da página de vendas, com um único objetivo (entrar na pré-lista). */
export default function PreListaPage() {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">

      {/* Brilhos de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-brand-jade/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[25%] right-[-10%] w-[35%] h-[50%] bg-brand-emerald/[0.07] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-brand-mint/5 blur-[150px] rounded-full" />
      </div>

      {/* Navegação */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl h-16 rounded-2xl neo-glass flex items-center justify-between px-5 md:px-8 border border-white/5">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Creator Lab Logo" width={32} height={32} className="rounded-lg" />
          <Image src="/logo-text.png" alt="Creator Lab" width={192} height={40} className="w-32 md:w-44 object-contain" />
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" /> Pré-lista
        </span>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-28 md:pt-32 pb-24 space-y-28 md:space-y-36">

        {/* 1. Herói com o formulário */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-12 items-center pt-6">
          <div className="space-y-7 text-center lg:text-left">
            <Eyebrow><Flame className="w-3.5 h-3.5" /> Acesso exclusivo para os primeiros inscritos</Eyebrow>
            <HeroHeadline />
            <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              A Creator Lab junta tudo o que você usa para criar e vender: roteiro pronto, prompt com direção de cinema,
              geração de <strong className="text-white">imagem e vídeo com IA</strong>, orçamento e proposta. E os cursos para dominar a técnica.
            </p>
            <ul className="space-y-3 max-w-xl mx-auto lg:mx-0 text-left">
              {BENEFITS.map(b => (
                <li key={b.tag} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400 leading-relaxed"><strong className="text-white font-semibold">{b.tag}.</strong> {b.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <PreListaForm />
        </section>

        {/* Modelos */}
        <section aria-label="Modelos de IA disponíveis" className="-mt-12 md:-mt-20">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-gray-600 mb-4">Os modelos de IA que você usa aqui dentro</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {MODELS.map(m => (
              <span key={m} className="px-4 py-2 rounded-full border border-white/[0.07] bg-white/[0.03] text-sm font-semibold text-gray-300">{m}</span>
            ))}
          </div>
        </section>

        {/* 2. Vídeo */}
        <section className="space-y-8">
          <SectionTitle eyebrow={<><PlayCircle className="w-3.5 h-3.5" /> Assista</>} title="Veja o que vem" accent="por aí" />
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-4 bg-brand-emerald/15 blur-[80px] rounded-[40px] group-hover:bg-brand-emerald/25 transition-all duration-700 pointer-events-none" />
            <div className="relative rounded-[28px] p-2 border border-white/10 bg-white/[0.04] backdrop-blur">
              <div className="rounded-[22px] overflow-hidden bg-[#050505] aspect-video">
                <iframe
                  id="panda-07c0c55c-deb7-40ad-8f99-6859e00c03cf"
                  src="https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=07c0c55c-deb7-40ad-8f99-6859e00c03cf"
                  style={{ border: 'none' }}
                  className="w-full h-full"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        <OneAppSection />
        <HowItWorksSection />

        {/* A plataforma por dentro */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <Eyebrow><Rocket className="w-3.5 h-3.5" /> Por que entrar agora</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
              Quem chega primeiro,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">fica melhor.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Os inscritos na pré-lista terão condições que <strong className="text-white">nunca mais serão repetidas</strong>, porque quem acredita no começo merece ser reconhecido.
            </p>
            <figure className="p-5 rounded-[22px] border border-brand-emerald/20 bg-brand-emerald/[0.06] space-y-3 text-left">
              <Quote className="w-5 h-5 text-brand-mint" aria-hidden />
              <blockquote className="text-sm text-brand-mint font-semibold leading-relaxed">
                Criar pelo celular é acessível. Criar bem, de forma consistente e lucrativa, exige método. A Creator Lab é esse método.
              </blockquote>
              <figcaption className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Luisera, criador mobile e idealizador</figcaption>
            </figure>
            <ScrollButton className="w-full sm:w-auto" />
          </div>
          <HeroMosaic />
        </section>

        <ExamplesSection />
        <ToolsSection />

        {/* Chamada final */}
        <section className="relative overflow-hidden rounded-[36px] border border-brand-emerald/30 p-8 md:p-14 text-center bg-[linear-gradient(140deg,#10b981_0%,#059669_34%,#065f46_72%,#043b2c_100%)] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.7)]">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-mint/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-black/30 blur-3xl pointer-events-none" />
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05] text-balance">Garanta o seu lugar na pré-lista.</h2>
            <p className="text-brand-mint/90 text-lg">Gratuito, sem cartão de crédito e sem compromisso.</p>
            <ScrollButton label="Entrar na pré-lista" />
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 Creator Lab. Criação mobile e IA num app só.</p>
          <nav className="flex flex-wrap gap-5">
            <a href="/termos-de-uso" className="hover:text-brand-mint">Termos de uso</a>
            <a href="/politica-de-privacidade" className="hover:text-brand-mint">Privacidade</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
