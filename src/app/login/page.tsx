'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  
  const router = useRouter();
  const { user, loading } = useAuth();

  // Se já estiver logado, redireciona para o Dashboard via useEffect
  // (nunca chamar router.push diretamente durante o render)
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Enquanto redireciona, não renderiza nada
  if (!loading && user) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    setLoadingLocal(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(`Erro Firebase: ${err.message}`);
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu e-mail no campo acima para redefinir a senha.');
      return;
    }
    
    setLoadingLocal(true);
    setError('');
    setResetMessage('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Link de redefinição enviado! Verifique seu e-mail (e a caixa de spam).');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('E-mail não encontrado no sistema.');
      } else {
        setError(`Erro: ${err.message}`);
      }
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 w-full">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative">
        
        {/* Core Header (Apenas a logo com luzes de fundo) */}
        <div className="flex flex-col items-center mb-6 text-center relative select-none">
          {/* Retroiluminação (Glow Backlight) com Animação Redimensionada */}
          <div className="absolute top-12 w-80 h-80 bg-gradient-to-tr from-brand-emerald/20 via-brand-emerald/5 to-brand-mint/30 rounded-full blur-[70px] opacity-90 animate-pulse -z-10" />
          <div className="absolute top-16 w-72 h-72 bg-brand-emerald/10 rounded-full blur-[50px] opacity-70 animate-ping duration-[6000ms] -z-10" />
          
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/creator%20lab%20verde.png?alt=media&token=8733334d-95bf-4f7c-85e1-6916cda0856f" 
            alt="Creator Lab Logo" 
            className="w-auto object-contain drop-shadow-[0_0_40px_rgba(16,185,129,0.45)] relative z-10 transition-transform duration-500 hover:scale-105"
            style={{ height: '330px' }}
          />
        </div>

        {/* Custom Glass Card with Animated Illuminated Contour Border (like the reference) */}
        <div className="relative p-[1.5px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Pulsing gradient layer for the 1.5px border highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/50 via-brand-mint/20 to-[#111] opacity-75 animate-pulse pointer-events-none" />
          
          {/* Slow rotating accent gradient around the card edge */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-brand-emerald/40 via-blue-500/10 to-brand-mint/30 opacity-40 pointer-events-none"
            style={{
              animation: 'spin 12s linear infinite',
              transformOrigin: 'center center',
            }}
          />

          {/* Inner Card container */}
          <div className="relative rounded-[30.5px] bg-[#0c0c0d]/95 backdrop-blur-3xl p-8 border border-white/5 overflow-hidden">
            {/* Top-left internal glass refraction glow (like the reference) */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent blur-md rounded-tl-3xl pointer-events-none" />

            {/* Header texts INSIDE the box */}
            <div className="mb-8 text-center space-y-1.5 relative z-10">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Acesse o Hub</h2>
              <p className="text-gray-400 text-xs font-light">Insira suas credenciais para entrar no painel.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resetMessage && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{resetMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                     <Mail className="w-4 h-4 text-brand-emerald" /> E-mail
                  </label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full glass-input text-white"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 flex justify-between items-center w-full">
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-brand-emerald" /> Senha
                    </span>
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="text-xs text-brand-emerald hover:text-brand-mint hover:underline bg-transparent border-none p-0"
                    >
                      Esqueceu a senha?
                    </button>
                  </label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input text-white"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={loadingLocal || loading}
                className="w-full h-12 text-sm uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-gradient-to-r from-brand-emerald/20 to-brand-emerald/10 text-brand-emerald border border-brand-emerald/30 hover:bg-brand-emerald hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              >
                {loadingLocal || loading ? (
                   <span className="flex items-center gap-2">Entrando...</span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Lock className="w-4 h-4" /> Entrar
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Footer Support */}
        <p className="text-center text-xs text-gray-500 mt-8">
           Acesso restrito a usuários autorizados.
        </p>

      </div>
    </div>
  );
}
