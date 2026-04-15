import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  Lightbulb, 
  Clapperboard, 
  Trophy, 
  ArrowRight,
  TrendingUp,
  Activity,
  ScanSearch,
  Calculator,
  FileText,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bem-vindo de volta, Criador.</h1>
          <p className="text-gray-400 mt-1">Veja o que está acontecendo com suas ferramentas de produção hoje.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Ver Histórico</Button>
          <Button>Gerar Ideia</Button>
        </div>
      </div>

      {/* Quick Stats & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-gray-300">Plano Pro</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">42 / 100</h3>
            <p className="text-sm text-gray-400">Créditos de IA Usados</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-gray-300">Este Mês</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">12</h3>
            <p className="text-sm text-gray-400">Propostas Geradas</p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-emerald/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white">Desafio Semanal</h3>
            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
              "B-Roll Cinematico de Produto" <ArrowRight className="w-4 h-4" />
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Primary Tools Access */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Central de Ferramentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Gerador de Ideias",
              description: "Insira seu nicho para receber conceitos estruturados de conteúdo, cena por cena.",
              icon: Lightbulb,
              href: "/dashboard/idea-generator",
              iconColor: "text-brand-neon",
              bgClass: "bg-brand-neon/10"
            },
            {
              title: "Diagnóstico de Perfil",
              description: "Analise seu posicionamento atual e descubra falhas e oportunidades de melhoria.",
              icon: ScanSearch,
              href: "/dashboard/diagnosis",
              iconColor: "text-teal-400",
              bgClass: "bg-teal-400/10"
            },
            {
              title: "Simulador de Produção",
              description: "Obtenha planos de execução técnica detalhados a partir de cenários descritos.",
              icon: Clapperboard,
              href: "/dashboard/simulator",
              iconColor: "text-emerald-400",
              bgClass: "bg-emerald-400/10"
            },
            {
              title: "Calculadora de Orçamento",
              description: "Precifique com segurança usando dados de complexidade, equipamento e direitos.",
              icon: Calculator,
              href: "/dashboard/calculator",
              iconColor: "text-brand-jade",
              bgClass: "bg-brand-jade/20"
            },
            {
              title: "Gerador de Propostas",
              description: "Crie narrativas estratégicas e argumentações comerciais para seus projetos.",
              icon: FileText,
              href: "/dashboard/proposal",
              iconColor: "text-brand-mint",
              bgClass: "bg-brand-mint/10"
            },
            {
              title: "Assistente IA",
              description: "Tire dúvidas rápidas de roteiro, captação, edição ou posicionamento.",
              icon: MessageSquare,
              href: "/dashboard/assistant",
              iconColor: "text-green-400",
              bgClass: "bg-green-400/10"
            }
          ].map((tool, idx) => (
            <Link key={idx} href={tool.href} className="block">
              <GlassCard glow className="h-full group hover:border-brand-emerald/40 transition-colors">
                <div className="flex flex-col items-start gap-4 h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${tool.bgClass} ${tool.iconColor}`}>
                    <tool.icon className="w-6 h-6 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_currentColor]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-brand-emerald transition-colors">{tool.title}</h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Outputs (Placeholder) */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Resultados Recentes</h2>
        <GlassCard className="p-0">
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-400">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Ideia de b-roll para cafeteria</h4>
                    <p className="text-xs text-gray-500">Gerador de Ideias • 2 horas atrás</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

    </div>
  );
}
