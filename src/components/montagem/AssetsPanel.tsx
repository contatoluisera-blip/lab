'use client';

import React, { useRef, useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { Film, Layers, Loader2, Scissors, Trash2, Upload } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { checkAssetFile, deleteAssetFile, removeAssetBackground, uploadProjectAsset } from '@/lib/client/projectAssets';
import { LETTERING_ROLES, LetteringRole } from '@/lib/brand';
import {
  ASSET_LIMITS, Edl, LETTERING_SIZES, LetteringSize, ProjectAsset, VideoProject, WATERMARK_CORNERS, WatermarkCorner, sourceFramesFor,
} from '@/lib/montagem';
import { CHECKER } from '@/components/brand/BrandKitEditor';

const field = 'px-2 py-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] text-white outline-none focus:border-brand-emerald/40';

/** Lê a lista na hora de gravar: envios seguidos (ou duas abas) não se apagam. */
async function changeAssets(projectId: string, change: (list: ProjectAsset[]) => ProjectAsset[]) {
  const ref = doc(db, 'video_projects', projectId);
  await runTransaction(db, async tx => {
    const list = ((await tx.get(ref)).data()?.assets || []) as ProjectAsset[];
    tx.update(ref, { assets: change(list), updatedAt: new Date().toISOString() });
  });
}

const watermarkFor = (a: ProjectAsset, prev?: Edl['watermark']): NonNullable<Edl['watermark']> => ({
  assetId: a.id, type: a.type, frames: a.type === 'video' ? sourceFramesFor(a.seconds) : 0,
  corner: prev?.corner || 'tr', size: prev?.size || 's', opacity: prev?.opacity ?? 0.8,
});
const outroFor = (a: ProjectAsset, prev?: Edl['outro']): NonNullable<Edl['outro']> => ({ assetId: a.id, frames: sourceFramesFor(a.seconds), muted: prev?.muted ?? false });

/**
 * Artes deste vídeo, sem passar pela biblioteca: envio de vários arquivos de uma vez.
 * Imagens viram letterings/logos da linha do tempo (e o Claude vê cada uma); vídeos servem de
 * marca d'água ou vinheta final. Nome do arquivo sugere a função (logo, cta, gancho...).
 */
export function AssetsPanel({ project, edl, onEdl, onError }: {
  project: VideoProject;
  edl: Edl;
  onEdl: (next: Edl) => void;
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState<{ name: string; progress: number; index: number; total: number } | null>(null);
  const [cutting, setCutting] = useState('');
  const assets = project.assets || [];
  const images = assets.filter(a => a.type === 'image');
  const videos = assets.filter(a => a.type === 'video');
  const room = ASSET_LIMITS.perProject - assets.length;

  const send = async (files: File[]) => {
    if (!user || !files.length) return;
    if (files.length > room) { onError(`Cada projeto aceita até ${ASSET_LIMITS.perProject} artes. Dá para enviar mais ${room}.`); return; }
    const problem = files.map(checkAssetFile).find(Boolean);
    if (problem) { onError(problem); return; }
    let next = edl;
    for (let i = 0; i < files.length; i++) {
      setSending({ name: files[i].name, progress: 0, index: i + 1, total: files.length });
      try {
        const asset = await uploadProjectAsset(user.uid, files[i], p => setSending(s => (s ? { ...s, progress: p } : s)));
        await changeAssets(project.id, list => [...list, asset].slice(0, ASSET_LIMITS.perProject));
        // Nome do arquivo já diz o uso: "vinheta.mp4" vira vinheta final; "marca-dagua.png" vira marca d'água.
        const n = files[i].name.toLowerCase();
        if (asset.type === 'video' && !next.outro && /vinheta|outro|encerramento|final/.test(n)) next = { ...next, outro: outroFor(asset) };
        else if (!next.watermark && /marca.?d.?agua|watermark/.test(n)) next = { ...next, watermark: watermarkFor(asset) };
      } catch (e: any) {
        const denied = /storage\/unauthorized|permission/i.test(String(e?.code || e?.message));
        onError(denied ? 'O envio foi recusado pelo armazenamento. Se continuar, avise o suporte.' : e.message || 'Não foi possível enviar a arte.');
        break;
      }
    }
    if (next !== edl) onEdl(next);
    setSending(null);
  };

  const patch = (a: ProjectAsset, change: Partial<ProjectAsset>) =>
    changeAssets(project.id, list => list.map(x => (x.id === a.id ? { ...x, ...change } : x))).catch(() => onError('Não foi possível salvar a arte.'));

  const cutBackground = async (a: ProjectAsset) => {
    if (!user) return;
    setCutting(a.id);
    try {
      const updated = await removeAssetBackground(user.uid, a);
      await changeAssets(project.id, list => list.map(x => (x.id === a.id ? updated : x)));
    } catch (e: any) {
      onError(e.message || 'Não foi possível recortar o fundo.');
    } finally {
      setCutting('');
    }
  };

  const remove = async (a: ProjectAsset) => {
    const used = edl.clips.some(c => c.letteringId === a.id) || edl.endCard.letteringId === a.id || edl.watermark?.assetId === a.id || edl.outro?.assetId === a.id;
    if (!confirm(`Apagar "${a.name}"?${used ? ' Ela está na montagem e sai de lá também.' : ''} O arquivo é excluído e não pode ser recuperado.`)) return;
    try {
      await changeAssets(project.id, list => list.filter(x => x.id !== a.id));
      await deleteAssetFile(a);
      if (used) {
        onEdl({
          ...edl,
          clips: edl.clips.map(c => (c.letteringId === a.id ? { ...c, letteringId: null } : c)),
          endCard: edl.endCard.letteringId === a.id ? { ...edl.endCard, letteringId: null } : edl.endCard,
          watermark: edl.watermark?.assetId === a.id ? null : edl.watermark,
          outro: edl.outro?.assetId === a.id ? null : edl.outro,
        });
      }
    } catch {
      onError('Não foi possível apagar a arte.');
    }
  };

  const mark = edl.watermark;
  const setMark = (id: string) => {
    const a = assets.find(x => x.id === id);
    onEdl({ ...edl, watermark: a ? watermarkFor(a, mark) : null });
  };
  const setOutro = (id: string) => {
    const a = videos.find(x => x.id === id);
    onEdl({ ...edl, outro: a ? outroFor(a, edl.outro) : null });
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white"><Layers className="w-3.5 h-3.5 text-brand-mint" /> Artes do vídeo <span className="font-normal text-gray-500">(opcional)</span></p>
          <p className="text-[11px] text-gray-500 mt-0.5">Letterings e logos (PNG com fundo transparente) e vídeos de marca d&apos;água ou vinheta final. Envie vários de uma vez.</p>
        </div>
        <input ref={input} type="file" accept={ASSET_LIMITS.accept} multiple className="hidden"
          onChange={e => { send(Array.from(e.target.files || [])); e.target.value = ''; }} />
        <button type="button" onClick={() => input.current?.click()} disabled={!!sending || room <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Enviar artes
        </button>
      </div>

      {sending && (
        <div className="space-y-1.5" role="status">
          <p className="text-[11px] text-gray-300 truncate">Enviando {sending.total > 1 ? `${sending.index} de ${sending.total}: ` : ''}{sending.name}</p>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-brand-emerald transition-all" style={{ width: `${Math.max(4, Math.round(((sending.index - 1 + sending.progress) / sending.total) * 100))}%` }} />
          </div>
        </div>
      )}

      {!assets.length && !sending && (
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); send(Array.from(e.dataTransfer.files || [])); }}
          className="w-full flex flex-col items-center gap-1 px-4 py-5 rounded-xl border border-dashed border-white/15 text-gray-400 hover:border-brand-emerald/50 hover:text-white">
          <Upload className="w-4 h-4" />
          <span className="text-xs font-semibold">Arraste todas as artes do vídeo aqui</span>
          <span className="text-[10px] text-gray-500">Dica: nomes como &ldquo;logo&rdquo;, &ldquo;cta&rdquo;, &ldquo;gancho&rdquo;, &ldquo;vinheta&rdquo; e &ldquo;marca-dagua&rdquo; já definem a função.</span>
        </button>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2"
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); send(Array.from(e.dataTransfer.files || [])); }}>
          {images.map(a => (
            <div key={a.id} className="rounded-xl border border-white/[0.07] overflow-hidden">
              <div className="h-20 flex items-center justify-center p-2 relative" style={CHECKER}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} className="max-w-full max-h-full object-contain" />
                <button type="button" onClick={() => remove(a)} aria-label={`Apagar ${a.name}`} className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-gray-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
              <div className="p-2 space-y-1.5 bg-black/40">
                <input defaultValue={a.name} maxLength={60} onBlur={e => e.target.value.trim() && e.target.value.trim() !== a.name && patch(a, { name: e.target.value.trim() })}
                  aria-label="Nome da arte" className={`${field} w-full`} />
                <select value={a.role} onChange={e => patch(a, { role: e.target.value as LetteringRole })} aria-label="Função" className={`${field} w-full`}>
                  {LETTERING_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {a.transparent === false && (
                  <button type="button" onClick={() => cutBackground(a)} disabled={!!cutting}
                    title="Sem fundo transparente, a arte aparece num retângulo no vídeo"
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-amber-300/40 text-[10px] font-semibold text-amber-200 disabled:opacity-50">
                    {cutting === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />} Remover fundo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <ul className="space-y-1.5">
          {videos.map(a => (
            <li key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.07] bg-black/30">
              <Film className="w-3.5 h-3.5 text-brand-mint shrink-0" />
              <span className="flex-1 min-w-0 truncate text-[11px] text-white">{a.name}</span>
              <span className="text-[10px] text-gray-500">{(a.seconds || 0).toFixed(1).replace('.', ',')} s</span>
              <button type="button" onClick={() => remove(a)} aria-label={`Apagar ${a.name}`} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </li>
          ))}
        </ul>
      )}

      {assets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="watermark" className="text-[11px] font-semibold text-white">Marca d&apos;água (durante as cenas)</label>
            <select id="watermark" value={mark?.assetId || ''} onChange={e => setMark(e.target.value)} className={`${field} w-full`}>
              <option value="">Sem marca d&apos;água</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.type === 'video' ? 'Vídeo: ' : ''}{a.name}</option>)}
            </select>
            {mark && (
              <div className="grid grid-cols-3 gap-1.5">
                <select value={mark.corner} onChange={e => onEdl({ ...edl, watermark: { ...mark, corner: e.target.value as WatermarkCorner } })} aria-label="Posição da marca d'água" className={field}>
                  {WATERMARK_CORNERS.map(c => <option key={c.id} value={c.id}>{c.label.replace('Canto ', '')}</option>)}
                </select>
                <select value={mark.size} onChange={e => onEdl({ ...edl, watermark: { ...mark, size: e.target.value as LetteringSize } })} aria-label="Tamanho da marca d'água" className={field}>
                  {LETTERING_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <label className="flex items-center gap-1 text-[10px] text-gray-400">
                  <input type="range" min={15} max={100} value={Math.round(mark.opacity * 100)} onChange={e => onEdl({ ...edl, watermark: { ...mark, opacity: Number(e.target.value) / 100 } })}
                    aria-label="Opacidade da marca d'água" className="w-full accent-emerald-400" />
                  {Math.round(mark.opacity * 100)}%
                </label>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="outro" className="text-[11px] font-semibold text-white">Vinheta final animada (depois da chamada final)</label>
            <select id="outro" value={edl.outro?.assetId || ''} onChange={e => setOutro(e.target.value)} disabled={!videos.length} className={`${field} w-full disabled:opacity-50`}>
              <option value="">{videos.length ? 'Sem vinheta' : 'Envie um vídeo para usar como vinheta'}</option>
              {videos.map(a => <option key={a.id} value={a.id}>{a.name} · {(a.seconds || 0).toFixed(1).replace('.', ',')} s</option>)}
            </select>
            {edl.outro && (
              <label className="flex items-center gap-2 text-[11px] text-gray-300">
                <input type="checkbox" checked={!edl.outro.muted} onChange={e => onEdl({ ...edl, outro: { ...edl.outro!, muted: !e.target.checked } })} className="accent-emerald-400" />
                Com o áudio da vinheta
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
