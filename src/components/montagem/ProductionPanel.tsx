'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Film, ImageIcon, Loader2, ShieldCheck } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { callTool, parseModelJson, streamTool } from '@/lib/client/api';
import { updateProjectScene } from '@/lib/client/project';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { GEN_LIMITS, GenJob, GenModel, STATUS_LABEL, modelsFor, normalizeConfig, quote } from '@/lib/generation';
import { compactStoredImage } from '@/lib/client/imageInput';
import { ensurePromptFits } from '@/lib/client/promptFit';
import { Edl, PROMPT_ASPECT, ProjectScene, RenderJob, VideoProject, sceneDescription } from '@/lib/montagem';

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
    // Última animação falhou e não há outra pronta: o card mostra o motivo (créditos já devolvidos).
    clipError: !clipReady.length && clips[0]?.status === 'failed' ? clips[0].error || 'A geração falhou.' : '',
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

// ── Geração em lote: frames que faltam ou animação de todos os frames ────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function nearestDuration(model: GenModel, seconds: number) {
  const options = (model.durations || []).map(d => d.value).sort((a, b) => a - b);
  return options.find(d => d >= seconds) ?? options[options.length - 1];
}

/**
 * Lê o frame direto do Storage (o bucket libera leitura com CORS; o link já leva o token) e reduz
 * para o Gerador de Prompts (até 1600 px, JPEG). Frames chegam a 8 MB: passar pelo servidor estoura a Netlify.
 */
async function frameForPrompt(url: string, max = 1600) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  // Parâmetro extra: o storyboard já carregou este arquivo sem CORS, e o cache não serviria para o canvas.
  img.src = `${url}${url.includes('?') ? '&' : '?'}cors=1`;
  await img.decode();
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

const DURATION_CHOICES = [5, 8, 10, 15];
const durationChoice = (seconds: number) => `${DURATION_CHOICES.find(d => d >= seconds) ?? 15} segundos`;

/**
 * Prompts de movimento que faltam: o mesmo Gerador de Prompts, cena a cena, com o frame
 * aprovado e a descrição da cena. Cada prompt custa como no Gerador (1 crédito).
 */
function MotionPrompts({ project, scenes, onError }: {
  project: VideoProject;
  scenes: { scene: ProjectScene; frameUrl: string }[];
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const { canUseTool, refreshProfile } = useUserProfile();
  const [progress, setProgress] = useState('');
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const number = (s: ProjectScene) => project.scenes.findIndex(x => x.id === s.id) + 1;

  const run = async () => {
    const check = canUseTool('prompts', scenes.length);
    if (!check.ok) { onError(check.message || 'Créditos insuficientes para criar os prompts.'); return; }
    if (!confirm(`Criar o prompt de movimento das cenas ${scenes.map(x => number(x.scene)).join(', ')} a partir do frame e da descrição de cada uma?\nCusto: ${scenes.length} crédito(s). Deixe esta página aberta até terminar.`)) return;
    for (let i = 0; i < scenes.length && alive.current; i++) {
      const { scene, frameUrl } = scenes[i];
      setProgress(`Prompt da cena ${number(scene)} (${i + 1} de ${scenes.length})...`);
      try {
        const description = sceneDescription(project, scene);
        const choices = { proporcao: PROMPT_ASPECT[project.format], duracao: durationChoice(scene.targetSeconds || 5) };
        const text = await streamTool('/api/tools/prompt-studio', { mode: 'i2v', description, choices, images: { inicial: await frameForPrompt(frameUrl) } });
        const data = parseModelJson<{ prompt?: string; negativePrompt?: string }>(text);
        if (!data.prompt) throw new Error('A IA não devolveu o prompt.');
        data.prompt = await ensurePromptFits(data.prompt, data.negativePrompt || '');
        const saved = await addDoc(collection(db, 'prompts'), {
          userId: user!.uid, mode: 'i2v', description, choices, result: data,
          projectId: project.id, sceneId: scene.id, createdAt: new Date().toISOString(),
        }).catch(() => null);
        await updateProjectScene(project.id, scene.id, { motionPrompt: data.prompt, motionPromptId: saved?.id || null });
      } catch (e: any) {
        onError(`Cena ${number(scene)}: ${e.message || 'não foi possível criar o prompt.'} Crie esse no Gerador de Prompts.`);
        break;
      }
    }
    setProgress('');
    refreshProfile();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full p-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.05]">
      <p className="text-xs text-amber-100">
        {scenes.length === 1 ? 'A cena' : 'As cenas'} {scenes.map(x => number(x.scene)).join(', ')} ainda não {scenes.length === 1 ? 'tem' : 'têm'} prompt de movimento e não entram na animação.
      </p>
      <button type="button" onClick={run} disabled={!!progress}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-amber-300 disabled:opacity-50">
        {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {progress || `Criar ${scenes.length} prompt(s) · ${scenes.length} crédito(s)`}
      </button>
    </div>
  );
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
  const { user } = useAuth();
  const [batch, setBatch] = useState<BatchEntry[] | null>(null);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const model = models.find(m => m.id === modelId) || models[0];
  const mark = (sceneId: string, patch: Partial<BatchEntry>) => setBatch(b => b && b.map(x => (x.sceneId === sceneId ? { ...x, ...patch } : x)));

  // Cenas que ainda precisam deste passo (sem resultado e sem geração em andamento).
  const pending = project.scenes.map(scene => ({ scene, m: sceneMedia(scene, jobs) })).filter(({ m }) => kind === 'image'
    ? m.framePrompt && !m.chosenFrame && !m.frameActive
    : m.chosenFrame && m.motionPrompt && !m.chosenClip && !m.clipActive);
  const items = pending.map(({ scene, m }) => {
    const config = normalizeConfig(model, { aspect: project.format, ...(kind === 'video' ? { duration: nearestDuration(model, scene.targetSeconds || 5) } : {}) });
    return {
      scene,
      frameUrl: kind === 'video' ? m.chosenFrame!.outputs[0].url : null,
      credits: quote(model, config).credits,
      body: {
        kind, mode: kind === 'image' ? 't2i' : 'i2v', modelId: model.id, config,
        prompt: kind === 'image' ? m.framePrompt : m.motionPrompt, negativePrompt: '',
        inputs: { images: kind === 'video' ? [m.chosenFrame!.outputs[0].path] : [] } as { images: string[] },
        promptId: (kind === 'image' ? scene.framePromptId : scene.motionPromptId) || null,
        projectId: project.id, sceneId: scene.id,
      },
    };
  });
  const total = items.reduce((s, it) => s + it.credits, 0);
  // Animação: cenas com frame mas sem prompt de movimento ficavam de fora sem aviso.
  const noPrompt = kind === 'video'
    ? project.scenes.map(scene => ({ scene, m: sceneMedia(scene, jobs) }))
      .filter(({ m }) => m.chosenFrame && !m.motionPrompt && !m.chosenClip && !m.clipActive)
      .map(({ scene, m }) => ({ scene, frameUrl: m.chosenFrame!.outputs[0].url }))
    : [];

  const run = async () => {
    if (!items.length || !user) return;
    const check = canUseTool(kind === 'image' ? 'gen-image' : 'gen-video', total);
    if (!check.ok) { onError(check.message || 'Créditos insuficientes para gerar tudo.'); return; }
    const what = kind === 'image' ? 'frame(s)' : 'cena(s) em vídeo';
    // Mostra o começo de cada prompt: dá para ver se algum não é desta cena antes de gastar.
    const list = items.map(it => `Cena ${project.scenes.indexOf(it.scene) + 1}: ${String(it.body.prompt).replace(/\s+/g, ' ').slice(0, 70)}...`).join('\n');
    const skipped = noPrompt.length ? `\n\nFora do lote (sem prompt de movimento): cenas ${noPrompt.map(x => project.scenes.indexOf(x.scene) + 1).join(', ')}.` : '';
    if (!confirm(`Gerar ${items.length} ${what} com ${model.name} por ${total} créditos?\n\n${list}${skipped}\n\nAs gerações entram na fila (até 3 por vez); deixe esta página aberta até todas serem enviadas.`)) return;

    setBatch(items.map(it => ({ sceneId: it.scene.id, number: project.scenes.indexOf(it.scene) + 1, step: 'Aguardando' })));
    setRunning(true);
    for (let i = 0; i < items.length && alive.current; i++) {
      const { scene, body } = items[i];
      const n = project.scenes.indexOf(scene) + 1;
      try {
        // Prompt salvo antes do limite (ou longo demais): o Claude enxuga e a cena guarda a versão nova.
        if (body.prompt.length > GEN_LIMITS.promptMax) {
          mark(scene.id, { step: 'Ajustando o prompt ao limite' });
          body.prompt = await ensurePromptFits(body.prompt);
          await updateProjectScene(project.id, scene.id, kind === 'image' ? { framePrompt: body.prompt } : { motionPrompt: body.prompt });
        }
        // Frame guardado (PNG de até 8 MB): vai uma cópia JPEG reduzida, porque o Veo recusa imagens grandes.
        if (kind === 'video' && items[i].frameUrl) {
          mark(scene.id, { step: 'Preparando o frame' });
          body.inputs = { images: [await compactStoredImage(user.uid, items[i].frameUrl!, `${Date.now()}-cena${n}`)] };
        }
        for (;;) {
          mark(scene.id, { step: 'Enviando' });
          try {
            const res = await callTool<{ id: string }>('/api/gen/create', body);
            mark(scene.id, { jobId: res.data.id, step: 'Enviado' });
            break;
          } catch (e: any) {
            if (e.code !== 'too_many_active' || !alive.current) throw e;
            mark(scene.id, { step: 'Na fila: espera uma das 3 gerações em andamento terminar' });
            await sleep(15_000);
          }
        }
      } catch (e: any) {
        // Termos ou saldo: nada mais vai passar, então para o lote. Outros erros: segue para a próxima cena.
        const fatal = ['terms_required', 'no_credits', 'payment_issue', 'no_subscription', 'no_access', 'gen_blocked'].includes(e.code);
        const msg = e.code === 'terms_required' ? 'Aceite os termos de uso da geração (abra Gerar imagem uma vez) e tente de novo.' : e.message || 'Não foi possível enviar.';
        mark(scene.id, { error: msg });
        if (fatal) {
          setBatch(b => b && b.map(x => (x.jobId || x.error ? x : { ...x, error: 'Não enviada.' })));
          break;
        }
      }
    }
    setRunning(false);
    refreshProfile();
  };

  if (!models.length) return null;
  const Icon = kind === 'image' ? ImageIcon : Film;
  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {noPrompt.length > 0 && <MotionPrompts project={project} scenes={noPrompt} onError={onError} />}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <label className="relative">
          <span className="sr-only">Modelo</span>
          <select value={model.id} onChange={e => setModelId(e.target.value)} disabled={running}
            className="appearance-none pl-3 pr-7 py-2 rounded-full bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-brand-emerald/60">
            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </label>
        <button type="button" onClick={run} disabled={running || !items.length}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-40">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
          {running ? 'Enviando...' : kind === 'image' ? 'Gerar frames que faltam' : 'Animar todos os frames'}
          {items.length > 0 && !running && <span className="font-medium">· {items.length} · {total} créditos</span>}
        </button>
      </div>
      {batch && <BatchTracker kind={kind} entries={batch} jobs={jobs} running={running} onClose={() => setBatch(null)} />}
    </div>
  );
}

interface BatchEntry {
  sceneId: string;
  number: number;
  /** Etapa antes da geração existir (ajuste do prompt, preparo do frame, envio, fila). */
  step: string;
  jobId?: string;
  error?: string;
}

/**
 * Acompanhamento do lote, cena a cena: etapa do envio e, depois, o status real da geração
 * (lido em tempo real do Firestore), com o motivo quando o provedor recusa ou falha.
 */
function BatchTracker({ kind, entries, jobs, running, onClose }: { kind: 'image' | 'video'; entries: BatchEntry[]; jobs: Job[]; running: boolean; onClose: () => void }) {
  const rows = entries.map(e => {
    const job = e.jobId ? jobs.find(j => j.id === e.jobId) : undefined;
    const state: 'done' | 'failed' | 'working' | 'waiting' = e.error || job?.status === 'failed' ? 'failed'
      : job?.status === 'completed' ? 'done' : e.jobId || e.step !== 'Aguardando' ? 'working' : 'waiting';
    const label = e.error ? 'Não enviada' : job ? STATUS_LABEL[job.status] : e.step;
    const detail = e.error || (job?.status === 'failed' ? job.error : '') || '';
    return { ...e, state, label, detail };
  });
  const finished = rows.filter(r => r.state === 'done' || r.state === 'failed').length;
  const done = rows.filter(r => r.state === 'done').length;
  const failed = rows.filter(r => r.state === 'failed').length;
  const pct = Math.round((finished / rows.length) * 100);
  const dot = { done: 'bg-brand-emerald', failed: 'bg-red-400', working: 'bg-amber-300 animate-pulse', waiting: 'bg-white/20' };
  return (
    <div className="basis-full mt-2 rounded-xl border border-white/[0.08] bg-black/40 p-3 space-y-3" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-white">
          {kind === 'video' ? 'Animação em lote' : 'Frames em lote'}: {finished} de {rows.length} concluída(s)
          <span className="font-normal text-gray-400"> · {done} pronta(s){failed ? ` · ${failed} com erro` : ''}</span>
        </p>
        {!running && finished === rows.length && (
          <button type="button" onClick={onClose} className="text-[11px] text-gray-400 hover:text-white underline">Fechar</button>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full transition-all ${failed && finished === rows.length && !done ? 'bg-red-400' : 'bg-brand-emerald'}`} style={{ width: `${Math.max(3, pct)}%` }} />
      </div>
      <ul className="space-y-1.5">
        {rows.map(r => (
          <li key={r.sceneId} className="flex items-start gap-2 text-[11px]">
            <span className={`mt-1 w-2 h-2 shrink-0 rounded-full ${dot[r.state]}`} />
            <span className="w-14 shrink-0 font-semibold text-white">Cena {r.number}</span>
            <span className="min-w-0">
              <span className={r.state === 'failed' ? 'text-red-300' : r.state === 'done' ? 'text-brand-mint' : 'text-gray-300'}>{r.label}</span>
              {r.detail && <span className="block text-gray-500">{r.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      {failed > 0 && finished === rows.length && (
        <p className="text-[11px] text-gray-400">Os créditos das que falharam já voltaram. Clique de novo no botão para tentar só essas, ou troque o modelo.</p>
      )}
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
