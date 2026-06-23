'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ScanSearch, Calculator, FolderArchive, Calendar, Target, Sparkles, TrendingUp, DollarSign, Lightbulb, FileText, CheckCircle2, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function ActionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'calculations' | 'ideas' | 'proposals' | 'estudia'>('diagnostics');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [estudiaGens, setEstudiaGens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredDiagnoses = diagnoses.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.handle?.toLowerCase().includes(query) ||
      d.tipoPerfil?.toLowerCase().includes(query) ||
      d.resultado_json?.classificacao?.toLowerCase().includes(query)
    );
  });

  const filteredCalculations = calculations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.offer_mode?.toLowerCase().includes(query) ||
      c.precoRecomendado?.toLowerCase().includes(query) ||
      String(c.video_quantity).includes(query)
    );
  });

  const filteredIdeas = ideas.filter(i => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      i.clientName?.toLowerCase().includes(query) ||
      i.modo?.toLowerCase().includes(query) ||
      i.result_json?.ideias_geradas?.some((g: any) => 
        g.titulo?.toLowerCase().includes(query) || 
        g.descricao?.toLowerCase().includes(query)
      )
    );
  });

  const filteredProposals = proposals.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.clientName?.toLowerCase().includes(query) ||
      p.result_json?.apresentacao?.objetivo_estrategico?.toLowerCase().includes(query)
    );
  });

  const filteredEstudia = estudiaGens.filter(e => {
    if (!searchQuery) return true;
    return e.status?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const diagQ = query(collection(db, 'diagnoses'), where('userId', '==', user.uid));
        const calcQ = query(collection(db, 'calculations'), where('userId', '==', user.uid));
        const ideaQ = query(collection(db, 'ideas'), where('userId', '==', user.uid));
        const propQ = query(collection(db, 'proposals'), where('userId', '==', user.uid));
        const estudiaQ = query(collection(db, 'estudia'), where('userId', '==', user.uid));
        
        const [diagSnap, calcSnap, ideaSnap, propSnap, estudiaSnap] = await Promise.all([
          getDocs(diagQ), getDocs(calcQ), getDocs(ideaQ), getDocs(propQ), getDocs(estudiaQ)
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
        const loadedEstudia = estudiaSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        
        setDiagnoses(loadedDiag);
        setCalculations(loadedCalc);
        setIdeas(loadedIdeas);
        setProposals(loadedProps);
        setEstudiaGens(loadedEstudia);
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

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => { setActiveTab('diagnostics'); setSearchQuery(''); }}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'diagnostics' ? 'bg-brand-jade text-white shadow-[0_0_15px_rgba(6,95,70,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
          >
            <ScanSearch className="w-4 h-4" /> Diagnósticos
          </button>
          <button 
            onClick={() => { setActiveTab('calculations'); setSearchQuery(''); }}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'calculations' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
          >
            <Calculator className="w-4 h-4" /> Orçamentos
          </button>
          <button 
            onClick={() => { setActiveTab('ideas'); setSearchQuery(''); }}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'ideas' ? 'bg-brand-neon text-black shadow-[0_0_15px_rgba(189,255,0,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
          >
            <Lightbulb className="w-4 h-4" /> Ideias
          </button>
          <button 
            onClick={() => { setActiveTab('proposals'); setSearchQuery(''); }}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'proposals' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
          >
            <FileText className="w-4 h-4" /> Propostas
          </button>
          <button 
            onClick={() => { setActiveTab('estudia'); setSearchQuery(''); }}
            className={`flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'estudia' ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-black/20 text-gray-400 hover:bg-white/5 border border-white/5'}`}
          >
            <Sparkles className="w-4 h-4" /> Fotos de Estúdio
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas minhas ações..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald/50 text-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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
              ) : filteredDiagnoses.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Search className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhum diagnóstico encontrado.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Tente buscar por outro termo.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDiagnoses.map((diag) => (
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
              ) : filteredCalculations.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Search className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhum orçamento encontrado.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Tente buscar por outro termo.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCalculations.map((calc) => (
                    <Link key={calc.id} href={`/dashboard/calculator?id=${calc.id}`} className="block">
                    <GlassCard className="p-6 border border-white/5 hover:border-emerald-400/30 transition-all duration-300 group relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-bl-full -z-10 blur-xl group-hover:bg-emerald-400/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <TrendingUp className="w-5 h-5" />
                          <span className="font-bold tracking-tight capitalize">{calc.clientName || calc.offer_mode?.replace('_', ' ') || calc.service_type?.replace('_', ' ')}</span>
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
              ) : filteredIdeas.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Search className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma ideia encontrada.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Tente buscar por outro termo.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIdeas.map((idea) => (
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
              ) : filteredProposals.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Search className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma proposta encontrada.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Tente buscar por outro termo.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProposals.map((prop) => (
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

          {/* Aba de Estúd.IA */}
          {activeTab === 'estudia' && (
            <div>
              {estudiaGens.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Sparkles className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma foto de estúdio gerada ainda.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Vá em Foto de Estúdio para criar seu retrato profissional.</p>
                </GlassCard>
              ) : filteredEstudia.length === 0 ? (
                <GlassCard className="p-12 flex flex-col items-center justify-center border-white/5 opacity-70">
                  <Search className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium text-center">Nenhuma foto encontrada.</p>
                  <p className="text-gray-500 text-sm font-light mt-2">Tente buscar por outro termo.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEstudia.map((gen) => (
                    <GlassCard key={gen.id} className="p-6 border border-white/5 hover:border-teal-500/30 transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full -z-10 blur-xl group-hover:bg-teal-500/10 transition-all"></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-teal-400">
                          <Sparkles className="w-5 h-5" />
                          <span className="font-bold tracking-tight">Estúd.IA</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          gen.status === 'completed' ? 'bg-teal-500/20 text-teal-400' :
                          gen.status === 'processing' ? 'bg-blue-400/20 text-blue-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {gen.status === 'completed' ? 'Concluído' : gen.status === 'processing' ? 'Processando' : 'Erro'}
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center mb-6">
                        {gen.status === 'completed' && gen.resultUrl ? (
                          <img src={gen.resultUrl} alt="Retrato" className="w-full h-48 object-cover rounded-xl" />
                        ) : gen.status === 'processing' ? (
                          <div className="w-full h-48 bg-black/40 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-teal-400 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-black/40 rounded-xl flex items-center justify-center">
                            <X className="w-8 h-8 text-red-400" />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-light">
                          <Calendar className="w-3 h-3" />
                          {new Date(gen.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        {gen.status === 'completed' && gen.resultUrl && (
                          <a href={gen.resultUrl} target="_blank" rel="noreferrer" className="text-teal-400 text-xs font-medium hover:underline">Abrir</a>
                        )}
                      </div>
                    </GlassCard>
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
