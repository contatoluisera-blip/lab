import { NextResponse } from 'next/server';
import { upsertLead, normalizeEmail } from '@/lib/server/leads';

export const dynamic = 'force-dynamic';

/**
 * Recebe leads do Manychat ("External Request" no fluxo, depois de pedir o e-mail no Direct).
 * Autenticação: cabeçalho `x-manychat-key` igual a MANYCHAT_WEBHOOK_SECRET.
 * Corpo: { email, first_name?, instagram?, keyword?, tool? } — keyword = palavra que disparou o fluxo,
 * tool = ferramenta da isca (ideias, prompts, diagnostico, calculadora, legenda...).
 */
export async function POST(req: Request) {
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-manychat-key') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!normalizeEmail(body.email)) {
    // O Manychat mostra o retorno no fluxo: dá para pedir o e-mail de novo.
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 200 });
  }
  const result = await upsertLead({
    email: body.email,
    name: typeof body.first_name === 'string' ? body.first_name : undefined,
    instagram: typeof body.instagram === 'string' ? body.instagram : undefined,
    keyword: typeof body.keyword === 'string' ? body.keyword : undefined,
    tool: typeof body.tool === 'string' ? body.tool : undefined,
    source: 'manychat',
  });
  return NextResponse.json({ ok: result.ok, new_lead: result.ok ? result.isNew : false });
}
