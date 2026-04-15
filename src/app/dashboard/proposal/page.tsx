'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FileText, Sparkles, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ProposalPage() {
  const [cliente, setCliente] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [entregaveis, setEntregaveis] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!cliente || !objetivo) {
      setError('Por favor, preencha o Nome do Cliente e o Objetivo Principal da campanha.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tools/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, objetivo, entregaveis, valorEstimado })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao compilar proposta');
      }
      
      setResult(resData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-mint bg-brand-mint/10 text-sm font-medium w-fit mb-2">
          <FileText className="w-4 h-4" />
          <span className="text-white">Motor de Conversão B2B</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Gerador Executivo de Propostas</h1>
        <p className="text-gray-400">Compile argumentos comerciais inquebráveis e apresente sua entrega tática de forma irrecusável ao cliente.</p>
      </div>

      <GlassCard glow className="p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Marca/Cliente</label>
              <input 
                type="text" 
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex: Coca-Cola, Starbucks..." 
                className="w-full glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimativa Orçamentária</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-500">R$</span>
                <input 
                  type="text"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                  placeholder="2.500,00"
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Objetivo Primário da Campanha</label>
            <input 
              type="text" 
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex: Lançar um novo sabor de bebida para o público jovem no TikTok." 
              className="w-full glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resumo dos Entregáveis</label>
            <textarea 
              value={entregaveis}
              onChange={(e) => setEntregaveis(e.target.value)}
              placeholder="Ex: 4 Vídeos de 15s formato Vertical (Reels) com inserções do produto." 
              className="w-full glass-input min-h-[100px] resize-none"
            />
          </div>

          <div className="pt-6 border-t border-white/10">
            <Button 
              className="w-full md:w-auto px-10 h-14 text-sm uppercase tracking-wider relative overflow-hidden group float-right bg-gradient-to-r from-teal-500 to-brand-mint text-black font-bold shadow-[0_0_20px_rgba(52,211,153,0.4)]"
              onClick={handleGenerate}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 animate-spin text-black" /> Sintetizando Estratégia...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Send className="w-4 h-4" /> Compilar Proposta Blindada
                </span>
              )}
            </Button>
            <div className="clear-both"></div>
          </div>
        </div>
      </GlassCard>

      {/* CONTINUOUS RESULTS */}
      {result && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-700 space-y-6 mt-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Email Structure */}
            <GlassCard className="lg:col-span-2 p-8 border-brand-mint/20">
              <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand-mint drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                Resumo Executivo (E-mail Base)
              </h4>
              <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 relative">
                 <div className="absolute top-4 right-4 text-xs font-mono text-gray-500">
                    Apresentação Direta
                 </div>
                 <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                   {result.emailHeader}
                 </p>
                 <div className="mt-8 space-y-4">
                    {result.estruturaExecutive.map((paragrafo: string, index: number) => (
                      <div key={index} className="flex gap-4 items-start bg-brand-mint/5 p-4 rounded-lg border border-brand-mint/10">
                        <CheckCircle2 className="w-5 h-5 text-brand-mint flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-200">{paragrafo}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </GlassCard>

            {/* Right Panel: Commercial Scope */}
            <div className="space-y-6">
              <GlassCard className="p-6 border-amber-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Barreira de Escopo
                </h4>
                <div className="relative z-10 text-sm text-gray-300 whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-white/5 font-mono">
                  {result.escopoComercial}
                </div>
              </GlassCard>

              <GlassCard glow className="p-6 bg-gradient-to-br from-brand-emerald/10 to-transparent flex flex-col items-center justify-center text-center">
                 <Button className="w-full bg-white text-black hover:bg-gray-200 border-none">
                    Gerar PDF Restrito
                 </Button>
                 <p className="text-xs text-gray-500 mt-3">Exporte e envie sem direito a edições.</p>
              </GlassCard>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
