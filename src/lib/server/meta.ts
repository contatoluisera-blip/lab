import { createHash } from 'crypto';

/**
 * API de Conversões da Meta (servidor): registra eventos que o navegador pode perder,
 * como a compra confirmada pela Stripe. Só envia com consentimento do usuário.
 * Precisa de NEXT_PUBLIC_META_PIXEL_ID e META_CAPI_TOKEN; sem eles, não faz nada.
 */
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';

const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

export interface MetaServerEvent {
  name: 'Purchase' | 'Lead' | 'CompleteRegistration' | 'InitiateCheckout';
  /** Mesmo id do evento do navegador, para a Meta não contar duas vezes. */
  eventId: string;
  email?: string | null;
  externalId?: string;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  sourceUrl?: string;
  value?: number;
  currency?: string;
  contentName?: string;
}

export async function sendMetaEvent(e: MetaServerEvent) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return;

  const user_data: Record<string, unknown> = {};
  if (e.email) user_data.em = [sha256(e.email)];
  if (e.externalId) user_data.external_id = [sha256(e.externalId)];
  if (e.fbp) user_data.fbp = e.fbp;
  if (e.fbc) user_data.fbc = e.fbc;
  if (e.ip) user_data.client_ip_address = e.ip;
  if (e.userAgent) user_data.client_user_agent = e.userAgent;

  const body = {
    data: [{
      event_name: e.name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: e.eventId,
      action_source: 'website',
      event_source_url: e.sourceUrl,
      user_data,
      custom_data: {
        ...(e.value !== undefined ? { value: e.value, currency: e.currency || 'BRL' } : {}),
        ...(e.contentName ? { content_name: e.contentName } : {}),
      },
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixel}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error('[meta] evento recusado', e.name, res.status, await res.text());
  } catch (err) {
    console.error('[meta] falha ao enviar evento', e.name, err);
  }
}
