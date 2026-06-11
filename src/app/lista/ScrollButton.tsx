'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function ScrollButton() {
  const scrollToForm = () => {
    document.getElementById('pre-lista-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToForm}
      className="glow-border bg-brand-emerald text-black font-bold px-8 py-4 rounded-xl text-sm uppercase tracking-wider hover:brightness-110 transition-all duration-300 flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
    >
      Quero entrar na pré-lista <ArrowRight className="w-4 h-4" />
    </button>
  );
}
