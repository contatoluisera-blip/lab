import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { billingInterval, currentPeriod, productIdFromInvoiceLine, productIdFromSubscription, stripeClient } from '@/lib/server/stripe';
import { PLAN_CONFIGS, planFromStripeProduct } from '@/lib/planConfig';
import { grantCredits } from '@/lib/server/credits';

export const dynamic = 'force-dynamic';

/**
 * Lista as faturas do usuário e a próxima cobrança.
 * Também serve de rede de segurança: se o ciclo renovou e o webhook não creditou,
 * credita aqui (uma vez por ciclo, controlado por `creditsResetAt`).
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    const customerId = userData.stripeCustomerId;
    if (!customerId) return NextResponse.json({ invoices: [], nextBillingDate: null, interval: null });

    const stripe = stripeClient();
    let nextBillingDate: number | null = null;
    let interval: string | null = null;

    if (userData.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
        const period = currentPeriod(sub);
        nextBillingDate = period.end;
        interval = billingInterval(sub);

        if ((sub.status === 'active' || sub.status === 'trialing') && period.start) {
          const lastReset = userData.creditsResetAt ? new Date(userData.creditsResetAt).getTime() : 0;
          const plan = planFromStripeProduct(productIdFromSubscription(sub));
          if (plan && period.start > lastReset) {
            await grantCredits(user.uid, PLAN_CONFIGS[plan].credits, 'cycle_catchup', {
              plan,
              creditsResetAt: new Date(period.start).toISOString(),
            });
          }
        }
      } catch (e) {
        console.error('[invoices] assinatura não encontrada:', e);
      }
    }

    const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
    const formatted = invoices.data.map((invoice) => {
      const plan = planFromStripeProduct(productIdFromInvoiceLine(invoice.lines?.data?.[0]));
      const method = invoice.payment_settings?.payment_method_types?.[0];
      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.amount_paid / 100),
        status: invoice.status === 'paid' ? 'Pago' : invoice.status === 'open' ? 'Aberto' : 'Falhou',
        method: method === 'pix' ? 'PIX' : method === 'boleto' ? 'Boleto' : 'Cartão',
        plan: plan ? PLAN_CONFIGS[plan].label : 'Desconhecido',
        pdfUrl: invoice.invoice_pdf,
      };
    });

    return NextResponse.json({ invoices: formatted, nextBillingDate, interval });
  } catch (error) {
    return errorResponse(error);
  }
}
