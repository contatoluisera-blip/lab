import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendAulaWelcome } from '@/lib/server/aulaEmails';
import { normalizeEmail, upsertLead } from '@/lib/server/leads';

export const dynamic = 'force-dynamic';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Cadastro que libera a aula (/aula): nome, e-mail e aceite para receber materiais. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Campo invisível preenchido: robô. Responde como se tivesse dado certo e não grava.
    if (body.website) return NextResponse.json({ success: true });

    const name = text(body.name, 120);
    const email = normalizeEmail(body.email);
    if (!name || !email) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: 'Marque o aceite para receber a aula e os materiais.' }, { status: 400 });

    const saved = await upsertLead({
      email, name,
      source: 'aula',
      keyword: text(body.keyword, 40) || undefined,
      attribution: body.marketing?.attribution,
      consent: body.marketing?.consent,
      marketingConsent: true,
    });
    if (!saved.ok) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });

    // O e-mail sai uma vez por pessoa, mesmo que ela libere a aula de novo em outro aparelho.
    const lead = (await adminDb.collection('leads').doc(saved.id).get()).data();
    if (!lead?.aulaEmail) await sendAulaWelcome(saved.id, email, name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[aula] erro ao registrar:', error);
    return NextResponse.json({ error: 'Não foi possível liberar agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
