'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  
  const router = useRouter();
  const { user, loading } = useAuth();

  // Se já estiver logado, foge direto pro Dashboard
  if (!loading && user) {
    router.push('/dashboard');
    return null;
  }

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

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 w-full">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        {/* Core Header */}
        <div className="flex flex-col items-center mb-8 text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl neo-glass flex items-center justify-center border-2 border-teal-500/50 shadow-[0_0_30px_rgba(45,212,191,0.2)] mb-4">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Acesso Tático</h1>
          <p className="text-gray-400 text-sm">Autenticação necessária para o ambiente B2B.</p>
        </div>

        {/* Login Form */}
        <GlassCard glow className="p-8 border-teal-500/20">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                   <Mail className="w-4 h-4 text-teal-500" /> Endereço de Operação
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analista@suaagencia.com.br"
                  className="w-full glass-input text-white"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                   <KeyRound className="w-4 h-4 text-teal-500" /> Código de Acesso
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
                className="w-full h-12 text-sm uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(45,212,191,0.3)] bg-gradient-to-r from-teal-500/20 to-teal-400/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500 hover:text-black hover:shadow-[0_0_20px_rgba(45,212,191,0.6)]"
              >
              {loadingLocal || loading ? (
                 <span className="flex items-center gap-2">Validando Criptografia...</span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Lock className="w-4 h-4" /> Desbloquear Creator Lab
                </span>
              )}
            </Button>
          </form>
        </GlassCard>
        
        {/* Footer Support */}
        <p className="text-center text-xs text-gray-500 mt-8">
           O acesso à estação táctica é restrito a convidados e clientes autorizados.
        </p>

      </div>
    </div>
  );
}
