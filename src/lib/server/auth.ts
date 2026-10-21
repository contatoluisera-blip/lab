import { adminAuth, adminDb, isAdminReady } from '@/lib/firebase/admin';

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface AuthedUser {
  uid: string;
  email: string | null;
}

/** E-mail com acesso administrativo garantido, além da coleção `admins`. */
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'luisfreitasyt@gmail.com';

/**
 * Lê o token Firebase do header Authorization e devolve o usuário.
 * Lança HttpError 401 se faltar ou for inválido, 503 se o Admin SDK não subiu.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  if (!isAdminReady || !adminAuth) {
    throw new HttpError(503, 'server_misconfigured', 'Servidor sem as credenciais do Firebase Admin. Avise o suporte.');
  }
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'unauthenticated', 'Faça login para usar esta ferramenta.');
  }
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    throw new HttpError(401, 'invalid_token', 'Sua sessão expirou. Saia e entre de novo.');
  }
}

/** Exige usuário logado E presente na coleção `admins` (ou o superadmin). */
export async function requireAdmin(req: Request): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!user.email) throw new HttpError(403, 'forbidden', 'Acesso restrito.');
  if (user.email === SUPERADMIN_EMAIL) return user;
  const snap = await adminDb.collection('admins').doc(user.email).get();
  if (!snap.exists) throw new HttpError(403, 'forbidden', 'Acesso restrito à equipe.');
  return user;
}
