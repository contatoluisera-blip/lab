import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { PlatformWelcome } from '@/emails/PlatformWelcome';
import { PLAN_CONFIGS, PlanId } from '@/lib/planConfig';
import React from 'react';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          const planId = (session.metadata?.planName?.toLowerCase() || 'start') as PlanId;
          const planConfig = PLAN_CONFIGS[planId];

          // 1. Ativa o plano no Firestore
          await adminDb.collection('users').doc(userId).set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeSubscriptionStatus: 'active',
            plan: planId,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // 2. Busca dados do usuário para personalizar o e-mail
          try {
            const userSnap = await adminDb.collection('users').doc(userId).get();
            const userData = userSnap.data();

            if (userData?.email && planConfig) {
              const firstName = (userData.name || userData.email).split(' ')[0];

              await resend.emails.send({
                from: 'Creator Lab <contato@luisera.com.br>',
                to: userData.email,
                subject: `${planConfig.label} ativado! Seu acesso à Creator Lab está liberado 🎉`,
                react: PlatformWelcome({
                  firstName,
                  planName: planConfig.label,
                  planPrice: planConfig.price,
                  credits: planConfig.credits,
                  hasCourses: planConfig.courses,
                  dashboardUrl: 'https://creatorlab.luisera.com.br/dashboard',
                }) as React.ReactElement,
              });
            }
          } catch (emailErr) {
            // Não bloqueia o webhook se o e-mail falhar
            console.error('Erro ao enviar e-mail de boas-vindas:', emailErr);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc
        
        const productId = subscription.items.data[0].price.product as string;
        
        let plan = '';
        if (status === 'active' || status === 'trialing') {
          if (productId === process.env.STRIPE_PRODUCT_START) plan = 'start';
          else if (productId === process.env.STRIPE_PRODUCT_PRO) plan = 'pro';
          else if (productId === process.env.STRIPE_PRODUCT_ELITE) plan = 'elite';
        } else {
          // If status is past_due, unpaid, or canceled, lock out the user immediately.
          plan = 'free';
        }

        // Buscar usuário pelo stripeCustomerId
        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const updates: any = {
            stripeSubscriptionStatus: status,
            updatedAt: new Date().toISOString()
          };
          if (plan !== '') {
            updates.plan = plan;
          }
          await userDoc.ref.update(updates);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Só renovamos créditos se for o pagamento recorrente da assinatura ou a criação inicial
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
          const subscriptionId = invoice.subscription as string;
          if (subscriptionId) {
            // Descobre o plano para saber quantos créditos adicionar
            let plan = 'free';
            let creditsToAdd = 0;
            const lines = invoice.lines.data;
            if (lines.length > 0) {
              const productId = lines[0].price?.product as string;
              if (productId === process.env.STRIPE_PRODUCT_START) {
                plan = 'start';
                creditsToAdd = 20;
              } else if (productId === process.env.STRIPE_PRODUCT_PRO) {
                plan = 'pro';
                creditsToAdd = 50;
              } else if (productId === process.env.STRIPE_PRODUCT_ELITE) {
                plan = 'elite';
                creditsToAdd = 100;
              }
            }

            if (creditsToAdd > 0) {
              const usersRef = adminDb.collection('users');
              const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
              if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                await userDoc.ref.update({
                  plan,
                  credits: creditsToAdd, // Reset credits or use admin.firestore.FieldValue.increment(creditsToAdd)? Usually monthly credits reset, so setting them to the limit is common.
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersRef = adminDb.collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            plan: 'free',
            stripeSubscriptionStatus: 'canceled',
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
