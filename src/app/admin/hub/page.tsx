'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Film, RefreshCcw, Plus, Trash2, Check, X, Link2, Sparkles, ExternalLink, Settings2, Radar } from 'lucide-react';
import { formatCount, shortCodeFromUrl } from '@/lib/hub';

type Source = { id: string; nicho: string; type: 'keyword' | 'hashtag' | 'profile'; value: string; active: boolean };
type Pending = {
  id: string; url: string; author: string; thumb: string; views: number; likes: number; comments: number;
  score: number; caption: string; source: 'auto' | 'manual'; sourceNicho: string | null; aiStatus: 'todo' | 'done' | 'failed';
  ai?: { nicho: string; tema: string; formato: string; gancho: string; tipoGancho: string; porqueFuncionou: string; adequado: boolean };
};
type Run = { id: string; kind: string; status: string; ingested?: number; received?: number; duplicates?: number; belowMinViews?: number; notVideo?: number; createdAt: string };

const panel = 'neo-glass-panel rounded-2xl border border-white/5 overflow-hidden';
const panelHead = 'p-5 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between gap-3';
const input = 'bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm';

export default function AdminHubPage() {
  const { user } = useAuth();
  const [state, setState] = useState<{ sources: Source[]; settings: { minViews: number; perSource: number }; pending: Pending[]; approvedCount: number; runs: Run[] } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [newSource, setNewSource] = useState({ nicho: '', type: 'keyword', value: '' });
  const [manual, setManual] = useState({ links: '', nicho: '' });
  const [settings, setSettings] = useState({ minViews: '', perSource: '' });
  const [unpublishLink, setUnpublishLink] = useState('');
  const processing = useRef(false);

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const token = await user?.getIdToken();
    const res = await fetch('/api/hub/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.error || 'Falha na operação.');
    return json;
  }, [user]);

  const load = useCallback(async () => {
    try {
      const s = await call({ action: 'state' });
      setState(s);
      setSettings({ minViews: String(s.settings.minViews), perSource: String(s.settings.perSource) });
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    }
  }, [call]);

  useEffect(() => { if (user) load(); }, [user, load]);

  // Classifica a fila em lotes enquanto houver itens sem análise.
  const processQueue = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    setBusy('process');
    try {
      for (let i = 0; i < 40; i++) {
        const r = await call({ action: 'process' });
        await load();
        if (!r.processed) break;
      }
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      processing.current = false;
      setBusy('');
    }
  }, [call, load]);

  useEffect(() => {
    if (state?.pending.some(p => p.aiStatus === 'todo')) processQueue();
  }, [state, processQueue]);

  const run = async (key: string, payload: Record<string, unknown>, ok: (r: any) => string) => {
    setBusy(key);
    setMessage(null);
    try {
      const r = await call(payload);
      setMessage({ ok: true, text: ok(r) });
      await load();
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setBusy('');
    }
  };

  const ready = state?.pending.filter(p => p.aiStatus !== 'todo') || [];
  const nichos = Array.from(new Set(state?.sources.map(s => s.nicho) || []));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1 text-white flex items-center gap-2"><Film className="w-6 h-6 text-brand-emerald" /> Hub de Referências</h1>
          <p className="text-xs text-gray-400">
            {state ? `${state.approvedCount} vídeos publicados · ${state.pending.length} na fila` : 'Carregando…'}
          </p>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Atualizar</button>
      </div>

      {message && (
        <p className={`text-sm px-4 py-3 rounded-xl border ${message.ok ? 'text-brand-mint border-brand-emerald/30 bg-brand-emerald/5' : 'text-red-400 border-red-500/30 bg-red-500/5'}`}>{message.text}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Coleta automática */}
        <div className={panel}>
          <div className={panelHead}>
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Radar className="w-4 h-4 text-brand-emerald" /> Coleta automática</h2>
            <button disabled={!!busy}
              onClick={async () => {
                setBusy('collect'); setMessage(null);
                try {
                  const token = await user?.getIdToken();
                  const res = await fetch('/api/hub/collect', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{}' });
                  const json = await res.json();
                  if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao iniciar a coleta.');
                  setMessage({ ok: true, text: `Coleta iniciada em ${json.sources} fontes. Os reels entram na fila em alguns minutos; clique em Atualizar.` });
                  await load();
                } catch (e: any) { setMessage({ ok: false, text: e.message }); } finally { setBusy(''); }
              }}
              className="px-3 py-1.5 rounded-lg bg-brand-emerald text-black text-xs font-bold disabled:opacity-50">
              {busy === 'collect' ? 'Iniciando…' : 'Coletar agora'}
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[11px] text-gray-500">Roda sozinha toda segunda às 9h. Palavra-chave traz os reels em alta no Instagram para o termo; @perfil traz os reels mais recentes do perfil. Só entram na fila reels acima do mínimo de views, e nenhum reel que já passou pelo hub volta.</p>
            {state?.sources.some(s => s.type === 'hashtag') && (
              <div className="text-[11px] text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between gap-3">
                <span>Fontes por #hashtag não trazem reels. Troque pela lista de palavras-chave sugeridas.</span>
                <button onClick={() => run('migrate', { action: 'migrateHashtags' }, r => `${r.removed} hashtags trocadas pela lista de palavras-chave.`)} className="shrink-0 px-2.5 py-1 rounded-md bg-amber-500 text-black font-bold">Trocar</button>
              </div>
            )}
            <form className="grid grid-cols-1 md:grid-cols-4 gap-2" onSubmit={e => { e.preventDefault(); run('add', { action: 'addSource', ...newSource }, () => 'Fonte adicionada.').then(() => setNewSource({ ...newSource, value: '' })); }}>
              <input list="hub-nichos" required placeholder="Nicho" value={newSource.nicho} onChange={e => setNewSource({ ...newSource, nicho: e.target.value })} className={input} />
              <datalist id="hub-nichos">{nichos.map(n => <option key={n} value={n} />)}</datalist>
              <select value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })} className={input}>
                <option value="keyword">Palavra-chave</option>
                <option value="profile">@perfil</option>
              </select>
              <input required placeholder={newSource.type === 'keyword' ? 'receitas fáceis' : 'perfil'} value={newSource.value} onChange={e => setNewSource({ ...newSource, value: e.target.value })} className={input} />
              <button disabled={!!busy} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"><Plus className="w-4 h-4" /> Adicionar</button>
            </form>
            {state && state.sources.length === 0 && (
              <button onClick={() => run('seed', { action: 'seedSources' }, () => 'Lista sugerida carregada. Edite à vontade.')} className="text-xs text-brand-mint underline">Carregar lista sugerida de nichos e hashtags</button>
            )}
            <div className="max-h-72 overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-xl">
              {state?.sources.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className={s.active ? 'text-gray-200' : 'text-gray-600 line-through'}>
                    <span className="text-gray-500">{s.nicho} · </span>{s.type === 'profile' ? '@' : s.type === 'hashtag' ? '#' : ''}{s.value}
                  </span>
                  <span className="flex items-center gap-3">
                    <button onClick={() => run('toggle', { action: 'toggleSource', id: s.id, active: !s.active }, () => s.active ? 'Fonte pausada.' : 'Fonte ativada.')} className="text-[11px] text-gray-400 hover:text-white">{s.active ? 'Pausar' : 'Ativar'}</button>
                    <button onClick={() => run('remove', { action: 'removeSource', id: s.id }, () => 'Fonte removida.')} className="text-gray-500 hover:text-red-400" aria-label="Remover fonte"><Trash2 className="w-3.5 h-3.5" /></button>
                  </span>
                </div>
              ))}
            </div>
            <form className="flex flex-wrap items-end gap-3 pt-2" onSubmit={e => { e.preventDefault(); run('settings', { action: 'saveSettings', ...settings }, () => 'Configurações salvas.'); }}>
              <Settings2 className="w-4 h-4 text-gray-500 mb-2.5" />
              <label className="text-[11px] text-gray-400">Views mínimas
                <input type="number" value={settings.minViews} onChange={e => setSettings({ ...settings, minViews: e.target.value })} className={`${input} block w-32 mt-1`} />
              </label>
              <label className="text-[11px] text-gray-400">Posts por fonte
                <input type="number" value={settings.perSource} onChange={e => setSettings({ ...settings, perSource: e.target.value })} className={`${input} block w-24 mt-1`} />
              </label>
              <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold">Salvar</button>
            </form>
            {state && state.runs.length > 0 && (
              <div className="text-[11px] text-gray-500 space-y-1 pt-2">
                <p className="font-bold uppercase tracking-widest">Últimas coletas</p>
                {state.runs.map(r => (
                  <p key={r.id}>{new Date(r.createdAt).toLocaleString('pt-BR')} · {r.kind === 'manual' ? 'links manuais' : 'automática'} · {r.status === 'ingested'
                    ? `${r.ingested} novos de ${r.received} recebidos${r.duplicates ? ` · ${r.duplicates} repetidos ignorados` : ''}${r.belowMinViews ? ` · ${r.belowMinViews} abaixo do mínimo` : ''}${r.notVideo ? ` · ${r.notVideo} não eram vídeo` : ''}`
                    : 'em andamento'}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Curadoria manual */}
        <div className={panel}>
          <div className={panelHead}>
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-400" /> Adicionar por link</h2>
          </div>
          <form className="p-5 space-y-3" onSubmit={e => { e.preventDefault(); run('manual', { action: 'manual', ...manual }, r => `${r.count} link(s) enviados. Em 1 a 2 minutos eles aparecem na fila, são classificados pela IA e publicados automaticamente.`).then(() => setManual({ links: '', nicho: '' })); }}>
            <p className="text-[11px] text-gray-500">Cole links de reels (um por linha, até 30). Eles não passam pelo mínimo de views e entram direto no hub assim que a IA classificar.</p>
            <textarea required rows={6} value={manual.links} onChange={e => setManual({ ...manual, links: e.target.value })} placeholder="https://www.instagram.com/reel/…" className={`${input} w-full resize-y`} />
            <input list="hub-nichos" placeholder="Nicho (opcional — a IA sugere se vazio)" value={manual.nicho} onChange={e => setManual({ ...manual, nicho: e.target.value })} className={`${input} w-full`} />
            <button disabled={!!busy} className="w-full px-4 py-2 rounded-lg bg-brand-emerald text-black font-bold text-sm disabled:opacity-50">{busy === 'manual' ? 'Enviando…' : 'Adicionar ao hub'}</button>
          </form>
          <form className="px-5 pb-5 flex gap-2" onSubmit={e => {
            e.preventDefault();
            const id = shortCodeFromUrl(unpublishLink);
            if (!id) { setMessage({ ok: false, text: 'Link inválido.' }); return; }
            run('unpublish', { action: 'unpublish', id }, r => `Removido do hub. Restam ${r.count} vídeos.`).then(() => setUnpublishLink(''));
          }}>
            <input value={unpublishLink} onChange={e => setUnpublishLink(e.target.value)} placeholder="Link de um vídeo publicado para remover do hub" className={`${input} flex-1`} />
            <button disabled={!!busy} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Remover</button>
          </form>
        </div>
      </div>

      {/* Fila de aprovação */}
      <div className={panel}>
        <div className={panelHead}>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Fila de aprovação
            {busy === 'process' && <span className="text-[11px] font-normal text-gray-400">· IA classificando…</span>}
          </h2>
          {ready.length > 0 && (
            <div className="flex gap-2">
              <button disabled={!!busy} onClick={() => run('approveAll', { action: 'review', decision: 'approve', ids: ready.filter(p => p.ai?.adequado !== false).map(p => p.id) }, r => `Publicados. O hub tem ${r.count} vídeos.`)}
                className="px-3 py-1.5 rounded-lg bg-brand-emerald text-black text-xs font-bold disabled:opacity-50">Aprovar todos os classificados</button>
            </div>
          )}
        </div>
        <div className="p-5">
          {!state?.pending.length ? (
            <p className="text-center text-sm text-gray-500 py-8">Fila vazia. Rode uma coleta ou adicione links.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {state.pending.map(p => (
                <div key={p.id} className="flex gap-3 bg-black/30 border border-white/5 rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt="" className="w-24 h-40 object-cover rounded-lg bg-black shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                    <p className="flex items-center justify-between gap-2">
                      <a href={p.url} target="_blank" rel="noreferrer" className="font-bold text-white truncate hover:underline flex items-center gap-1">@{p.author} <ExternalLink className="w-3 h-3" /></a>
                      <span className="px-1.5 py-0.5 rounded bg-brand-emerald/15 text-brand-mint font-bold shrink-0">{p.score}</span>
                    </p>
                    <p className="text-gray-500">{formatCount(p.views)} views · {formatCount(p.likes)} curtidas · {p.source === 'manual' ? 'link manual' : p.sourceNicho}</p>
                    {p.aiStatus === 'todo' && <p className="text-gray-400 italic">Aguardando classificação…</p>}
                    {p.aiStatus === 'failed' && <p className="text-red-400">A IA não conseguiu classificar.</p>}
                    {p.ai && (
                      <>
                        <p className="text-gray-200 font-semibold">{p.ai.tema}</p>
                        <p className="text-gray-400">{p.ai.nicho} · {p.ai.formato} · gancho: {p.ai.tipoGancho}</p>
                        <p className="text-gray-500 line-clamp-2">{p.ai.porqueFuncionou}</p>
                        {!p.ai.adequado && <p className="text-amber-300 font-semibold">IA marcou como inadequado</p>}
                      </>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button disabled={!!busy || p.aiStatus === 'todo'} onClick={() => run('review', { action: 'review', decision: 'approve', ids: [p.id] }, () => 'Publicado no hub.')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-emerald/20 text-brand-mint border border-brand-emerald/40 font-semibold disabled:opacity-40"><Check className="w-3 h-3" /> Aprovar</button>
                      <button disabled={!!busy} onClick={() => run('review', { action: 'review', decision: 'reject', ids: [p.id] }, () => 'Descartado.')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 text-gray-300 border border-white/10 font-semibold disabled:opacity-40"><X className="w-3 h-3" /> Descartar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
