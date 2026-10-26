// ─────────────────────────────────────────────────────────────
// Creator Lab — Configuração central de planos, permissões e custos
// Única fonte de verdade: usada pelas telas, pelas rotas de ferramentas,
// pelo webhook do Stripe e pelas rotas de faturamento.
// ─────────────────────────────────────────────────────────────

export type PlanId = 'start' | 'pro' | 'elite';
/** Plano gravado no perfil pode ser um dos pagos ou 'free' (conta sem assinatura ativa). */
export type StoredPlan = PlanId | 'free';

export type ToolId =
  | 'diagnosis'
  | 'calculator'
  | 'ideas'
  | 'proposal'
  | 'assistant'
  | 'clients'
  | 'actions'
  | 'creator-card'
  | 'estudia'
  | 'prompts'
  | 'proposal-rewrite'
  | 'caption'
  | 'hub';

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
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'assistant', 'creator-card', 'estudia', 'prompts', 'hub'],
    courses: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'R$ 117/mês',
    credits: 50,
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'proposal', 'proposal-rewrite', 'assistant', 'clients', 'actions', 'creator-card', 'estudia', 'prompts', 'hub'],
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

/**
 * Custo em créditos de cada uso. Para mudar o preço de uma ferramenta, altere só aqui.
 * Referência de custo real por uso (out/2026): Diagnóstico ~R$ 1,53 (Apify + IA), por isso 2 créditos;
 * demais ferramentas de IA entre R$ 0,01 e R$ 0,64. Calculadora, reescrita de trecho e Hub não têm custo relevante.
 */
export const TOOL_COSTS: Record<ToolId, number> = {
  diagnosis: 2,
  calculator: 0,
  ideas: 1,
  proposal: 1,
  assistant: 1,
  clients: 0,
  actions: 0,
  'creator-card': 1,
  estudia: 1,
  prompts: 1,
  'proposal-rewrite': 0, // ajuste fino de um trecho: custo ~R$ 0,01, não consome crédito
  caption: 1, // legenda do post de uma ideia, gerada à parte
  hub: 0, // navegar no hub é gratuito; as ações de IA cobram na ferramenta de destino
};

/** Gerador de Ideias: 1 crédito até 5 ideias, 2 créditos de 6 a 10 (o custo de IA cresce com a quantidade). */
export const IDEAS_MAX = 10;
export function ideasCost(quantidade: unknown) {
  const n = Math.min(IDEAS_MAX, Math.max(1, Math.round(Number(quantidade) || 5)));
  return n > 5 ? 2 : 1;
}

/** Primeiro uso de cada ferramenta é gratuito (teste). */
export const FREE_FIRST_USE = true;

/** Mapeia o ID do produto no Stripe para o plano. Lê as variáveis de ambiente uma vez. */
export function planFromStripeProduct(productId: string | null | undefined): PlanId | null {
  if (!productId) return null;
  const map: Record<string, PlanId> = {};
  const pairs: [string | undefined, PlanId][] = [
    [process.env.STRIPE_PRODUCT_START, 'start'],
    [process.env.STRIPE_PRODUCT_PRO, 'pro'],
    [process.env.STRIPE_PRODUCT_ELITE, 'elite'],
    [process.env.STRIPE_PRODUCT_START_ANNUAL, 'start'],
    [process.env.STRIPE_PRODUCT_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRODUCT_ELITE_ANNUAL, 'elite'],
  ];
  for (const [id, plan] of pairs) if (id) map[id] = plan;
  return map[productId] ?? null;
}

export function isPaidPlan(plan: string | null | undefined): plan is PlanId {
  return plan === 'start' || plan === 'pro' || plan === 'elite';
}

/** Retorna true se o plano tem acesso à ferramenta */
export function planHasToolAccess(plan: string | null | undefined, tool: ToolId): boolean {
  if (!isPaidPlan(plan)) return false;
  const config = PLAN_CONFIGS[plan];
  if (config.tools === 'all') return true;
  return config.tools.includes(tool);
}

/** Retorna true se o plano tem acesso aos cursos */
export function planHasCourseAccess(plan: string | null | undefined): boolean {
  if (!isPaidPlan(plan)) return false;
  return PLAN_CONFIGS[plan].courses;
}

/** Retorna os créditos mensais do plano */
export function planCredits(plan: string | null | undefined): number {
  if (!isPaidPlan(plan)) return 0;
  return PLAN_CONFIGS[plan].credits;
}
