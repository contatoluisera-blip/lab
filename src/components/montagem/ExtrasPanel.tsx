'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AudioLines, Mic, Plus, Trash2 } from 'lucide-react';
import type { GenJob } from '@/lib/generation';
import { AUDIO_TYPE_LABEL, audioTypeOf } from '@/lib/audioStudio';
import { Edl, EdlClip, EdlExtra, EXTRAS_MAX, MONTAGEM_FPS, clipStartFrames } from '@/lib/montagem';

const fmt = (frames: number) => {
  const s = frames / MONTAGEM_FPS;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

/**
 * Locuções avulsas e efeitos sonoros de Gerar Áudio na linha do tempo: cada um entra no início
 * de um clipe, com um atraso opcional. Locução pode ter legenda palavra por palavra; a trilha abaixa durante a fala.
 */
export function ExtrasPanel({ edl, libraryJobs, totalFrames, label, onEdl }: {
  edl: Edl;
  libraryJobs: GenJob[];
  totalFrames: number;
  label: (c: EdlClip) => string;
  onEdl: (next: Edl) => void;
}) {
  const items = useMemo(() => libraryJobs.filter(j => {
    const t = audioTypeOf(j);
    return (t === 'voice' || t === 'sfx') && j.status === 'completed' && j.outputs?.[0]?.stored;
  }), [libraryJobs]);
  const [jobId, setJobId] = useState('');
  const [clipIndex, setClipIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const extras = edl.extras || [];
  const starts = clipStartFrames(edl);
  const byId = (id: string) => items.find(j => j.id === id) || libraryJobs.find(j => j.id === id);
  const nameOf = (j?: GenJob) => (j ? j.title || j.prompt.slice(0, 60) : 'Áudio removido da biblioteca');

  const add = () => {
    const job = byId(jobId);
    if (!job || !edl.clips.length) return;
    const from = Math.min(Math.max(0, totalFrames - 1), (starts[clipIndex] ?? 0) + Math.round(Math.max(0, offset) * MONTAGEM_FPS));
    const type = audioTypeOf(job) === 'voice' ? 'voice' : 'sfx';
    const next: EdlExtra = { id: `x${Date.now().toString(36)}`, jobId: job.id, kind: type, from, volume: type === 'sfx' ? 0.8 : 1, captions: type === 'voice' };
    onEdl({ ...edl, extras: [...extras, next].sort((a, b) => a.from - b.from) });
  };
  const update = (id: string, patch: Partial<EdlExtra>) => onEdl({ ...edl, extras: extras.map(x => (x.id === id ? { ...x, ...patch } : x)) });
  const remove = (id: string) => onEdl({ ...edl, extras: extras.filter(x => x.id !== id) });

  const select = 'px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white outline-none focus:border-brand-emerald/40';
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-white"><AudioLines className="w-3.5 h-3.5 text-brand-mint" /> Locuções e efeitos da biblioteca <span className="font-normal text-gray-500">(opcional)</span></p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          O que você cria em <Link href="/dashboard/audio" className="text-brand-mint hover:underline">Gerar Áudio</Link> entra aqui: escolha o áudio e em que ponto do vídeo ele começa.
        </p>
      </div>

      {!items.length ? (
        <p className="text-[11px] text-gray-500">Nenhuma locução ou efeito na biblioteca ainda.</p>
      ) : !edl.clips.length ? (
        <p className="text-[11px] text-gray-500">Monte a linha do tempo primeiro.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[10px] text-gray-500 flex-1 min-w-[180px]">
            Áudio
            <select value={jobId} onChange={e => setJobId(e.target.value)} className={select} aria-label="Áudio da biblioteca">
              <option value="">Escolha…</option>
              {(['voice', 'sfx'] as const).map(t => (
                <optgroup key={t} label={AUDIO_TYPE_LABEL[t]}>
                  {items.filter(j => audioTypeOf(j) === t).map(j => (
                    <option key={j.id} value={j.id}>{nameOf(j)} · {Math.round(Number(j.outputs[0].seconds) || 0)} s</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-gray-500">
            Começa no
            <select value={clipIndex} onChange={e => setClipIndex(Number(e.target.value))} className={select} aria-label="Clipe de início">
              {edl.clips.map((c, i) => <option key={c.id} value={i}>Clipe {i + 1} · {label(c)} ({fmt(starts[i] ?? 0)})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-gray-500">
            + segundos
            <input type="number" min={0} max={60} step={0.1} value={offset} onChange={e => setOffset(Number(e.target.value) || 0)} className={`${select} w-20`} aria-label="Atraso em segundos" />
          </label>
          <button type="button" onClick={add} disabled={!jobId || extras.length >= EXTRAS_MAX}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>
      )}

      {extras.length > 0 && (
        <ul className="space-y-2">
          {extras.map(x => {
            const job = byId(x.jobId);
            return (
              <li key={x.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  {x.kind === 'voice' ? <Mic className="w-3.5 h-3.5 text-brand-mint shrink-0" /> : <AudioLines className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                  <span className="text-gray-300 truncate flex-1">{AUDIO_TYPE_LABEL[x.kind]} · {nameOf(job)}</span>
                  <span className="text-gray-500 tabular-nums shrink-0">em {fmt(x.from)}</span>
                  <button type="button" onClick={() => remove(x.id)} aria-label="Tirar da montagem" className="p-1 text-gray-500 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {job?.outputs?.[0]?.url && <audio src={job.outputs[0].url} controls preload="none" className="h-8 w-full" />}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-300">
                  <label className="flex items-center gap-2 flex-1 min-w-[160px]">
                    Volume
                    <input type="range" min={5} max={150} value={Math.round(x.volume * 100)} onChange={e => update(x.id, { volume: Number(e.target.value) / 100 })}
                      className="flex-1 accent-emerald-400" aria-label="Volume do áudio" />
                    {Math.round(x.volume * 100)}%
                  </label>
                  {x.kind === 'voice' && (
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={x.captions} onChange={e => update(x.id, { captions: e.target.checked })} className="accent-emerald-400" />
                      Legenda
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
