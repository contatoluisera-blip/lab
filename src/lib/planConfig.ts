// ─────────────────────────────────────────────────────────────
// Creator Lab — Configuração central de planos e permissões
// ─────────────────────────────────────────────────────────────

export type PlanId = 'start' | 'pro' | 'elite';

export type ToolId =
  | 'diagnosis'
  | 'calculator'
  | 'ideas'
  | 'proposal'
  | 'assistant'
  | 'clients'
  | 'actions';

export interface PlanConfig {
  id: PlanId;
  label: string;
  price: string;
  credits: number;          // créditos mensais
  tools: ToolId[] | 'all'; // ferramentas liberadas
  courses: boolean;         // acesso à aba Estudo
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  start: {
    id: 'start',
    label: 'Start',
    price: 'R$ 67/mês',
    credits: 20,
    tools: ['diagnosis', 'calculator', 'ideas', 'assistant'],
    courses: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'R$ 117/mês',
    credits: 50,
    tools: ['diagnosis', 'calculator', 'ideas', 'proposal', 'assistant', 'clients', 'actions'],
    courses: false,
  },
  elite: {
    id: 'elite',
    label: 'Elite',
    price: 'R$ 197/mês',
    credits: 100,
    tools: 'all',
    courses: true,
  },
};

/** Retorna true se o plano tem acesso à ferramenta */
export function planHasToolAccess(plan: PlanId | null | undefined, tool: ToolId): boolean {
  if (!plan) return false;
  const config = PLAN_CONFIGS[plan];
  if (!config) return false;
  if (config.tools === 'all') return true;
  return (config.tools as ToolId[]).includes(tool);
}

/** Retorna true se o plano tem acesso aos cursos */
export function planHasCourseAccess(plan: PlanId | null | undefined): boolean {
  if (!plan) return false;
  return PLAN_CONFIGS[plan]?.courses ?? false;
}

/** Retorna os créditos mensais do plano */
export function planCredits(plan: PlanId | null | undefined): number {
  if (!plan) return 0;
  return PLAN_CONFIGS[plan]?.credits ?? 0;
}
