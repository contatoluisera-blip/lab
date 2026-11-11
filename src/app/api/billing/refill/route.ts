import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { PLAN_CONFIGS, isPaidPlan } from '@/lib/planConfig';
import { addMonth } from '@/lib/server/credits';

export const dynamic = 'force-dynamic';

const ACTIVE = new Set(['active', 'trialing']);

/** Chave da rotina (netlify/functions/credits-refill.mts calcula a mesma). */
function refillKey() {
  return createHash('sha256').update(`credits-refill:${process.env.STRIPE_WEBHOOK_SECRET || ''}`).digest('hex').slice(0, 40);
}

/**
 * Recarga mensal dos planos trimestral e anual: a fatura cobre vários meses, mas a cota é mensal.
 * Roda de hora em hora; cada conta recarrega uma vez por mês, no mesmo dia da assinatura,
 * até a próxima fatura (que recarrega pelo webhook e agenda o ciclo seguinte).
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || req.headers.get('x-refill-key') !== refillKey()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const now = new Date();
  const due = await adminDb.collection('users').where('nextRefillAt', '<=', now.toISOString()).limit(200).get();
  let refilled = 0;
  let skipped = 0;
  for (const doc of due.docs) {
    const done = await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
      const snap = await tx.get(doc.ref as admin.firestore.DocumentReference);
      const u = (snap.data() || {}) as Record<string, any>;
      if (!u.nextRefillAt || u.nextRefillAt > now.toISOString()) return false;
      const left = Number(u.refillsLeft || 0);
      // Sem assinatura ativa ou sem recargas restantes: para de agendar (a próxima fatura reagenda).
      if (!isPaidPlan(u.plan) || !ACTIVE.has(u.stripeSubscriptionStatus) || left <= 0) {
        tx.update(doc.ref, { nextRefillAt: null });
        return false;
      }
      const credits = PLAN_CONFIGS[u.plan as keyof typeof PLAN_CONFIGS].credits;
      // Mantém o dia da assinatura (não acumula atraso da rotina).
      const next = left - 1 > 0 ? addMonth(new Date(u.nextRefillAt)).toISOString() : null;
      tx.update(doc.ref, { credits, refillsLeft: left - 1, nextRefillAt: next, creditsResetAt: now.toISOString(), updatedAt: now.toISOString() });
      tx.set(doc.ref.collection('credit_ledger').doc(), { delta: credits, reason: 'monthly_refill', reset: true, createdAt: now.toISOString() });
      return true;
    });
    if (done) refilled++; else skipped++;
  }
  return NextResponse.json({ ok: true, due: due.size, refilled, skipped });
}
