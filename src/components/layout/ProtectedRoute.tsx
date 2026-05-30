'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useRouter, usePathname } from 'next/navigation';
import { ScanSearch } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { userProfile, profileLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && !profileLoading && user && userProfile) {
      if ((!userProfile.plan || (userProfile.plan as any) === 'free') && pathname !== '/dashboard/billing') {
        router.push('/dashboard/billing');
      }
    }
  }, [user, loading, userProfile, profileLoading, pathname, router]);

  if (loading || profileLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4 opacity-50">
         <ScanSearch className="w-12 h-12 text-teal-500 animate-pulse" />
         <p className="text-gray-400 font-medium">Validando Acesso e Assinatura...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
