import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';

/** Responde se o usuário do token é administrador. Nunca confia em e-mail enviado pelo cliente. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ isAdmin: true });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
