import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { 
  Lightbulb, 
  Clapperboard, 
  ScanSearch,
  Calculator,
  FileText,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      
      <DashboardHeader />

      {/* Primary Tools Access */}
      <div className="px-4 md:px-0 relative z-10 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: '1000px' }}>
          {[
            {
              title: "Gerador de Ideias",
              description: "Insira seu nicho para receber conceitos estruturados de conteúdo, cena por cena.",
              icon: Lightbulb,
              href: "/dashboard/idea-generator",
              iconColor: "text-brand-neon",
              hoverTextColor: "group-hover:text-brand-neon",
              bgClass: "bg-brand-neon/10",
              shadowColor: "rgba(189,255,0,0.25)"
            },
            {
              title: "Diagnóstico de Perfil",
              description: "Analise seu posicionamento atual e descubra falhas e oportunidades de melhoria.",
              icon: ScanSearch,
              href: "/dashboard/diagnosis",
              iconColor: "text-teal-400",
              hoverTextColor: "group-hover:text-teal-400",
              bgClass: "bg-teal-400/10",
              shadowColor: "rgba(45,212,191,0.25)"
            },
            {
              title: "Simulador de Produção",
              description: "Obtenha planos de execução técnica detalhados a partir de cenários descritos.",
              icon: Clapperboard,
              href: "/dashboard/simulator",
              iconColor: "text-emerald-400",
              hoverTextColor: "group-hover:text-emerald-400",
              bgClass: "bg-emerald-400/10",
              shadowColor: "rgba(52,211,153,0.25)"
            },
            {
              title: "Calculadora de Orçamento",
              description: "Precifique com segurança usando dados de complexidade, equipamento e direitos.",
              icon: Calculator,
              href: "/dashboard/calculator",
              iconColor: "text-brand-jade",
              hoverTextColor: "group-hover:text-brand-jade",
              bgClass: "bg-brand-jade/20",
              shadowColor: "rgba(0,186,136,0.25)"
            },
            {
              title: "Gerador de Propostas",
              description: "Crie narrativas estratégicas e argumentações comerciais para seus projetos.",
              icon: FileText,
              href: "/dashboard/proposal",
              iconColor: "text-brand-mint",
              hoverTextColor: "group-hover:text-brand-mint",
              bgClass: "bg-brand-mint/10",
              shadowColor: "rgba(167,243,208,0.25)"
            },
            {
              title: "Assistente IA",
              description: "Tire dúvidas rápidas de roteiro, captação, edição ou posicionamento.",
              icon: MessageSquare,
              href: "/dashboard/assistant",
              iconColor: "text-green-400",
              hoverTextColor: "group-hover:text-green-400",
              bgClass: "bg-green-400/10",
              shadowColor: "rgba(74,222,128,0.25)"
            }
          ].map((tool, idx) => (
            <Link key={idx} href={tool.href} className="block group outline-none" style={{ transformStyle: 'preserve-3d' }}>
              <GlassCard 
                glow 
                className="h-full transition-all duration-500 ease-out transform-gpu group-hover:-translate-y-2 group-hover:scale-[1.02] border border-white/5 group-hover:border-white/20 p-6 relative overflow-hidden"
              >
                {/* Custom hover glow shadow for 3D effect */}
                <div 
                  className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ boxShadow: `0 20px 40px -10px ${tool.shadowColor}, inset 0 1px 1px rgba(255,255,255,0.1)` }}
                />

                <div className="flex flex-col items-start gap-5 h-full relative z-10" style={{ transform: 'translateZ(20px)' }}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 ${tool.bgClass} ${tool.iconColor} group-hover:shadow-[0_0_20px_currentColor]`}>
                    <tool.icon className="w-7 h-7 drop-shadow-[0_0_8px_currentColor]" />
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-xl font-bold tracking-tight text-white transition-colors duration-300 ${tool.hoverTextColor}`}>{tool.title}</h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed font-light tracking-wide transition-colors duration-300 group-hover:text-gray-300">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
