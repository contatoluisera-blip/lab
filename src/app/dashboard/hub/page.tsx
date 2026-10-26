'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Compass, Search, Heart, Eye, X, ExternalLink, Lightbulb, Clapperboard, Flame, Target, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { HUB_FORMATS, HubItem, formatCount, hubSearchText, normalizeText } from '@/lib/hub';

const PAGE = 24;
const PERIODS = [
  { id: 'all', label: 'Qualquer data', days: Infinity },
  { id: '30', label: 'Últimos 30 dias', days: 30 },
  { id: '90', label: 'Últimos 3 meses', days: 90 },
  { id: '365', label: 'Último ano', days: 365 },
];
const SORTS = [
  { id: 'score', label: 'Mais virais' },
  { id: 'recent', label: 'Mais recentes' },
  { id: 'views', label: 'Mais views' },
];

export default function HubPage() {
  const { user } = useAuth();
  const { hasToolAccess, profileLoading } = useUserProfile();

  const [items, setItems] = useState<(HubItem & { _search: string })[]>([]);
  const [nichos, setNichos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [q, setQ] = useState('');
  const [nicho, setNicho] = useState('');
  const [formato, setFormato] = useState('');
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState('score');
  const [onlyFav, setOnlyFav] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [open, setOpen] = useState<HubItem | null>(null);

  // Catálogo: poucas leituras por visita (uma página guarda centenas de vídeos).
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const meta = await getDoc(doc(db, 'hub_catalog', 'meta'));
        if (meta.exists()) {
          const { pages, nichos } = meta.data() as { pages: number; nichos: string[] };
          const all = await Promise.all(Array.from({ length: pages }, (_, p) => getDoc(doc(db, 'hub_catalog', `page_${p}`))));
          const loaded = all.flatMap(s => (s.exists() ? (s.data().items as HubItem[]) : [])).map(i => ({ ...i, _search: hubSearchText(i) }));
          setItems(loaded);
          setNichos(nichos || []);
          // Vindo de "Referências salvas" (?open=<id>): abre o reel direto.
          const openId = new URLSearchParams(window.location.search).get('open');
          const target = openId && loaded.find(i => i.id === openId);
          if (target) setOpen(target);
        }
        const favs = await getDocs(collection(db, 'users', user.uid, 'hub_favorites'));
        setFavorites(new Set(favs.docs.map(d => d.id)));
      } catch (e) {
        console.error('[hub] falha ao carregar catálogo:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const terms = normalizeText(q).split(/\s+/).filter(Boolean);
    const maxAge = PERIODS.find(p => p.id === period)!.days;
    const now = Date.now();
    const list = items.filter(i =>
      (!nicho || i.nicho === nicho) &&
      (!formato || i.formato === formato) &&
      (!onlyFav || favorites.has(i.id)) &&
      (maxAge === Infinity || (i.postedAt && (now - new Date(i.postedAt).getTime()) / 86_400_000 <= maxAge)) &&
      terms.every(t => i._search.includes(t))
    );
    const by: Record<string, (a: HubItem, b: HubItem) => number> = {
      score: (a, b) => b.score - a.score,
      recent: (a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''),
      views: (a, b) => b.views - a.views,
    };
    return list.sort(by[sort]);
  }, [items, q, nicho, formato, period, sort, onlyFav, favorites]);

  useEffect(() => { setVisible(PAGE); }, [q, nicho, formato, period, sort, onlyFav]);

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'hub_favorites', id);
    const next = new Set(favorites);
    if (next.has(id)) { next.delete(id); await deleteDoc(ref).catch(() => {}); }
    else { next.add(id); await setDoc(ref, { createdAt: new Date().toISOString() }).catch(() => {}); }
    setFavorites(next);
  };

  if (!profileLoading && !hasToolAccess('hub')) {
    return (
      <div className="max-w-xl mx-auto pt-16">
        <GlassCard className="p-8 text-center space-y-4">
          <Compass className="w-12 h-12 text-brand-jade mx-auto" />
          <h1 className="text-2xl font-bold text-white">Hub de Referências</h1>
          <p className="text-gray-400 text-sm">Reels que viralizaram, analisados por IA, para você se inspirar.</p>
          <UpgradeGate locked requiredPlan="Pro" mode="button" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-jade bg-brand-jade/10 text-sm font-medium w-fit mb-2">
          <Compass className="w-4 h-4" />
          <span className="text-white">Inspiração</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Hub de Referências</h1>
        <p className="text-gray-400">Reels que viralizaram, com a análise do porquê. Explore, busque por tema e transforme em ideia ou prompt.</p>
      </div>

      {/* Busca e filtros */}
      <GlassCard className="p-4 space-y-3 border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Busque por tema, gancho, formato, palavra-chave ou @perfil"
            className="w-full glass-input !pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={nicho} onChange={e => setNicho(e.target.value)} className="glass-input text-sm !w-auto">
            <option value="">Todos os nichos</option>
            {nichos.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={formato} onChange={e => setFormato(e.target.value)} className="glass-input text-sm !w-auto">
            <option value="">Todos os formatos</option>
            {HUB_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="glass-input text-sm !w-auto">
            {PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="glass-input text-sm !w-auto">
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" onClick={() => setOnlyFav(!onlyFav)}
            className={`flex items-center gap-1.5 px-3 rounded-xl text-sm font-medium border transition-colors ${onlyFav ? 'bg-pink-500/15 border-pink-500/40 text-pink-300' : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'}`}>
            <Heart className={`w-4 h-4 ${onlyFav ? 'fill-current' : ''}`} /> Favoritos
          </button>
        </div>
      </GlassCard>

      {/* Grade */}
      {loading ? (
        <p className="text-center text-gray-500 py-16">Carregando referências…</p>
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center opacity-70 border-white/5">
          <Compass className="w-12 h-12 text-brand-jade/40 mx-auto mb-3" />
          <p className="text-gray-400">O hub ainda está sendo abastecido. Volte em breve.</p>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-16">Nenhuma referência com esses filtros. Tente outra busca.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">{filtered.length} referência{filtered.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.slice(0, visible).map(item => (
              <button key={item.id} type="button" onClick={() => setOpen(item)}
                className="group text-left rounded-2xl overflow-hidden border border-white/5 bg-black/30 hover:border-brand-jade/40 transition-all hover:-translate-y-0.5">
                <div className="relative aspect-[9/16] bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumb} alt={item.tema} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                  <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-[11px] font-bold text-orange-300"><Flame className="w-3 h-3" />{item.score}</span>
                  {favorites.has(item.id) && <Heart className="absolute top-2 right-2 w-4 h-4 text-pink-400 fill-current" />}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] text-white/90 flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(item.views)}</p>
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{item.tema}</p>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-gray-400 truncate">@{item.author}</p>
                  <p className="text-[10px] text-brand-mint truncate">{item.nicho} · {item.formato}</p>
                </div>
              </button>
            ))}
          </div>
          {visible < filtered.length && (
            <div className="text-center">
              <button onClick={() => setVisible(v => v + PAGE)} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10">Carregar mais</button>
            </div>
          )}
        </>
      )}

      {/* Detalhe: vídeo pelo embed oficial do Instagram + análise da IA */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(null)}>
          <div className="relative w-full max-w-5xl bg-[#0b0f0d] border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/70 text-white hover:bg-black" aria-label="Fechar"><X className="w-4 h-4" /></button>
            <div className="bg-black flex items-center justify-center min-h-[480px]">
              <iframe
                key={open.id}
                src={`https://www.instagram.com/p/${open.id}/embed/`}
                className="w-full h-[640px] max-h-[80vh] border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`Reel de @${open.author}`}
              />
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
              <div>
                <p className="text-xs text-brand-mint font-semibold">{open.nicho} · {open.formato}</p>
                <h2 className="text-xl font-bold text-white leading-snug mt-1">{open.tema}</h2>
                <p className="text-xs text-gray-400 mt-1">@{open.author}{open.postedAt ? ` · ${new Date(open.postedAt).toLocaleDateString('pt-BR')}` : ''}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Viral', String(open.score)], ['Views', formatCount(open.views)], ['Curtidas', formatCount(open.likes)], ['Coment.', formatCount(open.comments)]].map(([l, v]) => (
                  <div key={l} className="bg-black/40 border border-white/5 rounded-xl py-2">
                    <p className="text-[10px] uppercase text-gray-500 font-bold">{l}</p>
                    <p className="text-sm font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex gap-3"><Zap className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /><div><p className="text-[10px] uppercase text-gray-500 font-bold">Gancho · {open.tipoGancho}</p><p className="text-sm text-gray-200">{open.gancho}</p></div></div>
                <div className="flex gap-3"><Target className="w-4 h-4 text-brand-jade shrink-0 mt-0.5" /><div><p className="text-[10px] uppercase text-gray-500 font-bold">Por que funcionou</p><p className="text-sm text-gray-200">{open.porque}</p></div></div>
                <div className="flex gap-3"><Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" /><div><p className="text-[10px] uppercase text-gray-500 font-bold">Estética</p><p className="text-sm text-gray-200">{open.resumo}</p></div></div>
              </div>
              {open.kw.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {open.kw.map(k => (
                    <button key={k} onClick={() => { setQ(k); setOpen(null); }} className="px-2 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-gray-300 hover:text-white">#{k}</button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href={`/dashboard/idea-generator?hub=${open.id}`} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-jade/20 border border-brand-jade/40 text-white text-sm font-semibold hover:bg-brand-jade/30">
                  <Lightbulb className="w-4 h-4" /> Gerar ideia parecida
                </Link>
                <Link href={`/dashboard/prompt-studio?hub=${open.id}`} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-white text-sm font-semibold hover:bg-purple-500/25">
                  <Clapperboard className="w-4 h-4" /> Gerar prompt
                </Link>
                <button onClick={() => toggleFavorite(open.id)} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold ${favorites.has(open.id) ? 'bg-pink-500/15 border-pink-500/40 text-pink-300' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'}`}>
                  <Heart className={`w-4 h-4 ${favorites.has(open.id) ? 'fill-current' : ''}`} /> {favorites.has(open.id) ? 'Favoritado' : 'Favoritar'}
                </button>
                <a href={open.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:text-white">
                  <ExternalLink className="w-4 h-4" /> Abrir no Instagram
                </a>
              </div>
              <p className="text-[10px] text-gray-600">Vídeo exibido pelo player oficial do Instagram; todos os direitos são do autor. Gerar ideia ou prompt consome créditos da ferramenta escolhida.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
