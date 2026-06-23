import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [], nextBillingDate: null });
    }

    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 12,
    });

    let nextBillingDate = null;
    if (userData.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
        nextBillingDate = subscription.current_period_end * 1000;
      } catch (e) {
        console.error('Erro ao buscar assinatura:', e);
      }
    }

    const formattedInvoices = invoices.data.map((invoice) => {
      let planName = 'Desconhecido';
      if (invoice.lines.data.length > 0) {
        const productId = invoice.lines.data[0].price?.product as string;
        if (productId === process.env.STRIPE_PRODUCT_START) planName = 'Start';
        else if (productId === process.env.STRIPE_PRODUCT_PRO) planName = 'Pro';
        else if (productId === process.env.STRIPE_PRODUCT_ELITE) planName = 'Elite';
      }

      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.amount_paid / 100),
        status: invoice.status === 'paid' ? 'Pago' : invoice.status === 'open' ? 'Aberto' : 'Falhou',
        method: invoice.payment_settings?.payment_method_types?.[0] === 'pix' ? 'PIX' : invoice.payment_settings?.payment_method_types?.[0] === 'boleto' ? 'Boleto' : 'Cartão',
        plan: planName,
        pdfUrl: invoice.invoice_pdf
      };
    });

    return NextResponse.json({ invoices: formattedInvoices, nextBillingDate });

  } catch (error: any) {
    console.error('Stripe Invoices Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
