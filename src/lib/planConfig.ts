// ─────────────────────────────────────────────────────────────
// Creator Lab — Configuração central de planos, permissões e custos
// Única fonte de verdade: usada pelas telas, pelas rotas de ferramentas,
// pelo webhook do Stripe e pelas rotas de faturamento.
// ─────────────────────────────────────────────────────────────

export type PlanId = 'start' | 'pro' | 'elite' | 'agency';
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
  | 'hub'
  | 'gen-image'
  | 'gen-video'
  | 'montagem';

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
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'assistant', 'creator-card', 'estudia', 'prompts', 'hub', 'gen-image', 'gen-video', 'montagem'],
    courses: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'R$ 117/mês',
    credits: 50,
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'proposal', 'proposal-rewrite', 'assistant', 'clients', 'actions', 'creator-card', 'estudia', 'prompts', 'hub', 'gen-image', 'gen-video', 'montagem'],
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
  // Empresas e agências: volume alto de produção (R$ 1,50 por crédito, 24% abaixo do Elite).
  agency: {
    id: 'agency',
    label: 'Agência',
    price: 'R$ 1.497/mês',
    credits: 1000,
    tools: 'all',
    courses: true,
  },
};

// ── Ciclos de cobrança ───────────────────────────────────────────────────────
// Os créditos são sempre mensais: trimestral e anual recebem a cota do plano todo mês
// (recarga agendada em /api/billing/refill). Estudo: docs/projecao-planos.md.
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export const BILLING_CYCLES: Record<BillingCycle, { label: string; months: number; discount: number }> = {
  monthly: { label: 'Mensal', months: 1, discount: 0 },
  quarterly: { label: 'Trimestral', months: 3, discount: 0.10 },
  annual: { label: 'Anual', months: 12, discount: 0.20 },
};

/** Preço por mês em cada ciclo (vitrine); o total do ciclo é este valor × meses. Precisa bater com a Stripe. */
export const PLAN_PRICES: Record<PlanId, Record<BillingCycle, number>> = {
  start: { monthly: 67, quarterly: 59.9, annual: 53 },
  pro: { monthly: 117, quarterly: 104.9, annual: 93 },
  elite: { monthly: 197, quarterly: 177, annual: 157 },
  agency: { monthly: 1497, quarterly: 1347, annual: 1197 },
};

export const cycleTotal = (plan: PlanId, cycle: BillingCycle) =>
  Math.round(PLAN_PRICES[plan][cycle] * BILLING_CYCLES[cycle].months * 100) / 100;

export const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: v % 1 ? 2 : 0 });

// ── Recarga avulsa ───────────────────────────────────────────────────────────
/**
 * Preço do crédito avulso: o mesmo do plano em que o crédito sai mais caro no mensal (hoje o Start, R$ 3,35),
 * para a recarga não competir com subir de plano.
 */
export const TOPUP_PRICE_PER_CREDIT = Math.max(...(Object.keys(PLAN_PRICES) as PlanId[]).map(p => PLAN_PRICES[p].monthly / PLAN_CONFIGS[p].credits));
export const TOPUP_PACKS = [10, 25, 50, 100, 250, 500, 1000];
/** Créditos avulsos valem 90 dias, num saldo à parte, usados depois da cota do mês. */
export const TOPUP_VALID_DAYS = 90;
export const topupPrice = (credits: number) => Math.round(credits * TOPUP_PRICE_PER_CREDIT * 100) / 100;

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
  // Geração de imagem e vídeo: o custo real de cada pedido vem de src/lib/generation.ts (modelo e configuração).
  'gen-image': 1,
  'gen-video': 3,
  // Montagem: o custo de cada exportação vem dos segundos do vídeo (src/lib/montagem.ts, montagemCost).
  montagem: 2,
};

/** Gerador de Ideias: 1 crédito até 5 ideias, 2 créditos de 6 a 10 (o custo de IA cresce com a quantidade). */
export const IDEAS_MAX = 10;
export function ideasCost(quantidade: unknown) {
  const n = Math.min(IDEAS_MAX, Math.max(1, Math.round(Number(quantidade) || 5)));
  return n > 5 ? 2 : 1;
}

/** Primeiro uso de cada ferramenta é gratuito (teste). */
export const FREE_FIRST_USE = true;
/** Ferramentas sem teste grátis: o custo real por uso é alto demais para dar de graça (vídeo ~R$ 2 a 7). */
export const NO_FREE_TRIAL: ToolId[] = ['gen-video'];

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
    [process.env.STRIPE_PRODUCT_AGENCY, 'agency'],
    [process.env.STRIPE_PRODUCT_AGENCY_ANNUAL, 'agency'],
  ];
  for (const [id, plan] of pairs) if (id) map[id] = plan;
  return map[productId] ?? null;
}

export function isPaidPlan(plan: string | null | undefined): plan is PlanId {
  return plan === 'start' || plan === 'pro' || plan === 'elite' || plan === 'agency';
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
