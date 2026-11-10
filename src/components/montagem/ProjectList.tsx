'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Clapperboard, FileText, Loader2, Plus, Sparkles, Trash2, ArrowRight, Upload, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { streamTool } from '@/lib/client/api';
import { SCRIPT_ACCEPT, ScriptFile, readScriptFile } from '@/lib/client/scriptFile';
import {
  FORMATS, MAX_SCENES, MontagemFormat, ProjectScene, SCRIPT_AGENT_CREDITS, SCRIPT_DONE_MARK, VideoProject, projectHref, scenesFromScript,
} from '@/lib/montagem';

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
  const { canUseTool, refreshProfile } = useUserProfile();
  const [mode, setMode] = useState<'ai' | 'manual' | 'edit'>('ai');
  const [aiFormat, setAiFormat] = useState<MontagemFormat | 'auto'>('auto');
  const [file, setFile] = useState<ScriptFile | null>(null);
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

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
      // Só edição: sem cenas; os vídeos da pessoa entram no projeto aberto.
      const base = mode === 'edit' ? [] : preview.length ? preview : [{ title: 'Cena 1', text: '' }];
      const scenes: ProjectScene[] = base.map(s => ({ id: newId(), title: s.title, text: s.text, targetSeconds: 5 }));
      const at = new Date().toISOString();
      const ref = await addDoc(collection(db, 'video_projects'), {
        uid: user.uid, title: title.trim().slice(0, 80), goal: goal.trim().slice(0, 200), format, scenes, edl: null, createdAt: at, updatedAt: at,
        kind: mode === 'edit' ? 'edit' : 'full', uploads: [],
      });
      router.push(projectHref('/dashboard/montagem', ref.id));
    } catch {
      setError('Não foi possível criar o projeto. Tente de novo.');
      setSaving(false);
    }
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setError('');
    try { setFile(await readScriptFile(f)); } catch (e: any) { setFile(null); setError(e.message); }
  };

  /** Agente de roteiro: o Claude lê o documento e separa em cenas (os prompts ficam para o Gerador de Prompts). */
  const createFromScript = async () => {
    if (!file) { setError('Envie o roteiro (PDF, DOCX, TXT ou MD).'); return; }
    const check = canUseTool('montagem', SCRIPT_AGENT_CREDITS);
    if (!check.ok) { setError(check.message || 'Sem créditos para o agente de roteiro.'); return; }
    setSaving(true);
    setError('');
    setProgress('Lendo o roteiro...');
    try {
      const full = await streamTool('/api/montagem/script', { file, description: [goal.trim() && `Objetivo do vídeo: ${goal.trim()}`, description.trim()].filter(Boolean).join('\n'), format: aiFormat, title }, partial => {
        const found = partial.split('"duracao"').length - 1;
        if (partial.trim()) setProgress(found ? `Fatiando o roteiro: ${found} cena(s)...` : 'Lendo o roteiro...');
      });
      const mark = full.indexOf(SCRIPT_DONE_MARK);
      if (mark < 0) throw new Error('A leitura do roteiro foi interrompida. Tente de novo; se o projeto aparecer na lista, abra e continue por lá.');
      const { projectId } = JSON.parse(full.slice(mark + SCRIPT_DONE_MARK.length)) as { projectId: string };
      refreshProfile();
      router.push(projectHref('/dashboard/montagem', projectId));
    } catch (e: any) {
      setError(e.message || 'Não foi possível ler o roteiro agora.');
      setSaving(false);
      setProgress('');
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
          Depois, o Claude monta o primeiro corte e você ajusta e exporta. Já tem os vídeos? Use &ldquo;Só edição&rdquo;.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-5 md:p-6 space-y-5" aria-label="Novo projeto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Novo projeto</h2>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-black/40 border border-white/[0.06]" role="tablist">
            {([['ai', 'Roteiro com IA'], ['manual', 'Manual'], ['edit', 'Só edição']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setError(''); }}
                className={`py-2 rounded-full text-xs font-semibold ${mode === id ? 'bg-brand-emerald/20 text-white' : 'text-gray-500 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Nome{mode === 'ai' ? ' (opcional: o Claude sugere)' : ''}</span>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="Ex.: Lançamento do curso de café"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Objetivo do vídeo (opcional)</span>
            <input value={goal} onChange={e => setGoal(e.target.value)} maxLength={200} placeholder="Ex.: levar para o link da bio"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none" />
          </label>
          {mode === 'ai' ? (<>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400">Roteiro</span>
            <input ref={fileInput} type="file" accept={SCRIPT_ACCEPT} className="hidden" onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
            {file ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/[0.06] border border-brand-emerald/30">
                <FileText className="w-4 h-4 text-brand-mint shrink-0" />
                <span className="flex-1 min-w-0 text-sm text-white truncate">{file.name}</span>
                <span className="text-[10px] text-gray-500">{file.kind === 'pdf' ? 'PDF' : `${file.text.length.toLocaleString('pt-BR')} caracteres`}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Remover arquivo" className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()}
                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
                className="w-full flex flex-col items-center gap-1.5 px-4 py-6 rounded-xl border border-dashed border-white/15 bg-black/30 text-gray-400 hover:border-brand-emerald/50 hover:text-white">
                <Upload className="w-5 h-5" />
                <span className="text-sm font-semibold">Enviar roteiro</span>
                <span className="text-[11px] text-gray-500">PDF (até 3 MB), DOCX, TXT ou MD. Arraste ou clique.</span>
              </button>
            )}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Descritivo (opcional): personagens, estilo, público, referências</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={2000}
              placeholder="Ex.: protagonista mulher de 30 anos, cabelo cacheado, blusa verde; estética de filme, luz quente de fim de tarde; público iniciante em café."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none resize-y" />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400">Formato</span>
            <div className="grid grid-cols-4 gap-2">
              {[{ id: 'auto' as const, label: 'Auto', hint: 'O Claude decide' }, ...FORMATS].map(f => (
                <button key={f.id} type="button" onClick={() => setAiFormat(f.id)} aria-pressed={aiFormat === f.id}
                  className={`px-1.5 py-2.5 rounded-xl border text-[11px] font-semibold ${aiFormat === f.id ? 'bg-brand-emerald/15 border-brand-emerald/60 text-white' : 'bg-black/30 border-white/[0.07] text-gray-400 hover:text-white'}`}>
                  {f.label.replace(/^(Vertical|Feed|Horizontal) /, '')}
                  <span className="block text-[9px] font-medium text-gray-500 mt-0.5 truncate">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3 text-[11px] text-gray-400 leading-relaxed">
            O agente lê o roteiro e separa em cenas, cada uma com a descrição e uma explicação curta do seu papel no vídeo.
            Depois, cena por cena: prompt no Gerador de Prompts, frame em Gerar imagem, storyboard, animação em Gerar vídeo e montagem.
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {progress && <p className="flex items-center gap-2 text-xs text-brand-mint"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress}</p>}
          <button type="button" onClick={createFromScript} disabled={saving || !file}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Separar em cenas com IA · {SCRIPT_AGENT_CREDITS} créditos
          </button>
          </>) : (<>
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
          {mode === 'edit' ? (
            <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3 text-[11px] text-gray-400 leading-relaxed">
              Para quem já tem os takes, gravados ou gerados fora. No projeto, envie os vídeos, descreva cada um e monte à mão ou com o Claude:
              cortes, ordem, texto na tela e ID Visual, mantendo o áudio original. Paga só a exportação.
            </div>
          ) : (<>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">Roteiro (opcional): separe as cenas com uma linha em branco ou &ldquo;Cena 1:&rdquo;, &ldquo;Cena 2:&rdquo;</span>
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} maxLength={8000}
              placeholder={'Cena 1: Close na xícara, vapor subindo.\n\nCena 2: Mãos moendo o café...'}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-brand-emerald/60 outline-none resize-y" />
          </label>
          <p className="text-[11px] text-gray-500">
            {preview.length ? `${preview.length} cena(s) encontradas${preview.length >= MAX_SCENES ? ` (máximo de ${MAX_SCENES})` : ''}.` : 'Sem roteiro, o projeto começa com 1 cena; dá para adicionar depois.'}
          </p>
          </>)}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="button" onClick={create} disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar projeto
          </button>
          </>)}
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
                    {p.format} · {p.kind === 'edit' ? `só edição · ${p.uploads?.length || 0} vídeo(s)` : `${p.scenes.length} cena(s) · ${done} com vídeo escolhido`}{p.edl?.clips?.length ? ` · ${p.edl.clips.length} na linha do tempo` : ''}
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
