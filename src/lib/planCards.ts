// Vitrine dos planos (cards, ordem e destaques), a mesma em Planos e Faturamento e no paywall.
// Preço e créditos vêm de src/lib/planConfig.ts.
import { PlanId } from './planConfig';

export type PlanCard = { id: PlanId; tier: number; description: string; features: string[]; featured?: boolean };

export const PLAN_CARDS: PlanCard[] = [
  { id: 'start', tier: 1, description: 'Ideal para criadores que querem sair do improviso e vender com mais clareza.',
    features: ['200 créditos de IA/mês', 'Diagnóstico de Perfil', 'Calculadora de Orçamento', 'Gerador de Ideias', 'Hub de Referências e Gerador de Prompts'] },
  { id: 'pro', tier: 2, featured: true, description: 'Para quem quer vender com mais autoridade e organizar melhor sua operação.',
    features: ['500 créditos de IA/mês', 'Acesso completo a todas as ferramentas', 'Gerador de Ideias & Propostas', 'Hub de Referências e Gerador de Prompts', 'Gestão de Clientes', 'Suporte via e-mail'] },
  { id: 'elite', tier: 3, description: 'Para criadores que querem levar a criação mobile para outro patamar.',
    features: ['1.000 créditos de IA/mês', 'Tudo do plano Pro', 'Cursos e Lives com Luisera', 'Suporte prioritário 24/7', 'Consultoria de marca pessoal'] },
  { id: 'agency', tier: 4, description: 'Para agências e empresas que atendem até ~6 clientes por mês com Reels, posts e carrosséis.',
    features: ['10.000 créditos de IA/mês', 'Tudo do plano Elite', '6 gerações simultâneas', 'Vídeos de até 5 minutos na Montagem', 'Recarga a R$ 0,125 por crédito'] },
  { id: 'agency_plus', tier: 5, featured: true, description: 'Para agências e empresas com carteira média, ~16 clientes por mês.',
    features: ['25.000 créditos de IA/mês', 'Tudo do plano Corporativo', '10 gerações simultâneas', 'Crédito 12% mais barato que no Corporativo'] },
  { id: 'agency_max', tier: 6, description: 'Para operações grandes, ~32 clientes por mês.',
    features: ['50.000 créditos de IA/mês', 'Tudo do plano Corporativo', '15 gerações simultâneas', 'Crédito 20% mais barato que no Corporativo'] },
];
export const TIER: Record<string, number> = { start: 1, pro: 2, elite: 3, agency: 4, agency_plus: 5, agency_max: 6 };
