'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  return (
    <header className="h-20 border-b border-white/5 neo-glass-panel sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3" />
        <input 
          type="text" 
          placeholder="Buscar ferramentas, desafios..." 
          className="w-full glass-input pl-10 h-10 py-0 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="hidden md:flex">
          Fazer Upgrade para Elite
        </Button>
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-emerald rounded-full border border-black shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-emerald to-[#065f46] p-0.5 cursor-pointer glow-border">
          <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold">
            LG
          </div>
        </div>
      </div>
    </header>
  );
}
