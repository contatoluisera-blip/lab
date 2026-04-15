'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Clapperboard, Sparkles, Camera, Mic, LayoutIcon } from 'lucide-react';

export default function SimulatorPage() {
  const [formato, setFormato] = useState('Reels');
  const [cenario, setCenario] = useState('');
  const [equipamento, setEquipamento] = useState('Smartphone Básico');
  const [dinamismo, setDinamismo] = useState('Cinemático');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!cenario) {
      setError('Por favor, descreva a cena principal.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tools/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formato, cenario, equipamento, dinamismo })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar simulação');
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-emerald-400 text-sm font-medium w-fit mb-2">
          <Clapperboard className="w-4 h-4" />
          <span>Física e Execução</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Simulador de Produção</h1>
        <p className="text-gray-400">Descreva sua cena e equipamento para visualizar precisamente como alinhar iluminação, captação e edição.</p>
      </div>

      {/* TACTILE CONTINUOUS FORM */}
      <GlassCard glow className="p-8">
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Formato Alvo</label>
              <select 
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                className="w-full glass-input"
              >
                <option>Reels (9:16)</option>
                <option>TikTok (9:16)</option>
                <option>YouTube Shorts (9:16)</option>
                <option>Long Form (16:9)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Setup Atual</label>
              <select 
                value={equipamento}
                onChange={(e) => setEquipamento(e.target.value)}
                className="w-full glass-input"
              >
                <option>Smartphone Básico + Luz de Janela</option>
                <option>iPhone Pro + Ringlight</option>
                <option>Câmera Mirrorless + Keylight</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição Visual da Cena</label>
            <textarea 
              value={cenario}
              onChange={(e) => setCenario(e.target.value)}
              placeholder="Ex: Gravando uma rotina matinal preparando um café expresso forte, com baixa iluminação." 
              className="w-full glass-input min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Linguagem e Dinamismo da Edição</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Cinemático/Lento', 'Dinâmico/Vlogs', 'Agressivo/Cortes', 'Tutorial/Educativo'].map(opt => (
                <div 
                  key={opt}
                  onClick={() => setDinamismo(opt)}
                  className={`cursor-pointer rounded-xl p-3 text-center text-sm font-medium border transition-all ${dinamismo === opt ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button at the bottom of the form block */}
          <div className="pt-6 border-t border-white/10">
            <Button 
              className="w-full md:w-auto px-10 h-14 text-sm uppercase tracking-wider relative overflow-hidden group float-right"
              variant="primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 animate-spin" /> Processando Cenário...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Camera className="w-4 h-4" /> Gerar Setup de Produção
                </span>
              )}
            </Button>
            <div className="clear-both"></div>
          </div>
        </div>
      </GlassCard>

      {/* CONTINUOUS RESULTS BELOW FORM */}
      {result && (
        <div className="animate-in fade-in slide-in-from-top-6 duration-700 space-y-6 mt-8">
          
          <GlassCard glow className="p-8 border-emerald-500/20">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Engenharia de Set (Luz & Áudio)</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {result.iluminacaoAudio}
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-8 border-white/5">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Guia de Movimentação
              </h4>
              <ul className="space-y-4">
                {result.guiaMovimentos.map((item: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300 items-start">
                    <span className="text-emerald-400 mt-1 mt-0.5 min-w-[20px] font-bold">{i+1}.</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-8 border-white/5">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <LayoutIcon className="w-5 h-5 text-emerald-400" />
                Diretrizes de Edição
              </h4>
              <ul className="space-y-4">
                {result.dicasEdicao.map((item: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
