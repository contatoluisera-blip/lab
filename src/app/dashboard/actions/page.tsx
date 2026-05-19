'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ScanSearch, Calculator, FolderArchive, Calendar, Target, Sparkles, TrendingUp, DollarSign, Lightbulb, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ActionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'calculations' | 'ideas' | 'proposals'>('diagnostics');
  
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const diagQ = query(collection(db, 'diagnoses'), where('userId', '==', user.uid));
        const calcQ = query(collection(db, 'calculations'), where('userId', '==', user.uid));
        const ideaQ = query(collection(db, 'ideas'), where('userId', '==', user.uid));
        const propQ = query(collection(db, 'proposals'), where('userId', '==', user.uid));
        
        const [diagSnap, calcSnap, ideaSnap, propSnap] = await Promise.all([
          getDocs(diagQ), getDocs(calcQ), getDocs(ideaQ), getDocs(propQ)
        ]);
        
        const loadedDiag = diagSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        const loadedCalc = calcSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        const loadedIdeas = ideaSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        const loadedProps = propSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        
        setDiagnoses(loadedDiag);
        setCalculations(loadedCalc);
        setIdeas(loadedIdeas);
        setProposals(loadedProps);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-blue-400 bg-blue-500/10 text-sm font-medium w-fit mb-2">
          <FolderArchive className="w-4 h-4" />
          <span className="text-white">Central de Memória</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Minhas Ações</h1>
        <p className="text-gray-400 font-light tracking-wide">
          Acesse o histórico completo de perfis auditados e orçamentos dimensionados.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button 
          onClick={() => setActiveTab('diagnostics')}
          className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'diagnostics' ? 'bg-brand-jade text-white shadow-[0_0_15px_rgba(6,95,70,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
        >
          <ScanSearch className="w-4 h-4" /> Diagnósticos
        </button>
        <button 
          onClick={() => setActiveTab('calculations')}
          className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'calculations' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
        >
          <Calculator className="w-4 h-4" /> Orçamentos
        </button>
        <button 
          onClick={() => setActiveTab('ideas')}
          className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'ideas' ? 'bg-brand-neon text-black shadow-[0_0_15px_rgba(189,255,0,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
        >
          <Lightbulb className="w-4 h-4" /> Ideias
        </button>
        <button 
          onClick={() => setActiveTab('proposals')}
          className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'proposals' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
        >
          <FileText className="w-4 h-4" /> Propostas
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 opacity-50">
          <Sparkles className="w-8 h-8 text-brand-jade animate-spin mb-4" />
          <p className="text-gray-400 font-light">Buscando registros...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Aba de Diagnósticos */}
          {activeTab === 'diagnostics' && (
            <div>
              {diagnoses.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <ScanSearch className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhum diagnóstico salvo ainda.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Vá em Diagnóstico de Perfil para auditar seu primeiro cliente.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {diagnoses.map((diag) => (
                    <Link key={diag.id} href={`/dashboard/diagnosis?id=${diag.id}`} className="block">
                    <GlassCard className="p-6 border border-white/5 hover:border-brand-jade/30 transition-all duration-300 group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-jade/5 rounded-bl-full -z-10 blur-xl group-hover:bg-brand-jade/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-brand-jade">
                          <Target className="w-5 h-5" />
                          <span className="font-bold tracking-tight">@{diag.handle}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${diag.nota_final >= 80 ? 'bg-brand-jade/20 text-brand-jade' : diag.nota_final >= 60 ? 'bg-blue-400/20 text-blue-400' : 'bg-amber-400/20 text-amber-400'}`}>
                          Nota: {diag.nota_final}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <p className="text-sm text-gray-400 flex justify-between">
                          <span>Perfil:</span> <span className="text-white capitalize">{diag.tipoPerfil}</span>
                        </p>
                        <p className="text-sm text-gray-400 flex justify-between">
                          <span>Status:</span> <span className="text-white">{diag.resultado_json?.classificacao || '-'}</span>
                        </p>
                        <p className="text-sm text-gray-400 flex justify-between">
                          <span>Engajamento:</span> <span className="text-white">{diag.resultado_json?.metricas?.engajamentoRobusto || '-'}</span>
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-light">
                          <Calendar className="w-3 h-3" />
                          {new Date(diag.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba de Orçamentos */}
          {activeTab === 'calculations' && (
            <div>
              {calculations.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Calculator className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhum orçamento salvo ainda.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Vá em Calculadora de Orçamento para dimensionar seu primeiro projeto.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculations.map((calc) => (
                    <Link key={calc.id} href={`/dashboard/calculator?id=${calc.id}`} className="block">
                    <GlassCard className="p-6 border border-white/5 hover:border-emerald-400/30 transition-all duration-300 group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-bl-full -z-10 blur-xl group-hover:bg-emerald-400/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-bold tracking-tight capitalize">{calc.offer_mode?.replace('_', ' ')}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-400">
                          {calc.video_quantity} vídeos
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Valor Final Estimado</p>
                          <p className="text-2xl font-bold text-white flex items-center gap-1">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            {calc.precoRecomendado?.replace('R$ ', '')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-light">
                          <Calendar className="w-3 h-3" />
                          {new Date(calc.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba de Ideias */}
          {activeTab === 'ideas' && (
            <div>
              {ideas.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Lightbulb className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma ideia salva ainda.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Vá em Gerador de Ideias para criar um roteiro.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ideas.map((idea) => (
                    <Link key={idea.id} href={`/dashboard/idea-generator?id=${idea.id}`} className="block">
                    <GlassCard className="p-6 border border-white/5 hover:border-brand-neon/30 transition-all duration-300 group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/5 rounded-bl-full -z-10 blur-xl group-hover:bg-brand-neon/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-brand-neon">
                          <Target className="w-5 h-5" />
                          <span className="font-bold tracking-tight capitalize">{idea.clientName || idea.modo}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-brand-neon/10 text-brand-neon">
                          {idea.result_json?.ideias_geradas?.length || 0} Ideias
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <p className="text-sm text-gray-400 flex justify-between">
                          <span>Modo:</span> <span className="text-white capitalize">{idea.modo}</span>
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-light">
                          <Calendar className="w-3 h-3" />
                          {new Date(idea.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba de Propostas */}
          {activeTab === 'proposals' && (
            <div>
              {proposals.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <FileText className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma proposta salva ainda.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Vá em Gerador de Propostas para montar a sua.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proposals.map((prop) => (
                    <Link key={prop.id} href={`/dashboard/proposal?id=${prop.id}`} className="block">
                    <GlassCard className="p-6 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Target className="w-5 h-5" />
                          <span className="font-bold tracking-tight capitalize">@{prop.clientName}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400">
                          {prop.result_json?.apresentacao?.objetivo_estrategico || 'Proposta'}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                         <p className="text-sm text-gray-400 flex justify-between">
                          <span>Risco:</span> <span className="text-white capitalize">{prop.result_json?.argumentacao?.senso_de_risco_se_nao_fechar ? 'Alto' : 'Baixo'}</span>
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-light">
                          <Calendar className="w-3 h-3" />
                          {new Date(prop.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
