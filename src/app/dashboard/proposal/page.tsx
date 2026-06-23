'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FileText, Sparkles, Send, ScanSearch, Calculator, FileDown, Target, Building2, CheckCircle2, ChevronRight, LayoutList } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';
import { Settings2, Palette, Type } from 'lucide-react';

const COLORS = [
  { id: 'brand-mint', label: 'Verde Mint', value: '#34d399', textClass: 'text-emerald-400', borderClass: 'border-emerald-400/50', bgClass: 'bg-emerald-400', gradient: 'from-[#064e3b] via-[#022c22] to-[#0a0a0a]', isLight: false },
  { id: 'purple', label: 'Roxo Metálico', value: '#a855f7', textClass: 'text-purple-400', borderClass: 'border-purple-400/50', bgClass: 'bg-purple-400', gradient: 'from-[#3b0764] via-[#2e1065] to-[#0a0a0a]', isLight: false },
  { id: 'blue', label: 'Azul Oceano', value: '#3b82f6', textClass: 'text-blue-400', borderClass: 'border-blue-400/50', bgClass: 'bg-blue-400', gradient: 'from-[#172554] via-[#1e3a8a] to-[#0a0a0a]', isLight: false },
  { id: 'gold', label: 'Ouro Queimado', value: '#eab308', textClass: 'text-yellow-400', borderClass: 'border-yellow-400/50', bgClass: 'bg-yellow-400', gradient: 'from-[#451a03] via-[#291506] to-[#0a0a0a]', isLight: false },
  { id: 'rose', label: 'Vermelho Carmim', value: '#f43f5e', textClass: 'text-rose-400', borderClass: 'border-rose-400/50', bgClass: 'bg-rose-400', gradient: 'from-[#881337] via-[#4c0519] to-[#0a0a0a]', isLight: false },
  { id: 'black', label: 'Preto Puro', value: '#222222', textClass: 'text-gray-300', borderClass: 'border-white/20', bgClass: 'bg-black', gradient: 'from-[#1a1a1a] via-[#0a0a0a] to-[#000000]', isLight: false },
  { id: 'white', label: 'Branco Minimalista', value: '#e5e7eb', textClass: 'text-black', borderClass: 'border-black/20', bgClass: 'bg-white', gradient: 'from-[#f9fafb] via-[#f3f4f6] to-[#e5e7eb]', isLight: true },
];

const FONTS = [
  { id: 'sans', label: 'Moderno (Sans)', class: 'font-sans' },
  { id: 'serif', label: 'Elegante (Serif)', class: 'font-serif' },
  { id: 'mono', label: 'Tech (Mono)', class: 'font-mono' },
];

export default function ProposalPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit } = useUserProfile();
  
  const [cliente, setCliente] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [modoGeracao, setModoGeracao] = useState('Profissional');
  
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [docColor, setDocColor] = useState(COLORS[0]);
  const [docFont, setDocFont] = useState(FONTS[0]);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  const isLight = docColor.isLight;
  const txtPrimary = isLight ? 'text-black' : 'text-white';
  const txtSecondary = isLight ? 'text-gray-700' : 'text-gray-300';
  const txtMuted = isLight ? 'text-gray-500' : 'text-gray-400';
  const borderMuted = isLight ? 'border-black/10' : 'border-white/10';
  const bgCard = isLight ? 'bg-black/[0.03]' : 'bg-white/[0.03]';
  const bgInvest = isLight ? 'bg-white/80' : 'bg-black/60';

  const EditableBlock = ({ id, value, onSave, label, renderDisplay }: { id: string, value: string, onSave: (val: string) => void, label: string, renderDisplay?: (val: string) => React.ReactNode }) => {
    const isEditing = editingBlock === id;
    const [localVal, setLocalVal] = useState(value);
    const [localPrompt, setLocalPrompt] = useState('');
    const [rewriting, setRewriting] = useState(false);
    
    useEffect(() => { setLocalVal(value); }, [value]);

    const handleSave = () => {
      onSave(localVal);
      setEditingBlock(null);
    };

    const handleRewrite = async () => {
       if (!localPrompt) return;
       const creditResult = await consumeCredit('proposal');
       if (!creditResult.ok) {
         addNotification(user?.uid || '', 'Sem créditos', 'Você precisa de créditos para reescrever.', 'warning');
         return;
       }
       
       try {
         setRewriting(true);
         const res = await fetch('/api/tools/proposal/rewrite', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ text: localVal, prompt: localPrompt })
         });
         const data = await res.json();
         if (data.success) {
           setLocalVal(data.data);
           setLocalPrompt('');
         } else {
           throw new Error(data.error);
         }
       } catch (err: any) {
         addNotification(user?.uid || '', 'Erro', err.message, 'error');
       } finally {
         setRewriting(false);
       }
    };

    if (!isEditing) {
      return (
        <div className="relative group cursor-pointer" onClick={() => setEditingBlock(id)}>
          <div className={`absolute -inset-4 ${isLight ? 'group-hover:bg-black/5' : 'group-hover:bg-white/5'} bg-transparent rounded-xl transition-all duration-200`}></div>
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-brand-mint text-black font-bold text-xs px-3 py-1.5 rounded-md z-20 flex items-center gap-2 shadow-xl"><Settings2 className="w-3 h-3"/> Editar Bloco</div>
          <div className="relative z-10 pointer-events-none">
            {renderDisplay ? renderDisplay(value) : (
              <p className={`${txtSecondary} font-light leading-relaxed tracking-wide text-[15px] whitespace-pre-wrap`}>{value}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-black/60 border border-white/20 p-5 rounded-2xl space-y-4 relative z-30 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-2">
           <span className="text-sm font-bold text-white flex items-center gap-2"><Settings2 className="w-4 h-4"/> Editando: {label}</span>
           <button onClick={() => {setEditingBlock(null); setLocalVal(value);}} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
        </div>
        
        <textarea 
          className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white text-sm min-h-[160px] focus:border-brand-mint/50 focus:ring-1 focus:ring-brand-mint/50 outline-none transition-all"
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
        />

        <div className="flex flex-col gap-3 pt-2">
          <label className="text-xs text-brand-mint font-semibold uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3"/> IA: O que deseja alterar neste bloco?</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ex: Refaça este texto com um tom mais focado em vendas e escassez..." 
              className="flex-1 bg-brand-mint/5 border border-brand-mint/20 text-white text-sm rounded-lg px-4 focus:border-brand-mint outline-none"
              value={localPrompt}
              onChange={e => setLocalPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRewrite()}
            />
            <Button 
              onClick={handleRewrite} 
              disabled={rewriting || !localPrompt}
              className="bg-brand-mint text-black hover:bg-emerald-400 text-sm font-bold whitespace-nowrap"
            >
              {rewriting ? 'Processando...' : '✨ Reescrever (1 Crédito)'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-white/10 mt-2">
          <Button onClick={handleSave} className="bg-white text-black hover:bg-gray-200 text-sm font-bold px-8">Salvar Alterações</Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const diagQ = query(collection(db, 'diagnoses'), where('userId', '==', user.uid));
        const calcQ = query(collection(db, 'calculations'), where('userId', '==', user.uid));
        
        const [diagSnap, calcSnap] = await Promise.all([getDocs(diagQ), getDocs(calcQ)]);
        
        const loadedDiag = diagSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        const loadedCalc = calcSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        
        setDiagnoses(loadedDiag);
        setCalculations(loadedCalc);
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      }
    };
    
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
          const docRef = doc(db, 'proposals', historyId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().userId === user.uid) {
            const data = docSnap.data();
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

  const handleGenerate = async () => {
    // Check access and consume 1 credit
    const creditResult = await consumeCredit('proposal');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits'
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.'
        : 'Seu plano não tem acesso ao Gerador de Propostas. Faça upgrade para o Plano Pro ou Elite.');
      return;
    }

    if (!cliente || !objetivo) {
      setError('Por favor, preencha o Nome do Cliente e o Objetivo Principal da campanha.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const settingsStr = localStorage.getItem('asa_settings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      
      const payload = {
        cliente,
        objetivo,
        modoGeração: modoGeracao,
        diagnostico: selectedDiagnosis ? diagnoses.find(d => d.id === selectedDiagnosis)?.resultado_json : null,
        orcamento: selectedCalculation ? calculations.find(c => c.id === selectedCalculation)?.resultado_json : null,
        profissional: {
          name: settings.nome_completo || user?.displayName || 'Criador',
          email: settings.email || user?.email || '',
        }
      };

      const response = await fetch('/api/tools/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao compilar proposta');
      }
      
      setResult(resData.data);
      
      if (user) {
        addNotification(
          user.uid,
          'Proposta Comercial Gerada',
          `A proposta comercial para ${cliente || 'o cliente'} foi gerada com sucesso!`,
          'success'
        );
        try {
          const clientNameToSave = cliente || (selectedDiagnosis ? diagnoses.find(d => d.id === selectedDiagnosis)?.handle : 'Cliente sem nome');

          await addDoc(collection(db, 'proposals'), {
            userId: user.uid,
            clientName: clientNameToSave,
            result_json: resData.data,
            createdAt: new Date().toISOString()
          });

          // Extrair valor da proposta para o CRM
          const valorString = resData.data.investimento?.valor || '';
          // Limpa 'R$ 3.500,00' para 3500.00
          const numericValue = Number(valorString.replace(/[^0-9,]+/g, '').replace(',', '.')) || 0;

          // Extrair entregáveis da proposta para o CRM
          let qtdVideos = 0;
          
          // 1. Tentar pegar do orçamento selecionado
          const orcamentoObj = selectedCalculation ? calculations.find(c => c.id === selectedCalculation)?.resultado_json : null;
          if (orcamentoObj && (orcamentoObj.video_quantity || orcamentoObj.video_quantity_total)) {
             qtdVideos = Number(orcamentoObj.video_quantity || orcamentoObj.video_quantity_total);
          } else {
             // 2. Tentar garimpar no escopo ou inclusos da proposta (ex: "Produção de 4 vídeos")
             const escopoText = (resData.data.escopo || '') + ' ' + (resData.data.o_que_esta_incluso || []).join(' ');
             const match = escopoText.match(/(\d+)\s+v[ií]deo/i);
             if (match) {
               qtdVideos = Number(match[1]);
             }
          }

          let entregaveis = [];
          if (qtdVideos > 0 && qtdVideos <= 30) { // Limite de sanidade
             entregaveis = Array.from({ length: qtdVideos }).map((_, i) => ({
                id: Math.random().toString(36).substring(7),
                description: `Vídeo ${i + 1}`,
                completed: false,
                link: ''
             }));
          } else {
             // Fallback caso não ache a quantidade de vídeos
             entregaveis = (resData.data.o_que_esta_incluso || []).map((item: string) => ({
                id: Math.random().toString(36).substring(7),
                description: item,
                completed: false,
                link: ''
             }));
          }

          // Criar cliente automaticamente no CRM
          await addDoc(collection(db, 'clients'), {
            userId: user.uid,
            name: clientNameToSave,
            stage: 'aguardando_resposta',
            value: numericValue,
            deliveries: entregaveis,
            createdAt: new Date().toISOString()
          });

        } catch (dbErr) {
          console.error("Falha ao salvar proposta ou cliente no Firestore:", dbErr);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const reportElement = document.getElementById('proposal-pdf-content');
    if (!reportElement) return;

    setLoadingPdf(true);
    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

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
      pdf.save(`Proposta_${cliente.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      setError(`Falha ao gerar PDF: ${err.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-mint bg-brand-mint/10 text-sm font-medium w-fit mb-2">
          <FileText className="w-4 h-4" />
          <span className="text-white">Motor Comercial</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Gerador de Propostas</h1>
        <p className="text-gray-400 font-light tracking-wide">Compile argumentos comerciais inquebráveis conectando dados do seu diagnóstico e valores da calculadora.</p>
      </div>

      <GlassCard glow className="p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">
          
          {/* Seção 1: Vínculos Estratégicos */}
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 border-b border-white/10 pb-3 mb-5">
              <LayoutList className="w-5 h-5 text-brand-mint" />
              1. Base de Dados (Vínculos)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <ScanSearch className="w-4 h-4 text-brand-jade" />
                  Diagnóstico (O Problema)
                </label>
                <select 
                  value={selectedDiagnosis} 
                  onChange={e => setSelectedDiagnosis(e.target.value)}
                  className="w-full glass-input text-sm py-3"
                >
                  <option value="">-- Não vincular (Entrada Manual) --</option>
                  {diagnoses.map(d => (
                    <option key={d.id} value={d.id}>@{d.handle} - Nota: {d.nota_final} ({new Date(d.createdAt).toLocaleDateString('pt-BR')})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 font-light mt-2 tracking-wide">A IA usará os pontos fracos identificados para justificar a urgência do serviço.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Orçamento (O Investimento)
                </label>
                <select 
                  value={selectedCalculation} 
                  onChange={e => setSelectedCalculation(e.target.value)}
                  className="w-full glass-input text-sm py-3"
                >
                  <option value="">-- Não vincular (Preço Sob Demanda) --</option>
                  {calculations.map(c => (
                    <option key={c.id} value={c.id}>Pacote: {c.video_quantity} vídeos - {c.precoRecomendado} ({new Date(c.createdAt).toLocaleDateString('pt-BR')})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 font-light mt-2 tracking-wide">Fornece o valor validado tecnicamente, evitando que o cliente negocie margens não mapeadas.</p>
              </div>
            </div>
          </div>

          {/* Seção 2: Contexto Específico */}
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 border-b border-white/10 pb-3 mb-5 mt-4">
              <Building2 className="w-5 h-5 text-brand-mint" />
              2. Dados Complementares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa/Cliente</label>
                <input 
                  type="text" 
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: Clínica Sorriso Metálico" 
                  className="w-full glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Objetivo Primário</label>
                <input 
                  type="text" 
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="Ex: Aumentar agendamentos de clareamento." 
                  className="w-full glass-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Modo de Geração</label>
                <div className="flex gap-4">
                  {['Rápida', 'Profissional', 'Premium'].map(modo => (
                    <button 
                      key={modo}
                      onClick={() => setModoGeracao(modo)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border ${modoGeracao === modo ? 'bg-brand-mint/20 border-brand-mint text-white' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}
                    >
                      {modo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            {hasToolAccess('proposal') ? (
              <div className="flex flex-col items-end float-right">
                <Button
                  className="w-full md:w-auto px-10 h-14 text-sm uppercase tracking-widest relative overflow-hidden group bg-gradient-to-r from-teal-500 to-brand-mint text-black font-bold shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Sparkles className="w-4 h-4 animate-spin text-black" /> Escrevendo Proposta...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Send className="w-4 h-4" /> Gerar Proposta Comercial
                    </span>
                  )}
                </Button>
                {!loading && <CreditNotice toolId="proposal" />}
              </div>
            ) : (
              <UpgradeGate locked={true} requiredPlan="Pro" mode="button" label="Gerador de Propostas — Disponível no Plano Pro ou Elite" />
            )}
            <div className="clear-both"></div>
          </div>
        </div>
      </GlassCard>

      {/* CONTINUOUS RESULTS */}
      {result && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-700 space-y-6 mt-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">Visualização da Proposta</h2>
            
            <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-white/10 p-2 rounded-xl">
              {/* Seletor de Cores */}
              <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <Palette className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1.5">
                  {COLORS.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setDocColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${docColor.id === c.id ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              
              {/* Seletor de Fonte */}
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-gray-400" />
                <div className="flex gap-2">
                  {FONTS.map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => setDocFont(f)}
                      className={`text-xs px-2 py-1 rounded transition-all ${docFont.id === f.id ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                      title={f.label}
                    >
                      {f.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={downloadPDF} 
              className="bg-brand-mint/20 text-brand-mint hover:bg-brand-mint hover:text-black border border-brand-mint/50 font-bold"
              disabled={loadingPdf}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {loadingPdf ? 'Processando PDF...' : 'Exportar PDF'}
            </Button>
          </div>

          {/* Document Render Area (Mobile-First Layout) */}
          <div className={`rounded-2xl overflow-hidden shadow-2xl mx-auto w-full max-w-[450px] ${isLight ? 'bg-white' : 'bg-[#0a0a0a]'}`}>
            <div className={`p-6 md:p-8 min-h-[800px] relative w-full h-full bg-gradient-to-b ${docColor.gradient} ${docFont.class}`} id="proposal-pdf-content">
             
             {/* Background glow effects */}
             <div className="absolute top-0 right-0 w-full h-64 blur-[80px] pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundColor: docColor.value }}></div>
             
             {/* Capa */}
             <div className={`min-h-[70vh] flex flex-col justify-center mb-16 relative z-10 pt-10 pb-16 ${isLight ? 'border-b border-black/5' : ''}`}>
                <div className="w-16 h-1 mb-6 rounded-full opacity-80" style={{ backgroundColor: docColor.value }}></div>
                <EditableBlock 
                  id="capa_titulo"
                  label="Título da Capa"
                  value={result.capa?.titulo || `Plano de Conversão`}
                  onSave={(val) => setResult({...result, capa: {...result.capa, titulo: val}})}
                  renderDisplay={(val) => <h1 className={`text-4xl font-extrabold tracking-tighter ${txtPrimary} mb-4 leading-[1.1]`}>{val}</h1>}
                />
                <EditableBlock 
                  id="capa_subtitulo"
                  label="Subtítulo da Capa"
                  value={result.capa?.subtitulo || `Para ${cliente}`}
                  onSave={(val) => setResult({...result, capa: {...result.capa, subtitulo: val}})}
                  renderDisplay={(val) => <p className={`text-lg font-light ${txtSecondary} tracking-wide mb-10 opacity-90`}>{val}</p>}
                />
                <div className={`mt-auto pt-10 border-t ${borderMuted}`}>
                  <p className={`text-[10px] ${txtMuted} uppercase tracking-widest font-semibold mb-1 opacity-70`}>Apresentado por</p>
                  <p className={`text-base font-bold ${txtPrimary}`}>{JSON.parse(localStorage.getItem('asa_settings') || '{}').nome_completo || user?.displayName || 'Criador'}</p>
                  <p className={`text-xs font-light ${txtMuted} mt-0.5`}>{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
             </div>

             {/* Corpo da Proposta (Mobile Cards) */}
             <div className="space-y-6 relative z-10 w-full pb-10">
                
                {/* Apresentação */}
                <section className={`${bgCard} p-6 rounded-2xl border ${borderMuted} shadow-lg backdrop-blur-md`}>
                  <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-4`}>Apresentação</h2>
                  <EditableBlock 
                    id="apresentacao"
                    label="Apresentação"
                    value={result.apresentacao}
                    onSave={(val) => setResult({...result, apresentacao: val})}
                    renderDisplay={(val) => <p className={`${txtSecondary} font-light leading-relaxed tracking-wide text-[15px] whitespace-pre-wrap`}>{val}</p>}
                  />
                </section>

                {/* Contexto & Diagnóstico */}
                <section className={`${bgCard} p-6 rounded-2xl border ${borderMuted} shadow-lg backdrop-blur-md relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none" style={{ backgroundColor: docColor.value }}></div>
                  <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-4 flex items-center gap-2 relative z-10`}>
                    <Target className={`w-5 h-5 ${docColor.textClass}`} /> O Cenário Atual
                  </h2>
                  <div className="relative z-10">
                    <EditableBlock 
                      id="contexto"
                      label="O Cenário Atual"
                      value={result.contexto}
                      onSave={(val) => setResult({...result, contexto: val})}
                      renderDisplay={(val) => <p className={`${txtSecondary} font-light leading-relaxed tracking-wide text-[15px] whitespace-pre-wrap`}>{val}</p>}
                    />
                  </div>
                </section>

                {/* Solução */}
                <section className={`${bgCard} p-6 rounded-2xl border ${borderMuted} shadow-lg backdrop-blur-md`}>
                  <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-4`}>A Solução</h2>
                  <EditableBlock 
                    id="solucao"
                    label="A Solução"
                    value={result.solucao}
                    onSave={(val) => setResult({...result, solucao: val})}
                    renderDisplay={(val) => <p className={`${txtSecondary} font-light leading-relaxed tracking-wide text-[15px] whitespace-pre-wrap`}>{val}</p>}
                  />
                </section>

                {/* Escopo */}
                <section className={`${bgCard} p-6 rounded-2xl border ${borderMuted} shadow-lg backdrop-blur-md`}>
                  <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-4`}>Escopo do Projeto</h2>
                  <div className="mb-6">
                    <EditableBlock 
                      id="escopo"
                      label="Escopo Geral"
                      value={result.escopo}
                      onSave={(val) => setResult({...result, escopo: val})}
                      renderDisplay={(val) => <p className={`${txtSecondary} font-light leading-relaxed tracking-wide text-[15px] whitespace-pre-wrap`}>{val}</p>}
                    />
                  </div>

                  <div className={`${isLight ? 'bg-black/5' : 'bg-black/40'} p-5 rounded-xl border ${borderMuted}`}>
                    <h4 className={`${docColor.textClass} font-bold mb-4 uppercase tracking-wider text-[11px] flex items-center gap-2`}>
                      <CheckCircle2 className="w-4 h-4" /> O que está incluso
                    </h4>
                    <EditableBlock 
                      id="inclusos"
                      label="Itens Inclusos (Uma linha por item)"
                      value={Array.isArray(result.o_que_esta_incluso) ? result.o_que_esta_incluso.join('\n') : result.o_que_esta_incluso}
                      onSave={(val) => setResult({...result, o_que_esta_incluso: val.split('\n').filter(Boolean)})}
                      renderDisplay={(val) => (
                        <ul className="space-y-3">
                          {val.split('\n').filter(Boolean).map((item: string, i: number) => (
                            <li key={i} className={`${txtSecondary} font-light text-[14px] flex items-start gap-2`}>
                              <span className={`${docColor.textClass} mt-0.5`}>•</span> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    />
                  </div>
                </section>

                {/* Processo de Trabalho */}
                <section className={`${bgCard} p-6 rounded-2xl border ${borderMuted} shadow-lg backdrop-blur-md`}>
                  <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-6`}>Processo de Trabalho</h2>
                  <div className={`space-y-0 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 ${isLight ? 'before:bg-black/10' : 'before:bg-white/10'}`}>
                    {Array.isArray(result.processo) && result.processo.map((p: any, i: number) => (
                      <div key={i} className="relative mb-6 last:mb-0">
                        <EditableBlock 
                          id={`processo_${i}`}
                          label={`Etapa ${i+1}`}
                          value={`${p.etapa}\n${p.descricao}`}
                          onSave={(val) => {
                            const lines = val.split('\n');
                            const newArr = [...result.processo];
                            newArr[i] = { etapa: lines[0] || '', descricao: lines.slice(1).join('\n') };
                            setResult({...result, processo: newArr});
                          }}
                          renderDisplay={(val) => {
                            const lines = val.split('\n');
                            return (
                              <div className="flex gap-4 items-start relative z-10">
                                <div className={`flex-shrink-0 w-9 h-9 rounded-full ${isLight ? 'bg-white border-white ring-black/10' : 'bg-black border-[#0a0a0a] ring-white/10'} border-[3px] ring-2 flex items-center justify-center ${docColor.textClass} font-bold text-sm shadow-md`}>
                                  {i + 1}
                                </div>
                                <div className="pt-1.5 pb-2">
                                  <h4 className={`${txtPrimary} font-bold text-[15px] mb-1 tracking-tight`}>{lines[0]}</h4>
                                  <p className={`${txtMuted} font-light text-[13px] leading-relaxed`}>{lines.slice(1).join('\n')}</p>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Investimento */}
                <section className={`mt-8 ${bgInvest} p-8 rounded-3xl border text-center relative overflow-hidden shadow-2xl`} style={{ borderColor: docColor.value }}>
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${docColor.value}, transparent)` }}></div>
                  <div className="relative z-10">
                    <h2 className={`text-xl font-bold tracking-tight ${txtPrimary} mb-4`}>Investimento</h2>
                    <div className={`mb-6 text-sm ${txtSecondary} font-light`}>
                      <EditableBlock 
                        id="investimento_texto"
                        label="Texto do Investimento"
                        value={result.investimento?.texto_introdutorio}
                        onSave={(val) => setResult({...result, investimento: {...result.investimento, texto_introdutorio: val}})}
                      />
                    </div>
                    <p className={`text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 ${isLight ? 'drop-shadow-sm' : 'drop-shadow-lg'}`} style={{ color: isLight ? '#0a0a0a' : docColor.value }}>
                      {result.investimento?.valor || 'R$ --'}
                    </p>
                    <div className={`mt-6 border-t ${borderMuted} pt-4`}>
                       <p className={`text-[10px] font-semibold tracking-widest uppercase mb-1 ${txtMuted}`}>Condições de Pagamento</p>
                       <EditableBlock 
                           id="investimento_condicoes"
                           label="Condições"
                           value={result.investimento?.condicoes}
                           onSave={(val) => setResult({...result, investimento: {...result.investimento, condicoes: val}})}
                           renderDisplay={(val) => <p className={`${txtSecondary} font-light text-[11px]`}>{val}</p>}
                       />
                    </div>
                  </div>
                </section>

                {/* Próximos Passos */}
                <section className="text-center pt-8">
                  <h2 className={`text-lg font-bold tracking-tight ${txtPrimary} mb-3`}>Próximos Passos</h2>
                  <div className={`mb-8 mx-auto text-sm ${txtMuted} font-light`}>
                    <EditableBlock 
                        id="proximo_passo"
                        label="Próximos Passos"
                        value={result.proximo_passo}
                        onSave={(val) => setResult({...result, proximo_passo: val})}
                    />
                  </div>
                  <div className="inline-flex flex-col items-center opacity-40">
                    <div className={`w-8 h-px ${isLight ? 'bg-black' : 'bg-white'} mb-2`}></div>
                    <p className={`text-[9px] font-light tracking-widest uppercase ${txtPrimary}`}>Proposta Válida por 7 dias</p>
                  </div>
                </section>

             </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
