import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { FREE_FIRST_USE, TOOL_COSTS, ToolId, planHasToolAccess } from '@/lib/planConfig';
import { HttpError } from './auth';

export interface ChargeResult {
  /** Quantos créditos foram descontados de fato (0 no 1º uso grátis ou ferramenta sem custo). */
  charged: number;
  /** Se este uso foi o teste gratuito da ferramenta. */
  trial: boolean;
  /** Saldo após a cobrança. */
  credits: number;
  plan: string;
}

/**
 * Cobra o uso de uma ferramenta dentro de uma transação do Firestore.
 * Garante: acesso pelo plano, 1º uso grátis, saldo nunca negativo, registro no extrato.
 * Lança HttpError 402 (sem créditos) ou 403 (plano sem acesso).
 */
export async function chargeCredit(uid: string, tool: ToolId): Promise<ChargeResult> {
  const cost = TOOL_COSTS[tool] ?? 1;
  const userRef = adminDb.collection('users').doc(uid) as admin.firestore.DocumentReference;

  return adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpError(404, 'profile_missing', 'Perfil não encontrado. Saia e entre de novo.');
    const data = snap.data() || {};
    const plan = data.plan as string;

    if (!planHasToolAccess(plan, tool)) {
      throw new HttpError(403, 'no_access', 'Seu plano não inclui esta ferramenta. Faça upgrade para liberar.');
    }

    const credits = Number(data.credits || 0);
    const trialUsed = !!data.trialUsed?.[tool];
    const isTrial = FREE_FIRST_USE && cost > 0 && !trialUsed;
    const charged = isTrial ? 0 : cost;

    if (charged > credits) {
      throw new HttpError(402, 'no_credits', 'Seus créditos acabaram. Eles renovam na próxima fatura, ou faça upgrade do plano.');
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (isTrial) updates[`trialUsed.${tool}`] = true;
    if (charged > 0) updates.credits = admin.firestore.FieldValue.increment(-charged);
    tx.update(userRef, updates);

    if (charged > 0 || isTrial) {
      tx.set(userRef.collection('credit_ledger').doc(), {
        tool,
        delta: -charged,
        reason: isTrial ? 'trial' : 'use',
        balanceAfter: credits - charged,
        createdAt: new Date().toISOString(),
      });
    }

    return { charged, trial: isTrial, credits: credits - charged, plan };
  });
}

/** Devolve créditos cobrados numa geração que falhou. Nunca lança. */
export async function refundCredit(uid: string, tool: ToolId, charge: ChargeResult | null, reason = 'failure') {
  if (!charge || charge.charged <= 0) return;
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const batch = adminDb.batch();
    batch.update(userRef, {
      credits: admin.firestore.FieldValue.increment(charge.charged),
      updatedAt: new Date().toISOString(),
    });
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
