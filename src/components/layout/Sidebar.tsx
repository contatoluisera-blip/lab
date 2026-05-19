'use client';

import React, { useState, useEffect } from 'react';
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
  Settings,
  Lock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  FolderArchive
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Diagnóstico de Perfil', href: '/dashboard/diagnosis', icon: ScanSearch },
  { name: 'Calculadora de Orçamento', href: '/dashboard/calculator', icon: Calculator },
  { name: 'Gerador de Ideias', href: '/dashboard/idea-generator', icon: Lightbulb },
  { name: 'Gerador de Propostas', href: '/dashboard/proposal', icon: FileText },
  { name: 'Simulador de Produção', href: '/dashboard/simulator', icon: Clapperboard },
  { name: 'Minhas Ações', href: '/dashboard/actions', icon: FolderArchive },
  { name: 'Meus Clientes', href: '/dashboard/clients', icon: Briefcase },
  { name: 'Perguntas Rápidas', href: '/dashboard/assistant', icon: MessageSquare },
  { name: 'Desafios', href: '/dashboard/challenges', icon: Trophy, comingSoon: true },
  { name: 'Colaboração', href: '/dashboard/collaboration', icon: Users, comingSoon: true },
  { name: 'Planos e Faturamento', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Listen for mobile toggle event from Topbar
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen(prev => !prev);
    document.addEventListener('toggleSidebar', handleToggle);
    return () => document.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "h-screen max-h-screen neo-glass-panel border-l-0 border-t-0 border-b-0 flex flex-col z-50 transition-all duration-300 ease-in-out",
          // Mobile styles
          "fixed top-0 left-0 w-64 md:relative",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop styles
          isDesktopExpanded ? "md:w-64" : "md:w-20"
        )}
      >
        <div className={cn("p-6 flex items-center justify-between", !isDesktopExpanded && "md:px-0 md:justify-center")}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center glow-text font-bold text-black border border-brand-emerald flex-shrink-0">
              A
            </div>
            <span className={cn("font-semibold text-lg tracking-tight text-white transition-opacity duration-200", !isDesktopExpanded && "md:hidden")}>
              ASA Creator
            </span>
          </Link>

          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {isDesktopExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 space-y-1 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.comingSoon ? '#' : item.href}
                className={cn(
                  "flex items-center rounded-xl transition-all group relative",
                  isDesktopExpanded ? "gap-3 px-3 py-2.5" : "md:justify-center md:py-3 md:px-0 px-3 py-2.5 gap-3",
                  isActive 
                    ? "bg-brand-emerald/10 text-brand-emerald glow-border" 
                    : "text-gray-400 hover:text-gray-100 hover:bg-white/5",
                  item.comingSoon && "opacity-50 grayscale-[0.5] cursor-default"
                )}
                onClick={(e) => item.comingSoon && e.preventDefault()}
                title={!isDesktopExpanded ? item.name : undefined} // Tooltip when collapsed
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0", 
                  isActive ? "text-brand-mint" : "opacity-70 group-hover:opacity-100",
                  !isDesktopExpanded && "md:w-6 md:h-6"
                )} />
                <span className={cn("text-sm font-medium transition-opacity duration-200", !isDesktopExpanded && "md:hidden")}>
                  {item.name}
                </span>
                
                {/* Coming Soon Badge */}
                {item.comingSoon && (
                  <div className={cn("ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors", !isDesktopExpanded && "md:hidden")}>
                    <Lock className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">
                      Em breve
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className={cn("p-4 border-t border-white/5", !isDesktopExpanded && "md:px-2")}>
          {isDesktopExpanded ? (
            <div className="glass-card !p-4 !rounded-xl text-center space-y-2">
              <p className="text-xs text-gray-400">Plano Pro</p>
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-emerald h-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              <p className="text-xs text-brand-mint">42/100 Créditos Usados</p>
            </div>
          ) : (
            <div className="glass-card !p-3 !rounded-xl flex flex-col items-center justify-center gap-2 md:block hidden text-center" title="Plano Pro: 42/100 Créditos">
               <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                 <div className="bg-brand-emerald h-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
               </div>
               <span className="text-[10px] font-bold text-brand-mint">PRO</span>
            </div>
          )}
          
          {/* Mobile version always shows full card */}
          <div className="glass-card !p-4 !rounded-xl text-center space-y-2 md:hidden">
            <p className="text-xs text-gray-400">Plano Pro</p>
            <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-emerald h-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
            <p className="text-xs text-brand-mint">42/100 Créditos Usados</p>
          </div>

        </div>
      </aside>
    </>
  );
}
