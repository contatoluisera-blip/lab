'use client';

import React from 'react';
import { Zap, Gift, BadgeCheck } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';
import { ToolId } from '@/lib/planConfig';

/**
 * Aviso abaixo do botão de gerar: custo em créditos do próximo uso.
 * Lê o custo da tabela central (planConfig), então acompanha qualquer mudança de preço.
 */
export function CreditNotice({ toolId }: { toolId: ToolId }) {
  const { userProfile, profileLoading, account, hasToolAccess, toolCost } = useUserProfile();

  if (profileLoading || !userProfile || !hasToolAccess(toolId)) return null;

  const { cost, trial } = toolCost(toolId);

  if (cost === 0) {
    return (
      <div className="flex items-center gap-1.5 justify-center mt-3 text-[10px] text-gray-500 font-medium tracking-wide">
        <BadgeCheck className="w-3 h-3 text-brand-emerald opacity-70" />
        <span>Não consome créditos</span>
      </div>
    );
  }

  if (trial) {
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
      <span>Consome {cost} {cost === 1 ? 'crédito' : 'créditos'} por uso · saldo atual: {account.credits}</span>
    </div>
  );
}
