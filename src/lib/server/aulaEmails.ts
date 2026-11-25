import { createHash, createHmac, timingSafeEqual } from 'crypto';
import React from 'react';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { AulaWelcome } from '@/emails/AulaWelcome';
import { AulaOffer } from '@/emails/AulaOffer';
import { isPaidPlan } from '@/lib/planConfig';

// E-mails do lead da aula (/aula): o link da aula na hora e, 2 dias depois, o lembrete da oferta.
// Ficam registrados no lead (`leads/{id}`): aulaEmail, aulaOfferDueAt e aulaOfferEmail.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://labcreator.com.br';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Creator Lab <contato@luisera.com.br>';

/** Tempo entre a liberação da aula e o e-mail da oferta. */
export const AULA_OFFER_DELAY_HOURS = 48;

/** Link da aula que já abre liberada (a pessoa deixou o e-mail; pode estar em outro aparelho). */
export const aulaUrl = (hash = '') => `${APP_URL}/aula?acesso=email${hash}`;

const secret = () => `aula-email:${process.env.STRIPE_WEBHOOK_SECRET || ''}`;
const unsubscribeToken = (leadId: string) => createHmac('sha256', secret()).update(leadId).digest('hex').slice(0, 32);
export const unsubscribeUrl = (leadId: string) => `${APP_URL}/api/aula/descadastro?id=${leadId}&t=${unsubscribeToken(leadId)}`;
export function validUnsubscribe(leadId: string, token: string) {
  const want = Buffer.from(unsubscribeToken(leadId));
  const got = Buffer.from(String(token || ''));
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Chave da rotina agendada (netlify/functions/aula-followup.mts calcula a mesma). */
export const followupKey = () => createHash('sha256').update(`aula-followup:${process.env.STRIPE_WEBHOOK_SECRET || ''}`).digest('hex').slice(0, 40);

async function send(to: string, subject: string, react: React.ReactElement) {
  if (!process.env.RESEND_API_KEY) return 'skipped' as const;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: EMAIL_FROM, to, subject, react });
  if (error) throw new Error(error.message);
  return 'sent' as const;
}

const firstName = (name: unknown) => (typeof name === 'string' && name.trim() ? name.trim().split(' ')[0] : 'Creator');

/** Link da aula na hora do cadastro; agenda o lembrete da oferta. Uma falha não desfaz o cadastro. */
export async function sendAulaWelcome(leadId: string, email: string, name: string) {
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  try {
    status = await send(email, 'Sua aula está liberada 🎬',
      AulaWelcome({ firstName: firstName(name), aulaUrl: aulaUrl(), unsubscribeUrl: unsubscribeUrl(leadId) }) as React.ReactElement);
  } catch (e) {
    status = 'failed';
    console.error('[aula] falha no e-mail da aula:', e);
  }
  const due = new Date(Date.now() + AULA_OFFER_DELAY_HOURS * 3600_000).toISOString();
  await adminDb.collection('leads').doc(leadId).set({ aulaEmail: status, aulaOfferDueAt: due }, { merge: true })
    .catch((e: unknown) => console.error('[aula] falha ao registrar o envio:', e));
}

/** A pessoa já assina? (conta com o mesmo e-mail e plano pago com assinatura ativa) */
async function isSubscriber(email: string) {
  const snap = await adminDb.collection('users').where('email', '==', email).limit(3).get();
  return snap.docs.some((d: any) => {
    const u = d.data();
    return isPaidPlan(u.plan) && ['active', 'trialing'].includes(u.stripeSubscriptionStatus);
  });
}

/** Envia os lembretes da oferta que venceram. Roda de hora em hora. */
export async function sendDueAulaOffers(now = new Date()) {
  const due = await adminDb.collection('leads').where('aulaOfferDueAt', '<=', now.toISOString()).limit(100).get();
  const result = { sent: 0, skipped: 0, failed: 0 };
  for (const doc of due.docs) {
    const lead = doc.data() as Record<string, any>;
    let status: 'sent' | 'skipped' | 'failed' | 'subscriber' | 'opted_out';
    try {
      if (lead.marketingOptOutAt) status = 'opted_out';
      else if (await isSubscriber(lead.email)) status = 'subscriber';
      else status = await send(lead.email, `${firstName(lead.name)}, sua condição da aula está de pé`,
        AulaOffer({ firstName: firstName(lead.name), offerUrl: aulaUrl('#oferta'), unsubscribeUrl: unsubscribeUrl(doc.id) }) as React.ReactElement);
    } catch (e) {
      status = 'failed';
      console.error('[aula] falha no lembrete da oferta:', lead.email ? 'lead ' + doc.id : '', e);
    }
    if (status === 'sent') result.sent++; else if (status === 'failed') result.failed++; else result.skipped++;
    // Sai da fila de qualquer jeito (uma falha não vira repetição a cada hora).
    await doc.ref.set({ aulaOfferDueAt: null, aulaOfferEmail: status, aulaOfferAt: new Date().toISOString() }, { merge: true });
  }
  return result;
}
