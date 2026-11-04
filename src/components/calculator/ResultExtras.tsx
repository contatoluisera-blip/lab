'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, MessageSquareQuote, PieChart } from 'lucide-react';
import { callTool } from '@/lib/client/api';

interface Analise {
  custoIaNum: number; custoTempoNum: number; extrasNum: number; impostosNum: number; lucroNum: number;
  custoIa: string; custoTempo: string; extras: string; impostos: string; lucro: string;
  margemPct: number; precoNum: number; horas: number; segundosIa?: number; precoPorSegundo?: string;
}

/** Barra de custos x margem no preço recomendado (100% da barra = preço). */
export function MarginBar({ analise, mode }: { analise: Analise; mode: string }) {
  const parts = [
    { key: 'ia', label: 'Custos de IA', value: analise.custoIaNum, fmt: analise.custoIa, color: 'bg-teal-400' },
    { key: 'tempo', label: 'Estrutura (seu custo fixo por hora)', value: analise.custoTempoNum, fmt: analise.custoTempo, color: 'bg-sky-400' },
    { key: 'extras', label: 'Extras e terceiros', value: analise.extrasNum, fmt: analise.extras, color: 'bg-amber-300' },
    { key: 'imp', label: 'Impostos e taxas', value: analise.impostosNum, fmt: analise.impostos, color: 'bg-red-400' },
    { key: 'lucro', label: 'Fica com você (trabalho + lucro)', value: Math.max(0, analise.lucroNum), fmt: analise.lucro, color: 'bg-brand-emerald' },
  ].filter(p => p.value > 0.5 && (p.key !== 'ia' || mode === 'ia'));
  const total = analise.precoNum || 1;

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.03] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><PieChart className="w-5 h-5 text-brand-mint" /> Custos x margem</h3>
        <p className="text-sm text-gray-400">No preço recomendado, <span className="text-brand-mint font-bold">{analise.margemPct}%</span> fica com você.</p>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden bg-black/40" role="img" aria-label="Divisão do preço recomendado entre custos e o que fica com você">
        {parts.map(p => <div key={p.key} className={p.color} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${p.fmt}`} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {parts.map(p => (
          <div key={p.key} className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-sm shrink-0 ${p.color}`} />
            <span className="text-sm text-gray-300 flex-1">{p.label}</span>
            <span className="text-sm font-bold text-white tabular-nums">{p.fmt}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        {analise.horas}h de trabalho estimadas{analise.segundosIa ? ` · ${analise.segundosIa}s de vídeo com IA · ${analise.precoPorSegundo} por segundo entregue` : ''}.
        "Fica com você" inclui a remuneração das suas horas e a margem do negócio.
      </p>
    </div>
  );
}

interface Explanation { resumo: string; itens: { label: string; explicacao: string }[]; margem: string; defesa: string; alertas: string[] }

/** Explicação do orçamento com IA (os números continuam sendo os do motor). */
export function ExplainPanel({ input }: { input: unknown }) {
  const [data, setData] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await callTool<Explanation>('/api/tools/calculator/explain', { input });
      setData(res.data);
    } catch (e: any) {
      setError(e.message || 'Não foi possível explicar agora.');
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="p-6 rounded-2xl border border-brand-emerald/25 bg-brand-emerald/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold">Entenda cada item e como defender o preço</p>
          <p className="text-sm text-gray-400">A IA explica o cálculo em linguagem simples. Os valores não mudam: continuam os do cálculo matemático.</p>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <button type="button" onClick={run} disabled={loading}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {loading ? 'Explicando…' : 'Explicar com IA'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-brand-emerald/25 bg-brand-emerald/[0.04] space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-mint flex items-center gap-2"><Sparkles className="w-4 h-4" /> Explicação do orçamento</p>
        <p className="text-gray-200 mt-2 leading-relaxed">{data.resumo}</p>
      </div>
      <div className="space-y-2">
        {data.itens.map(i => (
          <div key={i.label} className="p-3 rounded-lg bg-black/25 border border-white/5">
            <p className="text-sm font-semibold text-white">{i.label}</p>
            <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{i.explicacao}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-black/25 border border-white/5">
          <p className="text-sm font-semibold text-white flex items-center gap-2"><PieChart className="w-4 h-4 text-brand-mint" /> Custos x margem</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{data.margem}</p>
        </div>
        <div className="p-4 rounded-xl bg-black/25 border border-white/5">
          <p className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquareQuote className="w-4 h-4 text-brand-mint" /> Como apresentar ao cliente</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">{data.defesa}</p>
        </div>
      </div>
      {data.alertas.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 space-y-1.5">
          <p className="text-sm font-semibold text-amber-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Pontos de atenção</p>
          {data.alertas.map(a => <p key={a} className="text-sm text-gray-300">• {a}</p>)}
        </div>
      )}
    </div>
  );
}
