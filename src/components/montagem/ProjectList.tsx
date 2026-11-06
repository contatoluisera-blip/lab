'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Clapperboard, Loader2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { FORMATS, MAX_SCENES, MontagemFormat, ProjectScene, VideoProject, projectHref, scenesFromScript } from '@/lib/montagem';

const newId = () => crypto.randomUUID().slice(0, 8);

/** Projetos de vídeo da pessoa e o formulário de um projeto novo (roteiro → cenas). */
export function ProjectList() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<VideoProject[] | null>(null);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [format, setFormat] = useState<MontagemFormat>('9:16');
  const [script, setScript] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'video_projects'), where('uid', '==', user.uid));
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<VideoProject, 'id'>) }))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
    }, () => { setItems([]); setError('Não foi possível carregar seus projetos.'); });
  }, [user]);

  const preview = scenesFromScript(script);

  const create = async () => {
    if (!user) return;
    if (title.trim().length < 2) { setError('Dê um nome ao projeto.'); return; }
    setSaving(true);
    setError('');
    try {
      const base = preview.length ? preview : [{ title: 'Cena 1', text: '' }];
      const scenes: ProjectScene[] = base.map(s => ({ id: newId(), title: s.title, text: s.text, targetSeconds: 5 }));
      const at = new Date().toISOString();
      const ref = await addDoc(collection(db, 'video_projects'), {
        uid: user.uid, title: title.trim().slice(0, 80), goal: goal.trim().slice(0, 200), format, scenes, edl: null, createdAt: at, updatedAt: at,
      });
      router.push(projectHref('/dashboard/montagem', ref.id));
    } catch {
      setError('Não foi possível criar o projeto. Tente de novo.');
      setSaving(false);
    }
  };

  const remove = async (p: VideoProject) => {
    if (!confirm(`Apagar o projeto "${p.title}"? As imagens e vídeos gerados continuam nas abas de geração.`)) return;
    await deleteDoc(doc(db, 'video_projects', p.id)).catch(() => setError('Não foi possível apagar.'));
  };

  return (
    <div className="space-y-10 pb-24">
      <header className="space-y-3 max-w-2xl">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
          <Clapperboard className="w-3.5 h-3.5" /> Estúdio Creator Lab
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Montagem de vídeo</h1>
        <p className="text-gray-400 leading-relaxed">
          Do roteiro ao MP4 num lugar só. Cada projeto organiza as cenas: prompt, frame e vídeo de cada uma.
          Depois, o Claude monta o primeiro corte e você ajusta e exporta.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-5 md:p-6 space-y-5" aria-label="Novo projeto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Novo projeto</h2>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Nome</span>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="Ex.: Lançamento do curso de café"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Objetivo do vídeo (opcional)</span>
            <input value={goal} onChange={e => setGoal(e.target.value)} maxLength={200} placeholder="Ex.: levar para o link da bio"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none" />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400">Formato</span>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map(f => (
                <button key={f.id} type="button" onClick={() => setFormat(f.id)} aria-pressed={format === f.id}
                  className={`px-2 py-2.5 rounded-xl border text-xs font-semibold ${format === f.id ? 'bg-brand-emerald/15 border-brand-emerald/60 text-white' : 'bg-black/30 border-white/[0.07] text-gray-400 hover:text-white'}`}>
                  {f.label}
                  <span className="block text-[9px] font-medium text-gray-500 mt-0.5">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Roteiro (opcional): separe as cenas com uma linha em branco ou &ldquo;Cena 1:&rdquo;, &ldquo;Cena 2:&rdquo;</span>
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} maxLength={8000}
              placeholder={'Cena 1: Close na xícara, vapor subindo.\n\nCena 2: Mãos moendo o café...'}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none resize-y" />
          </label>
          <p className="text-[11px] text-gray-500">
            {preview.length ? `${preview.length} cena(s) encontradas${preview.length >= MAX_SCENES ? ` (máximo de ${MAX_SCENES})` : ''}.` : 'Sem roteiro, o projeto começa com 1 cena; dá para adicionar depois.'}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="button" onClick={create} disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar projeto
          </button>
        </section>

        <section className="lg:col-span-7 space-y-3" aria-label="Seus projetos">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Seus projetos</h2>
          {!items && <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-brand-mint" /></div>}
          {items?.length === 0 && (
            <p className="text-sm text-gray-500 p-6 rounded-2xl border border-dashed border-white/10">Nenhum projeto ainda. Crie o primeiro ao lado.</p>
          )}
          {items?.map(p => {
            const done = p.scenes.filter(s => s.clipJobId).length;
            return (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07] bg-black/30 hover:border-brand-emerald/40 transition-colors">
                <button type="button" onClick={() => router.push(projectHref('/dashboard/montagem', p.id))} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {p.format} · {p.scenes.length} cena(s) · {done} com vídeo escolhido{p.edl?.clips?.length ? ` · ${p.edl.clips.length} na linha do tempo` : ''}
                  </p>
                </button>
                <button type="button" onClick={() => remove(p)} aria-label={`Apagar ${p.title}`} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5">
                  <Trash2 className="w-4 h-4" />
                </button>
                <ArrowRight className="w-4 h-4 text-brand-mint shrink-0" />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
