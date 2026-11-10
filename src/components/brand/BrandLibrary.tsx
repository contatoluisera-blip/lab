'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { Loader2, Palette, Plus, X } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { callTool } from '@/lib/client/api';
import { prepareColorRef, prepareLettering } from '@/lib/client/lettering';
import { BRAND_LIMITS, BrandKit, DEFAULT_TEXT_STYLE, LetteringRole } from '@/lib/brand';
import { guessRole } from '@/lib/montagem';
import { BrandKitEditor } from './BrandKitEditor';
import { LetteringGenerator, LetteringReview, PendingLettering } from './LetteringStudio';

const API = '/api/montagem/brand';
const newId = () => crypto.randomUUID().slice(0, 8);

/** Biblioteca de ID Visual da conta: cada projeto de vídeo escolhe uma destas. */
export function BrandLibrary() {
  const { user } = useAuth();
  const [kits, setKits] = useState<BrandKit[] | null>(null);
  const [active, setActive] = useState<BrandKit | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingLettering | null>(null);
  /** Arquivos com fundo, esperando revisão (um por vez). */
  const [reviewQueue, setReviewQueue] = useState<PendingLettering[]>([]);

  // Sempre a versão mais nova, e uma gravação por vez: duas mudanças rápidas não se atropelam.
  const latest = useRef<BrandKit | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!user) return;
    callTool<{ kits: BrandKit[] }>(API, { action: 'list' })
      .then(r => setKits(r.data.kits))
      .catch(e => { setKits([]); setError(e.message || 'Não foi possível abrir a biblioteca.'); });
  }, [user]);

  const open = (kit: BrandKit | null) => {
    latest.current = kit;
    setActive(kit);
    setPending(null);
    setReviewQueue([]);
    setError('');
  };

  const persist = () => {
    queue.current = queue.current.then(async () => {
      if (!latest.current) return;
      try {
        const res = await callTool<{ kit: BrandKit }>(API, { action: 'save', kit: latest.current });
        setKits(list => (list || []).map(k => (k.id === res.data.kit.id ? res.data.kit : k)));
      } catch (e: any) {
        setError(e.message || 'Não foi possível salvar. Confira sua conexão.');
      }
    });
    return queue.current;
  };

  const change = (patch: Partial<BrandKit>, save = true) => {
    if (!latest.current) return;
    latest.current = { ...latest.current, ...patch };
    setActive(latest.current);
    if (save) persist();
  };

  const createKit = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy('Criando');
    setError('');
    try {
      const res = await callTool<{ kit: BrandKit }>(API, {
        action: 'save', kit: { name, colors: [], colorRefs: [], letterings: [], textStyle: DEFAULT_TEXT_STYLE },
      });
      setKits(list => [res.data.kit, ...(list || [])]);
      setNewName('');
      open(res.data.kit);
    } catch (e: any) {
      setError(e.message || 'Não foi possível criar a ID Visual.');
    } finally {
      setBusy('');
    }
  };

  const deleteKit = async () => {
    const kit = latest.current;
    if (!kit || !confirm(`Apagar a ID Visual "${kit.name}" e os arquivos dela? Os projetos que a usam ficam sem ID Visual. Isso não pode ser desfeito.`)) return;
    setBusy('Apagando');
    try {
      await queue.current;
      await callTool(API, { action: 'delete', id: kit.id });
      setKits(list => (list || []).filter(k => k.id !== kit.id));
      open(null);
    } catch (e: any) {
      setError(e.message || 'Não foi possível apagar.');
    } finally {
      setBusy('');
    }
  };

  const upload = async (blob: Blob, ext: 'png' | 'jpg') => {
    const path = `gen-inputs/${user!.uid}/brand-${crypto.randomUUID()}.${ext}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
    return { path, url: await getDownloadURL(ref) };
  };

  const uploadRef = async (file: File) => {
    if (!latest.current || latest.current.colorRefs.length >= BRAND_LIMITS.refs) return;
    setBusy('Enviando referência');
    setError('');
    try {
      const prepared = await prepareColorRef(file);
      const asset = await upload(prepared.blob, 'jpg');
      change({ colorRefs: [...(latest.current?.colorRefs || []), { id: newId(), ...asset, palette: prepared.palette }] });
    } catch (e: any) {
      setError(e.message || 'Não foi possível enviar a referência.');
    } finally {
      setBusy('');
    }
  };

  /** Envio em lote: PNG transparente entra direto (nome e função pelo nome do arquivo); com fundo, vai para a revisão. */
  const reviewFile = async (files: File[]) => {
    if (!latest.current) return;
    const room = BRAND_LIMITS.letterings - latest.current.letterings.length;
    if (files.length > room) { setError(`Esta ID Visual aceita até ${BRAND_LIMITS.letterings} letterings. Dá para enviar mais ${room}.`); return; }
    setError('');
    const toReview: PendingLettering[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBusy(`Enviando ${i + 1} de ${files.length}`);
      try {
        const prepared = await prepareLettering(file, { removeBackground: false });
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, BRAND_LIMITS.letteringName) || 'Lettering';
        if (!prepared.transparent) { toReview.push({ ...prepared, original: file, text: '', name }); continue; }
        const asset = await upload(prepared.blob, 'png');
        change({ letterings: [...(latest.current?.letterings || []), { id: newId(), ...asset, name, role: guessRole(file.name), text: '', width: prepared.width, height: prepared.height }] });
      } catch (e: any) {
        setError(`"${file.name}": ${e.message || 'não foi possível ler esse arquivo.'}`);
      }
    }
    setBusy('');
    if (toReview.length) {
      setPending(p => p || toReview[0]);
      setReviewQueue(q => [...q, ...(pending ? toReview : toReview.slice(1))]);
    }
  };

  /** Próximo da fila de revisão (ou nenhum). */
  const nextPending = () => {
    setPending(reviewQueue[0] || null);
    setReviewQueue(q => q.slice(1));
  };

  const removeBackground = async () => {
    if (!pending) return;
    setBusy('Recortando o fundo');
    try {
      const prepared = await prepareLettering(pending.original, { removeBackground: true });
      setPending({ ...pending, ...prepared });
    } catch (e: any) {
      setError(e.message || 'Não foi possível recortar o fundo.');
    } finally {
      setBusy('');
    }
  };

  const approve = async (meta: { name: string; role: LetteringRole; text: string }) => {
    if (!pending || !latest.current) return;
    setBusy('Salvando o lettering');
    setError('');
    try {
      const asset = await upload(pending.blob, 'png');
      change({ letterings: [...(latest.current?.letterings || []), { id: newId(), ...asset, ...meta, width: pending.width, height: pending.height }] });
      nextPending();
    } catch (e: any) {
      setError(e.message || 'Não foi possível salvar o lettering.');
    } finally {
      setBusy('');
    }
  };

  const errorBox = error && (
    <div className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">
      {error}
      <button type="button" onClick={() => setError('')} aria-label="Fechar aviso"><X className="w-4 h-4" /></button>
    </div>
  );

  if (kits === null) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-mint" /></div>;

  if (active) {
    return (
      <div className="space-y-4">
        {errorBox}
        <BrandKitEditor kit={active} busy={busy} onBack={() => open(null)} onDelete={deleteKit} onChange={change} onCommit={persist} onUploadRef={uploadRef} onUploadLettering={reviewFile}>
          {pending
            ? <LetteringReview key={pending.previewUrl} pending={pending} busy={!!busy} onRemoveBackground={removeBackground} onApprove={approve} onDiscard={nextPending} />
            : <LetteringGenerator kit={active} disabled={!!busy} onReady={setPending} onError={setError} />}
        </BrandKitEditor>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">ID Visual</h1>
        <p className="text-sm text-gray-400 max-w-2xl">Guarde cores, referências e letterings de cada marca. No projeto de vídeo, escolha uma ID Visual e o Claude usa essas artes na edição.</p>
      </header>
      {errorBox}
      <form onSubmit={e => { e.preventDefault(); createKit(); }} className="flex flex-col sm:flex-row gap-2 max-w-lg">
        <input value={newName} onChange={e => setNewName(e.target.value)} maxLength={BRAND_LIMITS.name} placeholder="Nome da marca ou do cliente" aria-label="Nome da nova ID Visual"
          className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/50" />
        <button type="submit" disabled={!newName.trim() || !!busy} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar ID Visual
        </button>
      </form>
      {kits.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map(k => (
            <button key={k.id} type="button" onClick={() => open(k)} className="text-left rounded-2xl border border-white/[0.07] bg-black/30 hover:border-brand-emerald/40 p-4 space-y-3 transition-colors">
              <p className="text-base font-semibold text-white truncate">{k.name}</p>
              <div className="flex gap-1 h-5">
                {k.colors.map(c => <span key={c} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />)}
              </div>
              <p className="text-xs text-gray-500">{k.letterings.length} lettering(s) · {k.colorRefs.length} referência(s)</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
          <Palette className="w-8 h-8 mx-auto text-brand-emerald/40" />
          <p className="text-sm text-gray-400">Nenhuma ID Visual ainda. Crie a primeira com o nome da marca.</p>
        </div>
      )}
    </div>
  );
}
