'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userName, setUserName] = useState("Criador");
  const { user } = useAuth();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;

      // 1. Primeiro tenta o perfil local (Configurações)
      const savedSettings = localStorage.getItem(`asa_settings_${user.uid}`);
      if (savedSettings) {
        try {
          const data = JSON.parse(savedSettings);
          if (data.name) {
            setUserName(data.name.split(' ')[0]);
            return;
          }
        } catch (e) {}
      }

      // 2. Tenta o perfil do Firestore
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().name) {
          setUserName(snap.data().name.split(' ')[0]);
          return;
        }
      } catch (e) {}

      // 3. Fallback para Firebase Auth displayName
      if (user.displayName) {
        setUserName(user.displayName.split(' ')[0]);
        return;
      }

      // 4. Último recurso: radical do email
      if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
    };

    fetchUserName();

    const handleSettingsUpdate = () => {
      fetchUserName();
    };

    window.addEventListener('asa-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('asa-settings-updated', handleSettingsUpdate);
  }, [user]);

  const getGreeting = () => {
    if (!currentTime) return "Bem-vindo(a),";
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia,";
    if (hour < 18) return "Boa tarde,";
    return "Boa noite,";
  };

  const getFormattedDate = () => {
    if (!currentTime) return "";
    
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    // Example: "segunda-feira, 19 de maio"
    const formatted = formatter.format(currentTime);
    const parts = formatted.split(',');
    
    if (parts.length >= 2) {
       // "Segunda-feira, 19 de maio" - capitalize first letter
       const weekday = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
       return (
         <>
           {weekday} <span className="text-brand-emerald animate-pulse">•</span>{parts[1]}
         </>
       );
    }
    
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-mint to-brand-emerald text-[#03140d] text-2xl font-extrabold flex items-center justify-center shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
          {userName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm text-gray-400">{getGreeting()}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{userName}<span className="text-brand-emerald">.</span></h1>
        </div>
      </div>
      <p className="text-xs md:text-sm text-gray-400 font-light tracking-[0.15em] uppercase">
        {currentTime ? getFormattedDate() : ''}
      </p>
    </div>
  );
}
