import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Lead único por e-mail (coleção `leads`), com todas as origens e palavras-chave que já o trouxeram.
 * Também entra no segmento de leads do Resend (RESEND_SEGMENT_LEADS), que cuida do descadastro (LGPD).
 */
export type LeadSource = 'manychat' | 'pre_lista' | 'isca' | 'lista_antiga' | 'manual';

export interface LeadInput {
  email: string;
  name?: string;
  source: LeadSource;
  keyword?: string;
  tool?: string;
  instagram?: string;
  whatsapp?: string;
  attribution?: unknown;
  consent?: string;
  /** A pessoa marcou o aceite para receber novidades. */
  marketingConsent?: boolean;
  /** Cadastro manual no admin: não entra no segmento de e-mails (a pessoa não deu o aceite). */
  skipSegment?: boolean;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(email: unknown) {
  const e = String(email || '').trim().toLowerCase();
  return EMAIL.test(e) && e.length <= 254 ? e : null;
}

const leadId = (email: string) => createHash('sha256').update(email).digest('hex').slice(0, 32);

export async function upsertLead(input: LeadInput) {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false as const, reason: 'invalid_email' };
  const id = leadId(email);
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
    ...(input.marketingConsent ? { marketingConsentAt: now } : {}),
    lastSeenAt: now,
  }, { merge: true });

  if (!input.skipSegment) await addToResendSegment(email, input.name);
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

// ── Leitura no admin ─────────────────────────────────────────────────────────
export interface LeadRow {
  id: string;
  email: string;
  name: string;
  instagram: string;
  whatsapp: string;
  sources: string[];
  keywords: string[];
  campaign: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  marketingConsentAt: string | null;
  welcomeEmail: string | null;
}

const isoDate = (v: any): string | null => {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** "instagram / reels-maio": de onde veio o lead, pela atribuição da última visita. */
function campaignOf(attribution: any) {
  const a = attribution?.last || attribution?.first || attribution;
  return [a?.utm_source, a?.utm_campaign].filter(Boolean).join(' / ').slice(0, 120);
}

/**
 * Todos os leads, sem repetir e-mail, do mais novo para o mais antigo. Junta o registro central (`leads`)
 * com a coleção antiga da pré-lista (`pre_list`), que tem inscrições anteriores ao registro central.
 * `preListIds` guarda os documentos antigos da pessoa, para a exclusão apagar tudo.
 */
export async function listLeads(): Promise<(LeadRow & { preListIds: string[] })[]> {
  const [central, old] = await Promise.all([adminDb.collection('leads').get(), adminDb.collection('pre_list').get()]);
  const rows = new Map<string, LeadRow & { preListIds: string[] }>();

  central.docs.forEach((d: any) => {
    const v = d.data();
    const email = normalizeEmail(v.email);
    if (!email) return;
    rows.set(email, {
      id: d.id, email, name: v.name || '', instagram: v.instagram || '', whatsapp: v.whatsapp || '',
      sources: v.sources || [], keywords: v.keywords || [], campaign: campaignOf(v.lastAttribution || v.attribution),
      createdAt: isoDate(v.createdAt), lastSeenAt: isoDate(v.lastSeenAt), marketingConsentAt: isoDate(v.marketingConsentAt),
      welcomeEmail: v.welcomeEmail || null, preListIds: [],
    });
  });

  old.docs.forEach((d: any) => {
    const v = d.data();
    const email = normalizeEmail(v.email);
    if (!email) return;
    const at = isoDate(v.createdAt);
    const row = rows.get(email) ?? {
      id: leadId(email), email, name: '', instagram: '', whatsapp: '', sources: [], keywords: [], campaign: '',
      createdAt: at, lastSeenAt: at, marketingConsentAt: null, welcomeEmail: null, preListIds: [],
    };
    row.name ||= v.name || '';
    row.instagram ||= String(v.instagram || '').replace('@', '');
    row.whatsapp ||= v.whatsapp || '';
    row.campaign ||= campaignOf(v.attribution);
    if (!row.sources.includes('pre_lista')) row.sources = [...row.sources, 'pre_lista'];
    if (at && (!row.createdAt || at < row.createdAt)) row.createdAt = at;
    row.preListIds.push(d.id);
    rows.set(email, row);
  });

  return [...rows.values()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/** Apaga o lead do registro central e da coleção antiga. */
export async function deleteLead(id: string) {
  const row = (await listLeads()).find(l => l.id === id);
  const batch = adminDb.batch();
  batch.delete(adminDb.collection('leads').doc(id));
  row?.preListIds.forEach(docId => batch.delete(adminDb.collection('pre_list').doc(docId)));
  await batch.commit();
  return !!row;
}
