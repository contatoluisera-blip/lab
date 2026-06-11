'use client';

import React, { useState, useEffect } from 'react';

export default function Dots() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-brand-emerald/30"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float-dot ${Math.random() * 8 + 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
            opacity: Math.random() * 0.7 + 0.2,
          }}
        />
      ))}
    </div>
  );
}
