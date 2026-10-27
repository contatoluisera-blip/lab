'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, RefreshCcw, Search, AlertTriangle, CalendarClock, CheckCircle2, RotateCw, X } from 'lucide-react';

type Issue = 'pagamento_pendente' | 'renovacao_atrasada' | 'assinatura_encerrada' | 'sem_assinatura_vinculada' | 'creditos_esgotados';
type AdminUser = {
  uid: string; name: string; email: string; createdAt: string | null;
  plan: 'start' | 'pro' | 'elite' | null; planLabel: string | null;
  status: 'active' | 'manual' | 'payment_issue' | 'none'; statusLabel: string;
  credits: number; planCredits: number; renewsAt: string | null; daysToRenewal: number | null;
  stripeStatus: string | null; hasStripe: boolean; manualGrant: { by?: string; at?: string } | null;
  source: string | null; issues: Issue[];
};

/** Texto e gravidade de cada irregularidade (o que o admin deve fazer está no título). */
const ISSUE: Record<Issue, { label: string; hint: string; tone: 'critical' | 'warning' }> = {
  pagamento_pendente: { label: 'Pagamento pendente', hint: 'Cartão recusado ou fatura em aberto na Stripe. O uso está bloqueado até o pagamento.', tone: 'critical' },
  renovacao_atrasada: { label: 'Renovação atrasada', hint: 'A Stripe indica assinatura ativa, mas a data de renovação já passou. Use "Sincronizar com a Stripe".', tone: 'critical' },
  assinatura_encerrada: { label: 'Assinatura encerrada', hint: 'A assinatura foi cancelada na Stripe, mas a conta ainda tem plano. Sincronize ou remova o plano.', tone: 'critical' },
  sem_assinatura_vinculada: { label: 'Sem assinatura vinculada', hint: 'Plano sem assinatura na Stripe e sem concessão registrada (conta antiga).', tone: 'warning' },
  creditos_esgotados: { label: 'Créditos esgotados', hint: 'Plano ativo com saldo zero.', tone: 'warning' },
};

const FILTERS = [
  { id: 'plans', label: 'Com plano' },
  { id: 'issues', label: 'Com irregularidade' },
  { id: 'payment', label: 'Pagamento pendente' },
  { id: 'soon', label: 'Renovam em até 7 dias' },
  { id: 'manual', label: 'Concessão manual' },
  { id: 'none', label: 'Sem plano' },
  { id: 'all', label: 'Todos' },
] as const;

const toneText = { critical: 'text-red-400', warning: 'text-amber-300' };
const toneChip = { critical: 'bg-red-500/10 border-red-500/30 text-red-300', warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
const input = 'bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm';

function renewalText(u: AdminUser) {
  if (u.status === 'payment_issue') return { text: 'Suspensa até o pagamento', tone: 'text-red-400' };
  if (u.status !== 'active') return { text: u.status === 'manual' ? 'Sem renovação automática' : '—', tone: 'text-gray-500' };
  if (u.daysToRenewal === null) return { text: 'Data não sincronizada', tone: 'text-amber-300' };
  const date = u.renewsAt ? new Date(u.renewsAt).toLocaleDateString('pt-BR') : '';
  if (u.daysToRenewal < 0) return { text: `Atrasada há ${-u.daysToRenewal} dia(s)`, tone: 'text-red-400' };
  if (u.daysToRenewal === 0) return { text: `Hoje · ${date}`, tone: 'text-amber-300' };
  return { text: `Em ${u.daysToRenewal} dia(s) · ${date}`, tone: u.daysToRenewal <= 3 ? 'text-amber-300' : 'text-gray-300' };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  // Padrão: só quem tem plano (ativo, concessão ou pagamento pendente); contas sem plano ficam no filtro próprio.
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('plans');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ plan: 'elite', credits: '', adjust: '' });

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const token = await user?.getIdToken();
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.error || 'Falha na operação.');
    return json;
  }, [user]);

  const load = useCallback(async () => {
    try { setUsers((await call({ action: 'list' })).users); } catch (e: any) { setMessage({ ok: false, text: e.message }); }
  }, [call]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const act = async (key: string, payload: Record<string, unknown>, ok: string) => {
    setBusy(key); setMessage(null);
    try {
      const r = await call(payload);
      setUsers(prev => prev ? prev.map(u => (u.uid === r.user.uid ? r.user : u)) : prev);
      setMessage({ ok: true, text: ok });
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setBusy('');
    }
  };

  const summary = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      stripe: list.filter(u => u.status === 'active').length,
      manual: list.filter(u => u.status === 'manual').length,
      payment: list.filter(u => u.status === 'payment_issue').length,
      soon: list.filter(u => u.daysToRenewal !== null && u.daysToRenewal >= 0 && u.daysToRenewal <= 7).length,
      critical: list.filter(u => u.issues.some(i => ISSUE[i].tone === 'critical')).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users || []).filter(u => {
      if (term && !`${u.name} ${u.email}`.toLowerCase().includes(term)) return false;
      if (filter === 'plans') return u.status !== 'none';
      if (filter === 'issues') return u.issues.length > 0;
      if (filter === 'payment') return u.status === 'payment_issue';
      if (filter === 'soon') return u.daysToRenewal !== null && u.daysToRenewal >= 0 && u.daysToRenewal <= 7;
      if (filter === 'manual') return u.status === 'manual';
      if (filter === 'none') return u.status === 'none';
      return true;
    }).sort((a, b) => b.issues.filter(i => ISSUE[i].tone === 'critical').length - a.issues.filter(i => ISSUE[i].tone === 'critical').length);
  }, [users, q, filter]);

  const critical = (users || []).filter(u => u.issues.some(i => ISSUE[i].tone === 'critical'));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1 text-white flex items-center gap-2"><Users className="w-6 h-6 text-brand-emerald" /> Usuários</h1>
          <p className="text-xs text-gray-400">Plano, situação, créditos e renovação de cada conta, com ações manuais registradas no extrato.</p>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Atualizar</button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          ['Contas', summary.total, 'text-white'],
          ['Assinatura ativa (Stripe)', summary.stripe, 'text-brand-mint'],
          ['Concessão manual', summary.manual, 'text-blue-300'],
          ['Pagamento pendente', summary.payment, summary.payment ? 'text-red-400' : 'text-white'],
          ['Renovam em até 7 dias', summary.soon, 'text-amber-300'],
          ['Irregularidades graves', summary.critical, summary.critical ? 'text-red-400' : 'text-white'],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="neo-glass-panel rounded-2xl border border-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${tone}`}>{users ? value : '…'}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {critical.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
          <p className="text-sm font-bold text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {critical.length} conta(s) precisam de atenção</p>
          {critical.slice(0, 6).map(u => (
            <button key={u.uid} onClick={() => { setOpen(u.uid); setQ(u.email); setFilter('plans'); }} className="block w-full text-left text-xs text-gray-300 hover:text-white">
              <span className="font-semibold">{u.email}</span> · {u.issues.filter(i => ISSUE[i].tone === 'critical').map(i => ISSUE[i].label).join(', ')}
            </button>
          ))}
        </div>
      )}

      {message && (
        <p className={`text-sm px-4 py-3 rounded-xl border ${message.ok ? 'text-brand-mint border-brand-emerald/30 bg-brand-emerald/5' : 'text-red-400 border-red-500/30 bg-red-500/5'}`}>{message.text}</p>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === f.id ? 'bg-brand-emerald/20 border-brand-emerald/50 text-white' : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'}`}>{f.label}</button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail" className={`${input} w-full pl-9`} />
        </div>
      </div>

      {/* Lista */}
      <div className="neo-glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2fr_0.9fr_1.1fr_1fr_1.4fr_1.6fr] gap-3 px-5 py-3 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Usuário</span><span>Plano</span><span>Situação</span><span>Créditos</span><span>Renovação</span><span>Irregularidades</span>
        </div>
        {!users ? <p className="p-8 text-center text-sm text-gray-500">Carregando…</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">Nenhuma conta com esse filtro.</p> : (
          <div className="divide-y divide-white/5">
            {filtered.map(u => {
              const ren = renewalText(u);
              const isOpen = open === u.uid;
              return (
                <div key={u.uid}>
                  <button onClick={() => { setOpen(isOpen ? null : u.uid); setForm({ plan: u.plan || 'elite', credits: '', adjust: String(u.credits) }); }}
                    className="w-full grid grid-cols-1 lg:grid-cols-[2fr_0.9fr_1.1fr_1fr_1.4fr_1.6fr] gap-2 lg:gap-3 px-5 py-4 text-left hover:bg-white/[0.02]">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{u.name || u.email.split('@')[0]}</span>
                      <span className="block text-xs text-gray-500 truncate">{u.email}{u.source ? ` · origem: ${u.source}` : ''}</span>
                    </span>
                    <span className="text-sm text-gray-200">{u.planLabel || <span className="text-gray-500">Sem plano</span>}</span>
                    <span className={`text-sm ${u.status === 'payment_issue' ? 'text-red-400' : u.status === 'active' ? 'text-brand-mint' : u.status === 'manual' ? 'text-blue-300' : 'text-gray-500'}`}>
                      {u.status === 'manual' ? 'Concessão manual' : u.statusLabel}
                    </span>
                    <span className="text-sm text-gray-200">{u.plan ? `${u.credits} / ${u.planCredits}` : u.credits}</span>
                    <span className={`text-sm ${ren.tone} flex items-center gap-1.5`}><CalendarClock className="w-3.5 h-3.5 shrink-0" /> {ren.text}</span>
                    <span className="flex flex-wrap gap-1">
                      {u.issues.length === 0 ? <span className="text-xs text-gray-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ok</span> : u.issues.map(i => (
                        <span key={i} title={ISSUE[i].hint} className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${toneChip[ISSUE[i].tone]}`}>{ISSUE[i].label}</span>
                      ))}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4 bg-black/20">
                      {u.issues.map(i => <p key={i} className={`text-xs ${toneText[ISSUE[i].tone]}`}>• {ISSUE[i].label}: {ISSUE[i].hint}</p>)}
                      <p className="text-[11px] text-gray-500">
                        Stripe: {u.hasStripe ? (u.stripeStatus || 'sem status') : 'sem assinatura'}
                        {u.manualGrant?.by ? ` · última concessão por ${u.manualGrant.by}${u.manualGrant.at ? ` em ${new Date(u.manualGrant.at).toLocaleDateString('pt-BR')}` : ''}` : ''}
                        {u.createdAt ? ` · conta criada em ${new Date(u.createdAt).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/5 p-3 space-y-2">
                          <p className="text-xs font-bold text-white">Sincronizar com a Stripe</p>
                          <p className="text-[11px] text-gray-500">Busca a assinatura na Stripe e corrige plano, situação e data de renovação. Não altera créditos.</p>
                          <button disabled={!!busy || !u.hasStripe} onClick={() => act('sync', { action: 'sync', uid: u.uid }, 'Conta sincronizada com a Stripe.')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold disabled:opacity-40"><RotateCw className="w-3.5 h-3.5" /> {busy === 'sync' ? 'Sincronizando…' : 'Sincronizar'}</button>
                          {!u.hasStripe && <p className="text-[10px] text-gray-600">Conta sem assinatura na Stripe.</p>}
                        </div>
                        <div className="rounded-xl border border-white/5 p-3 space-y-2">
                          <p className="text-xs font-bold text-white">Definir plano e créditos</p>
                          <div className="flex gap-2">
                            <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className={`${input} flex-1`}>
                              <option value="start">Start (20)</option><option value="pro">Pro (50)</option><option value="elite">Elite (100)</option>
                            </select>
                            <input type="number" min={0} placeholder="padrão" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} className={`${input} w-24`} />
                          </div>
                          <button disabled={!!busy} onClick={() => act('setPlan', { action: 'setPlan', uid: u.uid, plan: form.plan, credits: form.credits }, 'Plano e créditos definidos (concessão manual).')}
                            className="px-3 py-1.5 rounded-lg bg-brand-emerald text-black text-xs font-bold disabled:opacity-40">{busy === 'setPlan' ? 'Salvando…' : 'Aplicar'}</button>
                        </div>
                        <div className="rounded-xl border border-white/5 p-3 space-y-2">
                          <p className="text-xs font-bold text-white">Ajustar só os créditos</p>
                          <div className="flex gap-2">
                            <input type="number" min={0} value={form.adjust} onChange={e => setForm({ ...form, adjust: e.target.value })} className={`${input} flex-1`} />
                            <button disabled={!!busy} onClick={() => act('setCredits', { action: 'setCredits', uid: u.uid, credits: form.adjust }, 'Créditos ajustados.')}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold disabled:opacity-40">{busy === 'setCredits' ? '…' : 'Salvar'}</button>
                          </div>
                          {u.plan && (
                            <button disabled={!!busy} onClick={() => { if (confirm(`Remover o plano de ${u.email}? Os créditos vão a zero. A assinatura na Stripe não é cancelada.`)) act('removePlan', { action: 'removePlan', uid: u.uid }, 'Plano removido.'); }}
                              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 disabled:opacity-40"><X className="w-3 h-3" /> Remover plano</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
