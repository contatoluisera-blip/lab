'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Zap, ArrowRight } from 'lucide-react';

interface UpgradeGateProps {
  /** When true the gate is active (access denied) */
  locked: boolean;
  /** Which plan is required */
  requiredPlan?: 'Pro' | 'Elite';
  /** Button-mode: replaces the action button with an upgrade CTA */
  mode?: 'button' | 'overlay';
  /** Optional label override */
  label?: string;
  children?: React.ReactNode;
  /** Extra className for the overlay wrapper */
  className?: string;
}

/**
 * UpgradeGate — wraps any content and shows an upgrade prompt when locked.
 *
 * mode="button"  → renders only an upgrade button (no children rendered)
 * mode="overlay" → renders children with a semi-opaque cadeado overlay on top
 */
export function UpgradeGate({
  locked,
  requiredPlan = 'Pro',
  mode = 'button',
  label,
  children,
  className = '',
}: UpgradeGateProps) {
  const router = useRouter();

  const goToBilling = () => router.push('/dashboard/billing');

  if (!locked) return <>{children}</>;

  // ── Button Mode ──────────────────────────────
  if (mode === 'button') {
    return (
      <button
        onClick={goToBilling}
        className={`
          group flex items-center justify-center gap-2
          px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest
          bg-gradient-to-r from-amber-500/20 to-orange-500/20
          border border-amber-500/30 text-amber-300
          hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50
          hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]
          transition-all duration-300 w-full
          ${className}
        `}
      >
        <Lock className="w-4 h-4 flex-shrink-0" />
        <span>{label ?? `Disponível no Plano ${requiredPlan}`}</span>
        <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
      </button>
    );
  }

  // ── Overlay Mode (for Estudo cards) ──────────
  return (
    <div className={`relative ${className}`}>
      {/* Blurred children */}
      <div className="pointer-events-none select-none">
        {children}
      </div>

      {/* Lock overlay */}
      <div
        className="
          absolute inset-0 z-10 flex flex-col items-center justify-center gap-3
          bg-black/70 backdrop-blur-[3px] rounded-2xl
          border border-amber-500/20
        "
      >
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <p className="text-xs text-amber-300 font-semibold text-center px-4 leading-snug">
          {label ?? `Disponível no Plano ${requiredPlan}`}
        </p>
        <button
          onClick={goToBilling}
          className="
            flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold
            bg-amber-500 text-black hover:bg-amber-400
            transition-colors shadow-[0_0_12px_rgba(245,158,11,0.4)]
          "
        >
          <Zap className="w-3 h-3" />
          Fazer Upgrade
        </button>
      </div>
    </div>
  );
}
