'use client';

import React, { useState, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Mail, 
  Camera, 
  Briefcase, 
  IdCard,
  CheckCircle2,
  Calendar,
  CloudUpload,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [name, setName] = useState('Luis Erasmo');
  const [age, setAge] = useState('28');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('14:35');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados salvos ao montar o componente
  React.useEffect(() => {
    const saved = localStorage.getItem('asa_settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.age) setAge(data.age);
        if (data.corporateEmail) setCorporateEmail(data.corporateEmail);
        if (data.phone) setPhone(data.phone);
        if (data.avatar) setAvatar(data.avatar);
        if (data.lastSaved) setLastSaved(data.lastSaved);
      } catch (e) {
        console.error('Erro ao carregar configurações', e);
      }
    }
  }, []);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);

    if (file) {
      // Validar tamanho (máximo 2MB para não estourar o localStorage)
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('Imagem muito grande (máx 2MB).');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setPhotoError('Formato de arquivo inválido.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.onerror = () => {
        setPhotoError('Erro ao carregar arquivo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const dataToSave = {
      name,
      age,
      corporateEmail,
      phone,
      avatar,
      lastSaved: timeString
    };

    localStorage.setItem('asa_settings', JSON.stringify(dataToSave));
    setLastSaved(timeString);
    
    // Disparar evento para outros componentes (como o Topbar) atualizarem
    window.dispatchEvent(new Event('asa-settings-updated'));
    
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações</h1>
        <p className="text-gray-400">Personalize seu perfil, informações profissionais e conta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile/Avatar Section */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <GlassCard className="p-8 text-center flex flex-col items-center border-brand-emerald/10">
            <div 
              className="relative group cursor-pointer" 
              onClick={handlePhotoClick}
            >
              <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-white/5 group-hover:border-brand-emerald/40 transition-all duration-500 relative shadow-2xl">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-white/[0.03] flex flex-col items-center justify-center text-gray-500 gap-2">
                    <User className="w-16 h-16 opacity-20" />
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Sem Foto</span>
                  </div>
                )}
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
                  <CloudUpload className="w-8 h-8 text-brand-emerald mb-2 animate-bounce" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Alterar Foto</span>
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -bottom-2 -right-2 bg-brand-emerald p-2 rounded-xl shadow-lg border-2 border-black z-20 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-black" />
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <h3 className="text-2xl font-bold text-white">{name || 'Usuário'}</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest">Creator Pro</span>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />

            {photoError && (
              <div className="mt-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter text-center">
                  {photoError}
                </p>
              </div>
            )}
            
          </GlassCard>

          <GlassCard className="p-6 border-white/5">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informações de Conta</h4>
               <CheckCircle2 className="w-4 h-4 text-brand-emerald opacity-50" />
             </div>
             <div className="space-y-4">
               <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                 <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">E-mail Principal</p>
                 <p className="text-sm text-gray-300 font-medium truncate">luis.era@exemplo.com</p>
               </div>
             </div>
          </GlassCard>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-10 space-y-10 border-white/10">
            {/* Essential Info */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald border border-brand-emerald/20">
                    <IdCard className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Dados Pessoais</h2>
                    <p className="text-xs text-gray-500">Como você será identificado no ASA Creator Hub.</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input h-12"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Idade</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full glass-input h-12 !pr-10"
                      placeholder="Ex: 28"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-8 pt-10 border-t border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-brand-neon/10 flex items-center justify-center text-brand-neon border border-brand-neon/20">
                    <Briefcase className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Informações Profissionais</h2>
                    <p className="text-xs text-gray-500">Dados para faturamento e colaborações corporativas.</p>
                 </div>
              </div>
              
              <div className="space-y-2 max-w-lg">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    className="w-full glass-input h-12 !pl-12"
                    placeholder="empresa@seudominio.com.br"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                </div>
                <p className="text-[10px] text-gray-500 italic mt-3 px-1 leading-relaxed">
                   * Este e-mail será priorizado para o envio de propostas comerciais e notas fiscais de faturamento Elite.
                </p>
              </div>

              <div className="space-y-2 max-w-lg mt-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Número de Contato</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full glass-input h-12 !pl-12"
                    placeholder="(00) 00000-0000"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
               <p className="text-xs text-gray-500">Última alteração realizada hoje às {lastSaved}.</p>
               <Button onClick={handleSave} className="w-full md:w-auto px-10 h-12 font-bold uppercase tracking-widest text-xs group">
                  Salvar Alterações
                  <CheckCircle2 className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />
               </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
