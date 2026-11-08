'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Film, ImageIcon, Loader2, ShieldCheck, Wand2 } from 'lucide-react';
import { callTool } from '@/lib/client/api';
import { writeScenePrompts } from '@/lib/client/scriptPrompts';
import { useUserProfile } from '@/context/UserProfileContext';
import { GenJob, GenModel, modelsFor, normalizeConfig, quote } from '@/lib/generation';
import { Edl, ProjectScene, RenderJob, VideoProject } from '@/lib/montagem';

export type Job = GenJob & { sceneId?: string | null };

/** Frames e cenas em vídeo de uma cena, com a versão escolhida (ou a mais recente). */
export function sceneMedia(scene: ProjectScene, jobs: Job[]) {
  const frames = jobs.filter(j => j.sceneId === scene.id && j.kind === 'image');
  const clips = jobs.filter(j => j.sceneId === scene.id && j.kind === 'video');
  const frameDone = frames.filter(j => j.status === 'completed' && j.outputs?.[0]?.path);
  const clipReady = clips.filter(j => j.status === 'completed' && j.outputs?.[0]?.stored);
  const chosenFrame = frameDone.find(j => j.id === scene.frameJobId) || frameDone[0];
  const chosenClip = clipReady.find(j => j.id === scene.clipJobId) || clipReady[0];
  return {
    frames, clips, frameDone, clipReady, chosenFrame, chosenClip,
    frameActive: frames.some(j => j.active),
    clipActive: clips.some(j => j.active),
    // Cenas geradas antes de o prompt ser ligado à cena: vale o prompt da própria geração.
    framePrompt: scene.framePrompt || chosenFrame?.prompt || '',
    motionPrompt: scene.motionPrompt || chosenClip?.prompt || '',
  };
}

// ── Esteira: os checks do projeto, do roteiro à exportação ───────────────────
export function Pipeline({ project, jobs, edl, renders }: { project: VideoProject; jobs: Job[]; edl: Edl; renders: RenderJob[] }) {
  const n = project.scenes.length;
  const media = project.scenes.map(s => sceneMedia(s, jobs));
  const count = (f: (m: ReturnType<typeof sceneMedia>) => unknown) => media.filter(f).length;
  const steps: { label: string; done: boolean; detail: string }[] = [
    { label: 'Roteiro', done: n > 0, detail: `${n} cena(s)` },
    { label: 'Prompts', done: n > 0 && count(m => m.framePrompt && m.motionPrompt) === n, detail: `${count(m => m.framePrompt && m.motionPrompt)}/${n}` },
    { label: 'Frames', done: n > 0 && count(m => m.chosenFrame) === n, detail: `${count(m => m.chosenFrame)}/${n}` },
    { label: 'Storyboard', done: !!project.storyboardApprovedAt, detail: project.storyboardApprovedAt ? 'aprovado' : 'a aprovar' },
    { label: 'Animação', done: n > 0 && count(m => m.chosenClip) === n, detail: `${count(m => m.chosenClip)}/${n}` },
    { label: 'Montagem', done: edl.clips.length > 0, detail: edl.clips.length ? `${edl.clips.length} na linha` : 'a montar' },
    { label: 'Exportação', done: renders.some(r => r.status === 'completed'), detail: renders.some(r => r.status === 'completed') ? 'MP4 pronto' : renders.some(r => r.active) ? 'renderizando' : 'a exportar' },
  ];
  const next = steps.findIndex(s => !s.done);
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-7 gap-2" aria-label="Etapas do projeto">
      {steps.map((s, i) => (
        <li key={s.label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${s.done ? 'border-brand-emerald/30 bg-brand-emerald/[0.06]' : i === next ? 'border-amber-400/40 bg-amber-400/[0.05]' : 'border-white/[0.06] bg-black/30'}`}>
          <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border ${s.done ? 'bg-brand-emerald/20 border-brand-emerald/60 text-brand-mint' : i === next ? 'border-amber-400/60 text-amber-300' : 'border-white/15 text-gray-500'}`}>
            {s.done ? <Check className="w-3 h-3" /> : i + 1}
          </span>
          <span className="min-w-0 leading-tight">
            <span className={`block text-xs font-semibold ${s.done || i === next ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
            <span className="block text-[10px] text-gray-500 truncate">{s.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ── Prompts que faltam: o agente de roteiro escreve os das cenas sem prompt ──
export function MissingPrompts({ project, onError }: { project: VideoProject; onError: (message: string) => void }) {
  const [progress, setProgress] = useState('');
  const missing = project.scenes.filter(s => !s.framePrompt || !s.motionPrompt).map(s => s.id);
  if (!project.styleBible || !missing.length) return null;
  const run = async () => {
    setProgress('Escrevendo...');
    const r = await writeScenePrompts(project.id, missing, (done, total) => setProgress(`${done} de ${total} cenas...`));
    setProgress('');
    if (r.failed.length) onError(`${r.failed.length} cena(s) ficaram sem prompt${r.lastError ? ` (${r.lastError})` : ''}. Tente de novo.`);
  };
  return (
    <button type="button" onClick={run} disabled={!!progress}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-brand-mint border border-brand-emerald/40 bg-brand-emerald/10 hover:bg-brand-emerald/20 disabled:opacity-60">
      {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {progress ? `Prompts: ${progress}` : `Escrever prompts que faltam com IA · ${missing.length}`}
    </button>
  );
}

// ── Geração em lote: frames que faltam ou animação de todos os frames ────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function nearestDuration(model: GenModel, seconds: number) {
  const options = (model.durations || []).map(d => d.value).sort((a, b) => a - b);
  return options.find(d => d >= seconds) ?? options[options.length - 1];
}

export function BatchGenerate({ kind, project, jobs, onError }: {
  kind: 'image' | 'video';
  project: VideoProject;
  jobs: Job[];
  onError: (message: string) => void;
}) {
  const { canUseTool, refreshProfile } = useUserProfile();
  const models = useMemo(() => modelsFor(kind, kind === 'image' ? 't2i' : 'i2v'), [kind]);
  const [modelId, setModelId] = useState(() => (models.find(m => m.featured) || models[0])?.id || '');
  const [progress, setProgress] = useState('');
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const model = models.find(m => m.id === modelId) || models[0];

  // Cenas que ainda precisam deste passo (sem resultado e sem geração em andamento).
  const pending = project.scenes.map(scene => ({ scene, m: sceneMedia(scene, jobs) })).filter(({ m }) => kind === 'image'
    ? m.framePrompt && !m.chosenFrame && !m.frameActive
    : m.chosenFrame && m.motionPrompt && !m.chosenClip && !m.clipActive);
  const items = pending.map(({ scene, m }) => {
    const config = normalizeConfig(model, { aspect: project.format, ...(kind === 'video' ? { duration: nearestDuration(model, scene.targetSeconds || 5) } : {}) });
    return {
      scene,
      credits: quote(model, config).credits,
      body: {
        kind, mode: kind === 'image' ? 't2i' : 'i2v', modelId: model.id, config,
        prompt: kind === 'image' ? m.framePrompt : m.motionPrompt, negativePrompt: '',
        inputs: { images: kind === 'video' ? [m.chosenFrame!.outputs[0].path] : [] },
        promptId: (kind === 'image' ? scene.framePromptId : scene.motionPromptId) || null,
        projectId: project.id, sceneId: scene.id,
      },
    };
  });
  const total = items.reduce((s, it) => s + it.credits, 0);

  const run = async () => {
    if (!items.length) return;
    const check = canUseTool(kind === 'image' ? 'gen-image' : 'gen-video', total);
    if (!check.ok) { onError(check.message || 'Créditos insuficientes para gerar tudo.'); return; }
    const what = kind === 'image' ? 'frame(s)' : 'cena(s) em vídeo';
    if (!confirm(`Gerar ${items.length} ${what} com ${model.name} por ${total} créditos?\nAs gerações entram na fila (até 3 por vez); deixe esta página aberta até todas serem enviadas.`)) return;
    for (let i = 0; i < items.length && alive.current; i++) {
      setProgress(`Enviando ${i + 1} de ${items.length}...`);
      for (;;) {
        try {
          await callTool('/api/gen/create', items[i].body);
          break;
        } catch (e: any) {
          if (e.code === 'too_many_active' && alive.current) {
            setProgress(`Na fila: ${i} de ${items.length} enviados. O próximo sai quando uma geração terminar...`);
            await sleep(20_000);
            continue;
          }
          const msg = e.code === 'terms_required'
            ? 'Aceite os termos de uso da geração (abra Gerar imagem uma vez) e tente de novo.'
            : `Cena ${project.scenes.indexOf(items[i].scene) + 1}: ${e.message || 'não foi possível gerar.'}`;
          onError(msg);
          setProgress('');
          refreshProfile();
          return;
        }
      }
    }
    setProgress('');
    refreshProfile();
  };

  if (!models.length) return null;
  const Icon = kind === 'image' ? ImageIcon : Film;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative">
        <span className="sr-only">Modelo</span>
        <select value={model.id} onChange={e => setModelId(e.target.value)} disabled={!!progress}
          className="appearance-none pl-3 pr-7 py-2 rounded-full bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-brand-emerald/60">
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </label>
      <button type="button" onClick={run} disabled={!!progress || !items.length}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-40">
        {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
        {kind === 'image' ? 'Gerar frames que faltam' : 'Animar todos os frames'}
        {items.length > 0 && !progress && <span className="font-medium">· {items.length} · {total} créditos</span>}
      </button>
      {progress && <span className="text-[11px] text-brand-mint">{progress}</span>}
    </div>
  );
}

// ── Storyboard: frames em ordem, para aprovar antes de animar ────────────────
export function Storyboard({ project, jobs, onApprove, onError }: {
  project: VideoProject;
  jobs: Job[];
  onApprove: (approved: boolean) => void;
  onError: (message: string) => void;
}) {
  const media = project.scenes.map(s => sceneMedia(s, jobs));
  const ready = media.filter(m => m.chosenFrame).length;
  const allReady = ready === project.scenes.length && ready > 0;
  const approved = !!project.storyboardApprovedAt;
  const totalSeconds = project.scenes.reduce((s, sc) => s + (sc.targetSeconds || 5), 0);
  const ratio = project.format === '16:9' ? 'aspect-video' : project.format === '4:5' ? 'aspect-[4/5]' : 'aspect-[9/16]';

  return (
    <section aria-label="Storyboard" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">2. Storyboard</h2>
          <p className="text-[11px] text-gray-500 mt-1">{ready}/{project.scenes.length} frames · cerca de {totalSeconds} s. Confira a sequência e a coerência dos personagens antes de animar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {approved ? (
            <>
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-emerald/10 border border-brand-emerald/40 text-xs font-semibold text-brand-mint"><ShieldCheck className="w-3.5 h-3.5" /> Aprovado</span>
              <button type="button" onClick={() => onApprove(false)} className="text-[11px] text-gray-500 hover:text-white underline">Reabrir</button>
            </>
          ) : (
            <button type="button" onClick={() => onApprove(true)} disabled={!allReady} title={allReady ? '' : 'Gere o frame de todas as cenas primeiro'}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-40">
              <ShieldCheck className="w-3.5 h-3.5" /> Aprovar storyboard
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {project.scenes.map((scene, i) => {
          const m = media[i];
          return (
            <figure key={scene.id} className="w-36 shrink-0 snap-start space-y-1.5">
              <div className={`relative ${ratio} rounded-xl overflow-hidden bg-black/50 border ${m.chosenFrame ? 'border-white/10' : 'border-dashed border-white/15'}`}>
                {m.chosenFrame
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={m.chosenFrame.outputs[0].url} alt={`Frame da cena ${i + 1}`} className="w-full h-full object-cover" />
                  : <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600">{m.frameActive ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : 'sem frame'}</span>}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">{i + 1} · {scene.targetSeconds || 5}s</span>
                {m.chosenClip && <Film className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-brand-mint" aria-label="Animada" />}
              </div>
              <figcaption className="text-[10px] leading-snug text-gray-400 line-clamp-3"><span className="text-white font-semibold">{scene.title}.</span> {scene.text}</figcaption>
            </figure>
          );
        })}
      </div>

      {approved ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-white/[0.07] bg-black/30">
          <p className="text-xs text-gray-400">Próximo passo: animar cada frame com o prompt de movimento da cena.</p>
          <BatchGenerate kind="video" project={project} jobs={jobs} onError={onError} />
        </div>
      ) : allReady ? null : (
        <p className="text-[11px] text-gray-500">Gere os frames que faltam (etapa 1) para aprovar o storyboard e liberar a animação em lote.</p>
      )}
    </section>
  );
}
