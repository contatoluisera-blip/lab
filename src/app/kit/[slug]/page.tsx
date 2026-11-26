import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Gift, ShieldCheck } from 'lucide-react';
import PricingSection from '@/app/PricingSection';
import { SectionTitle } from '@/components/landing/sections';
import { KITS, getKit } from '@/lib/kits';
import { KitGate } from './KitGate';
import { KitContent } from './KitContent';

// Kit de prompts ("como eu fiz"): cadastro com aceite, o passo a passo com prompts para copiar
// e a condição da aula para assinar. Os dados de cada kit ficam em src/lib/kits. Fora do Google.

export function generateStaticParams() {
  return Object.keys(KITS).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const kit = getKit((await params).slug);
  if (!kit) return {};
  return {
    title: `${kit.title}${kit.accent ? ' ' + kit.accent : ''} · Kit Creator Lab`,
    description: kit.lead,
    robots: { index: false, follow: false },
  };
}

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) notFound();
  const path = `/kit/${kit.slug}`;

  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-brand-jade/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[35%] h-[50%] bg-brand-emerald/[0.07] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Creator Lab Logo" width={32} height={32} className="rounded-lg" />
          <Image src="/logo-text.png" alt="Creator Lab" width={192} height={40} className="w-32 md:w-40 object-contain" />
        </div>
        <Link href={`/login?next=${encodeURIComponent(path)}`} className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm text-white hover:border-brand-emerald/50 transition-colors">Entrar</Link>
      </header>

      <KitGate kit={kit}>
        <main className="relative z-10 max-w-5xl mx-auto px-5 md:px-6 pt-8 md:pt-12 pb-24 space-y-16">
          {/* Topo do kit */}
          <section className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 items-center">
            <div className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-mint">{kit.eyebrow}</p>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[0.98] text-balance">
                {kit.title} {kit.accent && <span className="text-brand-mint">{kit.accent}</span>}
              </h1>
              <p className="text-gray-400 leading-relaxed max-w-xl">{kit.lead}</p>
              <div className="flex flex-wrap gap-2">
                {kit.tools.map(t => (
                  <span key={t.label} className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300">
                    <b className="text-brand-mint font-semibold">{t.label}</b> {t.value}
                  </span>
                ))}
              </div>
            </div>
            {kit.video && (
              <div className="mx-auto w-full max-w-[240px] rounded-[24px] overflow-hidden border border-white/10 bg-black aspect-[9/16]">
                <video src={kit.video} poster={kit.poster} autoPlay muted loop playsInline aria-label="O vídeo final" className="w-full h-full object-cover" />
              </div>
            )}
          </section>

          <KitContent kit={kit} />

          {/* Oferta */}
          <section id="oferta" className="space-y-10 scroll-mt-10 pt-6">
            <div className="rounded-[28px] border border-brand-emerald/30 p-6 md:p-8 bg-[linear-gradient(140deg,rgba(16,185,129,0.18),rgba(6,95,70,0.12)_50%,rgba(3,20,13,0.4))] text-center space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-mint">Feito na Creator Lab</p>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight text-balance">
                Todos os modelos deste kit estão lá dentro, no mesmo saldo e em reais.
              </h2>
              <p className="text-sm text-gray-300 max-w-2xl mx-auto">
                GPT Image 2.6, Seedance 2.5, Kling 4.0, Veo 3.1, Nano Banana e mais, com o Gerador de Prompts para criar os seus a partir de uma ideia em português.
              </p>
            </div>
            <SectionTitle
              eyebrow={<><Gift className="w-3.5 h-3.5" /> Condição exclusiva do kit</>}
              title="50% de desconto"
              accent="nos 3 primeiros meses."
              sub="Escolha o plano e o ciclo. O desconto já entra no pagamento, sem cupom para digitar."
            />
            <PricingSection offer returnPath={path} />
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
              {['Sem fidelidade, cancele quando quiser', 'Créditos todo mês', 'Crédito volta se a IA falhar'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" /> {t}</span>
              ))}
            </div>
          </section>
        </main>
      </KitGate>

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
