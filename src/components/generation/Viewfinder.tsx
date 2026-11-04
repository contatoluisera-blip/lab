'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, Clapperboard, ImageIcon } from 'lucide-react';
import { GenJob, GenKind, STATUS_LABEL } from '@/lib/generation';

function useElapsed(since?: string | null, running?: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  if (!since) return '00:00';
  const s = Math.max(0, Math.floor((now - Date.parse(since)) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const ratio = (aspect?: string) => {
  const [w, h] = (aspect || '9:16').split(':').map(Number);
  return w && h ? w / h : 9 / 16;
};

/** Cantos de visor de câmera. */
function Corners({ live }: { live: boolean }) {
  const c = `absolute w-5 h-5 border-brand-mint/70 ${live ? 'animate-pulse' : ''}`;
  return (
    <>
      <span className={`${c} top-2 left-2 border-t-2 border-l-2 rounded-tl-md`} />
      <span className={`${c} top-2 right-2 border-t-2 border-r-2 rounded-tr-md`} />
      <span className={`${c} bottom-2 left-2 border-b-2 border-l-2 rounded-bl-md`} />
      <span className={`${c} bottom-2 right-2 border-b-2 border-r-2 rounded-br-md`} />
    </>
  );
}

/**
 * O palco: mostra o resultado selecionado num visor na proporção certa.
 * Enquanto gera, vira um visor "gravando" com status, posição na fila e tempo decorrido.
 */
export function Viewfinder({ kind, job, aspect, position, onDownload }: {
  kind: GenKind;
  job: GenJob | null;
  aspect?: string;
  position?: number | null;
  onDownload: (url: string, job: GenJob) => void;
}) {
  const pending = !!job && job.active;
  const elapsed = useElapsed(job?.submittedAt || job?.createdAt, pending);
  const r = ratio(job?.config?.aspect || aspect);
  const output = job?.status === 'completed' ? job.outputs?.[0] : null;

  return (
    <div className="relative rounded-[28px] border border-white/[0.07] bg-[#050807] overflow-hidden shadow-[0_40px_120px_-40px_rgba(16,185,129,0.35)]">
      {/* textura do palco */}
      <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(167,243,208,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70%] h-48 bg-brand-emerald/20 blur-[90px] pointer-events-none" />

      {/* faixa de metadados */}
      <div className="relative flex items-center justify-between gap-3 px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${pending ? 'bg-red-500 animate-pulse' : output ? 'bg-brand-emerald' : 'bg-gray-600'}`} />
          {job ? STATUS_LABEL[job.status] : kind === 'video' ? 'Visor' : 'Prancheta'}
        </span>
        <span className="truncate">
          {job ? [job.modelName, job.config?.aspect, job.config?.duration ? `${job.config.duration}s` : null, job.config?.resolution || (job.config?.quality === 'std' ? '720p' : job.config?.quality === 'pro' ? '1080p' : null)].filter(Boolean).join(' · ') : 'Creator Lab'}
        </span>
        <span className="tabular-nums">{pending ? elapsed : job?.completedAt ? new Date(job.completedAt).toLocaleDateString('pt-BR') : '--:--'}</span>
      </div>

      <div className="relative flex items-center justify-center p-5 min-h-[420px] lg:min-h-[560px]">
        <div
          className="relative w-full max-h-[64vh] rounded-2xl overflow-hidden bg-black/60 border border-white/[0.06]"
          style={{ aspectRatio: String(r), maxWidth: `calc(64vh * ${r})` }}
        >
          <Corners live={pending} />

          {output && (output.type === 'video' ? (
            <video key={output.url} src={output.url} className="w-full h-full object-contain" controls autoPlay loop muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={output.url} src={output.url} alt={job?.prompt.slice(0, 120) || 'Resultado'} className="w-full h-full object-contain" />
          ))}

          {pending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(52,211,153,0.10)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_2.4s_linear_infinite]" />
              <p className="relative font-mono text-[10px] uppercase tracking-[0.3em] text-brand-mint mb-3">
                {job!.status === 'queued' ? 'Na fila' : job!.status === 'processing' ? 'Gerando' : STATUS_LABEL[job!.status]}
              </p>
              <p className="relative text-2xl font-bold text-white tabular-nums">
                {job!.status === 'queued' && position ? `${position}º da fila` : elapsed}
              </p>
              <p className="relative text-xs text-gray-400 mt-3 max-w-xs leading-relaxed">
                {job!.status === 'queued'
                  ? 'Muita gente gerando agora. Seu pedido sai em instantes, na ordem de chegada.'
                  : kind === 'video' ? 'Vídeos levam de 1 a 5 minutos. Pode navegar pela plataforma: o resultado fica salvo aqui.' : 'Imagens levam de 10 a 60 segundos.'}
              </p>
            </div>
          )}

          {job?.status === 'failed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-300" />
              <p className="text-sm text-gray-200 leading-relaxed">{job.error || 'A geração falhou. Seu crédito foi devolvido.'}</p>
            </div>
          )}

          {!job && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-3">
              {kind === 'video' ? <Clapperboard className="w-10 h-10 text-brand-emerald/40" /> : <ImageIcon className="w-10 h-10 text-brand-emerald/40" />}
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                {kind === 'video'
                  ? 'Sua cena aparece aqui. Comece pelo prompt: importe do Gerador de Prompts ou escreva o seu.'
                  : 'Seu frame aparece aqui. Comece pelo prompt: importe do Gerador de Prompts ou escreva o seu.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {output && job && (
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <p className="text-[11px] text-gray-500 max-w-md line-clamp-2">{job.prompt}</p>
          <button type="button" onClick={() => onDownload(output.url, job)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar
          </button>
        </div>
      )}
    </div>
  );
}
