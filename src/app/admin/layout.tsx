'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProtectedRoute } from '@/components/layout/AdminProtectedRoute';
import { LayoutDashboard, Users, UserPlus, LogOut, ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { label: 'Visão Geral', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-20">
          <div className="h-16 flex items-center px-6 border-b border-white/5">
            <h1 className="text-sm font-extrabold tracking-widest text-brand-emerald flex items-center gap-2">
              <ShieldIcon /> ADMIN LAB
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 px-2">Gestão</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 space-y-2">
            <Link href="/dashboard">
              <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao App
              </button>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-emerald/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="p-8 relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
