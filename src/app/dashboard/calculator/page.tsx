'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Calculator, Sparkles, DollarSign, PieChart, ShieldCheck } from 'lucide-react';

export default function CalculatorPage() {
  const [tipoProjeto, setTipoProjeto] = useState('UGC Nativo');
  const [horasCaptação, setHorasCaptação] = useState('4');
  const [complexidadePos, setComplexidadePos] = useState('Básica com legendas');
  const [direitos, setDireitos] = useState('Apenas Orgânico (3 meses)');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tools/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoProjeto, horasCaptação, complexidadePos, direitos })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar orçamento');
      }
      
      setResult(resData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-[#065f46] bg-brand-jade/20 text-sm font-medium w-fit mb-2">
          <Calculator className="w-4 h-4 text-brand-jade" />
          <span className="text-white">Motor de Precificação</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Calculadora de Orçamento</h1>
        <p className="text-gray-400">Dimensione adequadamente seus pacotes baseando-se em horas técnicas brutas e proteções de imagem.</p>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Entrega Final</label>
              <select 
                value={tipoProjeto}
                onChange={(e) => setTipoProjeto(e.target.value)}
                className="w-full glass-input"
              >
                <option>UGC Nativo</option>
                <option>Comercial Premium</option>
                <option>B-Rolls / Cobertura de Evento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimativa Técnica (Horas de Gravação)</label>
              <input 
                type="number"
                value={horasCaptação}
                onChange={(e) => setHorasCaptação(e.target.value)}
                className="w-full glass-input"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Grau de Complexidade da Pós-Produção</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Básica com legendas', 'Mediana', 'Complexa com VFX'].map(opt => (
                <div 
                  key={opt}
                  onClick={() => setComplexidadePos(opt)}
                  className={`cursor-pointer rounded-xl p-4 text-center text-sm font-medium border transition-all ${complexidadePos === opt ? 'bg-[#065f46]/30 border-brand-jade text-white shadow-[inset_0_0_15px_rgba(6,95,70,0.5)]' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cessão de Direitos e Uso de Imagem</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Apenas Orgânico (3 meses)', 'Tráfego Pago (1 Ano)', 'Uso Perpétuo'].map(opt => (
                <div 
                  key={opt}
                  onClick={() => setDireitos(opt)}
                  className={`cursor-pointer rounded-xl p-4 text-center text-sm font-medium border transition-all flex flex-col justify-center items-center gap-1 ${direitos === opt ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button at the bottom of the form block */}
          <div className="pt-6 border-t border-white/10">
            <Button 
              className="w-full md:w-auto px-10 h-14 text-sm uppercase tracking-wider relative overflow-hidden group float-right bg-gradient-to-r from-brand-jade to-emerald-600 hover:from-brand-jade hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(6,95,70,0.5)]"
              onClick={handleGenerate}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 animate-spin" /> Processando Custos...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Calculator className="w-4 h-4" /> Dimensionar Preço Final
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
          
          <GlassCard glow className="p-8 border-brand-jade/40 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-brand-jade/10">
              <DollarSign className="w-48 h-48" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-6 border-b border-white/10 mb-6">
              <h3 className="text-gray-400 font-medium uppercase tracking-widest text-xs mb-2">Estrutura Sugerida</h3>
              <p className="text-5xl md:text-6xl font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(6,95,70,0.8)]">
                {result.valorSugerido}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-brand-jade" />
                  Raciocínio Base
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {result.raciocinio}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-jade" />
                  Argumento de Validação
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed bg-brand-jade/10 p-4 rounded-xl border border-brand-jade/20 italic">
                  "{result.argumentoVenda}"
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
