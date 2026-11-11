import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { ToolId } from '@/lib/planConfig';
import { checkTool, getAccountState, validExtraCredits } from '@/lib/accountState';
import { TOPUP_VALID_DAYS } from '@/lib/planConfig';
import { HttpError } from './auth';

export interface ChargeResult {
  /** Quantos créditos foram descontados de fato (0 no 1º uso grátis ou ferramenta sem custo). */
  charged: number;
  /** Se este uso foi o teste gratuito da ferramenta. */
  trial: boolean;
  /** Saldo após a cobrança (cota do mês + avulso). */
  credits: number;
  /** Quanto da cobrança saiu dos créditos avulsos (o resto saiu da cota do mês). */
  fromExtra: number;
  /** Saldos separados após a cobrança, para a tela atualizar sem contar o avulso duas vezes. */
  monthly: number;
  extra: number;
  plan: string;
}

/**
 * Campos para devolver créditos: a parte que saiu do avulso volta para o avulso, o resto para a cota.
 * Use em todo estorno (o documento do uso guarda `chargedCredits` e `chargedExtra`).
 */
export function refundFields(total: number, fromExtra = 0) {
  const extra = Math.min(Math.max(0, fromExtra || 0), total);
  return {
    ...(total - extra > 0 ? { credits: admin.firestore.FieldValue.increment(total - extra) } : {}),
    ...(extra > 0 ? { extraCredits: admin.firestore.FieldValue.increment(extra) } : {}),
  };
}

/**
 * Cobra o uso de uma ferramenta dentro de uma transação do Firestore.
 * Garante: acesso pelo plano, 1º uso grátis, saldo nunca negativo, registro no extrato.
 * Lança HttpError 402 (sem créditos) ou 403 (plano sem acesso).
 */
/** `costOverride`: custo deste uso quando varia com o pedido (ex.: quantidade de ideias). */
export async function chargeCredit(uid: string, tool: ToolId, costOverride?: number): Promise<ChargeResult> {
  const userRef = adminDb.collection('users').doc(uid) as admin.firestore.DocumentReference;

  return adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpError(404, 'profile_missing', 'Perfil não encontrado. Saia e entre de novo.');
    const data = snap.data() || {};
    const plan = data.plan as string;

    // Mesma regra que as telas usam para exibir: assinatura → pagamento → acesso → saldo.
    const state = getAccountState(data);
    const check = checkTool(state, data.trialUsed, tool, costOverride);
    if (!check.ok) {
      const status = check.reason === 'no_credits' || check.reason === 'payment_issue' ? 402 : 403;
      throw new HttpError(status, check.reason!, check.message!);
    }

    const credits = state.credits;
    const isTrial = check.trial;
    const charged = isTrial ? 0 : check.cost;
    // Primeiro a cota do mês; o que faltar sai dos créditos avulsos válidos.
    const fromMonthly = Math.min(charged, state.monthlyCredits);
    const fromExtra = charged - fromMonthly;

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (isTrial) updates[`trialUsed.${tool}`] = true;
    if (fromMonthly > 0) updates.credits = admin.firestore.FieldValue.increment(-fromMonthly);
    if (fromExtra > 0) updates.extraCredits = validExtraCredits(data) - fromExtra;
    tx.update(userRef, updates);

    if (charged > 0 || isTrial) {
      tx.set(userRef.collection('credit_ledger').doc(), {
        tool,
        delta: -charged,
        reason: isTrial ? 'trial' : 'use',
        balanceAfter: credits - charged,
        ...(fromExtra > 0 ? { fromExtra } : {}),
        createdAt: new Date().toISOString(),
      });
    }

    return {
      charged, trial: isTrial, credits: credits - charged, fromExtra, plan,
      monthly: state.monthlyCredits - fromMonthly, extra: state.extraCredits - fromExtra,
    };
  });
}

/** Devolve créditos cobrados numa geração que falhou. Nunca lança. */
export async function refundCredit(uid: string, tool: ToolId, charge: ChargeResult | null, reason = 'failure') {
  if (!charge || charge.charged <= 0) return;
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const batch = adminDb.batch();
    batch.update(userRef, { ...refundFields(charge.charged, charge.fromExtra), updatedAt: new Date().toISOString() });
    batch.set(userRef.collection('credit_ledger').doc(), {
      tool,
      delta: charge.charged,
      reason,
      createdAt: new Date().toISOString(),
    });
    await batch.commit();
  } catch (e) {
    console.error('[credits] Falha ao estornar crédito', { uid, tool, e });
  }
}

/** Concede créditos ao usuário (renovação, compra, ajuste manual), com registro. */
export async function grantCredits(uid: string, amount: number, reason: string, meta: Record<string, unknown> = {}) {
  const userRef = adminDb.collection('users').doc(uid);
  const batch = adminDb.batch();
  batch.update(userRef, { credits: amount, updatedAt: new Date().toISOString(), ...meta });
  batch.set(userRef.collection('credit_ledger').doc(), {
    delta: amount,
    reason,
    reset: true,
    createdAt: new Date().toISOString(),
    ...meta,
  });
  await batch.commit();
}

/**
 * Soma créditos avulsos (recarga paga). O saldo avulso ainda válido continua; a validade passa a
 * ser de TOPUP_VALID_DAYS a partir desta compra para o saldo todo. Idempotente pela `ref` (sessão da Stripe).
 */
export async function addExtraCredits(uid: string, amount: number, ref: string, meta: Record<string, unknown> = {}) {
  const userRef = adminDb.collection('users').doc(uid) as admin.firestore.DocumentReference;
  const markRef = userRef.collection('credit_ledger').doc(`topup_${ref}`);
  return adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const [snap, mark] = await Promise.all([tx.get(userRef), tx.get(markRef)]);
    if (mark.exists) return false;
    const data = snap.data() || {};
    const now = new Date();
    const total = validExtraCredits(data, now.getTime()) + amount;
    const expireAt = new Date(now.getTime() + TOPUP_VALID_DAYS * 86_400_000).toISOString();
    tx.set(userRef, { extraCredits: total, extraCreditsExpireAt: expireAt, updatedAt: now.toISOString() }, { merge: true });
    tx.set(markRef, { delta: amount, reason: 'topup', extraAfter: total, expiresAt: expireAt, createdAt: now.toISOString(), ...meta });
    return true;
  });
}

/** Mesmo dia do mês seguinte (31/01 → 28 ou 29/02): data da próxima recarga mensal de créditos. */
export function addMonth(from: Date) {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}
