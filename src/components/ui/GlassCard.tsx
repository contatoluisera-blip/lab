'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export function GlassCard({ children, className, glow = false, ...props }: GlassCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#0f0f0f]/60 backdrop-blur-xl border border-brand-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.1),inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300",
        "before:absolute before:inset-0 before:z-[-1] before:rounded-2xl before:bg-gradient-to-br before:from-brand-emerald/5 before:to-transparent",
        glow && "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-brand-emerald/60 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {/* Volumetric Mouse Spotlight inside the card */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10 rounded-2xl"
        style={{
          opacity,
          background: glow 
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16,185,129,0.15), transparent 40%)`
            : `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      {/* Dynamic Glow Border tracing the mouse */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 z-20 border"
        style={{
          opacity,
          borderColor: 'rgba(16,185,129,0.6)',
          maskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(150px circle at ${position.x}px ${position.y}px, black, transparent 100%)`,
        }}
      />

      <div className="relative z-30 w-full h-full p-6">
        {children}
      </div>
    </div>
  );
}
