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
          <span className="text-white">Motor Comercial B2B</span>
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
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">Visualização da Proposta</h2>
            <Button 
              onClick={downloadPDF} 
              className="bg-brand-mint/20 text-brand-mint hover:bg-brand-mint hover:text-black border border-brand-mint/50 font-bold"
              disabled={loadingPdf}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {loadingPdf ? 'Processando PDF...' : 'Exportar PDF'}
            </Button>
          </div>

          {/* Document Render Area (A4 style visually) */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 md:p-14 overflow-hidden relative shadow-2xl" id="proposal-pdf-content">
             
             {/* Background glow effects for premium look */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-brand-mint/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
             
             {/* Capa */}
             <div className="min-h-[60vh] flex flex-col justify-center mb-24 relative z-10 border-b border-white/5 pb-24">
                <div className="w-20 h-1 bg-brand-mint mb-8 rounded-full"></div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-4 leading-tight">
                  {result.capa?.titulo || `Proposta Comercial de Conteúdo`}
                </h1>
                <p className="text-xl md:text-2xl font-light text-gray-400 tracking-wide mb-12">
                  {result.capa?.subtitulo || `Desenvolvida para ${cliente}`}
                </p>
                <div className="mt-auto pt-12">
                  <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-1">Apresentado por</p>
                  <p className="text-lg font-bold text-gray-200">{JSON.parse(localStorage.getItem('asa_settings') || '{}').nome_completo || user?.displayName || 'Criador'}</p>
                  <p className="text-sm font-light text-gray-400 mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
             </div>

             {/* Corpo da Proposta */}
             <div className="space-y-16 relative z-10 max-w-4xl">
                
                {/* Apresentação */}
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-6">Apresentação</h2>
                  <p className="text-gray-300 font-light leading-relaxed tracking-wide text-lg whitespace-pre-wrap">
                    {result.apresentacao}
                  </p>
                </section>

                {/* Contexto & Diagnóstico */}
                <section className="bg-white/[0.02] p-8 rounded-2xl border border-white/5">
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-6 flex items-center gap-3">
                    <Target className="w-6 h-6 text-brand-mint" /> O Cenário Atual
                  </h2>
                  <p className="text-gray-300 font-light leading-relaxed tracking-wide text-lg whitespace-pre-wrap">
                    {result.contexto}
                  </p>
                </section>

                {/* Solução */}
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-6">A Solução</h2>
                  <p className="text-gray-300 font-light leading-relaxed tracking-wide text-lg whitespace-pre-wrap">
                    {result.solucao}
                  </p>
                </section>

                {/* Escopo */}
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-6">Escopo do Projeto</h2>
                  <p className="text-gray-300 font-light leading-relaxed tracking-wide text-lg whitespace-pre-wrap mb-8">
                    {result.escopo}
                  </p>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-brand-mint/5 p-6 rounded-xl border border-brand-mint/10">
                      <h4 className="text-brand-mint font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> O que está incluso
                      </h4>
                      <ul className="space-y-3">
                        {Array.isArray(result.o_que_esta_incluso) && result.o_que_esta_incluso.map((item: string, i: number) => (
                          <li key={i} className="text-gray-300 font-light text-sm flex items-start gap-2">
                            <span className="text-brand-mint mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Processo de Trabalho */}
                <section>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-8">Processo de Trabalho</h2>
                  <div className="space-y-6">
                    {Array.isArray(result.processo) && result.processo.map((p: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-mint font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-2 tracking-tight">{p.etapa}</h4>
                          <p className="text-gray-400 font-light text-sm leading-relaxed">{p.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Investimento */}
                <section className="mt-16 bg-gradient-to-br from-brand-mint/10 to-transparent p-10 rounded-3xl border border-brand-mint/20 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-6">Investimento</h2>
                  <p className="text-gray-300 font-light leading-relaxed tracking-wide text-base mb-8 max-w-2xl mx-auto">
                    {result.investimento?.texto_introdutorio}
                  </p>
                  <p className="text-5xl font-extrabold text-white tracking-tighter mb-4 drop-shadow-lg">
                    {result.investimento?.valor || 'R$ --'}
                  </p>
                  <p className="text-brand-mint font-semibold text-sm tracking-widest uppercase mt-6 mb-2">Condições de Pagamento</p>
                  <p className="text-gray-400 font-light text-sm">{result.investimento?.condicoes}</p>
                </section>

                {/* Próximos Passos */}
                <section className="text-center pt-16 border-t border-white/5">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-4">Próximos Passos</h2>
                  <p className="text-gray-400 font-light leading-relaxed tracking-wide text-lg max-w-xl mx-auto mb-10">
                    {result.proximo_passo}
                  </p>
                  <div className="inline-flex flex-col items-center opacity-50">
                    <div className="w-16 h-px bg-gray-500 mb-2"></div>
                    <p className="text-xs text-gray-500 font-light tracking-widest uppercase">Proposta Válida por 7 dias</p>
                  </div>
                </section>

             </div>
          </div>

        </div>
      )}
    </div>
  );
}
