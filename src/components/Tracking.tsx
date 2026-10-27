'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GA4_ID, PIXEL_ID, captureAttribution, getConsent, setConsent, track, Consent } from '@/lib/client/tracking';

let loaded = false;

/** Carrega o Pixel da Meta e o GA4 (uma vez, só após o consentimento). */
function loadTags() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;

  if (PIXEL_ID && !window.fbq) {
    // Mesmo formato do snippet oficial: a fila guarda o objeto `arguments`, não um array.
    // eslint-disable-next-line prefer-rest-params
    const fbq: any = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    window.fbq = fbq;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    fbq('init', PIXEL_ID);
  }

  if (GA4_ID && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    // O gtag.js só reconhece comandos enfileirados como `arguments` (igual ao snippet oficial).
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { send_page_view: false });
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(s);
  }
}

function pageView(path: string) {
  if (getConsent() !== 'granted') return;
  window.fbq?.('track', 'PageView');
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href });
  // A landing page (com a VSL) é o "conteúdo" da oferta.
  if (path === '/') track('ViewContent', { content_name: 'landing_vsl' });
}

/**
 * Medição de marketing com consentimento (LGPD): guarda a origem do visitante (UTM),
 * mostra o aviso de cookies e, se aceito, carrega Pixel + GA4 e registra as páginas vistas.
 */
export function Tracking() {
  const pathname = usePathname();
  const [consent, setConsentState] = useState<Consent | null | 'loading'>('loading');

  useEffect(() => {
    captureAttribution();
    const c = getConsent();
    setConsentState(c);
    if (c === 'granted') loadTags();
    const onChange = (e: Event) => {
      const value = (e as CustomEvent<Consent>).detail;
      setConsentState(value);
      if (value === 'granted') { loadTags(); pageView(window.location.pathname); }
    };
    window.addEventListener('cl-consent', onChange);
    return () => window.removeEventListener('cl-consent', onChange);
  }, []);

  useEffect(() => {
    captureAttribution();
    if (getConsent() === 'granted') pageView(pathname);
  }, [pathname]);

  // Sem IDs configurados não há o que consentir; nada é exibido.
  if ((!PIXEL_ID && !GA4_ID) || consent !== null) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:max-w-md z-[60] rounded-2xl border border-white/10 bg-[#0b0f0d]/95 backdrop-blur p-4 shadow-2xl">
      <p className="text-sm text-gray-200 leading-relaxed">
        Usamos cookies para medir de onde vêm as visitas e melhorar nossos anúncios. Você escolhe.{' '}
        <Link href="/politica-de-privacidade" className="underline text-gray-400 hover:text-white">Política de privacidade</Link>
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setConsent('granted')} className="flex-1 px-4 py-2 rounded-xl bg-brand-emerald text-black text-sm font-bold">Aceitar</button>
        <button onClick={() => setConsent('denied')} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold">Recusar</button>
      </div>
    </div>
  );
}
