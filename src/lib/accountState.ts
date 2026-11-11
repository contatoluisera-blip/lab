// ─────────────────────────────────────────────────────────────
// Creator Lab — Estado da conta (fonte única)
// O servidor usa para decidir se uma ferramenta pode ser usada;
// as telas usam para exibir plano, saldo e renovação.
// Nenhum valor é suposto: o que não está no perfil aparece como ausente.
// ─────────────────────────────────────────────────────────────

import { FREE_FIRST_USE, NO_FREE_TRIAL, PLAN_CONFIGS, PlanId, TOOL_COSTS, ToolId, isPaidPlan, planHasToolAccess } from './planConfig';

/**
 * - active: assinatura da Stripe ativa (renova sozinha)
 * - manual: plano concedido sem assinatura renovando (admin ou conta antiga)
 * - payment_issue: Stripe aguardando pagamento (cartão recusado, fatura em aberto)
 * - none: sem plano
 */
export type AccountStatus = 'active' | 'manual' | 'payment_issue' | 'none';

export type BlockReason = 'no_subscription' | 'payment_issue' | 'no_access' | 'no_credits';

/** Campos do perfil (users/{uid}) que definem o estado da conta. */
export interface AccountProfile {
  plan?: string | null;
  credits?: number | null;
  trialUsed?: Partial<Record<ToolId, boolean>> | null;
  stripeSubscriptionStatus?: string | null;
  /** Fim do período pago atual na Stripe (ISO). Gravado pelo webhook. */
  currentPeriodEnd?: string | null;
  manualGrant?: { by?: string; at?: string } | null;
  /** Créditos avulsos (recarga): saldo à parte, usado depois da cota do mês, com validade. */
  extraCredits?: number | null;
  extraCreditsExpireAt?: string | null;
  /** Ciclo de cobrança da assinatura (o crédito é sempre mensal). */
  billingCycle?: string | null;
  /** Trimestral e anual: data da próxima recarga mensal de créditos (ISO). */
  nextRefillAt?: string | null;
}

export interface AccountState {
  status: AccountStatus;
  plan: PlanId | null;
  planLabel: string | null;
  /** Rótulo da situação, já pronto para a tela. */
  statusLabel: string;
  /** Saldo disponível: cota do mês + créditos avulsos válidos. */
  credits: number;
  /** Cota do mês (zera e recarrega a cada mês). */
  monthlyCredits: number;
  /** Créditos avulsos válidos e a validade deles. */
  extraCredits: number;
  extraExpiresAt: string | null;
  /** Créditos que o plano concede a cada renovação. */
  planCredits: number;
  /** Data da próxima renovação (ISO), só quando a Stripe informou. */
  renewsAt: string | null;
  /** Frase de renovação, já pronta para a tela. */
  renewalLabel: string;
}

const PAYMENT_ISSUE = new Set(['past_due', 'unpaid', 'incomplete']);
const ACTIVE = new Set(['active', 'trialing']);

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Créditos avulsos ainda dentro da validade (vencidos contam como 0). */
export function validExtraCredits(profile: AccountProfile | null | undefined, now = Date.now()) {
  const amount = Math.max(0, Number(profile?.extraCredits ?? 0) || 0);
  const exp = profile?.extraCreditsExpireAt ? Date.parse(profile.extraCreditsExpireAt) : 0;
  return amount > 0 && exp > now ? amount : 0;
}

export function getAccountState(profile: AccountProfile | null | undefined): AccountState {
  const plan = isPaidPlan(profile?.plan) ? profile!.plan as PlanId : null;
  const monthlyCredits = Math.max(0, Number(profile?.credits ?? 0) || 0);
  const extraCredits = validExtraCredits(profile);
  const credits = monthlyCredits + extraCredits;
  const extra = { monthlyCredits, extraCredits, extraExpiresAt: extraCredits ? profile!.extraCreditsExpireAt! : null };
  const subStatus = profile?.stripeSubscriptionStatus ?? null;

  if (!plan) {
    return {
      status: 'none', plan: null, planLabel: null, statusLabel: 'Sem assinatura ativa',
      credits, ...extra, planCredits: 0, renewsAt: null, renewalLabel: 'Sem renovação automática',
    };
  }

  const cfg = PLAN_CONFIGS[plan];
  const base = { plan, planLabel: cfg.label, credits, ...extra, planCredits: cfg.credits };

  if (subStatus && PAYMENT_ISSUE.has(subStatus)) {
    return {
      ...base, status: 'payment_issue', statusLabel: 'Pagamento pendente',
      renewsAt: null, renewalLabel: 'Renovação suspensa até o pagamento ser confirmado',
    };
  }

  if (subStatus && ACTIVE.has(subStatus)) {
    // Trimestral e anual: a fatura vem a cada 3 ou 12 meses, mas a cota recarrega todo mês.
    const longCycle = profile?.billingCycle === 'quarterly' || profile?.billingCycle === 'annual';
    const refillAt = longCycle && profile?.nextRefillAt && (!profile.currentPeriodEnd || profile.nextRefillAt < profile.currentPeriodEnd)
      ? profile.nextRefillAt : null;
    const renewsAt = refillAt ?? profile?.currentPeriodEnd ?? null;
    return {
      ...base, status: 'active',
      statusLabel: credits > 0 ? 'Ativo' : 'Créditos esgotados',
      renewsAt,
      renewalLabel: renewsAt
        ? `${refillAt ? 'Créditos recarregam' : 'Renova'} em ${formatDate(renewsAt)} com ${cfg.credits} créditos`
        : 'Renovação automática (data ainda não sincronizada)',
    };
  }

  // Plano gravado sem assinatura renovando: concessão manual ou conta antiga.
  return {
    ...base, status: 'manual',
    statusLabel: credits > 0 ? 'Ativo' : 'Créditos esgotados',
    renewsAt: null, renewalLabel: 'Sem renovação automática',
  };
}

export interface ToolCheck {
  ok: boolean;
  reason?: BlockReason;
  message?: string;
  cost: number;
  trial: boolean;
}

/**
 * Decide se a ferramenta pode ser usada, sempre nesta ordem:
 * assinatura → pagamento → plano inclui a ferramenta → saldo.
 * Só o bloqueio "plano não inclui" fala em upgrade.
 */
export function checkTool(state: AccountState, trialUsed: AccountProfile['trialUsed'], tool: ToolId, costOverride?: number): ToolCheck {
  const cost = costOverride ?? TOOL_COSTS[tool] ?? 1;
  const trial = FREE_FIRST_USE && !NO_FREE_TRIAL.includes(tool) && cost > 0 && !trialUsed?.[tool];

  if (state.status === 'none') {
    return { ok: false, reason: 'no_subscription', cost, trial, message: 'Você não tem uma assinatura ativa. Escolha um plano em Planos e Faturamento.' };
  }
  if (state.status === 'payment_issue') {
    return { ok: false, reason: 'payment_issue', cost, trial, message: 'O pagamento da sua assinatura está pendente. Atualize o cartão em Planos e Faturamento para continuar.' };
  }
  if (!planHasToolAccess(state.plan, tool)) {
    return { ok: false, reason: 'no_access', cost, trial, message: `O plano ${state.planLabel} não inclui esta ferramenta. Faça upgrade para liberar.` };
  }
  const charge = trial ? 0 : cost;
  if (charge > state.credits) {
    const when = state.renewsAt
      ? `Eles renovam em ${formatDate(state.renewsAt)}.`
      : state.status === 'active' ? 'Eles renovam na próxima fatura.' : 'Sua conta não tem renovação automática.';
    const topup = state.status === 'active' ? ' Se precisar antes, faça uma recarga em Planos e Faturamento.' : '';
    const message = state.credits > 0
      ? `Este uso consome ${charge} créditos e seu saldo é ${state.credits}. ${when}${topup}`
      : `Seus créditos acabaram (saldo: 0). ${when}${topup}`;
    return { ok: false, reason: 'no_credits', cost, trial, message };
  }
  return { ok: true, cost, trial };
}
