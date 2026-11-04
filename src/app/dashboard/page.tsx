'use client';

import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CreditsCard, StudioShowcase, StudyCard, ToolTiles, useRecentGenerations } from '@/components/dashboard/PanelCards';

/**
 * Painel: a central da conta. Créditos e estudo no topo, o estúdio de geração em destaque
 * e todas as ferramentas a um toque.
 */
export default function DashboardPage() {
  const recent = useRecentGenerations();
  return (
    <div className="space-y-8 md:space-y-10 max-w-6xl mx-auto pb-16">
      <DashboardHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        <div className="lg:col-span-7"><CreditsCard /></div>
        <div className="lg:col-span-5"><StudyCard /></div>
      </div>

      <StudioShowcase />

      <ToolTiles recent={recent} />
    </div>
  );
}
