import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { NotificationToast } from '@/components/ui/NotificationToast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <div className="flex h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {/* Subtle background glow for the main dashboard area */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-emerald/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="relative z-10 w-full max-w-6xl mx-auto">
              <ProtectedRoute>
                {children}
              </ProtectedRoute>
            </div>
          </main>
        </div>
      </div>
      <NotificationToast />
    </UserProfileProvider>
  );
}
