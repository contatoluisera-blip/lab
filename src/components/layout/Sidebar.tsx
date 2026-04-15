'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Lightbulb, 
  ScanSearch, 
  Clapperboard, 
  Calculator, 
  FileText, 
  MessageSquare,
  Trophy,
  Users,
  CreditCard,
  Settings
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Gerador de Ideias', href: '/dashboard/idea-generator', icon: Lightbulb },
  { name: 'Diagnóstico de Perfil', href: '/dashboard/diagnosis', icon: ScanSearch },
  { name: 'Simulador de Produção', href: '/dashboard/simulator', icon: Clapperboard },
  { name: 'Calculadora de Orçamento', href: '/dashboard/calculator', icon: Calculator },
  { name: 'Gerador de Propostas', href: '/dashboard/proposal', icon: FileText },
  { name: 'Perguntas Rápidas', href: '/dashboard/assistant', icon: MessageSquare },
  { name: 'Desafios', href: '/dashboard/challenges', icon: Trophy },
  { name: 'Colaboração', href: '/dashboard/collaboration', icon: Users },
  { name: 'Planos e Faturamento', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen max-h-screen neo-glass-panel border-l-0 border-t-0 border-b-0 sticky top-0 flex flex-col z-30">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center glow-text font-bold text-black border border-brand-emerald">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">ASA Creator</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-brand-emerald/10 text-brand-emerald glow-border" 
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-brand-mint" : "opacity-70 group-hover:opacity-100")} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/5">
        <div className="glass-card !p-4 !rounded-xl text-center space-y-2">
          <p className="text-xs text-gray-400">Plano Pro</p>
          <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
            <div className="bg-brand-emerald h-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>
          <p className="text-xs text-brand-mint">42/100 Créditos Usados</p>
        </div>
      </div>
    </aside>
  );
}
