import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { AulaWelcome } from '@/emails/AulaWelcome';
import { normalizeEmail, upsertLead } from '@/lib/server/leads';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://labcreator.com.br';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Creator Lab <contato@luisera.com.br>';
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** E-mail com o link da aula. Uma falha aqui não desfaz o cadastro: o lead já está salvo. */
async function sendWelcome(email: string, name: string, leadId: string) {
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  try {
    if (process.env.RESEND_API_KEY) {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Sua aula está liberada 🎬',
        react: AulaWelcome({ firstName: name.split(' ')[0] || 'Creator', aulaUrl: `${APP_URL}/aula` }) as React.ReactElement,
      });
      if (error) throw new Error(error.message);
      status = 'sent';
    }
  } catch (e) {
    status = 'failed';
    console.error('[aula] falha no e-mail da aula:', e);
  }
  await adminDb.collection('leads').doc(leadId).set({ aulaEmail: status }, { merge: true })
    .catch((e: unknown) => console.error('[aula] falha ao registrar o envio:', e));
}

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
    if (!lead?.aulaEmail) await sendWelcome(email, name, saved.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[aula] erro ao registrar:', error);
    return NextResponse.json({ error: 'Não foi possível liberar agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
