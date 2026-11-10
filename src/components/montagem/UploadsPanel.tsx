'use client';

import React, { useRef, useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { checkVideoFile, uploadProjectVideo } from '@/lib/client/videoUpload';
import { ProjectUpload, UPLOAD_LIMITS, VideoProject } from '@/lib/montagem';

const secs = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${s.toFixed(1).replace('.', ',')} s`);

/** Lê a lista na hora de gravar: dois envios seguidos (ou duas abas) não se apagam. */
async function changeUploads(projectId: string, change: (list: ProjectUpload[]) => ProjectUpload[]) {
  const ref = doc(db, 'video_projects', projectId);
  await runTransaction(db, async tx => {
    const list = ((await tx.get(ref)).data()?.uploads || []) as ProjectUpload[];
    tx.update(ref, { uploads: change(list), updatedAt: new Date().toISOString() });
  });
}

/**
 * Vídeos da própria pessoa (gravados ou gerados fora): entram na linha do tempo como qualquer clipe,
 * com o áudio original. A descrição é o que o Claude usa para montar, junto com as miniaturas.
 */
export function UploadsPanel({ project, usedIds, onUse, onRemoved, onError, step }: {
  project: VideoProject;
  usedIds: Set<string>;
  onUse: (upload: ProjectUpload) => void;
  /** Tira o vídeo apagado da linha do tempo. */
  onRemoved: (id: string) => void;
  onError: (message: string) => void;
  step: string;
}) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState<{ name: string; progress: number; index: number; total: number } | null>(null);
  const uploads = project.uploads || [];
  const room = UPLOAD_LIMITS.perProject - uploads.length;

  const send = async (files: File[]) => {
    if (!user || !files.length) return;
    if (files.length > room) { onError(`Este projeto aceita até ${UPLOAD_LIMITS.perProject} vídeos. Dá para enviar mais ${room}.`); return; }
    const problem = files.map(checkVideoFile).find(Boolean);
    if (problem) { onError(problem); return; }
    for (let i = 0; i < files.length; i++) {
      setSending({ name: files[i].name, progress: 0, index: i + 1, total: files.length });
      try {
        const upload = await uploadProjectVideo(user.uid, files[i], p => setSending(s => (s ? { ...s, progress: p } : s)));
        await changeUploads(project.id, list => [...list, upload].slice(0, UPLOAD_LIMITS.perProject));
      } catch (e: any) {
        const denied = /storage\/unauthorized|permission/i.test(String(e?.code || e?.message));
        onError(denied ? 'O envio foi recusado pelo armazenamento. Se continuar, avise o suporte.' : e.message || 'Não foi possível enviar o vídeo.');
        break;
      }
    }
    setSending(null);
  };

  const describe = (u: ProjectUpload, description: string) => {
    const text = description.replace(/\s+/g, ' ').trim().slice(0, UPLOAD_LIMITS.descriptionMax);
    if (text === u.description) return;
    changeUploads(project.id, list => list.map(x => (x.id === u.id ? { ...x, description: text } : x))).catch(() => onError('Não foi possível salvar a descrição.'));
  };

  const remove = async (u: ProjectUpload) => {
    const warn = usedIds.has(u.id) ? ' Ele está na linha do tempo e vai sair de lá também.' : '';
    if (!confirm(`Apagar "${u.name}" deste projeto?${warn} O arquivo é excluído e não pode ser recuperado.`)) return;
    try {
      await changeUploads(project.id, list => list.filter(x => x.id !== u.id));
      onRemoved(u.id);
      await Promise.all([u.path, ...u.thumbs.map(t => t.path)].map(p => deleteObject(storageRef(storage, p)).catch(() => {})));
    } catch {
      onError('Não foi possível apagar o vídeo.');
    }
  };

  return (
    <section aria-label="Seus vídeos" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{step}. Seus vídeos</h2>
          <p className="text-[11px] text-gray-500 mt-1">
            Takes gravados ou prontos: MP4, MOV ou WEBM, até {UPLOAD_LIMITS.maxBytes / 1024 / 1024} MB e {UPLOAD_LIMITS.maxSeconds / 60} min cada. O áudio original é mantido.
          </p>
        </div>
        <input ref={input} type="file" accept={UPLOAD_LIMITS.accept} multiple className="hidden"
          onChange={e => { send(Array.from(e.target.files || [])); e.target.value = ''; }} />
        <button type="button" onClick={() => input.current?.click()} disabled={!!sending || room <= 0}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Enviar vídeos
        </button>
      </div>

      {sending && (
        <div className="p-3 rounded-xl border border-brand-emerald/25 bg-brand-emerald/[0.05] space-y-2" role="status">
          <p className="text-xs text-gray-200 truncate">
            Enviando {sending.total > 1 ? `${sending.index} de ${sending.total}: ` : ''}{sending.name} · {Math.round(sending.progress * 100)}%
          </p>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-brand-emerald transition-all" style={{ width: `${Math.max(3, Math.round(sending.progress * 100))}%` }} />
          </div>
          <p className="text-[10px] text-gray-500">Deixe esta página aberta até terminar.</p>
        </div>
      )}

      {uploads.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {uploads.map(u => (
            <article key={u.id} className="rounded-2xl border border-white/[0.07] bg-black/30 p-3 space-y-2.5">
              <div className="flex gap-1 rounded-lg overflow-hidden bg-black">
                {u.thumbs.map(t => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={t.path} src={t.url} alt="" className="flex-1 min-w-0 h-16 object-cover" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <p className="flex-1 min-w-0 text-xs font-semibold text-white truncate" title={u.name}>{u.name}</p>
                <span className="text-[10px] text-gray-500 shrink-0">{secs(u.seconds)}</span>
                <button type="button" onClick={() => remove(u)} aria-label={`Apagar ${u.name}`} className="p-1 text-gray-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea defaultValue={u.description} rows={2} maxLength={UPLOAD_LIMITS.descriptionMax} onBlur={e => describe(u, e.target.value)}
                placeholder="O que acontece no take (ajuda o Claude): ex.: abertura falando para a câmera; produto na mesa"
                aria-label={`Descrição de ${u.name}`}
                className="w-full px-2.5 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] text-gray-200 placeholder:text-gray-600 outline-none focus:border-brand-emerald/40 resize-y" />
              <button type="button" onClick={() => onUse(u)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-brand-emerald/30 text-brand-mint hover:bg-brand-emerald/10">
                <Plus className="w-3 h-3" /> {usedIds.has(u.id) ? 'Adicionar de novo à linha do tempo' : 'Usar na montagem'}
              </button>
            </article>
          ))}
        </div>
      ) : !sending && (
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); send(Array.from(e.dataTransfer.files || [])); }}
          className="w-full flex flex-col items-center gap-1.5 px-4 py-8 rounded-2xl border border-dashed border-white/15 bg-black/30 text-gray-400 hover:border-brand-emerald/50 hover:text-white">
          <Upload className="w-5 h-5" />
          <span className="text-sm font-semibold">Arraste seus vídeos ou clique para enviar</span>
          <span className="text-[11px] text-gray-500">Depois descreva cada take e use &ldquo;Montar com IA&rdquo; ou monte à mão.</span>
        </button>
      )}
    </section>
  );
}
