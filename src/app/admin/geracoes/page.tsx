'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RefreshCcw, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

type Job = {
  id: string; uid: string; email: string; userBlocked: boolean; kind: 'image' | 'video'; mode: string; modelName: string;
  status: string; prompt: string; credits: number; refunded: boolean; outputs: { url: string; type: string }[];
  error: string | null; expectedBrl: number; realBrl: number | null; costMismatch: boolean; createdAt: string;
};
type Blocked = { id: string; uid: string; email: string; prompt: string; modelId: string; createdAt: string };
type Summary = { total: number; queued: number; processing: number; failed: number; creditsCharged: number; costBrl: number; mismatches: number };

const STATUS: Record<string, string> = {
  queued: 'Na fila', submitting: 'Enviando', processing: 'Gerando', finalizing: 'Finalizando', completed: 'Pronto', failed: 'Falhou',
};
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Moderação e custo da geração de imagens e vídeos. */
export default function AdminGenerationsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ jobs: Job[]; blocked: Blocked[]; summary: Summary } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState('');

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const token = await user?.getIdToken();
    const res = await fetch('/api/admin/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.error || 'Falha na operação.');
    return json;
  }, [user]);

  const load = useCallback(async () => {
    try { setData((await call({ action: 'list' })).data); } catch (e: any) { setMessage({ ok: false, text: e.message }); }
  }, [call]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const toggleBlock = async (uid: string, email: string, block: boolean) => {
    const reason = block ? window.prompt(`Motivo do bloqueio de ${email}:`, 'Violação dos termos de uso da geração') : null;
    if (block && reason === null) return;
    setBusy(uid);
    try {
      await call({ action: block ? 'block' : 'unblock', uid, reason });
      setMessage({ ok: true, text: block ? `Geração bloqueada para ${email}.` : `Geração liberada para ${email}.` });
      await load();
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setBusy('');
    }
  };

  const s = data?.summary;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerações</h1>
          <p className="text-sm text-gray-400">As 120 gerações mais recentes, o custo previsto e o real, e os pedidos barrados pelo filtro.</p>
        </div>
        <button type="button" onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10">
          <RefreshCcw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {message && <p className={`text-sm ${message.ok ? 'text-emerald-400' : 'text-red-400'}`}>{message.text}</p>}

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Na fila / gerando', `${s.queued} / ${s.processing}`],
            ['Falhas (estornadas)', String(s.failed)],
            ['Créditos cobrados', String(s.creditsCharged)],
            ['Custo de IA (concluídas)', brl(s.costBrl)],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
              <p className="text-xl font-bold text-white tabular-nums mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}
      {s && s.mismatches > 0 && (
        <p className="flex items-center gap-2 text-sm text-amber-300"><AlertTriangle className="w-4 h-4" /> {s.mismatches} geração(ões) consumiram mais de 15% acima do previsto na KIE. Revise o preço do modelo em src/lib/generation.ts.</p>
      )}

      {data && data.blocked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Pedidos barrados pelo filtro</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm min-w-[720px]">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                <th className="p-3">Quando</th><th className="p-3">Conta</th><th className="p-3">Prompt</th><th className="p-3" />
              </tr></thead>
              <tbody>
                {data.blocked.map(b => (
                  <tr key={b.id} className="border-b border-white/5 align-top">
                    <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(b.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-gray-300">{b.email || b.uid}</td>
                    <td className="p-3 text-gray-400 max-w-md"><span className="line-clamp-3">{b.prompt}</span></td>
                    <td className="p-3 text-right">
                      <button type="button" disabled={busy === b.uid} onClick={() => toggleBlock(b.uid, b.email, true)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20">Bloquear</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Gerações recentes</h2>
        {!data && <p className="text-sm text-gray-500">Carregando…</p>}
        {data?.jobs.length === 0 && <p className="text-sm text-gray-500">Nenhuma geração ainda.</p>}
        {data && data.jobs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm min-w-[980px]">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                <th className="p-3">Quando</th><th className="p-3">Conta</th><th className="p-3">Modelo</th><th className="p-3">Status</th>
                <th className="p-3">Prompt</th><th className="p-3 text-right">Créditos</th><th className="p-3 text-right">Custo previsto / real</th><th className="p-3" />
              </tr></thead>
              <tbody>
                {data.jobs.map(j => (
                  <tr key={j.id} className="border-b border-white/5 align-top">
                    <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(j.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-gray-300">
                      {j.email || j.uid}
                      {j.userBlocked && <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 text-[10px]">bloqueada</span>}
                    </td>
                    <td className="p-3 text-gray-300 whitespace-nowrap">{j.modelName}<span className="block text-[10px] text-gray-500 uppercase">{j.mode}</span></td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={j.status === 'failed' ? 'text-red-300' : j.status === 'completed' ? 'text-emerald-300' : 'text-amber-300'}>{STATUS[j.status] || j.status}</span>
                      {j.refunded && <span className="block text-[10px] text-gray-500">estornado</span>}
                      {j.outputs[0] && (
                        <a href={j.outputs[0].url} target="_blank" rel="noopener" className="mt-1 flex items-center gap-1 text-[11px] text-brand-mint hover:underline">
                          Abrir <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-gray-400 max-w-sm"><span className="line-clamp-3">{j.prompt}</span>{j.error && <span className="block text-[11px] text-red-300 mt-1">{j.error}</span>}</td>
                    <td className="p-3 text-right text-gray-200 tabular-nums">{j.credits}</td>
                    <td className={`p-3 text-right tabular-nums whitespace-nowrap ${j.costMismatch ? 'text-amber-300' : 'text-gray-300'}`}>
                      {brl(j.expectedBrl)} / {j.realBrl == null ? '—' : brl(j.realBrl)}
                    </td>
                    <td className="p-3 text-right">
                      <button type="button" disabled={busy === j.uid} onClick={() => toggleBlock(j.uid, j.email, !j.userBlocked)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border ${j.userBlocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                        {j.userBlocked ? <><ShieldCheck className="w-3.5 h-3.5" /> Liberar</> : <><ShieldAlert className="w-3.5 h-3.5" /> Bloquear</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
