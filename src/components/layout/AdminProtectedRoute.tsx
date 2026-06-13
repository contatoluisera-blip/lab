'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check admin status
      const checkAdmin = async () => {
        try {
          const res = await fetch('/api/admin/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
          });
          const data = await res.json();
          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status', error);
          router.push('/dashboard');
        }
      };

      checkAdmin();
    }
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center space-y-4 opacity-50 bg-[#050505] text-white">
         <ShieldAlert className="w-12 h-12 text-brand-emerald animate-pulse" />
         <p className="text-gray-400 font-medium tracking-widest text-xs uppercase">Autenticando Área de Gestão...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
