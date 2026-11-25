import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowRight, BadgePercent, CheckCircle2, Gift, HelpCircle, PlayCircle, ShieldCheck, Star, Zap } from 'lucide-react';
import PricingSection from '@/app/PricingSection';
import { FeedbackMarquee } from '@/components/landing/FeedbackMarquee';
import { Eyebrow, HowItWorksSection, OneAppSection, SectionTitle } from '@/components/landing/sections';
import { AulaGate } from './AulaGate';
import { AulaGuide } from './AulaGuide';

// Página da aula: quem comenta a palavra-chave no Instagram recebe este link.
// Antes da aula, nome, e-mail e aceite (AulaGate, guia em AulaGuide); depois, a aula no Panda Vídeo
// e a condição exclusiva (planConfig.ts, AULA_OFFER). Fora do Google.

export const metadata: Metadata = {
  title: 'Aula + condição exclusiva · Creator Lab',
  description: 'Assista à aula completa e entre na Creator Lab com 50% de desconto nos 3 primeiros meses.',
  robots: { index: false, follow: false },
};

const AULA_EMBED = 'https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=6086d8a8-bce1-46dc-903c-9448e5dac16b';

const INCLUDED = [
  'Gerador de Ideias com roteiro, gancho e takes',
  'Gerador de Prompts com direção de fotografia',
  'Geração de imagem e vídeo com Kling, Veo, Seedance e Nano Banana',
  'Locução, efeitos e trilha com IA',
  'Hub de Referências com reels que viralizaram',
  'Calculadora, propostas em PDF e gestão de clientes',
];

const OFFER_STEPS = [
  { cycle: 'Mensal', line: '50% de desconto nas 3 primeiras mensalidades.' },
  { cycle: 'Trimestral', line: 'O primeiro trimestre inteiro pela metade.' },
  { cycle: 'Anual', line: '3 meses pela metade, descontados já no primeiro ano.' },
];

const FAQ = [
  { q: 'Como funciona o desconto?', a: 'Ele já vem aplicado no pagamento, sem cupom para digitar. No mensal, as 3 primeiras cobranças saem com 50% de desconto. No trimestral, a primeira cobrança sai pela metade. No anual, o primeiro ano já vem com o valor de 3 meses pela metade descontado.' },
  { q: 'E depois do período com desconto?', a: 'A assinatura segue no preço normal do plano e do ciclo que você escolheu. O valor de depois aparece no card de cada plano, antes de você assinar.' },
  { q: 'Posso cancelar quando quiser?', a: 'Pode. Não tem fidelidade: você cancela pela própria área de planos, e o acesso continua até o fim do período já pago.' },
  { q: 'Como funcionam os créditos?', a: 'Cada plano traz créditos todo mês, em qualquer ciclo. O custo de cada uso aparece antes de você confirmar, e se a geração falhar por erro técnico, o crédito volta sozinho.' },
  { q: 'Já tenho conta na Creator Lab. Posso usar a condição?', a: 'Se a sua conta não tem assinatura ativa, pode. Entre com seu e-mail e senha, volte para esta página e escolha o plano. A condição é para novas assinaturas.' },
];

export default function AulaPage() {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">

      {/* Brilhos de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-brand-jade/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[35%] h-[50%] bg-brand-emerald/[0.07] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Topo enxuto: a página só leva à aula e à oferta */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Creator Lab Logo" width={32} height={32} className="rounded-lg" />
          <Image src="/logo-text.png" alt="Creator Lab" width={192} height={40} className="w-32 md:w-40 object-contain" />
        </div>
        <Link href={`/login?next=${encodeURIComponent('/aula#oferta')}`} className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm text-white hover:border-brand-emerald/50 transition-colors">Entrar</Link>
      </header>

      <AulaGate guide={<AulaGuide />}>
      <main className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-24 space-y-24 md:space-y-32">

        {/* 1. Aula */}
        <section className="space-y-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Eyebrow><PlayCircle className="w-3.5 h-3.5" /> Aula completa · 13 minutos</Eyebrow>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
              Domine a criação com IA <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">em poucos minutos.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-400 leading-relaxed">
              Veja na prática como uma ideia simples vira uma cena com qualidade de entrega, sem saber prompt técnico e sem depender de dez ferramentas. Assista até o fim: logo abaixo tem uma condição que só quem viu a aula recebe.
            </p>
          </div>
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-4 bg-brand-emerald/15 blur-[80px] rounded-[40px] pointer-events-none" />
            <div className="relative rounded-[28px] p-1.5 md:p-2 border border-white/10 bg-white/[0.04] backdrop-blur">
              <div className="rounded-[22px] overflow-hidden bg-[#050505] aspect-video">
                <iframe
                  id="panda-6086d8a8-bce1-46dc-903c-9448e5dac16b"
                  src={AULA_EMBED}
                  title="Aula Creator Lab"
                  style={{ border: 'none' }}
                  className="w-full h-full"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <a href="#oferta" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-mint hover:text-white transition-colors">
              Ver a condição exclusiva <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 2. Ponte para a oferta */}
        <section className="relative overflow-hidden rounded-[32px] border border-brand-emerald/30 p-7 md:p-12 bg-[linear-gradient(140deg,rgba(16,185,129,0.18),rgba(6,95,70,0.12)_50%,rgba(3,20,13,0.4))]">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-brand-emerald/25 blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div className="space-y-4">
              <Eyebrow><Gift className="w-3.5 h-3.5" /> Só para quem veio da aula</Eyebrow>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight text-balance">
                O que você viu na aula, você faz aqui dentro. Com <span className="text-brand-mint">50% de desconto</span> nos 3 primeiros meses.
              </h2>
              <p className="text-gray-300 leading-relaxed">
                A Creator Lab junta roteiro, prompt com direção, geração de imagem, vídeo e áudio com IA, orçamento e proposta num app só, feito para o celular.
              </p>
            </div>
            <ul className="space-y-3">
              {OFFER_STEPS.map(s => (
                <li key={s.cycle} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <BadgePercent className="w-5 h-5 text-brand-mint shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300"><strong className="text-white">{s.cycle}:</strong> {s.line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <OneAppSection />

        {/* 3. O que vem junto */}
        <section className="space-y-10">
          <SectionTitle eyebrow={<><Zap className="w-3.5 h-3.5" /> O que você recebe</>} title="Tudo o que você precisa" accent="para criar e vender." />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {INCLUDED.map(i => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" /> {i}
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-gray-500">No plano Elite, os cursos com Luisera também estão incluídos.</p>
        </section>

        <HowItWorksSection />

        {/* 4. Prova */}
        <section className="space-y-12 overflow-hidden">
          <SectionTitle eyebrow={<><Star className="w-3.5 h-3.5" /> Comunidade</>} title="Quem já usa," accent="conta." sub="Prints reais de alunos e criadores que aplicaram o método." />
          <FeedbackMarquee />
        </section>

        {/* 5. Oferta */}
        <section id="oferta" className="space-y-10 scroll-mt-10">
          <SectionTitle
            eyebrow={<><Gift className="w-3.5 h-3.5" /> Condição exclusiva da aula</>}
            title="50% de desconto"
            accent="nos 3 primeiros meses."
            sub="Escolha o plano e o ciclo. O desconto já entra no pagamento, sem cupom para digitar."
          />
          <PricingSection offer />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {['Sem fidelidade, cancele quando quiser', 'Créditos todo mês', 'Crédito volta se a IA falhar'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" /> {t}</span>
            ))}
          </div>
        </section>

        {/* 6. Perguntas */}
        <section className="max-w-3xl mx-auto space-y-10">
          <SectionTitle eyebrow={<><HelpCircle className="w-3.5 h-3.5" /> Perguntas frequentes</>} title="Antes de você" accent="decidir." />
          <div className="space-y-3">
            {FAQ.map(f => (
              <details key={f.q} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] open:border-brand-emerald/30 open:bg-brand-emerald/[0.05] transition-colors">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 text-white font-semibold">
                  {f.q}
                  <span className="w-8 h-8 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-brand-mint transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-sm text-gray-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 7. Chamada final */}
        <section className="relative overflow-hidden rounded-[36px] border border-brand-emerald/30 p-8 md:p-14 text-center bg-[linear-gradient(140deg,#10b981_0%,#059669_34%,#065f46_72%,#043b2c_100%)] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.7)]">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-mint/25 blur-3xl pointer-events-none" />
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05] text-balance">Comece hoje pagando metade.</h2>
            <p className="text-brand-mint/90 text-lg">A condição da aula vale para Start, Pro e Elite, em qualquer ciclo.</p>
            <a href="#oferta" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#043b2c] font-bold text-lg hover:bg-brand-mint transition-colors shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)]">
              Quero minha condição <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      </AulaGate>

      <footer className="border-t border-white/5 py-10 bg-[#050505] relative z-10">
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
