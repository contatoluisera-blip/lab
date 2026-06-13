import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const allUsersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    
    const emailsSeen = new Set();
    const docsToDelete: string[] = [];

    allUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const email = data.email;
      
      if (!email) return;

      // Como ordenamos por desc (mais recente primeiro),
      // o primeiro que encontramos é o registro que vamos manter.
      if (emailsSeen.has(email)) {
        // Se já vimos, é um clone mais antigo. Vamos deletar.
        docsToDelete.push(doc.id);
      } else {
        emailsSeen.add(email);
      }
    });

    let deletedCount = 0;
    if (docsToDelete.length > 0) {
      const batch = adminDb.batch();
      docsToDelete.forEach(id => {
        batch.delete(adminDb.collection('users').doc(id));
        deletedCount++;
      });
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Limpeza concluída. ${deletedCount} usuários duplicados (clones antigos) foram removidos.` 
    });
  } catch (error: any) {
    console.error('Clean Users Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
