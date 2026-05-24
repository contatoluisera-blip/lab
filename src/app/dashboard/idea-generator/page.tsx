'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  Lightbulb, 
  Send, 
  Copy, 
  CheckCircle2, 
  Target, 
  PenTool,
  Video,
  Clock,
  PlayCircle,
  FileDown
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';

export default function IdeaGeneratorPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit } = useUserProfile();
  
  // Tabs State
  const [modo, setModo] = useState<'estrategico' | 'livre'>('estrategico');
  
  // Data State
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Modo Estratégico Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState('');
  const [quantidadeIdeias1, setQuantidadeIdeias1] = useState('8');
  const [focoCriativo, setFocoCriativo] = useState('Autoridade');
  const [observacoes, setObservacoes] = useState('');

  // Modo Livre Form State
  const [nicho, setNicho] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('');
  const [objetivo, setObjetivo] = useState('Atrair');
  const [tema, setTema] = useState('');
  const [plataforma, setPlataforma] = useState('Instagram Reels');
  const [quantidadeIdeias2, setQuantidadeIdeias2] = useState('5');
  const [nivelProducao, setNivelProducao] = useState('Intermediário');
  const [tom, setTom] = useState('');
  const [local, setLocal] = useState('');
  const [materiais, setMateriais] = useState('');
  const [restricoes, setRestricoes] = useState('');
  const [cta, setCta] = useState('');

  // Load Firestore Data
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const diagRef = collection(db, 'diagnoses');
        const calcRef = collection(db, 'calculations');
        
        const [diagSnap, calcSnap] = await Promise.all([
          getDocs(query(diagRef, where('userId', '==', user.uid))),
          getDocs(query(calcRef, where('userId', '==', user.uid)))
        ]);

        const diags = diagSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a, b) => b.createdAt - a.createdAt);
        
        const calcs = calcSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a, b) => b.createdAt - a.createdAt);

        setDiagnostics(diags);
        setCalculations(calcs);
      } catch (err) {
        console.error("Erro ao buscar dados", err);
      }
    }
    fetchData();
  }, [user]);

  // Carregar do Histórico via ID
  useEffect(() => {
    const loadFromHistory = async () => {
      const params = new URLSearchParams(window.location.search);
      const historyId = params.get('id');
      
      if (historyId && user) {
        try {
          setLoading(true);
          const docRef = doc(db, 'ideas', historyId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().userId === user.uid) {
            const data = docSnap.data();
            setModo(data.modo);
            if (data.modo === 'estrategico') {
              setSelectedClient(data.clientName);
            } else {
              setNicho(data.clientName);
            }
            setResult(data.result_json);
          }
        } catch (err) {
          console.error("Erro ao carregar histórico:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadFromHistory();
  }, [user]);

  // Clients logic (extract unique clients from diagnostics)
  const uniqueClients = Array.from(new Set(diagnostics.map(d => d.handle || d.clientName))).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check access and consume credit
    const creditResult = await consumeCredit('ideas');
    if (!creditResult.ok) {
      alert(creditResult.reason === 'no_credits' 
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano.' 
        : 'Seu plano não tem acesso ao Gerador de Ideias.');
      return;
    }

    setLoading(true);
    setResult(null);

    let payload: any = { modo };

    if (modo === 'estrategico') {
      const diagData = diagnostics.find(d => d.id === selectedDiagnosis);
      const calcData = calculations.find(c => c.id === selectedCalculation);
      payload = {
        ...payload,
        diagnostico: diagData,
        orcamento: calcData,
        quantidadeIdeias: quantidadeIdeias1,
        focoCriativo,
        observacoes
      };
    } else {
      payload = {
        ...payload,
        nicho, tipoCliente, publicoAlvo, objetivo, tema, plataforma,
        quantidadeIdeias: quantidadeIdeias2, nivelProducao,
        tom, local, materiais, restricoes, cta
      };
    }

    try {
      const res = await fetch('/api/tools/idea-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        if (user) {
          addNotification(
            user.uid,
            'Ideias Criativas Geradas',
            `O roteiro com ${json.data.ideias_geradas?.length || 5} ideias foi gerado com sucesso!`,
            'success'
          );
          try {
            await addDoc(collection(db, 'ideas'), {
              userId: user.uid,
              modo,
              clientName: modo === 'estrategico' && selectedClient ? selectedClient : (nicho || 'Avulso'),
              result_json: json.data,
              createdAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.error("Falha ao salvar ideia no Firestore:", dbErr);
          }
        }
      } else {
        alert("Erro: " + json.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const reportElement = document.getElementById('pdf-report-content');
    if (!reportElement) return;

    setLoadingPdf(true);
    try {
      // Temporarily hide the copy buttons before taking screenshot
      const copyButtons = reportElement.querySelectorAll('.copy-btn');
      copyButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');

      const imgData = await htmlToImage.toPng(reportElement, { 
        backgroundColor: '#0a0a0a',
        pixelRatio: 2
      });
      
      copyButtons.forEach(btn => (btn as HTMLElement).style.display = 'flex');

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
      const fileName = modo === 'estrategico' && selectedClient ? `Ideias_${selectedClient}.pdf` : `Ideias_Criativas.pdf`;
      pdf.save(fileName);
    } catch (err: any) {
      alert(`Falha ao gerar PDF: ${err.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const copyIdeaToClipboard = (idea: any, index: number) => {
    const text = `
Ideia: ${idea.titulo}
Objetivo: ${idea.objetivo_estrategico}
Gancho: "${idea.gancho}"
Conceito: ${idea.conceito}

ROTEIRO:
${idea.roteiro_base}

TAKES E GRAVAÇÃO:
${idea.lista_takes.map((t: string) => '- ' + t).join('\n')}
Direção de Câmera: ${idea.direcao_captacao}

EDIÇÃO E CTA:
Direção de Edição: ${idea.direcao_edicao}
CTA: ${idea.cta}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-neon bg-brand-neon/10 text-sm font-medium w-fit mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-white">Motor Criativo</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gerador de Ideias</h1>
          <p className="text-gray-400 font-light tracking-wide">Receba roteiros estruturados baseados na dor do seu cliente e no escopo vendido.</p>
        </div>
        
        {result && (
          <Button 
              onClick={downloadPDF} 
              className="bg-brand-neon/20 text-brand-neon hover:bg-brand-neon hover:text-black border border-brand-neon/50 h-11"
              disabled={loadingPdf}
          >
             <FileDown className="w-4 h-4 mr-2" />
             {loadingPdf ? 'Processando...' : 'Baixar PDF'}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        
        {/* Formulário / Setup */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <GlassCard className="p-2 border-white/5 flex gap-3">
            <button 
              onClick={() => setModo('estrategico')}
              className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${modo === 'estrategico' ? 'bg-brand-neon text-black shadow-[0_0_20px_rgba(189,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Modo Estratégico
            </button>
            <button 
              onClick={() => setModo('livre')}
              className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${modo === 'livre' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Modo Livre
            </button>
          </GlassCard>

          <GlassCard className="p-6 border-white/10">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {modo === 'estrategico' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="p-4 rounded-xl bg-brand-neon/5 border border-brand-neon/10 text-brand-neon text-sm leading-relaxed">
                    Use o diagnóstico e o orçamento aprovado para gerar ideias que não extrapolam a capacidade de produção.
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cliente / Projeto</label>
                    <select 
                      required
                      value={selectedClient} 
                      onChange={(e) => setSelectedClient(e.target.value)} 
                      className="w-full glass-input h-12 [&>option]:bg-black"
                    >
                      <option value="">Selecione um cliente...</option>
                      {uniqueClients.map((c, i) => <option key={i} value={c as string}>{c}</option>)}
                      <option value="avulso">-- Cliente Avulso --</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Diagnóstico (Problema)</label>
                    <select 
                      value={selectedDiagnosis} 
                      onChange={(e) => setSelectedDiagnosis(e.target.value)} 
                      className="w-full glass-input h-12 [&>option]:bg-black"
                    >
                      <option value="">-- Não vincular --</option>
                      {diagnostics.map((d) => (
                        <option key={d.id} value={d.id}>
                          @{d.handle || d.clientName} - Nota: {d.finalScore} ({new Date(d.createdAt).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Orçamento (Escopo)</label>
                    <select 
                      value={selectedCalculation} 
                      onChange={(e) => setSelectedCalculation(e.target.value)} 
                      className="w-full glass-input h-12 [&>option]:bg-black"
                    >
                      <option value="">-- Não vincular --</option>
                      {calculations.map((c) => (
                        <option key={c.id} value={c.id}>
                          Pacote: {c.video_quantity} vídeos - {c.precoRecomendado} ({new Date(c.createdAt).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Qtd Ideias</label>
                      <input 
                        type="number" 
                        value={quantidadeIdeias1} 
                        onChange={e => setQuantidadeIdeias1(e.target.value)} 
                        className="w-full glass-input h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Foco Criativo</label>
                      <select value={focoCriativo} onChange={e => setFocoCriativo(e.target.value)} className="w-full glass-input h-12 [&>option]:bg-black">
                        <option value="Autoridade">Autoridade</option>
                        <option value="Vender">Vender</option>
                        <option value="Atrair">Atrair novos</option>
                        <option value="Quebrar Objeções">Quebrar Objeções</option>
                        <option value="Bastidores">Bastidores</option>
                        <option value="Misturar Objetivos">Misturado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Observações / Restrições (Opcional)</label>
                    <textarea 
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      placeholder="Ex: Não mostrar rosto, gravar em 1 diária..."
                      className="w-full glass-input min-h-[80px] p-3 text-sm"
                    />
                  </div>
                </div>
              )}

              {modo === 'livre' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed">
                    Preencha o briefing detalhado para gerar ideias do zero sem depender de dados já salvos no sistema.
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nicho / Segmento *</label>
                    <input required value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex: Clínica Odontológica" className="w-full glass-input h-12" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Público-Alvo *</label>
                      <input required value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} placeholder="Ex: Mães jovens" className="w-full glass-input h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Objetivo *</label>
                      <select value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full glass-input h-12 [&>option]:bg-black">
                        <option value="Atrair">Atrair</option>
                        <option value="Vender">Vender</option>
                        <option value="Educar">Educar</option>
                        <option value="Conexão">Conexão</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tema Específico *</label>
                    <input required value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: Importância do clareamento antes do casamento" className="w-full glass-input h-12" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Produção</label>
                      <select value={nivelProducao} onChange={e => setNivelProducao(e.target.value)} className="w-full glass-input h-12 [&>option]:bg-black">
                        <option value="Simples">Simples (Celular)</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado (Cinema)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Qtd Ideias</label>
                      <input type="number" value={quantidadeIdeias2} onChange={e => setQuantidadeIdeias2(e.target.value)} className="w-full glass-input h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Restrições (Opcional)</label>
                    <input value={restricoes} onChange={e => setRestricoes(e.target.value)} placeholder="Ex: Sem usar áudio em off" className="w-full glass-input h-12" />
                  </div>
                </div>
              )}

              {hasToolAccess('ideas') ? (
                <>
                  <Button type="submit" className={`w-full h-14 font-bold uppercase tracking-widest text-xs mt-6 ${modo === 'estrategico' ? 'bg-brand-neon text-black hover:bg-brand-neon/90' : ''}`} disabled={loading}>
                    {!loading ? <Target className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {modo === 'estrategico' ? 'Gerar Ideias Alinhadas' : 'Gerar Ideias Avulsas'}
                  </Button>
                  {!loading && <CreditNotice toolId="ideas" />}
                </>
              ) : (
                <div className="mt-6">
                  <UpgradeGate locked={true} requiredPlan="Pro" mode="button" />
                </div>
              )}
            </form>
          </GlassCard>
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="h-full min-h-[500px] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 text-gray-500 bg-white/[0.01]">
              <PenTool className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm uppercase tracking-widest font-bold">Aguardando Parâmetros</p>
              <p className="text-xs mt-2 max-w-sm">Configure o motor criativo ao lado para receber um plano de conteúdo completo e estruturado.</p>
            </div>
          )}

          {loading && (
             <div className="h-full min-h-[500px] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
                <div className="w-12 h-12 border-4 border-brand-neon/20 border-t-brand-neon rounded-full animate-spin mb-4" />
                <p className="text-brand-neon font-bold animate-pulse tracking-widest uppercase text-xs">Processando Plano Criativo...</p>
             </div>
          )}

          {result && !loading && (
            <div id="pdf-report-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-transparent p-2">
              
              {/* Resumo e Direção */}
              <GlassCard className="p-8 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
                <h2 className="text-2xl font-extrabold text-white mb-6">Plano Criativo Estratégico</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-brand-neon uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Visão Geral
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.resumo_estrategico}</p>
                  </div>
                  <div className="h-px w-full bg-white/5" />
                  <div>
                    <h3 className="text-xs font-bold text-brand-neon uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4" /> Direção Criativa
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.direcao_criativa}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Organização da Diária */}
              {result.organizacao_diaria && (
                <GlassCard className="p-6 border-brand-emerald/20 bg-brand-emerald/5">
                  <h3 className="text-xs font-bold text-brand-emerald uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Organização da Gravação (Diária)
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.organizacao_diaria}</p>
                </GlassCard>
              )}

              {/* Lista de Ideias */}
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Ideias de Conteúdo</h3>
                
                {result.ideias_geradas?.map((idea: any, idx: number) => (
                  <GlassCard key={idx} className="p-6 md:p-8 border-white/10 relative group hover:border-white/20 transition-colors">
                    <div className="absolute top-6 right-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyIdeaToClipboard(idea, idx)} 
                        className={`copy-btn ${copiedIndex === idx ? 'text-brand-neon' : 'text-gray-500 hover:text-white'}`}
                      >
                        {copiedIndex === idx ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="pr-12">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="px-2 py-1 rounded bg-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-300">
                          Ideia {idx + 1}
                        </span>
                        <span className="px-2 py-1 rounded bg-brand-emerald/10 text-[10px] uppercase tracking-widest font-bold text-brand-emerald">
                          {idea.objetivo_estrategico}
                        </span>
                        <span className="px-2 py-1 rounded bg-orange-500/10 text-[10px] uppercase tracking-widest font-bold text-orange-400">
                          {idea.dificuldade_execucao}
                        </span>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2">{idea.titulo}</h4>
                      
                      {/* Gancho Destaque */}
                      <div className="my-6 p-4 rounded-xl border border-brand-neon/20 bg-brand-neon/5 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-brand-neon" />
                         <p className="text-sm font-medium text-brand-neon mb-1">Gancho sugerido:</p>
                         <p className="text-lg font-semibold text-white">"{idea.gancho}"</p>
                      </div>

                      {/* Roteiro e Execução Grid */}
                      <div className="grid md:grid-cols-2 gap-8 mt-6">
                        <div className="space-y-6">
                          <div>
                             <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <PlayCircle className="w-4 h-4" /> Conceito
                             </h5>
                             <p className="text-sm text-gray-300">{idea.conceito}</p>
                          </div>
                          <div>
                             <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <PenTool className="w-4 h-4" /> Roteiro Base
                             </h5>
                             <p className="text-sm text-gray-300 whitespace-pre-wrap">{idea.roteiro_base}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                             <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Lista de Takes</h5>
                             <ul className="text-sm text-gray-300 space-y-1 list-disc pl-4 marker:text-white/20">
                               {idea.lista_takes?.map((take: string, tIdx: number) => (
                                 <li key={tIdx}>{take}</li>
                               ))}
                             </ul>
                          </div>
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                             <div>
                               <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Captação</span>
                               <span className="text-xs text-gray-300">{idea.direcao_captacao}</span>
                             </div>
                             <div>
                               <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Edição</span>
                               <span className="text-xs text-gray-300">{idea.direcao_edicao}</span>
                             </div>
                             <div>
                               <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Atenção (Retenção)</span>
                               <span className="text-xs text-brand-neon/80">{idea.observacao_retencao}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Footer */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                         <div className="flex-1">
                           <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Call to Action</span>
                           <span className="text-sm font-medium text-white">{idea.cta}</span>
                         </div>
                         <div className="text-right ml-4">
                           <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Tempo Est.</span>
                           <span className="text-xs font-medium text-gray-400">{idea.tempo_estimado_gravacao}</span>
                         </div>
                      </div>

                    </div>
                  </GlassCard>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
