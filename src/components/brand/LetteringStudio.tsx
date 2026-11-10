'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useUserProfile } from '@/context/UserProfileContext';
import { callTool } from '@/lib/client/api';
import { prepareLettering } from '@/lib/client/lettering';
import { BRAND_LIMITS, BrandKit, LETTERING_ROLES, LetteringRole, buildLetteringPrompt } from '@/lib/brand';
import { guessRole } from '@/lib/montagem';
import { GEN_TERMS_VERSION, STATUS_LABEL, getModel, normalizeConfig, quote } from '@/lib/generation';
import { TermsModal } from '@/components/generation/TermsModal';
import { CHECKER } from './BrandKitEditor';

const MODELS = [
  { id: 'gpt-image-2', label: 'GPT Image 2', hint: 'acerta bem texto e layout' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', hint: 'mais detalhe e acabamento' },
];
const CONFIG = { aspect: '16:9', resolution: '1K' };
const field = 'w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/50';

/** Lettering pronto para revisão, antes de entrar na ID Visual. */
export interface PendingLettering {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  transparent: boolean;
  /** Original, para recortar o fundo quando o arquivo enviado não tem transparência. */
  original: Blob | string;
  text: string;
  /** Nome sugerido (do arquivo enviado). */
  name?: string;
}

export function LetteringGenerator({ kit, disabled, onReady, onError }: { kit: BrandKit; disabled: boolean; onReady: (p: PendingLettering) => void; onError: (m: string) => void }) {
  const { userProfile, canUseTool, refreshProfile } = useUserProfile();
  const [text, setText] = useState('');
  const [style, setStyle] = useState('');
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [sending, setSending] = useState(false);

  const credits = useMemo(() => {
    const model = getModel(modelId)!;
    return quote(model, normalizeConfig(model, CONFIG)).credits;
  }, [modelId]);

  // Acompanha a geração; pronta, busca a imagem e recorta o fundo.
  useEffect(() => {
    if (!jobId) return;
    let done = false;
    const unsub = onSnapshot(doc(db, 'gen_jobs', jobId), async snap => {
      const job = snap.data();
      if (!job || done) return;
      setStatus(STATUS_LABEL[job.status as keyof typeof STATUS_LABEL] || 'Gerando');
      if (job.status === 'failed') {
        done = true;
        setJobId(null);
        onError(job.error || 'A geração falhou. Os créditos foram devolvidos.');
        refreshProfile();
      } else if (job.status === 'completed' && job.outputs?.[0]?.path) {
        done = true;
        try {
          setStatus('Recortando o fundo');
          const res = await callTool<{ dataUrl: string }>('/api/montagem/brand', { action: 'output', jobId });
          const prepared = await prepareLettering(res.data.dataUrl, { removeBackground: true });
          onReady({ ...prepared, original: res.data.dataUrl, text: text.trim() });
        } catch (e: any) {
          onError(e.message || 'Não foi possível recortar esse lettering. Tente de novo.');
        } finally {
          setJobId(null);
        }
      }
    }, () => { setJobId(null); onError('Perdemos o acompanhamento da geração. Veja o resultado em Gerar Imagem.'); });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const generate = async (skipTerms = false) => {
    if (!text.trim()) { onError('Escreva o texto do lettering.'); return; }
    if (!skipTerms && userProfile?.genTerms?.version !== GEN_TERMS_VERSION) { setShowTerms(true); return; }
    const check = canUseTool('gen-image', credits);
    if (!check.ok) { onError(check.message || 'Não foi possível gerar agora.'); return; }
    setSending(true);
    try {
      const images = kit.colorRefs.map(r => r.path);
      const res = await callTool<{ id: string }>('/api/gen/create', {
        kind: 'image', mode: images.length ? 'i2i' : 't2i', modelId, config: CONFIG,
        prompt: buildLetteringPrompt({ text, style, colors: kit.colors, hasRefs: images.length > 0 }),
        inputs: { images },
      });
      setStatus('Na fila');
      setJobId(res.data.id);
      refreshProfile();
    } catch (e: any) {
      if (e.code === 'terms_required') { setShowTerms(true); return; }
      onError(e.message || 'Não foi possível gerar agora.');
    } finally {
      setSending(false);
    }
  };

  const busy = sending || !!jobId;
  return (
    <div className="rounded-xl border border-brand-emerald/20 bg-brand-emerald/[0.04] p-4 space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white"><Sparkles className="w-4 h-4 text-brand-mint" /> Gerar lettering</p>
        <p className="text-xs text-gray-400 mt-1">
          {kit.colors.length || kit.colorRefs.length
            ? `Usa ${kit.colors.length} cor(es) e ${kit.colorRefs.length} referência(s) desta ID Visual.`
            : 'Adicione cores ou referências acima para o lettering seguir a marca.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={text} onChange={e => setText(e.target.value)} maxLength={BRAND_LIMITS.letteringText} disabled={busy} placeholder="Texto exato (ex.: Oferta de Verão)" aria-label="Texto do lettering" className={field} />
        <select value={modelId} onChange={e => setModelId(e.target.value)} disabled={busy} aria-label="Modelo" className={field}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}: {m.hint}</option>)}
        </select>
      </div>
      <textarea value={style} onChange={e => setStyle(e.target.value)} maxLength={BRAND_LIMITS.letteringStyle} disabled={busy} rows={2} placeholder="Estilo (ex.: letra manuscrita grossa, com contorno e brilho de neon)" aria-label="Estilo do lettering" className={`${field} resize-y`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">O fundo é recortado depois. Confira a grafia antes de aprovar, porque a IA pode errar letras.</p>
        <button type="button" onClick={() => generate()} disabled={busy || disabled || !text.trim() || kit.letterings.length >= BRAND_LIMITS.letterings}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {busy ? (status || 'Enviando') : `Gerar · ${credits} crédito(s)`}
        </button>
      </div>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} onAccepted={() => { setShowTerms(false); refreshProfile(); generate(true); }} />}
    </div>
  );
}

/** Revisão: nada entra na ID Visual sem a pessoa ver o recorte e a grafia. */
export function LetteringReview({ pending, busy, onRemoveBackground, onApprove, onDiscard }: {
  pending: PendingLettering;
  busy: boolean;
  onRemoveBackground: () => void;
  onApprove: (meta: { name: string; role: LetteringRole; text: string }) => void;
  onDiscard: () => void;
}) {
  const [name, setName] = useState(pending.name || pending.text || '');
  const [role, setRole] = useState<LetteringRole>(pending.name ? guessRole(pending.name) : 'titulo');
  const [text, setText] = useState(pending.text);
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4 space-y-3">
      <p className="text-sm font-semibold text-white">Revise antes de adicionar</p>
      <div className="h-44 rounded-lg flex items-center justify-center p-3" style={CHECKER}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pending.previewUrl} alt="Lettering em revisão" className="max-w-full max-h-full object-contain" />
      </div>
      {!pending.transparent && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
          <span>Esse arquivo não tem fundo transparente: no vídeo, apareceria um retângulo.</span>
          <button type="button" onClick={onRemoveBackground} disabled={busy} className="px-3 py-1.5 rounded-full border border-amber-300/40 font-semibold disabled:opacity-50">Remover o fundo</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={BRAND_LIMITS.letteringName} placeholder="Nome" aria-label="Nome do lettering" className={field} />
        <select value={role} onChange={e => setRole(e.target.value as LetteringRole)} aria-label="Função do lettering" className={field}>
          {LETTERING_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <input value={text} onChange={e => setText(e.target.value)} maxLength={BRAND_LIMITS.letteringText} placeholder="O que está escrito (ajuda o Claude)" aria-label="Texto escrito no lettering" className={field} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDiscard} disabled={busy} className="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-gray-300 disabled:opacity-50">Descartar</button>
        <button type="button" onClick={() => onApprove({ name: name.trim() || 'Lettering', role, text: text.trim() })} disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Adicionar à ID Visual
        </button>
      </div>
    </div>
  );
}
