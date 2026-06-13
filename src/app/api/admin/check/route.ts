import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    // Hardcoded superadmin
    if (email === 'luisfreitasyt@gmail.com') {
      // Auto-seed in case it's not there
      if (adminDb) {
        await adminDb.collection('admins').doc(email).set({
          email,
          role: 'superadmin',
          addedAt: new Date(),
        }, { merge: true });
      }
      return NextResponse.json({ isAdmin: true });
    }

    // Check collection
    if (adminDb) {
      const doc = await adminDb.collection('admins').doc(email).get();
      if (doc.exists) {
        return NextResponse.json({ isAdmin: true });
      }
    }

    return NextResponse.json({ isAdmin: false });
  } catch (error: any) {
    console.error('Admin Check Error:', error);
    return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}
