'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import {
  Clapperboard, Coins, Copy, Download, FileDown, ImageIcon, Loader2, Repeat2, Sparkles, Wand2, Film, AlertTriangle, ShieldAlert,
} from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { callTool } from '@/lib/client/api';
import { setGenHandoff, takeGenHandoff } from '@/lib/client/handoff';
import {
  GEN_LIMITS, GEN_MODES, GEN_TERMS_VERSION, GenConfig, GenJob, GenKind, GenMode, STATUS_LABEL,
  getModel, modelsFor, normalizeConfig, quote,
} from '@/lib/generation';
import { PROMPT_MODES, PromptMode } from '@/lib/promptStudio';
import { AspectGlyph, Chip, ImageSlot, InputSlotState, ModelCard, StepHeader, VideoSlot } from './parts';
import { Viewfinder } from './Viewfinder';
import { TermsModal } from './TermsModal';
import { PromptImport, SavedPrompt } from './PromptImport';

/** Prompts do Gerador que servem para cada aba. */
const IMPORTABLE: Record<GenKind, PromptMode[]> = { image: ['t2i', 'i2i'], video: ['i2v', 'v2v'] };

const COPY: Record<GenKind, { title: string; subtitle: string; cta: string; tool: 'gen-image' | 'gen-video' }> = {
  image: {
    title: 'Gerar imagem',
    subtitle: 'Frames, capas e cenas estáticas com os melhores modelos de imagem. Direção no Gerador de Prompts, geração aqui.',
    cta: 'Gerar imagem',
    tool: 'gen-image',
  },
  video: {
    title: 'Gerar vídeo',
    subtitle: 'Cenas a partir de um frame, de um texto ou de um vídeo seu. Direção no Gerador de Prompts, geração aqui.',
    cta: 'Gerar cena',
    tool: 'gen-video',
  },
};

/** Converte para JPEG de até 2048px (os provedores aceitam JPG/PNG; WEBP vira JPG). */
async function toJpeg(file: File, max = 2048): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dataUrlToBlob(dataUrl: string) {
  const [head, body] = dataUrl.split(',');
  const type = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function videoDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = url;
    await new Promise<void>((resolve, reject) => { v.onloadedmetadata = () => resolve(); v.onerror = () => reject(new Error('Não foi possível ler este vídeo. Use MP4 ou MOV.')); });
    return v.duration || 0;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function download(url: string, name: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

export function GenerationStudio({ kind }: { kind: GenKind }) {
  const { user } = useAuth();
  const router = useRouter();
  const { userProfile, account, refreshProfile, hasToolAccess, canUseTool } = useUserProfile();
  const copy = COPY[kind];
  const modes = GEN_MODES[kind];

  const [mode, setMode] = useState<GenMode>(modes[0].id);
  const available = useMemo(() => modelsFor(kind, mode), [kind, mode]);
  const [modelId, setModelId] = useState<string>(available[0].id);
  const model = available.find(m => m.id === modelId) || available[0];
  const [configs, setConfigs] = useState<Record<string, GenConfig>>({});
  const config = normalizeConfig(model, configs[model.id] || model.defaults);
  const setConfig = (patch: GenConfig) => setConfigs(prev => ({ ...prev, [model.id]: { ...config, ...patch } }));
  const price = quote(model, config);
  /** Custo em créditos se esta opção for escolhida (mostra a escada de qualidade). */
  const costIf = (patch: GenConfig) => quote(model, { ...config, ...patch }).credits;
  const hintWith = (hint: string | undefined, credits: number) => `${hint ? `${hint} · ` : ''}${credits} cr`;

  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [source, setSource] = useState<{ id?: string | null; label: string } | null>(null);
  const [slots, setSlots] = useState<(InputSlotState | null)[]>([]);
  const [video, setVideo] = useState<{ file: File; preview: string; duration: number } | null>(null);
  const [busy, setBusy] = useState<number | 'video' | null>(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [jobs, setJobs] = useState<GenJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, number | null>>({});
  const termsOk = useRef(false);

  // Entradas exigidas por modo.
  const slotDefs = useMemo(() => {
    if (mode === 'i2v') return [{ label: 'Frame inicial', required: true }, { label: 'Frame final', required: false }];
    if (mode === 'i2i') {
      const max = model.maxImages?.i2i ?? 4;
      return Array.from({ length: max }, (_, i) => ({ label: i === 0 ? 'Imagem base' : `Referência ${i + 1}`, required: i === 0 }));
    }
    return [];
  }, [mode, model]);
  const visibleSlots = mode === 'i2i'
    ? slotDefs.slice(0, Math.min(slotDefs.length, Math.max(2, slots.filter(Boolean).length + 1)))
    : slotDefs;

  const changeMode = (m: GenMode) => {
    setMode(m);
    setError('');
    setSlots([]);
    if (m !== 'v2v' && video) { URL.revokeObjectURL(video.preview); setVideo(null); }
    const first = modelsFor(kind, m)[0];
    if (first && !first.modes.includes(m)) setModelId(first.id);
    if (!modelsFor(kind, m).some(x => x.id === modelId)) setModelId(first.id);
  };

  // Chegada de outra ferramenta (Gerador de Prompts, ou "Animar" de uma imagem).
  useEffect(() => {
    const h = takeGenHandoff(kind);
    if (h) {
      setMode(h.mode);
      const ms = modelsFor(kind, h.mode);
      setModelId(h.modelId && ms.some(m => m.id === h.modelId) ? h.modelId : ms[0].id);
      setPrompt(h.prompt || '');
      setNegative(h.negativePrompt || '');
      setSource(h.source === 'prompts' ? { id: h.promptId, label: 'Gerador de Prompts' } : h.source === 'imagens' ? { label: 'Imagem gerada' } : null);
      const list: (InputSlotState | null)[] = [
        ...(h.storedImages || []).map(s => ({ preview: s.preview, path: s.path })),
        ...(h.images || []).map(d => ({ preview: d, dataUrl: d })),
      ];
      setSlots(list);
      if (h.video) {
        videoDuration(h.video).then(duration => setVideo({ file: h.video!, preview: URL.createObjectURL(h.video!), duration })).catch(() => {});
      }
      return;
    }
    // Link direto com um prompt salvo: ?prompt=<id>
    const id = new URLSearchParams(window.location.search).get('prompt');
    if (id && user) {
      getDoc(doc(db, 'prompts', id)).then(snap => {
        if (!snap.exists() || snap.data().userId !== user.uid) return;
        applySaved({ id: snap.id, ...(snap.data() as any) });
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, user]);

  // Histórico em tempo real (só desta aba).
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gen_jobs'), where('uid', '==', user.uid), where('kind', '==', kind));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<GenJob, 'id'>) }))
        .sort((a, b) => b.id.localeCompare(a.id))
        .slice(0, 40);
      setJobs(list);
    }, err => console.error('[gen] histórico', err));
  }, [user, kind]);

  // Enquanto houver geração em andamento: empurra a fila e confere o status a cada 15 s.
  const activeCount = jobs.filter(j => j.active).length;
  const prevActive = useRef(0);
  useEffect(() => {
    if (prevActive.current > activeCount) refreshProfile(); // terminou ou falhou: saldo pode ter mudado (estorno)
    prevActive.current = activeCount;
    if (!activeCount) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await callTool<{ positions: Record<string, number | null> }>('/api/gen/status', {});
        if (!stop) setPositions(r.data.positions || {});
      } catch { /* a próxima volta tenta de novo */ }
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCount]);

  const selected = jobs.find(j => j.id === selectedId) || jobs[0] || null;

  const applySaved = (p: SavedPrompt) => {
    const genMode = p.mode as GenMode;
    if (modes.some(m => m.id === genMode)) changeMode(genMode);
    setPrompt(p.result.prompt);
    setNegative(p.result.negativePrompt || '');
    setSource({ id: p.id, label: PROMPT_MODES.find(m => m.id === p.mode)?.label || 'Gerador de Prompts' });
    setShowImport(false);
  };

  const pickImage = async (index: number, file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Envie a imagem em JPG, PNG ou WEBP.'); return; }
    setBusy(index);
    try {
      const dataUrl = await toJpeg(file);
      setSlots(prev => { const next = [...prev]; next[index] = { preview: dataUrl, dataUrl }; return next; });
      setError('');
    } catch {
      setError('Não foi possível ler essa imagem. Tente outro arquivo.');
    } finally {
      setBusy(null);
    }
  };

  const pickVideo = async (file?: File) => {
    if (!file) return;
    if (!/^video\/(mp4|quicktime)$/.test(file.type)) { setError('Envie o vídeo em MP4 ou MOV.'); return; }
    if (file.size > GEN_LIMITS.videoMaxBytes) { setError(`O vídeo passa de ${GEN_LIMITS.videoMaxBytes / 1024 / 1024} MB. Exporte um trecho menor ou em resolução mais baixa.`); return; }
    setBusy('video');
    try {
      const duration = await videoDuration(file);
      if (duration > GEN_LIMITS.videoMaxSeconds + 0.3) throw new Error(`O vídeo tem ${duration.toFixed(1)} s. Corte um trecho de até ${GEN_LIMITS.videoMaxSeconds} s.`);
      if (duration < GEN_LIMITS.videoMinSeconds) throw new Error(`O vídeo precisa ter pelo menos ${GEN_LIMITS.videoMinSeconds} s.`);
      if (video) URL.revokeObjectURL(video.preview);
      setVideo({ file, preview: URL.createObjectURL(file), duration });
      setError('');
    } catch (e: any) {
      setError(e.message || 'Não foi possível ler este vídeo.');
    } finally {
      setBusy(null);
    }
  };

  const generate = useCallback(async (skipTerms = false) => {
    if (!user) return;
    setError('');
    if (userProfile?.genBlocked) { setError('Sua conta está impedida de gerar por violar os termos de uso. Fale com o suporte.'); return; }
    if (!skipTerms && !termsOk.current && userProfile?.genTerms?.version !== GEN_TERMS_VERSION) { setShowTerms(true); return; }
    if (prompt.trim().length < 3) { setError('Escreva ou importe um prompt antes de gerar.'); return; }
    const missing = slotDefs.find((d, i) => d.required && !slots[i]);
    if (missing) { setError(`Envie a imagem: ${missing.label.toLowerCase()}.`); return; }
    if (mode === 'v2v' && !video) { setError('Envie o vídeo que será transformado.'); return; }
    const check = canUseTool(copy.tool, price.credits);
    if (!check.ok) { setError(check.message || 'Não foi possível gerar agora.'); return; }

    setSubmitting(true);
    try {
      const stamp = Date.now();
      const images: string[] = [];
      const filled = slots.slice(0, slotDefs.length);
      for (let i = 0; i < filled.length; i++) {
        const s = filled[i];
        if (!s) continue;
        if (s.path) { images.push(s.path); continue; }
        const path = `gen-inputs/${user.uid}/${stamp}-${i}.jpg`;
        await uploadBytes(storageRef(storage, path), dataUrlToBlob(s.dataUrl!), { contentType: 'image/jpeg' });
        images.push(path);
      }
      let videoPath: string | undefined;
      if (mode === 'v2v' && video) {
        videoPath = `gen-inputs/${user.uid}/${stamp}-video.${video.file.type === 'video/quicktime' ? 'mov' : 'mp4'}`;
        await uploadBytes(storageRef(storage, videoPath), video.file, { contentType: video.file.type });
      }

      const res = await callTool<{ id: string; position: number | null }>('/api/gen/create', {
        kind, mode, modelId: model.id, config, prompt: prompt.trim(), negativePrompt: negative.trim(),
        inputs: { images, video: videoPath }, promptId: source?.id || null,
      });
      setSelectedId(res.data.id);
      setPositions(prev => ({ ...prev, [res.data.id]: res.data.position }));
      refreshProfile();
    } catch (e: any) {
      if (e.code === 'terms_required') { termsOk.current = false; setShowTerms(true); return; }
      const storageDenied = /storage\/unauthorized|permission/i.test(String(e.code || e.message));
      setError(storageDenied
        ? 'Não foi possível enviar o arquivo. Se continuar, avise o suporte (permissão de armazenamento).'
        : e.message || 'Não foi possível gerar agora. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  }, [user, userProfile, prompt, negative, slots, slotDefs, mode, video, canUseTool, copy.tool, price.credits, kind, model.id, config, source, refreshProfile]);

  const reuse = (job: GenJob) => {
    if (modes.some(m => m.id === job.mode)) changeMode(job.mode);
    setModelId(job.modelId);
    setConfigs(prev => ({ ...prev, [job.modelId]: job.config }));
    setPrompt(job.prompt);
    setSource(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const animate = (job: GenJob) => {
    const out = job.outputs?.[0];
    if (!out?.path) return;
    setGenHandoff({ kind: 'video', mode: 'i2v', prompt: '', storedImages: [{ preview: out.url, path: out.path }], source: 'imagens' });
    router.push('/dashboard/videos?from=imagens');
  };

  const blocked = !!userProfile?.genBlocked;
  const balanceAfter = account.credits - price.credits;
  const createHref = `/dashboard/prompt-studio?mode=${mode === 'v2v' ? 'v2v' : mode === 'i2i' ? 'i2i' : mode === 't2i' ? 't2i' : 'i2v'}`;

  if (!hasToolAccess(copy.tool)) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 space-y-4">
        <h1 className="text-3xl font-bold text-white">{copy.title}</h1>
        <p className="text-gray-400">A geração está disponível para assinantes. Escolha um plano para começar.</p>
        <Link href="/dashboard/billing" className="inline-block glass-button-primary">Ver planos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
            {kind === 'video' ? <Film className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />} Estúdio Creator Lab
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{copy.title}</h1>
          <p className="text-gray-400 leading-relaxed">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.07] bg-black/30 self-start md:self-auto">
          <Coins className="w-4 h-4 text-brand-mint" />
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Saldo</p>
            <p className="text-sm font-bold text-white tabular-nums">{account.credits} créditos</p>
          </div>
        </div>
      </header>

      {blocked && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          Sua conta está impedida de gerar imagens e vídeos por violar os termos de uso. Fale com o suporte se acredita que houve um engano.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mesa de direção */}
        <section aria-label="Configuração da geração"
          className="lg:col-span-5 order-2 lg:order-1 rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-white/[0.01] backdrop-blur-xl p-5 md:p-6 space-y-7">

          {/* Modo */}
          <div role="tablist" aria-label="Tipo de geração" className={`grid gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/[0.05] ${modes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {modes.map(m => (
              <button key={m.id} role="tab" type="button" aria-selected={mode === m.id} onClick={() => changeMode(m.id)}
                className={`px-2 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === m.id
                  ? 'bg-gradient-to-b from-brand-emerald/30 to-brand-jade/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-gray-500 hover:text-white'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="-mt-4 text-[11px] text-gray-500">{modes.find(m => m.id === mode)?.description}</p>

          {/* 1. Prompt */}
          <div>
            <StepHeader n={1} title="Prompt" aside={
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/25 hover:border-brand-emerald/60">
                  <FileDown className="w-3.5 h-3.5" /> Importar
                </button>
                <Link href={createHref}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/[0.04] border border-white/10 hover:text-white">
                  <Wand2 className="w-3.5 h-3.5" /> Criar com direção
                </Link>
              </div>
            } />
            {source && (
              <p className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-emerald/10 text-[10px] font-semibold text-brand-mint">
                <Sparkles className="w-3 h-3" /> Importado · {source.label}
              </p>
            )}
            <textarea value={prompt} onChange={e => { setPrompt(e.target.value); if (source) setSource({ ...source, label: `${source.label} (editado)` }); }}
              rows={7} maxLength={GEN_LIMITS.promptMax}
              placeholder={kind === 'video'
                ? 'Descreva a cena: o que acontece, a câmera, a luz e o som. Ou importe um prompt com direção completa.'
                : 'Descreva a imagem: sujeito, composição, luz e estilo. Ou importe um prompt com direção completa.'}
              className="w-full glass-input text-[13px] leading-relaxed font-mono resize-y" />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
              <span>{prompt.length ? `${prompt.length} / ${GEN_LIMITS.promptMax}` : 'Prompts em inglês costumam render melhor.'}</span>
              {prompt && <button type="button" onClick={() => navigator.clipboard?.writeText(prompt)} className="flex items-center gap-1 hover:text-white"><Copy className="w-3 h-3" /> Copiar</button>}
            </div>
            {negative && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Evitar</p>
                <textarea value={negative} onChange={e => setNegative(e.target.value)} rows={2} maxLength={500} className="w-full glass-input text-[12px] font-mono" />
              </div>
            )}
          </div>

          {/* 2. Entradas */}
          {(slotDefs.length > 0 || mode === 'v2v') && (
            <div>
              <StepHeader n={2} title={mode === 'v2v' ? 'Vídeo de entrada' : mode === 'i2v' ? 'Frames' : 'Imagens'} />
              {mode === 'v2v' ? (
                <VideoSlot value={video} busy={busy === 'video'} onPick={pickVideo}
                  onClear={() => { if (video) URL.revokeObjectURL(video.preview); setVideo(null); }}
                  note={`MP4 ou MOV · ${GEN_LIMITS.videoMinSeconds} a ${GEN_LIMITS.videoMaxSeconds} s · até ${GEN_LIMITS.videoMaxBytes / 1024 / 1024} MB`} />
              ) : (
                <div className={`grid gap-3 ${visibleSlots.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {visibleSlots.map((d, i) => (
                    <ImageSlot key={i} label={d.label} required={d.required} value={slots[i]} busy={busy === i}
                      onPick={f => pickImage(i, f)}
                      onClear={() => setSlots(prev => { const next = [...prev]; next[i] = null; return next; })} />
                  ))}
                </div>
              )}
              {mode === 'i2v' && <p className="text-[10px] text-gray-500 mt-2">Com o frame final, o modelo faz o caminho entre as duas imagens.</p>}
            </div>
          )}

          {/* 3. Modelo */}
          <div>
            <StepHeader n={slotDefs.length > 0 || mode === 'v2v' ? 3 : 2} title="Modelo" />
            <div className="space-y-2.5">
              {available.map(m => (
                <ModelCard key={m.id} model={m} active={m.id === model.id} credits={m.id === model.id ? price.credits : undefined}
                  onClick={() => setModelId(m.id)} />
              ))}
            </div>
          </div>

          {/* 4. Ajustes */}
          <div className="space-y-4">
            <StepHeader n={slotDefs.length > 0 || mode === 'v2v' ? 4 : 3} title="Ajustes" />
            {model.aspects && !(mode === 'i2v' && model.id === 'kling-3') && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2">Proporção{mode === 'i2v' ? ' (o vídeo segue o frame inicial quando possível)' : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {model.aspects.map(a => (
                    <Chip key={a.value} active={config.aspect === a.value} onClick={() => setConfig({ aspect: a.value })} hint={a.hint}>
                      <span className="flex flex-col items-center"><AspectGlyph aspect={a.value} active={config.aspect === a.value} />{a.label}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {model.durations && model.durations.length > 1 && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2">Duração</p>
                <div className="flex flex-wrap gap-2">
                  {model.durations.map(d => <Chip key={d.value} active={config.duration === d.value} hint={hintWith(undefined, costIf({ duration: d.value }))} onClick={() => setConfig({ duration: d.value })}>{d.label}</Chip>)}
                </div>
              </div>
            )}
            {model.qualities && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2">Qualidade</p>
                <div className="flex flex-wrap gap-2">
                  {model.qualities.map(q => <Chip key={q.value} active={config.quality === q.value} hint={hintWith(q.hint, costIf({ quality: q.value }))} onClick={() => setConfig({ quality: q.value })}>{q.label}</Chip>)}
                </div>
              </div>
            )}
            {model.resolutions && (
              <div>
                <p className="text-[11px] text-gray-500 mb-2">Resolução</p>
                <div className="flex flex-wrap gap-2">
                  {model.resolutions.map(r => <Chip key={r.value} active={config.resolution === r.value} hint={hintWith(r.hint, costIf({ resolution: r.value }))} onClick={() => setConfig({ resolution: r.value })}>{r.label}</Chip>)}
                </div>
              </div>
            )}
            {model.audioToggle && (
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06] cursor-pointer">
                <span>
                  <span className="block text-xs font-semibold text-white">Áudio gerado</span>
                  <span className="block text-[10px] text-gray-500">Ambiência e efeitos sincronizados · {costIf({ audio: true })} créditos com áudio, {costIf({ audio: false })} sem.</span>
                </span>
                <input type="checkbox" checked={!!config.audio} onChange={e => setConfig({ audio: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
              </label>
            )}
            {model.nativeAudio && <p className="text-[10px] text-gray-500">Este modelo gera som e fala junto com a imagem.</p>}
          </div>

          {/* Resumo e ação */}
          <div className="sticky bottom-3 z-10 -mx-2 p-4 rounded-2xl border border-brand-emerald/25 bg-[#07100c]/95 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Custo desta geração</p>
                <p className="text-2xl font-bold text-white tabular-nums">{price.credits} <span className="text-sm font-medium text-gray-400">créditos</span></p>
              </div>
              <p className={`text-[11px] text-right tabular-nums ${balanceAfter < 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                {balanceAfter < 0 ? 'Saldo insuficiente' : `Saldo depois: ${balanceAfter}`}
              </p>
            </div>
            {error && (
              <p role="alert" className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </p>
            )}
            <button type="button" onClick={() => generate()} disabled={submitting || blocked}
              className="w-full h-12 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-sm font-bold tracking-wide shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_30px_-8px_rgba(16,185,129,0.7)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : <>{kind === 'video' ? <Clapperboard className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />} {copy.cta}</>}
            </button>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              Falhou por erro técnico? Os créditos voltam sozinhos. Uso sujeito aos <a href="/termos-de-uso/geracao-ia" target="_blank" rel="noopener" className="text-brand-mint hover:underline">termos da geração</a>.
            </p>
          </div>
        </section>

        {/* Palco */}
        <section aria-label="Resultado" className="lg:col-span-7 order-1 lg:order-2 space-y-4 lg:sticky lg:top-2">
          <Viewfinder kind={kind} job={selected} aspect={config.aspect} position={selected ? positions[selected.id] : null}
            onDownload={(url, job) => download(url, `creator-lab-${job.id}.${job.kind === 'video' ? 'mp4' : 'png'}`)} />

          {selected && selected.status === 'completed' && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => reuse(selected)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 bg-white/[0.04] border border-white/10 hover:text-white hover:border-white/25">
                <Repeat2 className="w-3.5 h-3.5" /> Reusar prompt e ajustes
              </button>
              {kind === 'image' && selected.outputs?.[0]?.path && (
                <button type="button" onClick={() => animate(selected)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/30 hover:border-brand-emerald/70">
                  <Film className="w-3.5 h-3.5" /> Animar esta imagem
                </button>
              )}
              <button type="button" onClick={() => navigator.clipboard?.writeText(selected.prompt)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 bg-white/[0.04] border border-white/10 hover:text-white hover:border-white/25">
                <Copy className="w-3.5 h-3.5" /> Copiar prompt
              </button>
            </div>
          )}

          {/* Rolo de filme: histórico */}
          {jobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 font-semibold">Suas gerações</p>
                <p className="text-[10px] text-gray-600">{jobs.length} {jobs.length === 1 ? 'item' : 'itens'}</p>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x">
                {jobs.map(j => {
                  const out = j.status === 'completed' ? j.outputs?.[0] : null;
                  const isSel = selected?.id === j.id;
                  return (
                    <button key={j.id} type="button" onClick={() => setSelectedId(j.id)} title={`${STATUS_LABEL[j.status]} · ${j.modelName}`}
                      className={`relative shrink-0 snap-start w-20 aspect-[9/16] rounded-xl overflow-hidden border bg-black/50 transition-all ${isSel ? 'border-brand-emerald ring-2 ring-brand-emerald/30' : 'border-white/[0.08] hover:border-white/25'}`}>
                      {out && (out.type === 'video'
                        ? <video src={`${out.url}#t=0.5`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={out.url} alt="" className="w-full h-full object-cover" />)}
                      {!out && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          {j.status === 'failed' ? <AlertTriangle className="w-4 h-4 text-amber-300" /> : <Loader2 className="w-4 h-4 text-brand-mint animate-spin" />}
                        </span>
                      )}
                      <span className="absolute bottom-0 inset-x-0 px-1 py-0.5 bg-black/70 text-[8px] font-mono uppercase tracking-wider text-gray-300 truncate">
                        {j.active && j.status === 'queued' && positions[j.id] ? `fila ${positions[j.id]}` : STATUS_LABEL[j.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {jobs.some(j => j.status === 'completed' && j.outputs?.some(o => !o.stored)) && (
                <p className="text-[10px] text-gray-500 mt-1">Alguns arquivos ficam disponíveis por 14 dias: baixe os que quiser guardar.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} onAccepted={async () => {
          termsOk.current = true;
          setShowTerms(false);
          await refreshProfile();
          generate(true);
        }} />
      )}
      {showImport && user && (
        <PromptImport uid={user.uid} modes={IMPORTABLE[kind]} onPick={applySaved} onClose={() => setShowImport(false)} createHref={createHref} />
      )}
    </div>
  );
}


