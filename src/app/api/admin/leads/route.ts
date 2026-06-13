import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Função auxiliar para verificar autorização (simplificada)
async function checkAuth(request: Request) {
  // Num cenário ideal, pegaríamos o token do header. Como estamos chamando do client
  // que já tem o AuthContext, podemos passar o email no body. 
  // No GET/DELETE podemos passar via header ou query.
  // Para simplificar, vou confiar no email do header ou query por ser um dashboard admin local/fechado
  return true; 
}

export async function POST(request: Request) {
  try {
    const { name, email, whatsapp, instagram, adminEmail } = await request.json();

    // Validação básica de permissão
    const isSuperAdmin = adminEmail === 'luisfreitasyt@gmail.com';
    let isAdmin = isSuperAdmin;
    if (!isAdmin && adminDb) {
      const doc = await adminDb.collection('admins').doc(adminEmail).get();
      isAdmin = doc.exists;
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e E-mail são obrigatórios' }, { status: 400 });
    }

    const docRef = await adminDb.collection('pre_list').add({
      name,
      email,
      whatsapp: whatsapp || '',
      instagram: instagram || '',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail');

    if (!id || !adminEmail) {
      return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
    }

    const isSuperAdmin = adminEmail === 'luisfreitasyt@gmail.com';
    let isAdmin = isSuperAdmin;
    if (!isAdmin && adminDb) {
      const doc = await adminDb.collection('admins').doc(adminEmail).get();
      isAdmin = doc.exists;
    }
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await adminDb.collection('pre_list').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
