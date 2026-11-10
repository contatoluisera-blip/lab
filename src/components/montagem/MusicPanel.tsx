'use client';

import React, { useState } from 'react';
import { Check, Loader2, Music2 } from 'lucide-react';
import { callTool } from '@/lib/client/api';
import { useUserProfile } from '@/context/UserProfileContext';
import { STATUS_LABEL, getModel, normalizeConfig, quote } from '@/lib/generation';
import { Edl, MONTAGEM_FPS, MUSIC_DEFAULT_VOLUME, VideoProject } from '@/lib/montagem';
import type { Job } from './ProductionPanel';

const MODEL_ID = 'suno-v6';
/** Climas prontos (o Suno entende melhor em inglês); a pessoa pode escrever o próprio. */
const MOODS: { label: string; style: string }[] = [
  { label: 'Inspirador', style: 'uplifting inspirational corporate, warm piano and strings, soft build, modern' },
  { label: 'Lo-fi', style: 'chill lo-fi hip hop, mellow keys, soft vinyl texture, relaxed groove' },
  { label: 'Pop animado', style: 'upbeat feel-good pop, bright synths, claps, energetic and catchy' },
  { label: 'Cinematográfico', style: 'cinematic emotional score, orchestral strings, epic build, trailer feel' },
  { label: 'Eletrônico', style: 'energetic electronic, punchy drums, driving bass, modern social media' },
  { label: 'Acústico', style: 'light acoustic guitar, warm and organic, gentle percussion, positive' },
];

/**
 * Trilha da montagem: Suno V6 (KIE) instrumental, na duração do vídeo. Cada pedido devolve
 * mais de uma versão; a escolhida toca sob o vídeo todo, com volume ajustável e fade no fim.
 */
export function MusicPanel({ project, jobs, edl, totalFrames, onEdl, onError }: {
  project: VideoProject;
  jobs: Job[];
  edl: Edl;
  totalFrames: number;
  onEdl: (next: Edl) => void;
  onError: (message: string) => void;
}) {
  const { canUseTool, refreshProfile } = useUserProfile();
  const [style, setStyle] = useState('');
  const [sending, setSending] = useState(false);
  const model = getModel(MODEL_ID)!;
  const seconds = Math.max(15, Math.ceil(totalFrames / MONTAGEM_FPS));
  // Menor duração do catálogo que cobre o vídeo (a trilha repete se o vídeo crescer depois).
  const duration = (model.durations || []).map(d => d.value).find(v => v >= seconds) ?? 180;
  const config = normalizeConfig(model, { duration });
  const credits = quote(model, config).credits;
  const tracks = jobs.filter(j => j.kind === 'audio');

  const generate = async () => {
    const text = style.trim();
    if (text.length < 3) { onError('Escolha um clima ou descreva o estilo da trilha.'); return; }
    const check = canUseTool('montagem', credits);
    if (!check.ok) { onError(check.message || 'Sem créditos para gerar a trilha.'); return; }
    setSending(true);
    try {
      await callTool('/api/gen/create', {
        kind: 'audio', mode: 't2a', modelId: MODEL_ID, config, prompt: text, negativePrompt: 'vocals, singing, voice, lyrics',
        title: project.title, projectId: project.id, inputs: { images: [] },
      });
      refreshProfile();
    } catch (e: any) {
      onError(e.code === 'terms_required' ? 'Aceite os termos de uso da geração (abra Gerar imagem uma vez) e tente de novo.' : e.message || 'Não foi possível gerar a trilha.');
    } finally {
      setSending(false);
    }
  };

  const chosen = edl.music;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-white"><Music2 className="w-3.5 h-3.5 text-brand-mint" /> Trilha sonora <span className="font-normal text-gray-500">(opcional)</span></p>
        <p className="text-[11px] text-gray-500 mt-0.5">Música instrumental gerada no clima do vídeo, com {duration} s. Cada pedido traz mais de uma versão para você escolher.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map(m => (
          <button key={m.label} type="button" onClick={() => setStyle(m.style)} aria-pressed={style === m.style}
            className={`px-2.5 py-1 rounded-full border text-[11px] ${style === m.style ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/[0.08] text-gray-400 hover:text-white'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={style} onChange={e => setStyle(e.target.value)} maxLength={300} placeholder="Ou descreva: ex.: soft piano, hopeful, slow build"
          aria-label="Estilo da trilha" className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/40" />
        <button type="button" onClick={generate} disabled={sending || style.trim().length < 3}
          className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music2 className="w-3.5 h-3.5" />} Gerar trilha · {credits} crédito{credits > 1 ? 's' : ''}
        </button>
      </div>

      {tracks.length > 0 && (
        <ul className="space-y-2">
          {tracks.map(j => (
            <li key={j.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-2">
              <p className="text-[11px] text-gray-400 truncate">
                <span className={j.status === 'failed' ? 'text-red-300' : j.status === 'completed' ? 'text-brand-mint' : 'text-amber-300'}>{STATUS_LABEL[j.status]}</span>
                {' · '}{j.prompt}
              </p>
              {j.status === 'failed' && j.error && <p className="text-[11px] text-red-300">{j.error}</p>}
              {j.active && <div className="h-1 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-1/3 bg-amber-300 animate-pulse" /></div>}
              {j.status === 'completed' && j.outputs.map((o, i) => {
                const active = chosen?.jobId === j.id && chosen.index === i;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-14">Versão {i + 1}{o.seconds ? ` · ${Math.round(o.seconds)} s` : ''}</span>
                    <audio src={o.url} controls preload="none" className="h-8 flex-1 min-w-[180px]" />
                    <button type="button" onClick={() => onEdl({ ...edl, music: active ? null : { jobId: j.id, index: i, volume: chosen?.volume ?? MUSIC_DEFAULT_VOLUME } })}
                      disabled={!o.stored}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${active ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/10 text-gray-300 hover:text-white'} disabled:opacity-40`}>
                      {active ? <><Check className="w-3 h-3" /> Na montagem</> : 'Usar esta'}
                    </button>
                  </div>
                );
              })}
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <label className="flex items-center gap-2 text-[11px] text-gray-300">
          Volume da trilha
          <input type="range" min={5} max={100} value={Math.round(chosen.volume * 100)} onChange={e => onEdl({ ...edl, music: { ...chosen, volume: Number(e.target.value) / 100 } })}
            className="flex-1 accent-emerald-400" aria-label="Volume da trilha" />
          {Math.round(chosen.volume * 100)}%
        </label>
      )}
    </div>
  );
}
