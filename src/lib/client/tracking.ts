'use client';

// ─────────────────────────────────────────────────────────────
// Medição de marketing: consentimento (LGPD), origem do visitante (UTM)
// e eventos para o Pixel da Meta e o GA4. Nada é enviado sem consentimento.
// IDs vêm de NEXT_PUBLIC_META_PIXEL_ID e NEXT_PUBLIC_GA4_ID; sem eles, tudo vira no-op.
// ─────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';

const CONSENT_KEY = 'cl_consent';
const FIRST_KEY = 'cl_attr_first';
const LAST_KEY = 'cl_attr_last';
const ATTR_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type Consent = 'granted' | 'denied';

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  landing?: string;
  referrer?: string;
  ts: string;
}

const safe = <T,>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export function getConsent(): Consent | null {
  return safe(() => (localStorage.getItem(CONSENT_KEY) as Consent | null), null);
}

export function setConsent(value: Consent) {
  safe(() => localStorage.setItem(CONSENT_KEY, value), undefined);
  window.dispatchEvent(new CustomEvent('cl-consent', { detail: value }));
}

/** Guarda de onde o visitante veio: primeira origem (90 dias) e a mais recente. */
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;
  const found: Partial<Attribution> = {};
  keys.forEach(k => { const v = params.get(k); if (v) found[k] = v.slice(0, 200); });
  const externalReferrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer.slice(0, 300) : '';
  if (!Object.keys(found).length && !externalReferrer) return;

  const attr: Attribution = { ...found, landing: window.location.pathname, referrer: externalReferrer || undefined, ts: new Date().toISOString() };
  safe(() => {
    localStorage.setItem(LAST_KEY, JSON.stringify(attr));
    const first = JSON.parse(localStorage.getItem(FIRST_KEY) || 'null') as Attribution | null;
    if (!first || Date.now() - new Date(first.ts).getTime() > ATTR_TTL_MS) localStorage.setItem(FIRST_KEY, JSON.stringify(attr));
  }, undefined);

  // Clique vindo de anúncio da Meta: cookie _fbc melhora a atribuição da API de Conversões.
  if (found.fbclid) document.cookie = `_fbc=fb.1.${Date.now()}.${found.fbclid}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
}

export function getAttribution(): { first: Attribution | null; last: Attribution | null } {
  return safe(() => ({
    first: JSON.parse(localStorage.getItem(FIRST_KEY) || 'null'),
    last: JSON.parse(localStorage.getItem(LAST_KEY) || 'null'),
  }), { first: null, last: null });
}

function cookie(name: string) {
  return safe(() => document.cookie.split('; ').find(c => c.startsWith(`${name}=`))?.split('=').slice(1).join('=') || undefined, undefined);
}

/** Dados que vão junto para o servidor (checkout, cadastro, leads) para medir e atribuir conversões. */
export function marketingContext() {
  return {
    consent: getConsent() || 'denied',
    fbp: cookie('_fbp'),
    fbc: cookie('_fbc'),
    attribution: getAttribution(),
  };
}

/** Nome do evento no GA4 para cada evento padrão da Meta. */
const GA4_EVENT: Record<string, string> = {
  PageView: 'page_view',
  ViewContent: 'view_item',
  Lead: 'generate_lead',
  CompleteRegistration: 'sign_up',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
};

/**
 * Registra um evento no Pixel e no GA4 (só com consentimento).
 * `eventId` permite à Meta juntar o evento do navegador com o mesmo evento enviado pelo servidor.
 */
export function track(event: keyof typeof GA4_EVENT, params: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === 'undefined' || getConsent() !== 'granted') return;
  safe(() => {
    if (window.fbq && event !== 'PageView') window.fbq('track', event, params, eventId ? { eventID: eventId } : undefined);
    if (window.gtag && event !== 'PageView') window.gtag('event', GA4_EVENT[event], params);
  }, undefined);
}

/** Valor mensal de cada plano, para os eventos de checkout. */
export function planValue(planName: string) {
  const v: Record<string, number> = { start: 67, pro: 117, elite: 197 };
  return v[String(planName || '').toLowerCase()] ?? 0;
}
