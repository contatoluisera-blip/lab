import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { PreListaWelcome } from '@/emails/PreListaWelcome';
import { normalizeEmail, upsertLead } from '@/lib/server/leads';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Boas-vindas da pré-lista. Uma falha aqui não desfaz a inscrição: o lead já está salvo. */
async function sendWelcome(email: string, name: string, leadId: string) {
  let status: 'sent' | 'failed' | 'skipped' = 'skipped';
  try {
    if (process.env.RESEND_API_KEY) {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: 'Creator Lab <contato@luisera.com.br>',
        to: email,
        subject: 'O seu lugar está garantido 🧪',
        react: PreListaWelcome({ firstName: name.split(' ')[0] }) as React.ReactElement,
      });
      if (error) throw new Error(error.message);
      status = 'sent';
    }
  } catch (e) {
    status = 'failed';
    console.error('[prelista] falha no e-mail de boas-vindas:', e);
  }
  await adminDb.collection('leads').doc(leadId).set({ welcomeEmail: status }, { merge: true })
    .catch((e: unknown) => console.error('[prelista] falha ao registrar o envio:', e));
}

/** Inscrição na pré-lista (/lista). O lead é salvo antes de tudo; só responde sucesso se foi gravado. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Campo invisível preenchido: robô. Responde como se tivesse dado certo e não grava.
    if (body.website) return NextResponse.json({ success: true });

    const name = text(body.name, 120);
    const email = normalizeEmail(body.email);
    if (!name || !email) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: 'Marque o aceite para entrar na pré-lista.' }, { status: 400 });

    const saved = await upsertLead({
      email, name,
      instagram: text(body.instagram, 60),
      whatsapp: text(body.whatsapp, 30),
      source: 'pre_lista',
      attribution: body.marketing?.attribution,
      consent: body.marketing?.consent,
      marketingConsent: true,
    });
    if (!saved.ok) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });

    // Quem já estava na lista não recebe as boas-vindas de novo.
    if (saved.isNew) await sendWelcome(email, name, saved.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[prelista] erro ao registrar:', error);
    return NextResponse.json({ error: 'Não foi possível registrar agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
