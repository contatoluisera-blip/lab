'use client';

import React, { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { Loader2, Mic, Wand2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { callTool, streamTool } from '@/lib/client/api';
import { useUserProfile } from '@/context/UserProfileContext';
import { Edl, EdlClip, MONTAGEM_FPS, SCRIPT_DONE_MARK, VideoProject, clipFrames } from '@/lib/montagem';
import { ProjectVoice, VOICES, VOICE_CREDITS, VOICE_LEAD_FRAMES, VOICE_TEXT_MAX, VoiceProvider, VoiceSegment, WORDS_PER_SECOND, segmentReady } from '@/lib/voice';

const field = 'px-2.5 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white outline-none focus:border-brand-emerald/40';
const DEFAULT_VOICE: ProjectVoice = { provider: 'elevenlabs', voiceId: VOICES[0].id, style: '', segments: [] };
const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Lê a locução na hora de gravar: duas abas ou a geração no servidor não se atropelam. */
async function changeVoice(projectId: string, change: (v: ProjectVoice) => ProjectVoice) {
  const ref = doc(db, 'video_projects', projectId);
  await runTransaction(db, async tx => {
    const current = ((await tx.get(ref)).data()?.voice || DEFAULT_VOICE) as ProjectVoice;
    tx.update(ref, { voice: change({ ...DEFAULT_VOICE, ...current }), updatedAt: new Date().toISOString() });
  });
}

/**
 * Locução: o Claude escreve a fala de cada clipe no tempo dele, a pessoa ajusta o texto,
 * escolhe a voz (ElevenLabs ou OpenAI) e gera. Cada trecho toca no início do clipe, com
 * legenda palavra por palavra e a trilha abaixando durante a fala.
 */
export function VoicePanel({ project, edl, label, onEdl, flushEdl, onError }: {
  project: VideoProject;
  edl: Edl;
  label: (c: EdlClip) => string;
  onEdl: (next: Edl) => void;
  /** Grava a linha do tempo antes de o servidor ler o projeto. */
  flushEdl: () => Promise<unknown>;
  onError: (message: string) => void;
}) {
  const { canUseTool, refreshProfile } = useUserProfile();
  const voice: ProjectVoice = { ...DEFAULT_VOICE, ...(project.voice || {}) };
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const options = VOICES.filter(v => v.provider === voice.provider);
  const segOf = (clipId: string) => voice.segments.find(s => s.clipId === clipId);
  const withText = edl.clips.filter(c => segOf(c.id)?.text.trim());
  const pending = withText.filter(c => !segmentReady(segOf(c.id)!, voice)).length;

  const save = (change: (v: ProjectVoice) => ProjectVoice) => changeVoice(project.id, change).catch(() => onError('Não foi possível salvar a locução.'));
  const setText = (clipId: string, text: string) => save(v => {
    const exists = v.segments.some(s => s.clipId === clipId);
    const seg: VoiceSegment = { clipId, text: text.slice(0, VOICE_TEXT_MAX), audio: v.segments.find(s => s.clipId === clipId)?.audio || null };
    return { ...v, segments: exists ? v.segments.map(s => (s.clipId === clipId ? seg : s)) : [...v.segments, seg] };
  });

  const writeScript = async () => {
    if (withText.length && !confirm('Substituir os textos da locução pelos que o Claude escrever?')) return;
    setBusy('Escrevendo a locução');
    setNote('');
    try {
      await flushEdl();
      const res = await callTool<{ note: string }>('/api/montagem/voice/script', { projectId: project.id, provider: voice.provider, voiceId: voice.voiceId, style: voice.style || '' });
      setNote(res.data.note);
    } catch (e: any) {
      onError(e.message || 'Não foi possível escrever a locução.');
    } finally {
      setBusy('');
    }
  };

  /** Clipes curtos para a fala ganham tempo (até o fim do arquivo), e a locução entra na montagem. */
  const fitAndEnable = (segments: VoiceSegment[]) => {
    const fresh = { ...voice, segments };
    const clips = edl.clips.map(c => {
      const seg = segments.find(s => s.clipId === c.id);
      if (!seg || !segmentReady(seg, fresh)) return c;
      const need = Math.ceil(seg.audio!.seconds * MONTAGEM_FPS) + VOICE_LEAD_FRAMES + 6;
      if (clipFrames(c) >= need) return c;
      return { ...c, trimEnd: Math.min(c.sourceFrames, c.trimStart + need) };
    });
    onEdl({ ...edl, clips, voice: edl.voice || { volume: 1, captions: true, duck: 0.3 } });
  };

  const generate = async () => {
    const check = canUseTool('montagem', VOICE_CREDITS);
    if (!check.ok) { onError(check.message || 'Sem créditos para gerar a locução.'); return; }
    setBusy('Gerando a voz');
    try {
      await flushEdl();
      const full = await streamTool('/api/montagem/voice', { projectId: project.id }, partial => {
        const lines = partial.split('\n').map(l => l.trim()).filter(l => l.endsWith('...'));
        if (lines.length) setBusy(lines[lines.length - 1].replace(/\.\.\.$/, ''));
      });
      if (full.indexOf(SCRIPT_DONE_MARK) < 0) throw new Error('A geração foi interrompida. Seu crédito foi devolvido.');
      refreshProfile();
      // Lê o projeto atualizado pelo servidor para ajustar os cortes ao tempo da fala.
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'video_projects', project.id));
      fitAndEnable(((snap.data()?.voice as ProjectVoice | undefined)?.segments) || []);
    } catch (e: any) {
      onError(e.message || 'Não foi possível gerar a locução.');
    } finally {
      setBusy('');
    }
  };

  const vcfg = edl.voice;
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-4 space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-white"><Mic className="w-3.5 h-3.5 text-brand-mint" /> Locução <span className="font-normal text-gray-500">(opcional)</span></p>
        <p className="text-[11px] text-gray-500 mt-0.5">O Claude escreve a fala de cada clipe no tempo dele; você ajusta e gera a voz. Legendas palavra por palavra e a trilha abaixa durante a fala.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <select value={voice.provider} aria-label="Provedor de voz" className={`${field} sm:col-span-3`}
          onChange={e => { const provider = e.target.value as VoiceProvider; save(v => ({ ...v, provider, voiceId: VOICES.find(o => o.provider === provider)!.id })); }}>
          <option value="elevenlabs">ElevenLabs</option>
          <option value="openai">OpenAI</option>
        </select>
        <select value={voice.voiceId} aria-label="Voz" className={`${field} sm:col-span-4`} onChange={e => save(v => ({ ...v, voiceId: e.target.value }))}>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}: {o.hint}</option>)}
        </select>
        <input defaultValue={voice.style} maxLength={200} placeholder="Tom: ex.: animado, próximo, sem exagero" aria-label="Tom da locução"
          onBlur={e => e.target.value.trim() !== (voice.style || '') && save(v => ({ ...v, style: e.target.value.trim() }))} className={`${field} sm:col-span-5`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={writeScript} disabled={!!busy || !edl.clips.length}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-brand-mint bg-brand-emerald/10 border border-brand-emerald/25 disabled:opacity-40">
          <Wand2 className="w-3.5 h-3.5" /> Escrever locução com IA
        </button>
        <button type="button" onClick={generate} disabled={!!busy || !pending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-40">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
          {busy || (pending ? `Gerar voz (${pending} trecho${pending > 1 ? 's' : ''}) · ${VOICE_CREDITS} crédito` : withText.length ? 'Voz pronta' : 'Gerar voz')}
        </button>
      </div>
      {note && <p className="text-[11px] text-gray-400">{note}</p>}

      {edl.clips.length > 0 && (
        <ol className="space-y-2">
          {edl.clips.map((c, i) => {
            const seg = segOf(c.id);
            const secs = clipFrames(c) / MONTAGEM_FPS;
            const max = Math.floor(secs * WORDS_PER_SECOND);
            const words = wordCount(seg?.text || '');
            const ready = seg && seg.text.trim() && segmentReady(seg, voice);
            return (
              <li key={c.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-white font-semibold truncate">{String(i + 1).padStart(2, '0')} · {label(c)} <span className="font-normal text-gray-500">· {secs.toFixed(1).replace('.', ',')} s</span></span>
                  <span className={words > max ? 'text-amber-300' : 'text-gray-500'}>{words}/{max} palavras</span>
                </div>
                <textarea key={`${c.id}-${seg?.text || ''}`} defaultValue={seg?.text || ''} rows={2} maxLength={VOICE_TEXT_MAX}
                  placeholder="Fala deste clipe (vazio = sem locução aqui)" aria-label={`Locução do clipe ${i + 1}`}
                  onBlur={e => e.target.value.trim() !== (seg?.text || '').trim() && setText(c.id, e.target.value.trim())}
                  className={`${field} w-full resize-y`} />
                {ready && <audio src={seg!.audio!.url} controls preload="none" className="h-8 w-full" />}
                {seg?.text.trim() && !ready && <p className="text-[10px] text-amber-300">Texto ou voz mudou: gere a voz de novo.</p>}
              </li>
            );
          })}
        </ol>
      )}

      {withText.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-gray-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!vcfg} onChange={e => onEdl({ ...edl, voice: e.target.checked ? { volume: 1, captions: true, duck: 0.3 } : null })} className="accent-emerald-400" />
            Locução na montagem
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={!vcfg} checked={!!vcfg?.captions} onChange={e => vcfg && onEdl({ ...edl, voice: { ...vcfg, captions: e.target.checked } })} className="accent-emerald-400" />
            Legendas palavra por palavra
          </label>
          <label className="flex items-center gap-2">
            Trilha na fala
            <input type="range" min={10} max={100} disabled={!vcfg} value={Math.round((vcfg?.duck ?? 0.3) * 100)}
              onChange={e => vcfg && onEdl({ ...edl, voice: { ...vcfg, duck: Number(e.target.value) / 100 } })} className="flex-1 accent-emerald-400" aria-label="Volume da trilha durante a fala" />
            {Math.round((vcfg?.duck ?? 0.3) * 100)}%
          </label>
        </div>
      )}
    </div>
  );
}
