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
  | 'estudia';

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
    tools: ['diagnosis', 'calculator', 'ideas', 'assistant', 'creator-card', 'estudia'],
    courses: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'R$ 117/mês',
    credits: 50,
    tools: ['diagnosis', 'calculator', 'ideas', 'proposal', 'assistant', 'clients', 'actions', 'creator-card', 'estudia'],
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
 * Custo em créditos de cada uso. Hoje todas as ferramentas com IA custam 1.
 * A calculadora não tem custo externo e não consome crédito.
 * Para mudar o preço de uma ferramenta, altere só aqui.
 */
export const TOOL_COSTS: Record<ToolId, number> = {
  diagnosis: 1,
  calculator: 0,
  ideas: 1,
  proposal: 1,
  assistant: 1,
  clients: 0,
  actions: 0,
  'creator-card': 1,
  estudia: 1,
};

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
