'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Vídeo em loop, mudo, que só carrega e toca quando aparece na tela
 * (a página de vendas tem vários: assim não pesam todos de uma vez).
 */
export function LoopVideo({ src, poster, className, label }: { src: string; poster?: string; className?: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (el.preload !== 'auto') { el.preload = 'auto'; el.load(); }
        if (!reduce) el.play().catch(() => {});
      } else {
        el.pause();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      className={className}
    />
  );
}
