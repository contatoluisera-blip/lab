import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import React from 'react';
import { adminDb } from '@/lib/firebase/admin';
import { PlatformWelcome } from '@/emails/PlatformWelcome';
import { PLAN_CONFIGS, planFromStripeProduct } from '@/lib/planConfig';
import { grantCredits } from '@/lib/server/credits';
import { productIdFromInvoiceLine, productIdFromSubscription, stripeClient, subscriptionIdFromInvoice } from '@/lib/server/stripe';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mobilelab.com.br';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Creator Lab <contato@luisera.com.br>';

async function findUserByCustomer(customerId: string) {
  const snap = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

/** Garante que um evento da Stripe só é processado uma vez (a Stripe reenvia em caso de dúvida). */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  const ref = adminDb.collection('stripe_events').doc(event.id);
  try {
    await ref.create({ type: event.type, created: event.created, receivedAt: new Date().toISOString() });
    return true;
  } catch {
    return false; // já existe
  }
}

async function sendWelcome(userId: string, planId: string) {
  if (!process.env.RESEND_API_KEY) return;
  const planConfig = PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS];
  if (!planConfig) return;
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const userData = userSnap.data();
  if (!userData?.email) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: EMAIL_FROM,
    to: userData.email,
    subject: `${planConfig.label} ativado! Seu acesso à Creator Lab está liberado 🎉`,
    react: PlatformWelcome({
      firstName: (userData.name || userData.email).split(' ')[0],
      planName: planConfig.label,
      planPrice: planConfig.price,
      credits: planConfig.credits,
      hasCourses: planConfig.courses,
      dashboardUrl: `${APP_URL}/dashboard`,
    }) as React.ReactElement,
  });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (err: any) {
    console.error(`[stripe] assinatura inválida: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (!(await claimEvent(event))) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      // 1) Pagamento inicial concluído: vincula cliente/assinatura ao usuário e ativa o plano.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId) break;
        const planId = (session.metadata?.planName?.toLowerCase() || 'start');
        await adminDb.collection('users').doc(userId).set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripeSubscriptionStatus: 'active',
          plan: planId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        try { await sendWelcome(userId, planId); } catch (e) { console.error('[stripe] e-mail de boas-vindas falhou:', e); }
        break;
      }

      // 2) Assinatura criada/alterada: espelha status e plano. Inadimplência bloqueia na hora.
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userDoc = await findUserByCustomer(sub.customer as string);
        if (!userDoc) break;
        const active = sub.status === 'active' || sub.status === 'trialing';
        const plan = active ? planFromStripeProduct(productIdFromSubscription(sub)) : 'free';
        const updates: Record<string, unknown> = {
          stripeSubscriptionId: sub.id,
          stripeSubscriptionStatus: sub.status,
          updatedAt: new Date().toISOString(),
        };
        if (plan) updates.plan = plan;
        await userDoc.ref.update(updates);
        break;
      }

      // 3) Fatura paga (primeira ou renovação): zera os créditos para o limite do plano.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const reason = invoice.billing_reason;
        if (reason !== 'subscription_cycle' && reason !== 'subscription_create' && reason !== 'subscription_update') break;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        const userDoc = await findUserByCustomer(invoice.customer as string);
        if (!userDoc) break;

        const productId = productIdFromInvoiceLine(invoice.lines?.data?.[0]);
        const plan = planFromStripeProduct(productId);
        if (!plan) {
          console.error('[stripe] invoice.paid com produto desconhecido:', productId);
          break;
        }
        await grantCredits(userDoc.id, PLAN_CONFIGS[plan].credits, `invoice_${reason}`, {
          plan,
          stripeSubscriptionId: subscriptionId,
          creditsResetAt: new Date().toISOString(),
          lastInvoiceId: invoice.id,
        });
        break;
      }

      // 4) Assinatura encerrada: volta para free e zera os créditos.
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userDoc = await findUserByCustomer(sub.customer as string);
        if (!userDoc) break;
        await userDoc.ref.update({
          plan: 'free',
          credits: 0,
          stripeSubscriptionStatus: 'canceled',
          updatedAt: new Date().toISOString(),
        });
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[stripe] erro ao processar evento', event.type, error);
    // Libera o evento para a Stripe reenviar.
    await adminDb.collection('stripe_events').doc(event.id).delete().catch(() => {});
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
