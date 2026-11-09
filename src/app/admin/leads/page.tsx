'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Download, Loader2, MailCheck, MailWarning, MessageCircle, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';

type Lead = {
  id: string; email: string; name: string; instagram: string; whatsapp: string; sources: string[]; keywords: string[];
  campaign: string; createdAt: string | null; lastSeenAt: string | null; marketingConsentAt: string | null; welcomeEmail: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  pre_lista: 'Pré-lista', manychat: 'ManyChat', isca: 'Isca', lista_antiga: 'Lista antiga', manual: 'Manual',
};
const sourceLabel = (s: string) => SOURCE_LABEL[s] || s;
const PAGE = 100;
const WEEK = 7 * 24 * 60 * 60 * 1000;

const dateBR = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
/** Número para o link do WhatsApp: acrescenta o 55 só quando ele ainda não veio. */
const waNumber = (v: string) => { const d = v.replace(/\D/g, ''); return d.startsWith('55') && d.length >= 12 ? d : `55${d}`; };
/** Célula de CSV: entre aspas e sem virar fórmula na planilha (os dados vêm de um formulário público). */
const csvCell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="neo-glass-panel rounded-2xl border border-white/5 p-5">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</p>
      <p className="text-3xl font-extrabold text-white tabular-nums mt-1">{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

/** Todos os leads da plataforma: pré-lista (/lista), ManyChat, iscas e cadastros manuais. */
export default function AdminLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', whatsapp: '', instagram: '' });

  const api = useCallback(async (init: RequestInit = {}, query = '') => {
    const token = await user?.getIdToken();
    const res = await fetch(`/api/admin/leads${query}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.error || 'Falha na operação.');
    return json;
  }, [user]);

  const load = useCallback(async () => {
    setError('');
    try { setLeads((await api()).leads); } catch (e: any) { setError(e.message); setLeads(l => l ?? []); }
  }, [api]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const all = useMemo(() => leads ?? [], [leads]);
  const sources = useMemo(() => {
    const count: Record<string, number> = {};
    all.forEach(l => l.sources.forEach(s => { count[s] = (count[s] || 0) + 1; }));
    return Object.entries(count).sort((a, b) => b[1] - a[1]);
  }, [all]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(l => (!source || l.sources.includes(source))
      && (!q || [l.name, l.email, l.instagram, l.whatsapp, l.campaign, ...l.keywords].some(v => v.toLowerCase().includes(q))));
  }, [all, search, source]);

  const [weekAgo] = useState(() => Date.now() - WEEK);
  const lastWeek = all.filter(l => l.createdAt && new Date(l.createdAt).getTime() >= weekAgo).length;

  const remove = async (lead: Lead) => {
    if (!confirm(`Excluir o lead ${lead.email}? Essa ação não pode ser desfeita.`)) return;
    setBusy(true);
    try { await api({ method: 'DELETE' }, `?id=${encodeURIComponent(lead.id)}`); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api({ method: 'POST', body: JSON.stringify(draft) });
      setDraft({ name: '', email: '', whatsapp: '', instagram: '' });
      setShowAdd(false);
      await load();
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };

  const exportCsv = () => {
    const head = ['Nome', 'E-mail', 'Instagram', 'WhatsApp', 'Origens', 'Palavras-chave', 'Campanha', 'Aceite', 'Entrou em'];
    const lines = filtered.map(l => [l.name, l.email, l.instagram, l.whatsapp, l.sources.map(sourceLabel).join(', '), l.keywords.join(', '), l.campaign, l.marketingConsentAt ? 'sim' : '', l.createdAt || ''].map(csvCell).join(';'));
    const url = URL.createObjectURL(new Blob([`﻿${[head.join(';'), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-creator-lab-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const input = 'px-3 py-2 bg-black/50 border border-white/10 rounded text-xs text-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Pré-lista (/lista), ManyChat, iscas e cadastros manuais, sem repetir e-mail.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white" aria-label="Atualizar"><RefreshCcw className="w-4 h-4" /></button>
          <button type="button" onClick={exportCsv} disabled={!filtered.length} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-40"><Download className="w-3.5 h-3.5" /> Exportar CSV</button>
          <button type="button" onClick={() => setShowAdd(v => !v)} className="px-3 py-2 rounded-lg bg-brand-emerald/15 border border-brand-emerald/30 text-xs font-bold text-brand-mint flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Adicionar lead</button>
        </div>
      </div>

      {error && <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total de leads" value={all.length} />
        <Stat label="Últimos 7 dias" value={lastWeek} />
        <Stat label="Com WhatsApp" value={all.filter(l => l.whatsapp).length} />
        <Stat label="Com Instagram" value={all.filter(l => l.instagram).length} />
      </div>

      {showAdd && (
        <form onSubmit={add} className="neo-glass-panel rounded-2xl border border-white/5 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input required placeholder="Nome" aria-label="Nome" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className={input} />
          <input required type="email" placeholder="E-mail" aria-label="E-mail" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} className={input} />
          <input placeholder="WhatsApp" aria-label="WhatsApp" value={draft.whatsapp} onChange={e => setDraft({ ...draft, whatsapp: e.target.value })} className={input} />
          <input placeholder="@instagram" aria-label="Instagram" value={draft.instagram} onChange={e => setDraft({ ...draft, instagram: e.target.value })} className={input} />
          <button type="submit" disabled={busy} className="rounded bg-brand-emerald text-black text-xs font-bold disabled:opacity-50">Salvar lead</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setLimit(PAGE); }} placeholder="Buscar por nome, e-mail, @, WhatsApp, campanha..." aria-label="Buscar leads"
            className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/50" />
        </label>
        {[['', `Todas (${all.length})`] as const, ...sources.map(([s, n]) => [s, `${sourceLabel(s)} (${n})`] as const)].map(([id, label]) => (
          <button key={id || 'all'} type="button" onClick={() => { setSource(id); setLimit(PAGE); }} aria-pressed={source === id}
            className={`px-3 py-2 rounded-full border text-[11px] font-semibold ${source === id ? 'bg-brand-emerald/15 border-brand-emerald/50 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="neo-glass-panel rounded-2xl border border-white/5 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[820px]">
          <thead className="bg-[#050505] text-gray-500">
            <tr>
              {['Lead', 'Contato', 'Origem', 'Campanha', 'Entrou em', ''].map(h => <th key={h} className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads === null && <tr><td colSpan={6} className="px-4 py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand-mint inline" /></td></tr>}
            {leads !== null && !filtered.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Nenhum lead encontrado.</td></tr>}
            {filtered.slice(0, limit).map(l => (
              <tr key={l.id} data-lead-row className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-200">{l.name || '—'}</div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    {l.email}
                    {l.welcomeEmail === 'sent' && <MailCheck className="w-3 h-3 text-brand-mint" aria-label="Boas-vindas enviado" />}
                    {l.welcomeEmail === 'failed' && <MailWarning className="w-3 h-3 text-amber-400" aria-label="Boas-vindas falhou" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {l.instagram && <a href={`https://instagram.com/${l.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label={`Instagram de ${l.name || l.email}`} className="p-1.5 bg-pink-500/10 text-pink-500 rounded hover:bg-pink-500/20"><Camera className="w-3.5 h-3.5" /></a>}
                    {l.whatsapp && <a href={`https://wa.me/${waNumber(l.whatsapp)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${l.name || l.email}`} className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20"><MessageCircle className="w-3.5 h-3.5" /></a>}
                    {!l.instagram && !l.whatsapp && <span className="text-gray-600">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.sources.map(s => <span key={s} className="px-2 py-0.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-semibold text-brand-mint">{sourceLabel(s)}</span>)}
                    {l.keywords.map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300">{k}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{l.campaign || '—'}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{dateBR(l.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => remove(l)} disabled={busy} aria-label={`Excluir ${l.email}`} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <button type="button" onClick={() => setLimit(n => n + PAGE)} className="mx-auto block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white">
          Mostrar mais ({filtered.length - limit} restantes)
        </button>
      )}
    </div>
  );
}
