import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Clapperboard, Lightbulb, TrendingUp, Sparkles, Navigation } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">
      {/* Abstract Background Elements local overrides */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-jade/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[30%] h-[50%] bg-brand-emerald/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-brand-mint/5 blur-[150px] rounded-full" />
      </div>

      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl h-16 rounded-2xl neo-glass flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Creator Lab Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-xl tracking-tight text-white">Creator Lab</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <Link href="#features" className="hover:text-brand-mint transition-colors">Recursos</Link>
          <Link href="#pricing" className="hover:text-brand-mint transition-colors">Preços</Link>
          <Link href="/dashboard" className="text-white hover:text-brand-mint transition-colors">Entrar no App</Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 mb-40 pt-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full neo-glass text-brand-mint text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>O Sistema Operacional de Inteligência para Criadores Mobile</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-tight">
            Produza <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-jade drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Melhor.</span><br />
            Cobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Mais.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Uma plataforma premium assistida por IA, desenvolvida para ajudar criadores mobile a pensar melhor, executar com perfeição, precificar de forma inteligente e escalar seus negócios criativos.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="glow-border text-black">Começar de Graça</Button>
            </Link>
            <Button size="lg" variant="ghost" className="hidden sm:flex">Ver a Plataforma</Button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 border-t border-white/5">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Projetado para o Criador Moderno</h2>
            <p className="text-gray-400">Tudo o que você precisa, da ideia à execução.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard glow className="group cursor-pointer">
              <Lightbulb className="w-8 h-8 text-brand-emerald mb-6 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all" />
              <h3 className="text-xl font-semibold text-white mb-3">Gerador de Ideias</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Gere conceitos de conteúdo de alta conversão adaptados ao seu nicho, público e equipamento disponível com notas práticas de execução.
              </p>
            </GlassCard>
            
            <GlassCard glow className="group cursor-pointer">
              <Clapperboard className="w-8 h-8 text-brand-emerald mb-6 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all" />
              <h3 className="text-xl font-semibold text-white mb-3">Simulador de Produção</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transforme um cenário em um plano de produção passo a passo. Recomendações de iluminação, enquadramento, áudio e lista de planos instantaneamente.
              </p>
            </GlassCard>

            <GlassCard glow className="group cursor-pointer">
              <TrendingUp className="w-8 h-8 text-brand-emerald mb-6 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all" />
              <h3 className="text-xl font-semibold text-white mb-3">Orçamento Inteligente</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Mecanismo de precificação baseado em dados. Calcule exatamente quanto cobrar com base na complexidade, direitos de uso e esforço, sem adivinhações.
              </p>
            </GlassCard>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-transparent text-center relative z-10">
        <p className="text-gray-600 text-sm">© 2026 Creator Lab. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
