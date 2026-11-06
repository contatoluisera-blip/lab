'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, Coins, Download, Film, ImageIcon, Loader2, Plus, Sparkles, Trash2, Volume2, VolumeX, Wand2, Wand, X, Clapperboard,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { callTool } from '@/lib/client/api';
import { setGenHandoff } from '@/lib/client/handoff';
import { GenJob, STATUS_LABEL } from '@/lib/generation';
import { isPaidPlan } from '@/lib/planConfig';
import {
  Edl, EdlClip, MIN_CLIP_FRAMES, MONTAGEM_FPS, MONTAGEM_MAX_SECONDS, MAX_SCENES, ProjectScene, RENDER_STATUS_LABEL, RenderJob,
  TRANSITIONS, TextPosition, TransitionKind, VideoProject, clipFrames, edlDurationFrames, emptyEdl, montagemCost, projectHref, sourceFramesFor,
} from '@/lib/montagem';

const Preview = dynamic(() => import('./Preview'), {
  ssr: false,
  loading: () => <div className="aspect-[9/16] w-full rounded-2xl bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand-mint" /></div>,
});

const newId = () => crypto.randomUUID().slice(0, 8);
const secs = (frames: number) => (frames / MONTAGEM_FPS).toFixed(1).replace('.', ',');

type Job = GenJob & { sceneId?: string | null };

function StepRow({ done, active, label, children }: { done: boolean; active?: boolean; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="flex items-center gap-2 text-xs">
        <span className={`w-4 h-4 rounded-full flex items-center justify-center border ${done ? 'bg-brand-emerald/20 border-brand-emerald/60' : active ? 'border-amber-400/60' : 'border-white/15'}`}>
          {done ? <Check className="w-2.5 h-2.5 text-brand-mint" /> : active ? <Loader2 className="w-2.5 h-2.5 text-amber-300 animate-spin" /> : null}
        </span>
        <span className={done ? 'text-gray-200' : 'text-gray-500'}>{label}</span>
      </span>
      <span className="flex items-center gap-1.5">{children}</span>
    </div>
  );
}

const linkCls = 'px-2 py-1 rounded-md text-[10px] font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/25 hover:border-brand-emerald/60';

/**
 * Painel do Projeto de vídeo: o quadro de cenas liga Prompts, Gerar imagem e Gerar vídeo;
 * a linha do tempo monta o plano (com o Claude ou à mão); a prévia toca na hora; a exportação renderiza na AWS.
 */
export function ProjectEditor({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { userProfile, account, canUseTool, refreshProfile } = useUserProfile();
  const [project, setProject] = useState<VideoProject | null | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [renders, setRenders] = useState<RenderJob[]>([]);
  const [edl, setEdl] = useState<Edl | null>(null);
  const [error, setError] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [exporting, setExporting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedEdl = useRef(false);

  // Projeto, gerações e exportações em tempo real.
  useEffect(() => {
    if (!user) return;
    const unsubs = [
      onSnapshot(doc(db, 'video_projects', projectId), snap => {
        const data = snap.data();
        if (!snap.exists() || data?.uid !== user.uid) { setProject(null); return; }
        const p = { id: snap.id, ...data } as VideoProject;
        setProject(p);
        if (!loadedEdl.current) { loadedEdl.current = true; setEdl(p.edl || emptyEdl(p.format)); }
      }, () => setProject(null)),
      onSnapshot(query(collection(db, 'gen_jobs'), where('uid', '==', user.uid), where('projectId', '==', projectId)), snap => {
        setJobs(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Job, 'id'>) })).sort((a, b) => b.id.localeCompare(a.id)));
      }, err => console.error('[montagem] gerações', err)),
      onSnapshot(query(collection(db, 'render_jobs'), where('uid', '==', user.uid), where('projectId', '==', projectId)), snap => {
        setRenders(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<RenderJob, 'id'>) })).sort((a, b) => b.id.localeCompare(a.id)));
      }, err => console.error('[montagem] exportações', err)),
    ];
    return () => unsubs.forEach(u => u());
  }, [user, projectId]);

  // Exportação em andamento: empurra a fila e confere a AWS a cada 10 s.
  const activeRenders = renders.filter(r => r.active).length;
  const prevActive = useRef(0);
  useEffect(() => {
    if (prevActive.current > activeRenders) refreshProfile();
    prevActive.current = activeRenders;
    if (!activeRenders) return;
    const tick = () => callTool('/api/montagem/render/status', {}).catch(() => {});
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRenders]);

  const clipsDone = useMemo(() => jobs.filter(j => j.kind === 'video' && j.status === 'completed' && j.outputs?.[0]?.stored), [jobs]);
  const sources = useMemo(() => Object.fromEntries(clipsDone.map(j => [j.id, j.outputs[0].url])), [clipsDone]);

  if (project === undefined || !edl) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-mint" /></div>;
  if (project === null) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-gray-400">Projeto não encontrado.</p>
        <Link href="/dashboard/montagem" className="inline-block glass-button-primary">Ver projetos</Link>
      </div>
    );
  }

  const plan = isPaidPlan(userProfile?.plan) ? userProfile!.plan : 'start';
  const maxFrames = MONTAGEM_MAX_SECONDS[plan as keyof typeof MONTAGEM_MAX_SECONDS] * MONTAGEM_FPS;
  const totalFrames = edl.clips.length ? edlDurationFrames(edl) : 0;
  const cost = montagemCost(totalFrames);
  const missing = edl.clips.filter(c => !sources[c.jobId]).length;

  // ── Escrita ────────────────────────────────────────────────────────────────
  const saveProject = (patch: Partial<VideoProject>) =>
    updateDoc(doc(db, 'video_projects', project.id), { ...patch, updatedAt: new Date().toISOString() }).catch(() => setError('Não foi possível salvar. Confira sua conexão.'));

  const changeEdl = (next: Edl) => {
    setEdl(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProject({ edl: next }), 700);
  };
  const patchClip = (id: string, patch: Partial<EdlClip>) => changeEdl({ ...edl, clips: edl.clips.map(c => (c.id === id ? { ...c, ...patch } : c)) });
  const moveClip = (i: number, dir: -1 | 1) => {
    const clips = [...edl.clips];
    const j = i + dir;
    if (j < 0 || j >= clips.length) return;
    [clips[i], clips[j]] = [clips[j], clips[i]];
    changeEdl({ ...edl, clips });
  };

  const updateScene = (id: string, patch: Partial<ProjectScene>) => saveProject({ scenes: project.scenes.map(s => (s.id === id ? { ...s, ...patch } : s)) });
  const addScene = () => {
    if (project.scenes.length >= MAX_SCENES) return;
    saveProject({ scenes: [...project.scenes, { id: newId(), title: `Cena ${project.scenes.length + 1}`, text: '', targetSeconds: 5 }] });
  };
  const removeScene = (s: ProjectScene) => {
    if (!confirm(`Remover "${s.title}" do projeto? As gerações continuam no histórico.`)) return;
    saveProject({ scenes: project.scenes.filter(x => x.id !== s.id) });
  };

  const addClip = (job: Job, scene?: ProjectScene) => {
    const frames = sourceFramesFor(job.config?.duration);
    const clip: EdlClip = {
      id: newId(), jobId: job.id, sceneId: scene?.id || job.sceneId || null, sourceFrames: frames,
      trimStart: 0, trimEnd: frames, muted: true, transition: 'cut', text: '', textPosition: 'bottom',
    };
    changeEdl({ ...edl, clips: [...edl.clips, clip] });
  };

  const animateFrame = (scene: ProjectScene, frame: Job) => {
    const out = frame.outputs?.[0];
    if (!out?.path) return;
    setGenHandoff({
      kind: 'video', mode: 'i2v', prompt: scene.motionPrompt || '', promptId: scene.motionPromptId || null,
      storedImages: [{ preview: out.url, path: out.path }], source: 'imagens',
    });
    router.push(projectHref('/dashboard/videos', project.id, scene.id, { from: 'montagem' }));
  };

  const autoEdit = async () => {
    if (edl.clips.length && !confirm('Substituir a linha do tempo atual pela montagem do Claude?')) return;
    setAiBusy(true);
    setError('');
    setAiNote('');
    try {
      const res = await callTool<{ edl: Edl; resumo: string }>('/api/montagem/auto', { projectId: project.id });
      changeEdl(res.data.edl);
      setAiNote(res.data.resumo);
    } catch (e: any) {
      setError(e.message || 'Não foi possível montar com IA agora.');
    } finally {
      setAiBusy(false);
    }
  };

  const exportVideo = async () => {
    setError('');
    if (!edl.clips.length) { setError('Coloque pelo menos uma cena na linha do tempo.'); return; }
    if (totalFrames > maxFrames) { setError(`O vídeo passa de ${maxFrames / MONTAGEM_FPS} s, o limite do seu plano.`); return; }
    const check = canUseTool('montagem', cost);
    if (!check.ok) { setError(check.message || 'Não foi possível exportar agora.'); return; }
    setExporting(true);
    try {
      if (saveTimer.current) { clearTimeout(saveTimer.current); await saveProject({ edl }); }
      await callTool('/api/montagem/render', { projectId: project.id, edl });
      refreshProfile();
    } catch (e: any) {
      setError(e.message || 'Não foi possível exportar agora.');
    } finally {
      setExporting(false);
    }
  };

  const sceneNumber = (sceneId: string | null) => {
    const i = project.scenes.findIndex(s => s.id === sceneId);
    return i >= 0 ? `Cena ${i + 1}` : 'Clipe';
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <Link href="/dashboard/montagem" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Projetos</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight truncate">{project.title}</h1>
          <p className="text-sm text-gray-400">{project.format} · {project.scenes.length} cena(s){project.goal ? ` · ${project.goal}` : ''}</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.07] bg-black/30 self-start md:self-auto">
          <Coins className="w-4 h-4 text-brand-mint" />
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Saldo</p>
            <p className="text-sm font-bold text-white tabular-nums">{account.credits} créditos</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Fechar aviso"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 1. Cenas: o painel de produção */}
      <section aria-label="Cenas" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">1. Cenas</h2>
          <button type="button" onClick={addScene} disabled={project.scenes.length >= MAX_SCENES} className={`${linkCls} flex items-center gap-1 disabled:opacity-40`}>
            <Plus className="w-3 h-3" /> Adicionar cena
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {project.scenes.map((scene, i) => {
            const frames = jobs.filter(j => j.sceneId === scene.id && j.kind === 'image');
            const clips = jobs.filter(j => j.sceneId === scene.id && j.kind === 'video');
            const frameDone = frames.filter(j => j.status === 'completed' && j.outputs?.[0]?.path);
            const clipReady = clips.filter(j => j.status === 'completed' && j.outputs?.[0]?.stored);
            const chosenFrame = frameDone.find(j => j.id === scene.frameJobId) || frameDone[0];
            const chosenClip = clipReady.find(j => j.id === scene.clipJobId) || clipReady[0];
            const inTimeline = edl.clips.some(c => c.sceneId === scene.id);
            return (
              <article key={scene.id} className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 shrink-0 rounded-full border border-brand-emerald/40 bg-brand-emerald/10 text-brand-mint text-[11px] font-mono font-bold flex items-center justify-center">{i + 1}</span>
                  <input defaultValue={scene.title} onBlur={e => e.target.value.trim() !== scene.title && updateScene(scene.id, { title: e.target.value.trim().slice(0, 60) || scene.title })}
                    aria-label={`Título da cena ${i + 1}`} className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-brand-emerald/40" />
                  <button type="button" onClick={() => removeScene(scene)} aria-label={`Remover cena ${i + 1}`} className="p-1 text-gray-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <textarea defaultValue={scene.text} rows={3} maxLength={1200} placeholder="Fala ou descrição da cena"
                  onBlur={e => e.target.value !== scene.text && updateScene(scene.id, { text: e.target.value })}
                  aria-label={`Texto da cena ${i + 1}`} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-brand-emerald/40 resize-y" />

                {(chosenClip || chosenFrame) && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    {chosenClip
                      ? <video src={chosenClip.outputs[0].url} muted playsInline loop controls className="w-full h-full object-cover" />
                      // eslint-disable-next-line @next/next/no-img-element
                      : <img src={chosenFrame!.outputs[0].url} alt={`Frame da cena ${i + 1}`} className="w-full h-full object-cover" />}
                  </div>
                )}

                <div className="divide-y divide-white/[0.05]">
                  <StepRow done={!!scene.framePrompt} label="Prompt do frame">
                    <Link href={projectHref('/dashboard/prompt-studio', project.id, scene.id, { mode: 't2i' })} className={linkCls}>{scene.framePrompt ? 'Refazer' : 'Criar'}</Link>
                  </StepRow>
                  <StepRow done={!!chosenFrame} active={frames.some(j => j.active)} label={frames.some(j => j.active) ? `Frame: ${STATUS_LABEL[frames.find(j => j.active)!.status]}` : `Frame${frameDone.length > 1 ? ` (${frameDone.length} versões)` : ''}`}>
                    <Link href={projectHref('/dashboard/imagens', project.id, scene.id)} className={linkCls}><ImageIcon className="w-3 h-3 inline -mt-0.5" /> Gerar</Link>
                  </StepRow>
                  <StepRow done={!!scene.motionPrompt} label="Prompt do movimento">
                    <Link href={projectHref('/dashboard/prompt-studio', project.id, scene.id, { mode: 'i2v' })} className={linkCls}>{scene.motionPrompt ? 'Refazer' : 'Criar'}</Link>
                  </StepRow>
                  <StepRow done={!!chosenClip} active={clips.some(j => j.active)} label={clips.some(j => j.active) ? `Cena: ${STATUS_LABEL[clips.find(j => j.active)!.status]}` : `Cena em vídeo${clipReady.length > 1 ? ` (${clipReady.length} versões)` : ''}`}>
                    {chosenFrame
                      ? <button type="button" onClick={() => animateFrame(scene, chosenFrame)} className={linkCls}><Film className="w-3 h-3 inline -mt-0.5" /> Animar frame</button>
                      : <Link href={projectHref('/dashboard/videos', project.id, scene.id)} className={linkCls}><Film className="w-3 h-3 inline -mt-0.5" /> Gerar</Link>}
                  </StepRow>
                </div>

                {frameDone.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto" aria-label="Versões do frame">
                    {frameDone.map(j => (
                      <button key={j.id} type="button" onClick={() => updateScene(scene.id, { frameJobId: j.id })} aria-pressed={chosenFrame?.id === j.id}
                        className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 ${chosenFrame?.id === j.id ? 'border-brand-emerald' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={j.outputs[0].url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {clipReady.length > 1 && (
                  <div className="flex flex-wrap gap-1.5" aria-label="Versões da cena">
                    {clipReady.map((j, n) => (
                      <button key={j.id} type="button" onClick={() => updateScene(scene.id, { clipJobId: j.id })} aria-pressed={chosenClip?.id === j.id}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${chosenClip?.id === j.id ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/10 text-gray-400'}`}>
                        Versão {clipReady.length - n} · {j.modelName}
                      </button>
                    ))}
                  </div>
                )}

                {chosenClip && (
                  <button type="button" onClick={() => addClip(chosenClip, scene)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-brand-emerald/30 text-brand-mint hover:bg-brand-emerald/10">
                    <Plus className="w-3.5 h-3.5" /> {inTimeline ? 'Adicionar de novo à linha do tempo' : 'Usar na montagem'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 2. Montagem */}
      <section aria-label="Montagem" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">2. Montagem</h2>
          <button type="button" onClick={autoEdit} disabled={aiBusy || !clipsDone.length}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
            {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {aiBusy ? 'Montando…' : 'Montar com IA'}
          </button>
        </div>
        {!clipsDone.length && (
          <p className="text-sm text-gray-500 p-4 rounded-2xl border border-dashed border-white/10">
            Gere pelo menos uma cena em vídeo (etapa 1) para começar a montar.
          </p>
        )}
        {aiNote && (
          <p className="flex items-start gap-2 p-3 rounded-xl bg-brand-emerald/[0.06] border border-brand-emerald/20 text-sm text-gray-200">
            <Wand2 className="w-4 h-4 text-brand-mint shrink-0 mt-0.5" /> {aiNote}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
            {edl.clips.length ? <Preview edl={edl} sources={sources} /> : (
              <div className="aspect-[9/16] w-full rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center justify-center gap-2 text-center p-6">
                <Clapperboard className="w-8 h-8 text-brand-emerald/40" />
                <p className="text-xs text-gray-500">A prévia aparece quando houver cenas na linha do tempo.</p>
              </div>
            )}
            {missing > 0 && <p className="text-[11px] text-amber-300">{missing} clipe(s) da linha do tempo não estão mais disponíveis. Remova-os antes de exportar.</p>}
          </div>

          <div className="lg:col-span-8 space-y-3">
            {edl.clips.map((c, i) => (
              <div key={c.id} className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-brand-mint">{String(i + 1).padStart(2, '0')}</span>
                  <p className="flex-1 text-sm font-semibold text-white">{sceneNumber(c.sceneId)} <span className="text-gray-500 font-normal">· {secs(clipFrames(c))} s</span></p>
                  <button type="button" onClick={() => patchClip(c.id, { muted: !c.muted })} aria-label={c.muted ? 'Ligar áudio do clipe' : 'Silenciar clipe'} className="p-1.5 text-gray-400 hover:text-white">
                    {c.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => moveClip(i, -1)} disabled={i === 0} aria-label="Mover para cima" className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => moveClip(i, 1)} disabled={i === edl.clips.length - 1} aria-label="Mover para baixo" className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => changeEdl({ ...edl, clips: edl.clips.filter(x => x.id !== c.id) })} aria-label="Remover da linha do tempo" className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] text-gray-500">Início do corte: {secs(c.trimStart)} s</span>
                    <input type="range" min={0} max={c.sourceFrames - MIN_CLIP_FRAMES} value={c.trimStart} className="w-full accent-emerald-400"
                      onChange={e => { const v = Number(e.target.value); patchClip(c.id, { trimStart: v, trimEnd: Math.max(c.trimEnd, v + MIN_CLIP_FRAMES) }); }} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] text-gray-500">Fim do corte: {secs(c.trimEnd)} s de {secs(c.sourceFrames)} s</span>
                    <input type="range" min={MIN_CLIP_FRAMES} max={c.sourceFrames} value={c.trimEnd} className="w-full accent-emerald-400"
                      onChange={e => { const v = Number(e.target.value); patchClip(c.id, { trimEnd: v, trimStart: Math.min(c.trimStart, v - MIN_CLIP_FRAMES) }); }} />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input value={c.text} maxLength={120} placeholder="Texto na tela (opcional)" onChange={e => patchClip(c.id, { text: e.target.value })}
                    aria-label="Texto na tela" className="sm:col-span-6 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/40" />
                  <select value={c.textPosition} onChange={e => patchClip(c.id, { textPosition: e.target.value as TextPosition })} aria-label="Posição do texto"
                    className="sm:col-span-3 px-2 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white">
                    <option value="top">Texto no topo</option><option value="center">Texto no centro</option><option value="bottom">Texto embaixo</option>
                  </select>
                  <select value={c.transition} disabled={i === 0} onChange={e => patchClip(c.id, { transition: e.target.value as TransitionKind })} aria-label="Transição de entrada"
                    className="sm:col-span-3 px-2 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white disabled:opacity-40">
                    {TRANSITIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            ))}

            {edl.clips.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-white">
                  <input type="checkbox" checked={edl.endCard.enabled} onChange={e => changeEdl({ ...edl, endCard: { ...edl.endCard, enabled: e.target.checked } })} className="accent-emerald-400" />
                  Chamada final (2 s)
                </label>
                {edl.endCard.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={edl.endCard.title} maxLength={120} placeholder="Título (ex.: Link na bio)" onChange={e => changeEdl({ ...edl, endCard: { ...edl.endCard, title: e.target.value } })}
                      aria-label="Título da chamada final" className="px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white placeholder:text-gray-600 outline-none" />
                    <input value={edl.endCard.subtitle} maxLength={120} placeholder="Subtítulo (opcional)" onChange={e => changeEdl({ ...edl, endCard: { ...edl.endCard, subtitle: e.target.value } })}
                      aria-label="Subtítulo da chamada final" className="px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white placeholder:text-gray-600 outline-none" />
                  </div>
                )}
              </div>
            )}

            {clipsDone.some(j => !edl.clips.some(c => c.jobId === j.id)) && (
              <details className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <summary className="text-xs font-semibold text-gray-300 cursor-pointer">Outros clipes do projeto</summary>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clipsDone.filter(j => !edl.clips.some(c => c.jobId === j.id)).map(j => (
                    <button key={j.id} type="button" onClick={() => addClip(j)} className="text-left rounded-xl overflow-hidden border border-white/[0.07] hover:border-brand-emerald/50">
                      <video src={j.outputs[0].url} muted playsInline className="w-full aspect-video object-cover bg-black" />
                      <span className="block px-2 py-1.5 text-[10px] text-gray-400 truncate"><Wand className="w-3 h-3 inline -mt-0.5" /> {sceneNumber(j.sceneId || null)} · {j.modelName}</span>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </section>

      {/* 3. Exportar */}
      <section aria-label="Exportar" className="rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-5 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">3. Exportar</h2>
            <p className="text-sm text-gray-400 mt-1">
              {edl.clips.length
                ? <>Vídeo de <strong className="text-white">{secs(totalFrames)} s</strong> em 1080p · <strong className="text-white">{cost} créditos</strong> · limite do seu plano: {maxFrames / MONTAGEM_FPS} s</>
                : 'Monte a linha do tempo para exportar.'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">A prévia é grátis. Se a exportação falhar, os créditos voltam sozinhos.</p>
          </div>
          <button type="button" onClick={exportVideo} disabled={exporting || !edl.clips.length || missing > 0 || totalFrames > maxFrames || activeRenders > 0}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {activeRenders ? 'Exportando…' : 'Exportar MP4'}
          </button>
        </div>
        {renders.length > 0 && (
          <div className="space-y-2">
            {renders.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.05]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">{new Date(r.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {secs(r.durationFrames)} s · {r.credits} créditos</p>
                  {r.active && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-brand-emerald transition-all" style={{ width: `${Math.max(4, Math.round((r.progress || 0) * 100))}%` }} />
                    </div>
                  )}
                  {r.error && <p className="text-[11px] text-red-300 mt-1">{r.error}</p>}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${r.status === 'completed' ? 'text-brand-mint' : r.status === 'failed' ? 'text-red-400' : 'text-amber-300'}`}>
                  {RENDER_STATUS_LABEL[r.status]}
                </span>
                {r.outputUrl && (
                  <a href={r.outputUrl} target="_blank" rel="noopener" download className={linkCls}><Download className="w-3 h-3 inline -mt-0.5" /> Baixar</a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
