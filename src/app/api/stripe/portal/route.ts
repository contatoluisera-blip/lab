import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireUser, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { stripeClient } from '@/lib/server/stripe';

export const dynamic = 'force-dynamic';

/** Abre o portal do cliente da Stripe (trocar cartão, cancelar, ver faturas). */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const customerId = userDoc.data()?.stripeCustomerId;
    if (!customerId) throw new HttpError(400, 'no_subscription', 'Você ainda não tem uma assinatura ativa.');

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripeClient().billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/dashboard/billing` });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
