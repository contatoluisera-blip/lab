'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AudioLines, Download, FileText, Loader2, Mic, Music2, Scissors, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { callTool, streamTool } from '@/lib/client/api';
import { useAudioLibrary } from '@/lib/client/audioLibrary';
import { GenJob, STATUS_LABEL, getModel, normalizeConfig, quote } from '@/lib/generation';
import { SCRIPT_DONE_MARK } from '@/lib/montagem';
import { VOICES, VoiceProvider, WORDS_PER_SECOND, voiceCredits } from '@/lib/voice';
import {
  AUDIO_TYPE_LABEL, AudioType, SFX_DEFAULT_SECONDS, SFX_DURATIONS, SFX_PRESETS, SFX_PROMPT_MAX, VOICE_STUDIO_TEXT_MAX,
  audioTypeOf, sfxCredits, srtFromWords,
} from '@/lib/audioStudio';
import { MOODS } from '@/components/montagem/MusicPanel';
import { TermsModal } from '@/components/generation/TermsModal';
import { cn } from '@/lib/utils';

const MUSIC_MODEL = 'suno-v6';
const TABS: { id: AudioType; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'voice', label: 'Locução', icon: Mic, hint: 'Texto vira voz brasileira, com o tempo de cada palavra para legenda.' },
  { id: 'music', label: 'Trilha', icon: Music2, hint: 'Música instrumental original no clima que você escolher (Suno).' },
  { id: 'sfx', label: 'Efeitos sonoros', icon: AudioLines, hint: 'Whoosh, impacto, clique, ambiente: descreva e gere.' },
];

const field = 'w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/40';
const primary = 'flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50';

/** Baixa o arquivo com nome legível (o bucket aceita leitura de qualquer origem). */
async function download(url: string, name: string) {
  const blob = await fetch(url).then(r => r.blob());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase() || 'audio';

/**
 * Estúdio de Áudio: locução, trilha e efeitos sonoros como ferramenta própria.
 * Tudo vai para a biblioteca de áudio, que também aparece na Montagem de Vídeo.
 */
export function AudioStudio() {
  const { user } = useAuth();
  const { canUseTool, refreshProfile, account } = useUserProfile();
  const { jobs } = useAudioLibrary(user?.uid);
  const [tab, setTab] = useState<AudioType>('voice');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  // ── Locução ──
  const [provider, setProvider] = useState<VoiceProvider>('elevenlabs');
  const [voiceId, setVoiceId] = useState(VOICES.find(v => v.provider === 'elevenlabs')!.id);
  const [style, setStyle] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const voiceCost = voiceCredits(provider, text.trim().length);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  // ── Trilha ──
  const model = getModel(MUSIC_MODEL)!;
  const [mood, setMood] = useState('');
  const [duration, setDuration] = useState<number>(model.defaults.duration || 30);
  const musicConfig = normalizeConfig(model, { duration });
  const musicCost = quote(model, musicConfig).credits;

  // ── Efeito ──
  const [sfxText, setSfxText] = useState('');
  const [sfxEnglish, setSfxEnglish] = useState('');
  const [sfxSeconds, setSfxSeconds] = useState(SFX_DEFAULT_SECONDS);
  const [loop, setLoop] = useState(false);
  const sfxCost = sfxCredits(sfxSeconds);

  const run = async (cost: number, label: string, fn: () => Promise<void>) => {
    setError('');
    const check = canUseTool('audio', cost);
    if (!check.ok) { setError(check.message || 'Sem créditos para gerar.'); return; }
    setBusy(label);
    try {
      await fn();
      refreshProfile();
    } catch (e: any) {
      if (e.code === 'terms_required') { setShowTerms(true); return; }
      setError(e.message || 'Não foi possível gerar agora.');
    } finally {
      setBusy('');
    }
  };

  const streamed = async (path: string, body: unknown) => {
    const full = await streamTool(path, body, partial => {
      const lines = partial.split('\n').map(l => l.trim()).filter(l => l.endsWith('...'));
      if (lines.length) setBusy(lines[lines.length - 1].replace(/\.\.\.$/, ''));
    });
    if (full.indexOf(SCRIPT_DONE_MARK) < 0) throw new Error('A geração foi interrompida. Seu crédito foi devolvido.');
  };

  const generateVoice = () => run(voiceCost, 'Gerando a voz', async () => {
    await streamed('/api/audio/voice', { provider, voiceId, style: style.trim(), text: text.trim(), title: title.trim() });
  });
  const generateMusic = () => run(musicCost, 'Enviando a trilha', async () => {
    await callTool('/api/gen/create', {
      kind: 'audio', mode: 't2a', modelId: MUSIC_MODEL, config: musicConfig, prompt: mood.trim(), negativePrompt: 'vocals, singing, voice, lyrics',
      title: title.trim() || null, inputs: { images: [] },
    });
  });
  const generateSfx = () => run(sfxCost, 'Gerando o efeito', async () => {
    await streamed('/api/audio/sfx', { text: sfxText.trim(), english: sfxEnglish || undefined, seconds: sfxSeconds, loop, title: title.trim() });
  });

  const list = useMemo(() => (jobs || []).filter(j => audioTypeOf(j) === tab), [jobs, tab]);
  const current = TABS.find(t => t.id === tab)!;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Estúdio de Áudio</h1>
        <p className="text-gray-400 max-w-2xl">
          Locução com vozes brasileiras, trilha original e efeitos sonoros. Baixe o arquivo ou use direto na{' '}
          <Link href="/dashboard/montagem" className="text-brand-mint hover:underline">Montagem de Vídeo</Link>, onde tudo aparece na biblioteca.
        </p>
        <p className="text-xs text-gray-500">Saldo: <strong className="text-white tabular-nums">{account.credits.toLocaleString('pt-BR')}</strong> créditos</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de áudio">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setError(''); }}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors',
              tab === t.id ? 'border-brand-emerald/60 bg-brand-emerald/15 text-white' : 'border-white/[0.08] text-gray-400 hover:text-white')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-white/[0.07] bg-black/30 p-5 md:p-6 space-y-4">
        <p className="text-sm text-gray-400">{current.hint}</p>

        {tab === 'voice' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <select value={provider} aria-label="Provedor de voz" className={`${field} sm:col-span-3`}
                onChange={e => { const p = e.target.value as VoiceProvider; setProvider(p); setVoiceId(VOICES.find(o => o.provider === p)!.id); }}>
                <option value="elevenlabs">ElevenLabs (mais natural)</option>
                <option value="openai">OpenAI (mais econômica)</option>
              </select>
              <select value={voiceId} aria-label="Voz" className={`${field} sm:col-span-4`} onChange={e => setVoiceId(e.target.value)}>
                {VOICES.filter(v => v.provider === provider).map(o => <option key={o.id} value={o.id}>{o.name}: {o.hint}</option>)}
              </select>
              <input value={style} onChange={e => setStyle(e.target.value)} maxLength={200} aria-label="Tom da locução"
                placeholder={provider === 'openai' ? 'Tom: ex.: animado, próximo, sem exagero' : 'Tom (só OpenAI segue instruções de tom)'}
                disabled={provider !== 'openai'} className={`${field} sm:col-span-5 disabled:opacity-50`} />
            </div>
            <textarea value={text} onChange={e => setText(e.target.value.slice(0, VOICE_STUDIO_TEXT_MAX))} rows={7} aria-label="Texto da locução"
              placeholder="Escreva o texto como deve ser falado. Números por extenso soam melhor (ex.: dois mil e vinte e seis)."
              className={`${field} resize-y`} />
            <p className="text-[11px] text-gray-500 tabular-nums">
              {text.trim().length}/{VOICE_STUDIO_TEXT_MAX} caracteres · ~{Math.max(0, Math.round(words / WORDS_PER_SECOND))} s de fala
            </p>
          </>
        )}

        {tab === 'music' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button key={m.label} type="button" onClick={() => setMood(m.style)} aria-pressed={mood === m.style}
                  className={cn('px-3 py-1.5 rounded-full border text-xs', mood === m.style ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/[0.08] text-gray-400 hover:text-white')}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input value={mood} onChange={e => setMood(e.target.value)} maxLength={300} aria-label="Estilo da trilha"
                placeholder="Ou descreva: ex.: soft piano, hopeful, slow build" className={`${field} sm:col-span-9`} />
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} aria-label="Duração da trilha" className={`${field} sm:col-span-3`}>
                {(model.durations || []).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-gray-500">Instrumental, sem voz. Cada pedido traz mais de uma versão; leva cerca de 1 minuto.</p>
          </>
        )}

        {tab === 'sfx' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {SFX_PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => { setSfxText(p.label); setSfxEnglish(p.text); setSfxSeconds(p.seconds); }}
                  aria-pressed={sfxEnglish === p.text}
                  className={cn('px-3 py-1.5 rounded-full border text-xs', sfxEnglish === p.text ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/[0.08] text-gray-400 hover:text-white')}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input value={sfxText} onChange={e => { setSfxText(e.target.value); setSfxEnglish(''); }} maxLength={SFX_PROMPT_MAX} aria-label="Descrição do efeito"
                placeholder="Descreva o som: ex.: porta de madeira rangendo e batendo forte" className={`${field} sm:col-span-7`} />
              <select value={sfxSeconds} onChange={e => setSfxSeconds(Number(e.target.value))} aria-label="Duração do efeito" className={`${field} sm:col-span-3`}>
                {SFX_DURATIONS.map(s => <option key={s} value={s}>{s} s</option>)}
              </select>
              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} className="accent-emerald-400" /> Em loop
              </label>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} aria-label="Nome na biblioteca"
            placeholder="Nome na biblioteca (opcional): ex.: Cliente X · abertura" className={`${field} sm:flex-1`} />
          <button type="button" disabled={!!busy || (tab === 'voice' ? text.trim().length < 2 : tab === 'music' ? mood.trim().length < 3 : sfxText.trim().length < 3)}
            onClick={tab === 'voice' ? generateVoice : tab === 'music' ? generateMusic : generateSfx} className={primary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy || `Gerar ${current.label.toLowerCase()} · ${tab === 'voice' ? voiceCost : tab === 'music' ? musicCost : sfxCost} créditos`}
          </button>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Biblioteca · {AUDIO_TYPE_LABEL[tab]}</h2>
          <Link href="/dashboard/montagem" className="flex items-center gap-1.5 text-xs text-brand-mint hover:underline"><Scissors className="w-3.5 h-3.5" /> Usar na Montagem</Link>
        </div>
        {jobs === null ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-brand-mint" /></div>
        ) : !list.length ? (
          <p className="text-sm text-gray-500">Nada aqui ainda. O que você gerar aparece nesta lista e na Montagem de Vídeo.</p>
        ) : (
          <ul className="space-y-3">{list.map(j => <LibraryItem key={j.id} job={j} />)}</ul>
        )}
      </section>

      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} onAccepted={async () => {
          setShowTerms(false);
          await refreshProfile();
          generateMusic();
        }} />
      )}
    </div>
  );
}

function LibraryItem({ job }: { job: GenJob }) {
  const type = audioTypeOf(job)!;
  const name = job.title || job.prompt.slice(0, 80);
  const date = new Date(job.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const btn = 'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/10 text-gray-300 hover:text-white';
  return (
    <li className="rounded-2xl border border-white/[0.06] bg-black/30 p-3 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-semibold text-white truncate max-w-full">{name}</span>
        <span className="text-gray-500">{date} · {job.modelName}{job.credits ? ` · ${(job as GenJob & { creditScale?: number }).creditScale === 10 ? job.credits : job.credits * 10} créditos` : ''}</span>
        {job.status !== 'completed' && (
          <span className={job.status === 'failed' ? 'text-red-300' : 'text-amber-300'}>{STATUS_LABEL[job.status]}</span>
        )}
      </div>
      {type === 'voice' && <p className="text-[11px] text-gray-500 line-clamp-2">{job.prompt}</p>}
      {job.status === 'failed' && job.error && <p className="text-[11px] text-red-300">{job.error}</p>}
      {job.active && <div className="h-1 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-1/3 bg-amber-300 animate-pulse" /></div>}
      {job.status === 'completed' && job.outputs.map((o, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          {job.outputs.length > 1 && <span className="text-[10px] text-gray-500 w-14">Versão {i + 1}</span>}
          <audio src={o.url} controls preload="none" className="h-8 flex-1 min-w-[200px]" />
          {o.seconds ? <span className="text-[10px] text-gray-500 tabular-nums">{Math.round(o.seconds)} s</span> : null}
          <button type="button" className={btn} onClick={() => download(o.url, `${slug(name)}${job.outputs.length > 1 ? `-v${i + 1}` : ''}.mp3`)}>
            <Download className="w-3 h-3" /> MP3
          </button>
          {type === 'voice' && job.words?.length ? (
            <button type="button" className={btn} onClick={() => {
              const blob = new Blob([srtFromWords(job.words!)], { type: 'application/x-subrip' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${slug(name)}.srt`; a.click();
            }}>
              <FileText className="w-3 h-3" /> Legenda .srt
            </button>
          ) : null}
        </div>
      ))}
    </li>
  );
}
