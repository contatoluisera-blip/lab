'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';
import { ProjectList } from '@/components/montagem/ProjectList';
import { ProjectEditor } from '@/components/montagem/ProjectEditor';

function MontagemInner() {
  const projectId = useSearchParams().get('projeto');
  const { hasToolAccess, profileLoading } = useUserProfile();
  if (profileLoading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-mint" /></div>;
  if (!hasToolAccess('montagem')) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 space-y-4">
        <h1 className="text-3xl font-bold text-white">Montagem de vídeo</h1>
        <p className="text-gray-400">A montagem está disponível para assinantes. Escolha um plano para começar.</p>
        <Link href="/dashboard/billing" className="inline-block glass-button-primary">Ver planos</Link>
      </div>
    );
  }
  return projectId ? <ProjectEditor key={projectId} projectId={projectId} /> : <ProjectList />;
}

export default function MontagemPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-mint" /></div>}>
      <MontagemInner />
    </Suspense>
  );
}
