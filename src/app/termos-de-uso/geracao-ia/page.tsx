import React from 'react';
import type { Metadata } from 'next';
import { GEN_TERMS_SECTIONS, GEN_TERMS_VERSION } from '@/lib/genTerms';

export const metadata: Metadata = {
  title: 'Termos de uso da geração de imagens e vídeos | Creator Lab',
};

export default function TermosGeracaoIA() {
  const [y, m, d] = GEN_TERMS_VERSION.split('-');
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs uppercase tracking-widest text-brand-mint font-semibold">Creator Lab</p>
        <h1 className="text-3xl font-bold text-brand-emerald">Termos de uso da geração de imagens e vídeos</h1>
        <p className="text-sm text-gray-500">Versão de {d}/{m}/{y}. É preciso aceitar estes termos antes da primeira geração e a cada nova versão.</p>

        {GEN_TERMS_SECTIONS.map(section => (
          <section key={section.title} className="space-y-3 pt-4">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <ul className="space-y-2 list-disc pl-5">
              {section.items.map(item => <li key={item} className="text-gray-400 text-sm leading-relaxed">{item}</li>)}
            </ul>
          </section>
        ))}

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm">
          <a href="/termos-de-uso" className="text-brand-mint hover:underline">Termos de Uso gerais</a>
          <a href="/politica-de-privacidade" className="text-brand-mint hover:underline">Política de Privacidade</a>
          <a href="/" className="text-brand-mint hover:underline">Página inicial</a>
        </div>
      </div>
    </div>
  );
}
