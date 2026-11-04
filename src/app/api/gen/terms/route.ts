import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { HttpError, requireUser } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';
import { GEN_TERMS_VERSION } from '@/lib/generation';

export const dynamic = 'force-dynamic';

/** Registra o aceite dos termos de uso da geração (versão, data, IP e navegador). */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    if (body.accept !== true || body.version !== GEN_TERMS_VERSION) {
      throw new HttpError(400, 'bad_terms', 'Leia e aceite a versão atual dos termos.');
    }
    const genTerms = {
      version: GEN_TERMS_VERSION,
      acceptedAt: new Date().toISOString(),
      ip: req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: (req.headers.get('user-agent') || '').slice(0, 300),
    };
    await adminDb.collection('users').doc(user.uid).set({ genTerms }, { merge: true });
    return NextResponse.json({ success: true, data: { version: GEN_TERMS_VERSION } });
  } catch (err) {
    return errorResponse(err);
  }
}
