'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, User, Settings, LogOut, HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export function Topbar() {
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState('Luis Gustavo');
  const [initials, setInitials] = React.useState('LG');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  const updateProfile = React.useCallback(() => {
    let nameToUse = '';
    let avatarToUse = null;

    const saved = localStorage.getItem('asa_settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.avatar) avatarToUse = data.avatar;
        if (data.name) nameToUse = data.name;
      } catch (e) {
        console.error('Erro ao atualizar topo', e);
      }
    }

    if (avatarToUse) setAvatar(avatarToUse);

    // Fallbacks
    if (!nameToUse && user) {
      nameToUse = user.displayName || (user.email ? user.email.split('@')[0] : 'Criador');
    }

    if (nameToUse) {
      setUserName(nameToUse);
      const names = nameToUse.trim().split(' ');
      const initial = names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].length > 0 ? names[0][0].toUpperCase() : 'LG';
      setInitials(initial);
    }
  }, [user]);

  React.useEffect(() => {
    updateProfile();
    window.addEventListener('asa-settings-updated', updateProfile);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('asa-settings-updated', updateProfile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updateProfile]);

  const toggleSidebar = () => {
    document.dispatchEvent(new CustomEvent('toggleSidebar'));
  };

  return (
    <header className="h-20 border-b border-white/5 neo-glass-panel sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md relative">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar ferramentas, desafios..." 
            className="w-full glass-input !pl-10 h-10 py-0 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Fazer Upgrade para Elite
          </Button>
        </Link>
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-emerald rounded-full border border-black shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
        </button>
        
        <div className="relative" ref={menuRef}>
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-emerald to-[#065f46] p-0.5 cursor-pointer glow-border group relative z-50 transition-transform active:scale-95"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                initials
              )}
            </div>
          </div>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 neo-glass-panel overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 z-50 rounded-2xl border border-white/10 shadow-2xl">
              <div className="p-4 bg-white/[0.03] border-b border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Olá,</p>
                <p className="text-sm font-bold text-white truncate">{userName}</p>
              </div>

              <div className="p-2">
                <Link href="/dashboard/settings" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-brand-emerald/10 transition-all group">
                    <User className="w-4 h-4 text-brand-emerald/60 group-hover:text-brand-emerald transition-colors" />
                    Meu perfil
                  </button>
                </Link>


                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-brand-emerald/10 transition-all group border-b border-white/5 rounded-none mb-1 pb-3">
                  <Settings className="w-4 h-4 text-brand-emerald/60 group-hover:text-brand-emerald transition-colors" />
                  Suporte
                </button>
                
                <div className="pt-1">
                  <button 
                    onClick={() => { setIsMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all group"
                  >
                    <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                    Sair do ASA Hub
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
