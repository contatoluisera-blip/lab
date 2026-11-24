// ─────────────────────────────────────────────────────────────
// Creator Lab — Configuração central de planos, permissões e custos
// Única fonte de verdade: usada pelas telas, pelas rotas de ferramentas,
// pelo webhook do Stripe e pelas rotas de faturamento.
// ─────────────────────────────────────────────────────────────

export type PlanId = 'start' | 'pro' | 'elite' | 'agency' | 'agency_plus' | 'agency_max';
/** Planos Corporativo (ids `agency*`, para agências e empresas): volume alto, limites maiores e recarga com preço próprio. */
export const AGENCY_PLANS: PlanId[] = ['agency', 'agency_plus', 'agency_max'];
export const isAgencyPlan = (plan: string | null | undefined) => AGENCY_PLANS.includes(plan as PlanId);
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
  | 'audio'
  | 'montagem';

export interface PlanConfig {
  id: PlanId;
  label: string;
  price: string;
  credits: number;          // créditos mensais (escala nova: src/lib/creditUnits.ts)
  tools: ToolId[] | 'all'; // ferramentas liberadas
  courses: boolean;         // acesso à aba Estudo
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  start: {
    id: 'start',
    label: 'Start',
    price: 'R$ 67/mês',
    credits: 200,
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'assistant', 'creator-card', 'estudia', 'prompts', 'hub', 'gen-image', 'gen-video', 'audio', 'montagem'],
    courses: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 'R$ 117/mês',
    credits: 500,
    tools: ['diagnosis', 'calculator', 'ideas', 'caption', 'proposal', 'proposal-rewrite', 'assistant', 'clients', 'actions', 'creator-card', 'estudia', 'prompts', 'hub', 'gen-image', 'gen-video', 'audio', 'montagem'],
    courses: false,
  },
  elite: {
    id: 'elite',
    label: 'Elite',
    price: 'R$ 197/mês',
    credits: 1000,
    tools: 'all',
    courses: true,
  },
  // Empresas e agências (docs/plano-agencia.md, seção 8): três tamanhos, crédito de R$ 0,125 a R$ 0,10.
  agency: {
    id: 'agency',
    label: 'Corporativo',
    price: 'R$ 1.247/mês',
    credits: 10000,
    tools: 'all',
    courses: true,
  },
  agency_plus: {
    id: 'agency_plus',
    label: 'Corporativo Plus',
    price: 'R$ 2.747/mês',
    credits: 25000,
    tools: 'all',
    courses: true,
  },
  agency_max: {
    id: 'agency_max',
    label: 'Corporativo Max',
    price: 'R$ 4.997/mês',
    credits: 50000,
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
  // Agências: trimestral −10% e anual −15% (o anual de agência tem desconto menor que o individual).
  agency: { monthly: 1247, quarterly: 1122, annual: 1060 },
  agency_plus: { monthly: 2747, quarterly: 2472, annual: 2335 },
  agency_max: { monthly: 4997, quarterly: 4497, annual: 4247 },
};

/** Desconto do ciclo para o plano (o anual de agência é −15%, o individual −20%). */
export const cycleDiscount = (plan: PlanId, cycle: BillingCycle) =>
  cycle === 'annual' && isAgencyPlan(plan) ? 0.15 : BILLING_CYCLES[cycle].discount;

export const cycleTotal = (plan: PlanId, cycle: BillingCycle) =>
  Math.round(PLAN_PRICES[plan][cycle] * BILLING_CYCLES[cycle].months * 100) / 100;

// ── Oferta da aula (/aula) ───────────────────────────────────────────────────
// Quem chega pela aula do Instagram assina Start, Pro ou Elite com desconto no começo.
// O cupom de cada ciclo é aplicado pelo servidor no checkout (sem código para digitar):
// mensal 50% nas 3 primeiras cobranças, trimestral 50% na primeira, anual 12,5% na primeira
// (o mesmo que 3 dos 12 meses pela metade). Cupons criados por scripts/stripe-offer-aula.ts.
export const AULA_OFFER = {
  id: 'aula50',
  plans: ['start', 'pro', 'elite'] as PlanId[],
  cycles: {
    monthly: { coupon: 'AULA50_MENSAL', percentOff: 50, invoices: 3 },
    quarterly: { coupon: 'AULA50_TRIMESTRAL', percentOff: 50, invoices: 1 },
    annual: { coupon: 'AULA50_ANUAL', percentOff: 12.5, invoices: 1 },
  } satisfies Record<BillingCycle, { coupon: string; percentOff: number; invoices: number }>,
} as const;

/** Valor de cada uma das cobranças com desconto da oferta da aula (as primeiras `invoices`). */
export const aulaOfferCharge = (plan: PlanId, cycle: BillingCycle) =>
  Math.round(cycleTotal(plan, cycle) * (1 - AULA_OFFER.cycles[cycle].percentOff / 100) * 100) / 100;

export const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: v % 1 ? 2 : 0 });

// ── Recarga avulsa ───────────────────────────────────────────────────────────
/**
 * Preço do crédito avulso: o do plano em que o crédito sai mais caro no mensal, para a recarga
 * não competir com subir de plano. Individuais: Start (R$ 0,335). Agências: Agência (R$ 0,125).
 */
const maxPerCredit = (plans: PlanId[]) => Math.max(...plans.map(p => PLAN_PRICES[p].monthly / PLAN_CONFIGS[p].credits));
export const TOPUP_PRICE_PER_CREDIT = Math.round(maxPerCredit(['start', 'pro', 'elite']) * 1000) / 1000;
export const AGENCY_TOPUP_PRICE_PER_CREDIT = Math.round(maxPerCredit(AGENCY_PLANS) * 1000) / 1000;
export const TOPUP_PACKS = [100, 250, 500, 1000, 2500, 5000, 10000];
export const AGENCY_TOPUP_PACKS = [2500, 5000, 10000, 25000, 50000];
/** Créditos avulsos valem 90 dias, num saldo à parte, usados depois da cota do mês. */
export const TOPUP_VALID_DAYS = 90;
export const topupPacksFor = (plan: string | null | undefined) => (isAgencyPlan(plan) ? AGENCY_TOPUP_PACKS : TOPUP_PACKS);
export const topupPrice = (credits: number, plan?: string | null) =>
  Math.round(credits * (isAgencyPlan(plan) ? AGENCY_TOPUP_PRICE_PER_CREDIT : TOPUP_PRICE_PER_CREDIT) * 100) / 100;

/**
 * Custo em créditos de cada uso (escala nova, forma B de docs/creditos-multiplos.md).
 * Para mudar o preço de uma ferramenta, altere só aqui. Teto: 1 crédito para cada R$ 0,067 de custo.
 * Custo real por uso: Diagnóstico ~R$ 1,53 (Apify + IA); ideia, legenda e proposta ~R$ 0,17;
 * prompt ~R$ 0,46. Calculadora, reescrita de trecho e Hub não têm custo relevante.
 */
export const TOOL_COSTS: Record<ToolId, number> = {
  diagnosis: 25,
  calculator: 0,
  ideas: 5,
  proposal: 5,
  assistant: 10,
  clients: 0,
  actions: 0,
  'creator-card': 10,
  estudia: 10,
  prompts: 8, // dentro da Montagem, até 3 por cena e tipo saem grátis (src/lib/montagem.ts, SCENE_FREE_PROMPTS)
  'proposal-rewrite': 0, // ajuste fino de um trecho: custo ~R$ 0,01, não consome crédito
  caption: 5, // legenda do post de uma ideia, gerada à parte
  hub: 0, // navegar no hub é gratuito; as ações de IA cobram na ferramenta de destino
  // Geração de imagem e vídeo: o custo real de cada pedido vem de src/lib/generation.ts (modelo e configuração).
  'gen-image': 8,
  'gen-video': 30,
  // Gerar Áudio: locução pelo tamanho do texto (src/lib/voice.ts), trilha pelo catálogo, efeito pela duração.
  audio: 8,
  // Montagem: o custo de cada exportação vem dos segundos do vídeo (src/lib/montagem.ts, montagemCost).
  montagem: 20,
};

/** Gerador de Ideias: 5 créditos até 5 ideias, 10 de 6 a 10 (o custo de IA cresce com a quantidade). */
export const IDEAS_MAX = 10;
export function ideasCost(quantidade: unknown) {
  const n = Math.min(IDEAS_MAX, Math.max(1, Math.round(Number(quantidade) || 5)));
  return n > 5 ? 10 : 5;
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
    [process.env.STRIPE_PRODUCT_AGENCY_PLUS, 'agency_plus'],
    [process.env.STRIPE_PRODUCT_AGENCY_MAX, 'agency_max'],
  ];
  for (const [id, plan] of pairs) if (id) map[id] = plan;
  return map[productId] ?? null;
}

export function isPaidPlan(plan: string | null | undefined): plan is PlanId {
  return plan === 'start' || plan === 'pro' || plan === 'elite' || isAgencyPlan(plan);
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

/**
 * Gerações de imagem e vídeo em andamento ao mesmo tempo, por conta.
 * Agências produzem para vários clientes de uma vez e precisam de mais fila própria.
 */
export const GEN_ACTIVE_LIMIT: Record<PlanId, number> = { start: 3, pro: 3, elite: 3, agency: 6, agency_plus: 10, agency_max: 15 };
export const genActiveLimit = (plan: string | null | undefined) => (isPaidPlan(plan) ? GEN_ACTIVE_LIMIT[plan] : 3);
