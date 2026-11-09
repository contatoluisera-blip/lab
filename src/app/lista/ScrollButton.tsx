'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ScrollButton({ label = 'Quero entrar na pré-lista', className = '' }: { label?: string; className?: string }) {
  const scrollToForm = () => {
    document.getElementById('pre-lista-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <Button type="button" size="lg" onClick={scrollToForm} className={`px-8 flex items-center gap-2 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.7)] ${className}`}>
      {label} <ArrowRight className="w-4 h-4" />
    </Button>
  );
}
