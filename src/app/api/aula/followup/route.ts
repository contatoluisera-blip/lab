import { NextResponse } from 'next/server';
import { followupKey, sendDueAulaOffers } from '@/lib/server/aulaEmails';

export const dynamic = 'force-dynamic';

/** Lembrete da oferta da aula, chamado de hora em hora por netlify/functions/aula-followup.mts. */
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || req.headers.get('x-followup-key') !== followupKey()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await sendDueAulaOffers()) });
}
