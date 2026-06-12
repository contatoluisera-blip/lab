import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import { PreListaWelcome } from '@/emails/PreListaWelcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, instagram, whatsapp } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e E-mail são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Salvar no Firestore de forma segura pelo backend
    if (adminDb) {
      await adminDb.collection('pre_list').add({
        name,
        email,
        instagram: instagram || '',
        whatsapp: whatsapp || '',
        status: 'registered',
        createdAt: new Date(),
      });
    } else {
      console.warn('adminDb not initialized, skipping Firestore save');
      // Não retornar erro aqui, o email é mais importante, mas idealmente ambos funcionam
    }

    // Extrair o primeiro nome
    const firstName = name.split(' ')[0];

    // 2. Enviar o email de boas vindas
    const { data, error } = await resend.emails.send({
      from: 'Creator Lab <contato@luisera.com.br>',
      to: email,
      subject: 'O seu lugar está garantido 🧪',
      react: PreListaWelcome({ firstName }) as React.ReactElement,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error('Pre-lista Registration Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a inscrição' },
      { status: 500 }
    );
  }
}
