'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, User, LogOut, Menu, Check, Trash2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { getNotifications, markAllAsRead, clearNotifications, NotificationItem } from '@/lib/notifications';

export function Topbar() {
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  
  const menuRef = React.useRef<HTMLDivElement>(null);
  const bellRef = React.useRef<HTMLDivElement>(null);
  
  const { user, signOut } = useAuth();
  const { userProfile } = useUserProfile();

  const [localName, setLocalName] = React.useState<string | null>(null);

  const isElite = userProfile?.plan === 'elite';
  const userName = localName || userProfile?.name || (user?.displayName ? user.displayName : (user?.email ? user.email.split('@')[0] : 'Criador'));
  const initials = userName.charAt(0).toUpperCase() || 'C';

  const updateProfile = React.useCallback(() => {
    let avatarToUse = null;
    let nameToUse = null;

    const saved = user ? localStorage.getItem(`asa_settings_${user.uid}`) : null;
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.avatar) avatarToUse = data.avatar;
        if (data.name) nameToUse = data.name;
      } catch (e) {
        console.error('Erro ao atualizar topo', e);
      }
    }

    setAvatar(avatarToUse);
    setLocalName(nameToUse);
  }, [user]);

  const loadNotifications = React.useCallback(() => {
    if (user) {
      setNotifications(getNotifications(user.uid));
    }
  }, [user]);

  React.useEffect(() => {
    updateProfile();
    loadNotifications();
    window.addEventListener('asa-settings-updated', updateProfile);
    window.addEventListener('asa-notifications-updated', loadNotifications);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('asa-settings-updated', updateProfile);
      window.removeEventListener('asa-notifications-updated', loadNotifications);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updateProfile, loadNotifications]);

  const toggleSidebar = () => {
    document.dispatchEvent(new CustomEvent('toggleSidebar'));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 border-b border-white/5 neo-glass-panel sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 relative">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {!isElite && (
          <Link href="/dashboard/billing">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              Fazer Upgrade para Elite
            </Button>
          </Link>
        )}
        
        <div className="relative" ref={bellRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-emerald rounded-full border border-black shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 neo-glass-panel overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 z-50 rounded-2xl border border-white/10 shadow-2xl">
              <div className="p-4 bg-[#0a0a0b]/90 border-b border-white/5 flex items-center justify-between">
                <p className="text-xs font-bold text-white uppercase tracking-widest">Notificações</p>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => user && markAllAsRead(user.uid)}
                    className="text-[10px] text-brand-emerald hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Lidas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5 bg-[#0a0a0b]/95">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-4 hover:bg-white/[0.02] transition-colors relative ${!n.read ? 'bg-brand-emerald/[0.02]' : ''}`}>
                      {!n.read && (
                        <div className="absolute left-2.5 top-5 w-1.5 h-1.5 bg-brand-emerald rounded-full" />
                      )}
                      <div className="pl-2">
                        <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                        <p className="text-[11px] text-gray-400 mt-1 leading-normal">{n.message}</p>
                        <p className="text-[9px] text-gray-500 mt-2 font-mono">{new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                    <Inbox className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs">Nenhuma notificação</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-2 border-t border-white/5 bg-[#0a0a0b]/95 text-center">
                  <button 
                    onClick={() => user && clearNotifications(user.uid)}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 mx-auto transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
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
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-brand-emerald/10 transition-all group border-b border-white/5 rounded-none mb-1 pb-3">
                    <User className="w-4 h-4 text-brand-emerald/60 group-hover:text-brand-emerald transition-colors" />
                    Meu perfil
                  </button>
                </Link>
                
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
