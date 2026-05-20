import * as admin from 'firebase-admin';

let isAdminReady = false;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
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
    console.warn(
      '[Firebase Admin] Não inicializado: variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY ausentes no .env.local'
    );
  }
} else {
  isAdminReady = true;
}

export { isAdminReady };
export const adminDb = isAdminReady ? admin.firestore() : null as any;
export const adminAuth = isAdminReady ? admin.auth() : null as any;
