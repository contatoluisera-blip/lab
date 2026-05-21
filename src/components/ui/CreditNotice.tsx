'use client';

import React from 'react';
import { Zap, Gift } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';
import { ToolId } from '@/lib/planConfig';

export function CreditNotice({ toolId }: { toolId: ToolId }) {
  const { userProfile, profileLoading, hasToolAccess } = useUserProfile();

  if (profileLoading || !userProfile || !hasToolAccess(toolId)) return null;

  const isTrial = !userProfile.trialUsed?.[toolId];

  if (isTrial) {
    return (
      <div className="flex items-center gap-1.5 justify-center mt-3 text-[11px] text-brand-mint font-bold tracking-wide animate-pulse">
        <Gift className="w-3.5 h-3.5" />
        <span>1º Uso Gratuito (Teste)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-center mt-3 text-[10px] text-gray-500 font-medium tracking-wide">
      <Zap className="w-3 h-3 text-brand-emerald opacity-70" />
      <span>Consome 1 crédito por uso</span>
    </div>
  );
}
