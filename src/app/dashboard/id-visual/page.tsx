'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';
import { BrandLibrary } from '@/components/brand/BrandLibrary';

export default function IdVisualPage() {
  const { hasToolAccess, profileLoading } = useUserProfile();
  if (profileLoading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-mint" /></div>;
  if (!hasToolAccess('montagem')) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 space-y-4">
        <h1 className="text-3xl font-bold text-white">ID Visual</h1>
        <p className="text-gray-400">A biblioteca de ID Visual faz parte da Montagem de vídeo, disponível para assinantes.</p>
        <Link href="/dashboard/billing" className="inline-block glass-button-primary">Ver planos</Link>
      </div>
    );
  }
  return <BrandLibrary />;
}
