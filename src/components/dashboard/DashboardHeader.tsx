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
    <div className="py-12 mt-4 relative flex flex-col items-center text-center px-4 md:px-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-emerald/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="text-gray-400 font-light text-sm md:text-base tracking-[0.2em] uppercase mb-4 flex items-center gap-2 h-8">
        {currentTime ? getFormattedDate() : ""}
      </div>
      
      <h1 className="text-5xl md:text-7xl flex flex-col items-center">
        <span className="font-extralight tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-400 mb-1">
          {getGreeting()}
        </span>
        <span className="font-extrabold tracking-tighter text-white drop-shadow-lg">
          {userName}.
        </span>
      </h1>
    </div>
  );
}
