import * as admin from 'firebase-admin';

let isAdminReady = false;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace all literal \n with actual newlines to fix Netlify env var formatting
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      isAdminReady = true;
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  } else {
    console.error(
      '[Firebase Admin] Erro fatal: Variáveis de ambiente ausentes no Netlify! Verifique se FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY estão configuradas corretamente.'
    );
  }
} else {
  isAdminReady = true;
}

export { isAdminReady };
export const adminDb = isAdminReady ? admin.firestore() : null as any;
export const adminAuth = isAdminReady ? admin.auth() : null as any;
