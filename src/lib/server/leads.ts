import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Lead único por e-mail (coleção `leads`), com todas as origens e palavras-chave que já o trouxeram.
 * Também entra no segmento de leads do Resend (RESEND_SEGMENT_LEADS), que cuida do descadastro (LGPD).
 */
export interface LeadInput {
  email: string;
  name?: string;
  source: 'manychat' | 'pre_lista' | 'isca' | 'lista_antiga';
  keyword?: string;
  tool?: string;
  instagram?: string;
  whatsapp?: string;
  attribution?: unknown;
  consent?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(email: unknown) {
  const e = String(email || '').trim().toLowerCase();
  return EMAIL.test(e) && e.length <= 254 ? e : null;
}

export async function upsertLead(input: LeadInput) {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false as const, reason: 'invalid_email' };
  const id = createHash('sha256').update(email).digest('hex').slice(0, 32);
  const now = new Date().toISOString();
  const ref = adminDb.collection('leads').doc(id);
  const existed = (await ref.get()).exists;
  const union = (v?: string) => (v ? admin.firestore.FieldValue.arrayUnion(v.slice(0, 80)) : undefined);

  await ref.set({
    email,
    ...(input.name ? { name: input.name.slice(0, 120) } : {}),
    ...(input.instagram ? { instagram: input.instagram.replace('@', '').slice(0, 60) } : {}),
    ...(input.whatsapp ? { whatsapp: input.whatsapp.slice(0, 30) } : {}),
    sources: union(input.source),
    ...(input.keyword ? { keywords: union(input.keyword.toUpperCase()) } : {}),
    ...(input.tool ? { tools: union(input.tool) } : {}),
    ...(input.attribution ? { lastAttribution: input.attribution } : {}),
    ...(existed ? {} : { firstSource: input.source, firstKeyword: input.keyword?.toUpperCase() || null, createdAt: now, attribution: input.attribution ?? null }),
    lastSeenAt: now,
  }, { merge: true });

  await addToResendSegment(email, input.name);
  return { ok: true as const, id, isNew: !existed };
}

async function addToResendSegment(email: string, name?: string) {
  const segment = process.env.RESEND_SEGMENT_LEADS;
  if (!segment || !process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.contacts.create({ email, firstName: name?.split(' ')[0], segments: [{ id: segment }] });
    // Contato já existente não é erro para nós.
    if (error && !/already|exist/i.test(error.message)) console.error('[leads] Resend recusou o contato:', error.message);
  } catch (e) {
    console.error('[leads] falha ao enviar contato ao Resend:', e);
  }
}
