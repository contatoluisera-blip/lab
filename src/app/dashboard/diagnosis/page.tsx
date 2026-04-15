'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScanSearch, Sparkles, CheckCircle, AlertTriangle, Activity, Target, ShieldAlert, LineChart, BadgeDollarSign, ShieldCheck, Landmark, FileDown } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function DiagnosisPage() {
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('crescimento');
  
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleGenerate = async () => {
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
        body: JSON.stringify({ handle, niche, goal })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar dados via Inteligência.');
      }
      
      setResult(resData.data);

      // Injeção Automática no Banco de Dados Firestore
      if (user && resData.data) {
        try {
          await addDoc(collection(db, 'diagnoses'), {
             userId: user.uid,
             handle: handle.trim().replace('@',''),
             niche,
             goal,
             resultado_json: resData.data,
             nota_final: resData.data.nota_final_publicitaria_0_100 || 0,
             createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Falha ao salvar no banco de dados Firestore:", dbErr);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const reportElement = document.getElementById('pdf-report-content');
    if (!reportElement) return;

    setLoadingPdf(true);
    try {
      // Configuracao do html-to-image (muito superior para CSS modernos e filtros que o html2canvas falha)
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
      pdf.save(`Avaliacao_B2B_${handle.replace('@', '')}.pdf`);
    } catch (err: any) {
      console.error("Erro na criacao do PDF:", err);
      setError(`Falha ao gerar PDF: ${err.message || 'Erro de renderização'}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-teal-400 text-sm font-medium w-fit mb-2">
          <ScanSearch className="w-4 h-4" />
          <span>Inteligência Comercial B2B</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Avaliação Publicitária do Perfil</h1>
            <p className="text-gray-400">Leitura tática para identificar maturidade B2B de potenciais agênciados.</p>
          </div>
          {result && (
            <Button 
                onClick={downloadPDF} 
                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/50"
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
              <Activity className="w-5 h-5 text-teal-400" />
              Executar Busca
            </h2>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm break-words">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Seu @ no Instagram</label>
                <input 
                  type="text" 
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="ex: lucasfraga" 
                  className="w-full glass-input"
                />
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full h-12 text-sm uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(45,212,191,0.3)] bg-gradient-to-r from-teal-500/20 to-teal-400/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500 hover:text-black hover:shadow-[0_0_20px_rgba(45,212,191,0.6)]"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Sparkles className="w-4 h-4 animate-spin" /> Auditando Perfil...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <ScanSearch className="w-4 h-4" /> Realizar Auditoria
                    </span>
                  )}
                </Button>
                {loading && <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">Isso pode levar de 20 a 50 segundos dependendo da fila de raspagem...</p>}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Output Panel MASSIVE V2 SCHEMA */}
        <div className="lg:col-span-3">
          {!result ? (
            <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center opacity-50">
              <ScanSearch className="w-16 h-16 text-teal-400/30 mb-4" />
              <p className="text-gray-400 font-medium text-center px-8">
                Aguardando execução...
              </p>
            </GlassCard>
          ) : (
            
            <div id="pdf-report-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-transparent rounded-3xl p-2 pb-6">
              
              {/* Top Banner Analytics */}
              <GlassCard glow className="p-6 border-teal-500/30">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex-shrink-0 relative">
                    <div className="w-28 h-28 rounded-full neo-glass flex items-center justify-center border-4 border-teal-500 shadow-[0_0_40px_rgba(45,212,191,0.4)]">
                      <span className="text-4xl font-bold text-white">{result.nota_final_publicitaria_0_100}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-2xl font-bold text-teal-400">@{result.perfil.username} <span className="text-gray-500 text-lg font-normal">({result.perfil.nome})</span></h3>
                       {result.perfil.verificado && <CheckCircle className="w-5 h-5 text-blue-400" />}
                    </div>
                    <p className="text-gray-300 font-mono text-sm mb-4 leading-relaxed bg-black/30 p-4 border border-white/5 rounded-xl">
                      {result.resumo_executivo_final}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-gray-300">{result.perfil.seguidores} Seguidores</span>
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-gray-300">{result.perfil.quantidade_posts} Posts Analisados</span>
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">{result.perfil.nicho_provavel}</span>
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">{result.perfil.tipo_de_perfil}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Diagnosis Grid Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Atratividade Comercial & Brand Safety */}
                <GlassCard className="p-6 border-white/5 flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BadgeDollarSign className="w-24 h-24 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white flex items-center gap-2 relative z-10"><Target className="w-4 h-4 text-teal-400" /> Atratividade & Brand Safety</h4>
                  <div className="bg-[#121212] p-4 rounded-xl text-sm border border-white/5 relative z-10">
                    <span className="text-teal-500 block mb-1">Nota Atratividade: {result.notas.atratividade_para_publicidade}/10</span>
                    <p className="text-gray-300 mb-3">{result.atratividade_publicitaria.nivel_geral}</p>
                    <p className="text-gray-400 italic text-xs">{result.atratividade_publicitaria.analise}</p>
                  </div>
                  <div className="bg-[#121212] p-4 rounded-xl text-sm border border-white/5 relative z-10">
                    <span className="text-emerald-500 block mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Segurança de Marca: {result.notas.seguranca_de_marca}/10</span>
                    <p className="text-gray-300 text-xs">{result.ambiente_de_conteudo_para_marcas.brand_safety_aparente}</p>
                  </div>
                  
                  {/* Sensibilidade Politica Módulo */}
                  {result.sensibilidade_politica.classificacao !== "no visible political connotation" && result.sensibilidade_politica.classificacao !== "sem conotação política observável" && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm relative z-10 mt-2">
                       <span className="text-amber-400 block mb-1 flex items-center gap-2 font-bold"><Landmark className="w-4 h-4" /> Aviso de Conotação ({result.sensibilidade_politica.nota_0_10}/10)</span>
                       <p className="text-amber-200/80 text-xs italic">{result.sensibilidade_politica.impacto_para_marcas}</p>
                    </div>
                  )}
                </GlassCard>

                {/* Engajamento & Maturidade */}
                <GlassCard className="p-6 border-white/5 flex flex-col gap-4">
                  <h4 className="font-bold text-white flex items-center gap-2"><LineChart className="w-4 h-4 text-teal-400" /> Maturidade Estrutural</h4>
                  <div className="bg-[#121212] p-4 rounded-xl text-sm border border-white/5">
                    <span className="text-teal-500 block mb-1">Métricas Gerais ({result.notas.maturidade_comercial_do_perfil}/10)</span>
                    <p className="text-gray-300 mb-3">{result.metricas_gerais.maturidade_aparente} — {result.metricas_gerais.volume_estrutural}</p>
                    <p className="text-gray-400 italic text-xs">{result.metricas_gerais.leitura_estrategica}</p>
                  </div>
                  
                  {/* Consistência */}
                  <div className="bg-[#121212] p-4 rounded-xl text-sm border border-white/5">
                    <span className="text-gray-400 block mb-1 font-bold flex gap-2 justify-between">
                      Volume e Fidelidade 
                      <span className="text-teal-500 font-normal">{result.notas.consistencia_de_postagem}/10</span>
                    </span>
                    <p className="text-emerald-400/80 mb-2">{result.frequencia_e_consistencia.confiabilidade_para_campanhas}</p>
                    <p className="text-gray-300 text-xs">{result.frequencia_e_consistencia.analise}</p>
                  </div>
                </GlassCard>
                
              </div>

              {/* Táticas de Batalha (Fortalezas e Gargalos Comerciais) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Fortalezas Comerciais */}
                 <GlassCard className="p-6 border-emerald-500/20">
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <CheckCircle className="w-5 h-5 text-emerald-400" /> Argumentos de Venda
                   </h4>
                   <ul className="space-y-3">
                     {result.pontos_fortes_comerciais.map((p:string, i:number) => (
                       <li key={i} className="flex gap-2 text-sm text-gray-300"><span className="text-emerald-400">-</span> {p}</li>
                     ))}
                   </ul>
                 </GlassCard>
                 
                 {/* Fragilidades Comerciais */}
                 <GlassCard className="p-6 border-amber-500/20">
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-amber-400" /> Gargalos de Fechamento B2B
                   </h4>
                   <ul className="space-y-3">
                     {result.gargalos_para_fechamento_de_publicidades.map((f:string, i:number) => (
                       <li key={i} className="flex gap-2 text-sm text-gray-300"><span className="text-amber-400">-</span> {f}</li>
                     ))}
                   </ul>
                 </GlassCard>
              </div>

              {/* Roadmap Comercial */}
              <GlassCard glow className="p-6 border-white/10">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-teal-400" /> Plano de Ação (Atratividade de Marca)
                </h4>
                <div className="space-y-4">
                  {result.recomendacoes_priorizadas.map((rec: any, i: number) => (
                    <div key={i} className="bg-[#0f0f0f]/80 p-5 rounded-2xl border border-white/5 border-l-4 border-l-teal-500">
                      <div className="flex gap-3 items-center mb-2">
                        <span className="w-6 h-6 rounded-md bg-teal-500 text-black font-bold flex flex-col justify-center items-center text-xs">{rec.prioridade}</span>
                        <h5 className="font-bold text-white">{rec.acao}</h5>
                      </div>
                      <p className="text-sm text-gray-400 pl-9 mb-2"><strong>Motivo:</strong> {rec.motivo}</p>
                      <p className="text-sm text-emerald-400/80 pl-9 border-t border-white/5 pt-2 mt-2"><strong>Impacto Publicitário Acumulado:</strong> {rec.impacto_esperado}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
