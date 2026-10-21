import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin, HttpError } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/tool';

/** Cadastra um lead manualmente. Exige token de um administrador. */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { name, email, whatsapp, instagram } = await request.json();
    if (!name || !email) throw new HttpError(400, 'missing_fields', 'Nome e e-mail são obrigatórios.');

    const docRef = await adminDb.collection('pre_list').add({
      name,
      email,
      whatsapp: whatsapp || '',
      instagram: instagram || '',
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Remove um lead. Exige token de um administrador. */
export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new HttpError(400, 'missing_id', 'Falta o identificador do lead.');
    await adminDb.collection('pre_list').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
