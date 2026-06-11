'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScanSearch, Sparkles, CheckCircle, AlertTriangle, Activity, Target, LineChart, FileDown, AtSign, TrendingUp, AlertCircle, Heart, MessageCircle, LayoutTemplate, Globe, ExternalLink, ThumbsUp, ThumbsDown, Minus, Info } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';

export default function DiagnosisPage() {
  const [handle, setHandle] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('criador');
  
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { hasToolAccess, consumeCredit, userProfile } = useUserProfile();

  React.useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setLoading(true);
      const docRef = doc(db, 'diagnoses', id);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setResult(docSnap.data().resultado_json);
          setHandle(docSnap.data().handle);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  const handleGenerate = async () => {
    const creditResult = await consumeCredit('diagnosis');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits'
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.'
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }

    if (!handle) {
      setError('Por favor, preencha o @ do perfil para continuar.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tools/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, tipo_perfil: tipoPerfil })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar dados via API.');
      }
      
      setResult(resData.data);

      if (user && resData.data) {
        addNotification(
          user.uid,
          'Diagnóstico Concluído',
          `A auditoria do perfil @${handle.trim().replace('@', '')} foi gerada com sucesso!`,
          'success'
        );

        try {
          await addDoc(collection(db, 'diagnoses'), {
             userId: user.uid,
             handle: handle.trim().replace('@',''),
             tipoPerfil,
             resultado_json: resData.data,
             nota_final: resData.data.notaGeral || 0,
             createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Falha ao salvar no Firestore:", dbErr);
        }
      }

    } catch (err: any) {
      console.error("Erro completo da auditoria:", err);
      setError(err.message || "Não foi possível analisar este perfil no momento.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const reportElement = document.getElementById('pdf-report-content');
    if (!reportElement) return;

    setLoadingPdf(true);
    try {
      const imgData = await htmlToImage.toPng(reportElement, { 
        backgroundColor: '#0a0a0a',
        pixelRatio: 2
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`Diagnostico_${handle.replace('@', '')}.pdf`);
    } catch (err: any) {
      setError(`Falha ao gerar PDF: ${err.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-400';
    if (score >= 60) return 'text-brand-jade border-brand-jade';
    if (score >= 40) return 'text-amber-400 border-amber-400';
    return 'text-red-400 border-red-400';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 60) return 'bg-brand-jade/10';
    if (score >= 40) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-jade bg-brand-jade/10 text-sm font-medium w-fit mb-2">
          <ScanSearch className="w-4 h-4" />
          <span className="text-white">Inteligência Analítica</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Diagnóstico de Perfil</h1>
            <p className="text-gray-400">Auditoria automatizada baseada em métricas puras, constância e engajamento.</p>
          </div>
          {result && (
            <Button 
                onClick={downloadPDF} 
                className="bg-brand-jade/20 text-brand-jade hover:bg-brand-jade hover:text-white border border-brand-jade/50"
                disabled={loadingPdf}
             >
               <FileDown className="w-4 h-4 mr-2" />
               {loadingPdf ? 'Processando...' : 'Baixar PDF'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard glow className="p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-jade" />
              Nova Varredura
            </h2>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm break-words">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Seu @ no Instagram</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="lucasfraga" 
                    className="w-full glass-input !pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Perfil</label>
                <select value={tipoPerfil} onChange={e=>setTipoPerfil(e.target.value)} className="w-full glass-input text-sm">
                  <option value="criador">Criador / Influenciador</option>
                  <option value="negocio">Negócio Local / Marca</option>
                </select>
              </div>

              <div className="pt-4">
                {hasToolAccess('diagnosis') ? (
                  <Button 
                    className="w-full h-12 text-sm uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(6,95,70,0.3)] bg-gradient-to-r from-brand-jade to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(6,95,70,0.6)]"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Sparkles className="w-4 h-4 animate-spin" /> Auditando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <ScanSearch className="w-4 h-4" /> Auditar Perfil
                      </span>
                    )}
                  </Button>
                ) : (
                  <UpgradeGate locked={true} requiredPlan="Pro" mode="button" />
                )}
                {!loading && <CreditNotice toolId="diagnosis" />}
                {loading && <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">Extraindo dados do Instagram e Web (até 60s)...</p>}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-3">
          {!result ? (
            <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center opacity-50 border-white/5">
              <Target className="w-16 h-16 text-brand-jade/30 mb-4" />
              <p className="text-gray-400 font-medium text-center px-8">
                Insira o @ do perfil para rodar o algoritmo de maturidade e busca de menções.
              </p>
            </GlassCard>
          ) : (
            <div id="pdf-report-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-transparent rounded-3xl p-2 pb-6">
              
              {/* Score Header */}
              <GlassCard glow className="p-8 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-jade/5 rounded-bl-full -z-10 blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  {/* Big Number */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-lg ${getScoreColor(result.notaGeral)} ${getScoreBg(result.notaGeral)}`}>
                      <span className="text-5xl font-bold">{result.notaGeral}</span>
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest mt-4 text-gray-300">{result.classificacao}</span>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-white mb-1">@{handle.replace('@', '')}</h3>
                    <p className="text-brand-jade text-sm font-medium mb-4">Confiança da Análise: {result.confianca}%</p>
                    
                    <div className="bg-black/30 border border-white/5 p-5 rounded-2xl">
                      <p className="text-gray-300 text-sm leading-relaxed italic">
                        "{result.resumoExecutivo}"
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Principais Números */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 border-white/5 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Seguidores</p>
                  <p className="text-xl font-bold text-white">{(result.metricas.seguidores).toLocaleString('pt-BR')}</p>
                </GlassCard>
                <GlassCard className="p-4 border-white/5 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Posts Analisados</p>
                  <p className="text-xl font-bold text-white">{result.metricas.postsAnalisados}</p>
                  <p className="text-[10px] text-gray-600 mt-1">Últimos 12 meses</p>
                </GlassCard>
                <GlassCard className="p-4 border-white/5 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Eng. Robusto</p>
                  <p className="text-xl font-bold text-brand-jade">{result.metricas.engajamentoRobusto}</p>
                </GlassCard>
                <GlassCard className="p-4 border-white/5 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Posts / Semana</p>
                  <p className="text-xl font-bold text-white">{result.metricas.postsPorSemana}</p>
                </GlassCard>
              </div>
              
              {/* Identidade Criativa */}
              {result.identidade && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GlassCard className="p-4 border-white/5 flex items-start gap-3">
                    <div className="p-2 bg-brand-jade/10 rounded-lg text-brand-jade shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Nicho / Segmento</p>
                      <p className="text-sm font-semibold text-white leading-tight">{result.identidade.nicho}</p>
                    </div>
                  </GlassCard>
                  
                  <GlassCard className="p-4 border-white/5 flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tom de Voz</p>
                      <p className="text-sm font-semibold text-white leading-tight">{result.identidade.tom}</p>
                    </div>
                  </GlassCard>
                  
                  <GlassCard className="p-4 border-white/5 flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                      <LayoutTemplate className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Formato Predominante</p>
                      <p className="text-sm font-semibold text-white leading-tight">{result.identidade.formatoPrincipal}</p>
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Análise de Sentimento dos Comentários */}
              {result.analiseSentimento && (
                <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-white/10 pb-4 gap-4">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-brand-jade" /> Sentimento da Audiência
                    </h4>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-xs text-gray-400 border border-white/5">
                      <Info className="w-3.5 h-3.5" /> Amostra: {result.analiseSentimento.amostraTotal || 0} comentários processados
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><ThumbsUp className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Positivo</span><span className="font-bold text-emerald-400">{result.analiseSentimento.positivo}%</span></div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full" style={{width: `${result.analiseSentimento.positivo}%`}}></div></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 shrink-0"><Minus className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Neutro</span><span className="font-bold text-gray-400">{result.analiseSentimento.neutro}%</span></div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-gray-400 h-full" style={{width: `${result.analiseSentimento.neutro}%`}}></div></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0"><ThumbsDown className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1"><span className="text-gray-300">Negativo</span><span className="font-bold text-red-400">{result.analiseSentimento.negativo}%</span></div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden"><div className="bg-red-400 h-full" style={{width: `${result.analiseSentimento.negativo}%`}}></div></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/30 p-5 rounded-2xl border border-white/5 h-full flex items-center">
                      <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-brand-jade pl-4">
                        "{result.analiseSentimento.resumo}"
                      </p>
                    </div>
                  </div>

                  {/* Detalhamento por Post */}
                  {result.analiseSentimento.porPost && result.analiseSentimento.porPost.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quebra por Publicação Recente</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.analiseSentimento.porPost.map((postData: any, idx: number) => (
                          <div key={idx} className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col h-full">
                            <div className="flex justify-between items-start mb-2">
                              <a href={postData.url?.includes('http') ? postData.url : `https://instagram.com/p/${postData.url}`} target="_blank" rel="noreferrer" className="text-brand-jade hover:underline text-xs font-medium truncate pr-2">
                                Link do Post
                              </a>
                              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 shrink-0">{postData.amostra} coment.</span>
                            </div>
                            <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden mb-3">
                              <div className="bg-emerald-500" style={{width: `${postData.positivo}%`}}></div>
                              <div className="bg-gray-500" style={{width: `${postData.neutro}%`}}></div>
                              <div className="bg-red-500" style={{width: `${postData.negativo}%`}}></div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed mb-3">"{postData.resumo}"</p>
                            
                            {postData.comentariosAvaliados && postData.comentariosAvaliados.length > 0 && (
                              <div className="mt-auto pt-3 border-t border-white/5 space-y-2">
                                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Avaliação Individual</span>
                                <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                                  {postData.comentariosAvaliados.map((com: any, cIdx: number) => {
                                    let badgeColor = 'bg-gray-500/20 text-gray-400';
                                    if (com.sentimento === 'positivo') badgeColor = 'bg-emerald-500/20 text-emerald-400';
                                    if (com.sentimento === 'negativo') badgeColor = 'bg-red-500/20 text-red-400';
                                    return (
                                      <div key={cIdx} className="flex gap-2 items-start bg-black/40 p-2 rounded-lg border border-white/5">
                                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${badgeColor.split(' ')[0].replace('/20', '')}`}></div>
                                        <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">"{com.texto}"</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Sub-Scores Matrix */}
              <GlassCard className="p-6 border-white/5">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-brand-jade" /> Notas por Área
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Completude', score: result.notasBlocos.completude, title: 'Setup do Perfil', desc: 'Avalia a presença de recursos vitais como foto, bio otimizada, links e categoria.' },
                    { label: 'Posicionamento', score: result.notasBlocos.posicionamento, title: 'Clareza e CTAs', desc: 'Mede o grau de especialização, uso inteligente do nome e chamadas para ação.' },
                    { label: 'Constância', score: result.notasBlocos.constancia, title: 'Frequência e Ritmo', desc: 'Analisa a regularidade e o intervalo das postagens ao longo dos últimos 12 meses.' },
                    { label: 'Engajamento', score: result.notasBlocos.engajamento, title: 'Resposta vs Meta', desc: 'Compara as interações reais (curtidas e comentários) com o esperado pelo seu tamanho.' },
                    { label: 'Conteúdo', score: result.notasBlocos.conteudo, title: 'Mix de Formatos', desc: 'Verifica a variação e priorização de formatos dinâmicos de alto alcance como Reels.' },
                    { label: 'Comentários', score: result.notasBlocos.comentarios, title: 'Tom e Conversação', desc: 'Mede a qualidade das conversas geradas, além de apenas "palminhas".' },
                  ].map(b => (
                    <div key={b.label} className={`p-4 rounded-xl border ${getScoreBg(b.score)} border-white/5 relative group`}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-white" title={b.desc}>{b.label}</span>
                        <span className={`text-lg font-bold ${getScoreColor(b.score).split(' ')[0]}`}>{b.score}</span>
                      </div>
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreColor(b.score).split(' ')[0].replace('text-', 'bg-')}`} style={{ width: `${b.score}%` }}></div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-300 font-medium mb-1">{b.title}</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Recomendações */}
              {result.recomendacoes.length > 0 && (
                <GlassCard className="p-6 border-amber-500/20">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> Oportunidades de Melhoria
                  </h4>
                  <div className="space-y-3">
                    {result.recomendacoes.map((rec: any, i: number) => (
                      <div key={i} className="flex gap-3 items-start bg-black/20 p-4 rounded-lg border border-white/5">
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-200 mb-1">{rec.area}</p>
                          <p className="text-sm text-gray-400">{rec.txt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Top Posts & Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Top Post */}
                 <GlassCard className="p-6 border-brand-jade/20">
                   <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-brand-jade" /> Melhor Post (Relativo)
                   </h4>
                   {result.topPost ? (
                     <div className="space-y-3 text-sm">
                       <p className="text-gray-400">Data: <span className="text-white">{result.topPost.data}</span></p>
                       <p className="text-gray-400">Tipo: <span className="text-white">{result.topPost.tipo}</span></p>
                       <p className="text-gray-400">Engajamento: <span className="text-brand-jade font-bold">{result.topPost.engajamento}</span></p>
                       <p className="mt-2 text-xs text-gray-500 break-all"><a href={result.topPost.url.includes('http') ? result.topPost.url : `https://instagram.com/p/${result.topPost.url}`} target="_blank" rel="noreferrer" className="underline hover:text-brand-jade">Ver Publicação</a></p>
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">Dados insuficientes.</p>
                   )}
                 </GlassCard>
                 
                 {/* Insights Adicionais */}
                 <GlassCard className="p-6 border-white/5">
                   <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                     <Target className="w-4 h-4 text-blue-400" /> Padrões Analíticos
                   </h4>
                   <div className="space-y-4">
                     <div>
                       <p className="text-xs text-gray-500 uppercase mb-1">Dependência Viral (Concentração)</p>
                       <p className="text-sm text-gray-200 font-bold">{result.metricas.concentracaoViral}</p>
                       <p className="text-xs text-gray-400 mt-1">Acima de 50% indica que o perfil é carregado por 1 único post viral.</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 uppercase mb-1">Domínio de Vídeo (Reels)</p>
                       <p className="text-sm text-gray-200 font-bold">{result.metricas.pctReels} dos posts</p>
                     </div>
                   </div>
                 </GlassCard>
              </div>



            </div>
          )}
        </div>
      </div>
    </div>
  );
}
