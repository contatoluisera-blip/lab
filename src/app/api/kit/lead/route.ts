import { NextResponse } from 'next/server';
import { getKit } from '@/lib/kits';
import { sendKitWelcome } from '@/lib/server/aulaEmails';
import { normalizeEmail, upsertLead } from '@/lib/server/leads';

export const dynamic = 'force-dynamic';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Cadastro que libera um kit de prompts (/kit/{slug}): nome, e-mail e aceite para receber materiais. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Campo invisível preenchido: robô. Responde como se tivesse dado certo e não grava.
    if (body.website) return NextResponse.json({ success: true });

    const kit = getKit(text(body.slug, 80));
    if (!kit) return NextResponse.json({ error: 'Kit não encontrado.' }, { status: 404 });
    const name = text(body.name, 120);
    const email = normalizeEmail(body.email);
    if (!name || !email) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: 'Marque o aceite para receber o kit e os materiais.' }, { status: 400 });

    const saved = await upsertLead({
      email, name,
      source: 'kit',
      keyword: text(body.keyword, 40) || kit.slug,
      tool: `kit:${kit.slug}`,
      attribution: body.marketing?.attribution,
      consent: body.marketing?.consent,
      marketingConsent: true,
    });
    if (!saved.ok) return NextResponse.json({ error: 'Preencha seu nome e um e-mail válido.' }, { status: 400 });

    await sendKitWelcome(saved.id, email, name, { slug: kit.slug, title: `${kit.title}${kit.accent ? ' ' + kit.accent : ''}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[kit] erro ao registrar:', error);
    return NextResponse.json({ error: 'Não foi possível liberar agora. Tente de novo em instantes.' }, { status: 500 });
  }
}
