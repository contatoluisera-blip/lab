'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AudioLines, ChevronDown, Download, FileText, Loader2, Mic, Music2, RotateCcw, Scissors, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { callTool, streamTool } from '@/lib/client/api';
import { useAudioLibrary } from '@/lib/client/audioLibrary';
import { GenJob, STATUS_LABEL, getModel, normalizeConfig, quote } from '@/lib/generation';
import { SCRIPT_DONE_MARK } from '@/lib/montagem';
import {
  ELEVEN_TTS_MODELS, OPENAI_TTS_MODELS, VOICES, VoiceProvider, WORDS_PER_SECOND, elevenModel, openaiModel, voiceCredits, voiceFitsModel,
} from '@/lib/voice';
import {
  AUDIO_TYPE_LABEL, AudioType, MUSIC_LYRICS_MAX, MUSIC_STYLE_MAX, SFX_DEFAULT_INFLUENCE, SFX_DEFAULT_SECONDS, SFX_DURATIONS, SFX_PRESETS,
  SFX_PROMPT_MAX, SUNO_VERSIONS, VOICE_STUDIO_TEXT_MAX, audioTypeOf, sfxCredits, srtFromWords,
} from '@/lib/audioStudio';
import { MOODS } from '@/components/montagem/MusicPanel';
import { TermsModal } from '@/components/generation/TermsModal';
import { cn } from '@/lib/utils';

const MUSIC_MODEL = 'suno-v6';
const TABS: { id: AudioType; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'voice', label: 'Locução', icon: Mic, hint: 'Texto vira voz brasileira, com o tempo de cada palavra para legenda.' },
  { id: 'music', label: 'Trilha', icon: Music2, hint: 'Trilha instrumental ou música com letra, no estilo que você descrever (Suno).' },
  { id: 'sfx', label: 'Efeitos sonoros', icon: AudioLines, hint: 'Whoosh, impacto, clique, ambiente: descreva e gere.' },
];

/** Tags de emoção e reação do Eleven v3/v4 (vão em inglês, entre colchetes, antes do trecho). */
const VOICE_TAGS: { tag: string; label: string }[] = [
  { tag: '[happy]', label: 'Feliz' }, { tag: '[excited]', label: 'Empolgada' }, { tag: '[sad]', label: 'Triste' },
  { tag: '[angry]', label: 'Brava' }, { tag: '[curious]', label: 'Curiosa' }, { tag: '[sarcastic]', label: 'Sarcástica' },
  { tag: '[calm]', label: 'Calma' }, { tag: '[serious]', label: 'Séria' }, { tag: '[whispers]', label: 'Sussurro' },
  { tag: '[shouts]', label: 'Grito' }, { tag: '[laughs]', label: 'Risada' }, { tag: '[chuckles]', label: 'Risadinha' },
  { tag: '[sighs]', label: 'Suspiro' }, { tag: '[exhales]', label: 'Expira' }, { tag: '[clears throat]', label: 'Pigarro' },
  { tag: '[pause]', label: 'Pausa' },
];
/** Marcações de estrutura que o Suno entende na letra. */
const LYRIC_TAGS = ['[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Outro]'];
const VARIETY = ['Exata', 'Normal', 'Alta', 'Extra', 'Máxima'];

const field = 'w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-emerald/40';
const primary = 'flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-black bg-gradient-to-b from-[#34d399] to-[#10b981] disabled:opacity-50';
const chip = (on: boolean) => cn('px-2.5 py-1 rounded-full border text-[11px]', on ? 'border-brand-emerald/60 text-white bg-brand-emerald/15' : 'border-white/[0.08] text-gray-400 hover:text-white');

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

/** Controle deslizante que pode ficar "no padrão do provedor" (null = não envia o parâmetro). */
function Knob({ label, value, onChange, min = 0, max = 1, step = 0.05, left, right, fallback, help }: {
  label: string; value: number | null; onChange: (v: number | null) => void;
  min?: number; max?: number; step?: number; left?: string; right?: string; fallback: number; help?: string;
}) {
  const v = value ?? fallback;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-gray-300" title={help}>{label}</span>
        <span className="flex items-center gap-1.5 text-gray-500 tabular-nums">
          {value === null ? 'padrão' : v.toFixed(2)}
          {value !== null && (
            <button type="button" onClick={() => onChange(null)} aria-label={`Voltar ${label} ao padrão`} className="hover:text-white"><RotateCcw className="w-3 h-3" /></button>
          )}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => onChange(Number(e.target.value))}
        className={cn('w-full accent-emerald-400', value === null && 'opacity-50')} aria-label={label} />
      {(left || right) && <div className="flex justify-between text-[10px] text-gray-600"><span>{left}</span><span>{right}</span></div>}
      {help && <p className="text-[10px] text-gray-600">{help}</p>}
    </div>
  );
}

function Advanced({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white">
        Ajustes avançados <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

/** Insere um trecho na posição do cursor de uma caixa de texto. */
function insertAt(el: HTMLTextAreaElement | null, value: string, current: string, set: (v: string) => void, max: number) {
  const start = el?.selectionStart ?? current.length;
  const end = el?.selectionEnd ?? current.length;
  const before = current.slice(0, start);
  const piece = `${before && !/\s$/.test(before) ? ' ' : ''}${value} `;
  set((before + piece + current.slice(end)).slice(0, max));
  requestAnimationFrame(() => { el?.focus(); const p = before.length + piece.length; el?.setSelectionRange(p, p); });
}

/**
 * Estúdio de Áudio: locução, trilha e efeitos sonoros como ferramenta própria, com todos os
 * parâmetros de cada provedor. Tudo vai para a biblioteca de áudio, que também aparece na Montagem.
 */
export function AudioStudio() {
  const { user } = useAuth();
  const { canUseTool, refreshProfile, account } = useUserProfile();
  const { jobs } = useAudioLibrary(user?.uid);
  const [tab, setTab] = useState<AudioType>('voice');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [title, setTitle] = useState('');

  // ── Locução ──
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [provider, setProvider] = useState<VoiceProvider>('elevenlabs');
  const [elModel, setElModel] = useState('eleven_v3');
  const [oaModel, setOaModel] = useState(OPENAI_TTS_MODELS[0].id);
  const [gender, setGender] = useState<'all' | 'f' | 'm'>('all');
  const [voiceId, setVoiceId] = useState(VOICES.find(v => v.provider === 'elevenlabs')!.id);
  const [instructions, setInstructions] = useState('');
  const [text, setText] = useState('');
  const [stability, setStability] = useState<number | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [styleExag, setStyleExag] = useState<number | null>(null);
  const [boost, setBoost] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [seed, setSeed] = useState('');
  const [normalization, setNormalization] = useState<'' | 'auto' | 'on' | 'off'>('');
  const em = elevenModel(elModel);
  const om = openaiModel(oaModel);
  const voiceModel = provider === 'elevenlabs' ? elModel : oaModel;
  const textMax = provider === 'elevenlabs' ? Math.min(VOICE_STUDIO_TEXT_MAX, em.maxChars) : VOICE_STUDIO_TEXT_MAX;
  const voiceCost = voiceCredits(provider, text.trim().length, voiceModel);
  const spoken = text.replace(/\[[^\]]*\]/g, ' ').trim();
  const words = spoken ? spoken.split(/\s+/).length : 0;
  const voiceList = VOICES.filter(v => v.provider === provider && (gender === 'all' || v.gender === gender) && voiceFitsModel(v, voiceModel));
  const voiceOptions = provider === 'elevenlabs'
    ? {
      model: elModel,
      ...(stability !== null ? { stability } : {}), ...(similarity !== null ? { similarity } : {}),
      ...(em.style && styleExag !== null ? { style: styleExag } : {}), ...(em.boost && boost !== null ? { speakerBoost: boost } : {}),
      ...(speed !== null ? { speed } : {}), ...(seed.trim() ? { seed: Number(seed) } : {}), ...(normalization ? { normalization } : {}),
    }
    : { model: oaModel, ...(om.speed && speed !== null ? { speed } : {}) };

  // ── Trilha ──
  const model = getModel(MUSIC_MODEL)!;
  const lyricsRef = useRef<HTMLTextAreaElement>(null);
  const [mood, setMood] = useState('');
  const [duration, setDuration] = useState<number>(model.defaults.duration || 30);
  const [version, setVersion] = useState<'V6' | 'V6_MINI' | 'V6_WILD'>('V6');
  const [instrumental, setInstrumental] = useState(true);
  const [lyrics, setLyrics] = useState('');
  const [vocalGender, setVocalGender] = useState<'' | 'f' | 'm'>('');
  const [negative, setNegative] = useState('');
  const [styleWeight, setStyleWeight] = useState<number | null>(null);
  const [weirdness, setWeirdness] = useState<number | null>(null);
  const [audioWeight, setAudioWeight] = useState<number | null>(null);
  const [variety, setVariety] = useState<number | null>(null);
  const musicConfig = normalizeConfig(model, { duration });
  const musicCost = quote(model, musicConfig).credits;

  // ── Efeito ──
  const [sfxText, setSfxText] = useState('');
  const [sfxEnglish, setSfxEnglish] = useState('');
  const [sfxSeconds, setSfxSeconds] = useState(SFX_DEFAULT_SECONDS);
  const [loop, setLoop] = useState(false);
  const [influence, setInfluence] = useState<number | null>(null);
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
    await streamed('/api/audio/voice', { provider, voiceId, style: om.instructions ? instructions.trim() : '', text: text.trim(), title: title.trim(), options: voiceOptions });
  });
  const generateMusic = () => run(musicCost, 'Enviando a trilha', async () => {
    await callTool('/api/gen/create', {
      kind: 'audio', mode: 't2a', modelId: MUSIC_MODEL, config: musicConfig, prompt: mood.trim(),
      negativePrompt: negative.trim() || (instrumental ? 'vocals, singing, voice, lyrics' : ''),
      title: title.trim() || null, inputs: { images: [] },
      music: {
        version, instrumental, ...(instrumental ? {} : { lyrics: lyrics.trim(), ...(vocalGender ? { vocalGender } : {}), ...(audioWeight !== null ? { audioWeight } : {}) }),
        ...(styleWeight !== null ? { styleWeight } : {}), ...(weirdness !== null ? { weirdness } : {}), ...(variety !== null ? { variety } : {}),
      },
    });
  });
  const generateSfx = () => run(sfxCost, 'Gerando o efeito', async () => {
    await streamed('/api/audio/sfx', { text: sfxText.trim(), english: sfxEnglish || undefined, seconds: sfxSeconds, loop, title: title.trim(), ...(influence !== null ? { influence } : {}) });
  });

  const canGenerate = tab === 'voice' ? text.trim().length >= 2 && text.trim().length <= textMax
    : tab === 'music' ? mood.trim().length >= 3 && (instrumental || lyrics.trim().length >= 10)
      : sfxText.trim().length >= 3;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="space-y-1 text-[11px] text-gray-500">
                Provedor
                <select value={provider} aria-label="Provedor de voz" className={field}
                  onChange={e => { const p = e.target.value as VoiceProvider; setProvider(p); setVoiceId(VOICES.find(o => o.provider === p)!.id); setSpeed(null); }}>
                  <option value="elevenlabs">ElevenLabs: mais natural, {VOICES.filter(v => v.provider === 'elevenlabs').length} vozes brasileiras</option>
                  <option value="openai">OpenAI: mais econômica, {VOICES.filter(v => v.provider === 'openai').length} vozes</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px] text-gray-500">
                Modelo
                {provider === 'elevenlabs' ? (
                  <select value={elModel} onChange={e => { setElModel(e.target.value); setSpeed(null); }} aria-label="Modelo de voz" className={field}>
                    {ELEVEN_TTS_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}: {m.hint}</option>)}
                  </select>
                ) : (
                  <select value={oaModel} onChange={e => { setOaModel(e.target.value); setSpeed(null); }} aria-label="Modelo de voz" className={field}>
                    {OPENAI_TTS_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}: {m.hint}</option>)}
                  </select>
                )}
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                Voz
                {(['all', 'f', 'm'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)} className={chip(gender === g)}>{g === 'all' ? 'Todas' : g === 'f' ? 'Femininas' : 'Masculinas'}</button>
                ))}
              </div>
              <select value={voiceList.some(v => v.id === voiceId) ? voiceId : ''} onChange={e => setVoiceId(e.target.value)} aria-label="Voz" className={field}>
                {!voiceList.some(v => v.id === voiceId) && <option value="" disabled>Escolha uma voz</option>}
                {voiceList.map(o => <option key={o.id} value={o.id}>{o.name}: {o.gender === 'f' ? 'feminina' : 'masculina'}, {o.hint}</option>)}
              </select>
            </div>

            {provider === 'openai' && om.instructions && (
              <input value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={200} aria-label="Instruções de tom"
                placeholder="Tom e emoção: ex.: animada e sorridente, ritmo rápido de Reels, sem exagero" className={field} />
            )}

            {provider === 'elevenlabs' && em.tags && (
              <div className="space-y-1">
                <p className="text-[11px] text-gray-500">Emoções e reações ({em.label}): toque para inserir no ponto do cursor. A tag vale para o trecho que vem depois dela e não aparece na legenda.</p>
                <div className="flex flex-wrap gap-1.5">
                  {VOICE_TAGS.map(t => (
                    <button key={t.tag} type="button" onClick={() => insertAt(textRef.current, t.tag, text, setText, textMax)} className={chip(false)} title={t.tag}>
                      {t.label} <span className="text-gray-600">{t.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {provider === 'elevenlabs' && !em.tags && /\[[^\]]+\]/.test(text) && (
              <p className="text-[11px] text-amber-300">O {em.label} lê as tags entre colchetes como texto. Para emoções, use o Eleven v3 ou o v4.</p>
            )}

            <textarea ref={textRef} value={text} onChange={e => setText(e.target.value.slice(0, textMax))} rows={7} aria-label="Texto da locução"
              placeholder={em.tags && provider === 'elevenlabs'
                ? 'Ex.: [excited] Chegou a promoção que você esperava! [whispers] Mas é só até domingo.'
                : 'Escreva o texto como deve ser falado. Números por extenso soam melhor (ex.: dois mil e vinte e seis).'}
              className={`${field} resize-y`} />
            <p className="text-[11px] text-gray-500 tabular-nums">{text.trim().length}/{textMax} caracteres · ~{Math.max(0, Math.round(words / WORDS_PER_SECOND))} s de fala</p>

            <Advanced>
              {provider === 'elevenlabs' ? (
                <>
                  <Knob label="Estabilidade" value={stability} onChange={setStability} fallback={0.5} left="mais expressiva" right="mais estável"
                    help={em.tags ? 'No v3: perto de 0 = criativa, 0,5 = natural, 1 = robusta (segue menos as tags).' : 'Baixa varia mais a emoção; alta deixa a leitura uniforme.'} />
                  <Knob label="Semelhança com a voz original" value={similarity} onChange={setSimilarity} fallback={0.75} left="mais livre" right="mais fiel" />
                  {em.style && <Knob label="Exagero de estilo" value={styleExag} onChange={setStyleExag} fallback={0} left="neutro" right="carregado" help="Acentua o jeito da voz; acima de 0,5 pode soar artificial." />}
                  <Knob label="Velocidade" value={speed} onChange={setSpeed} min={0.7} max={1.2} step={0.01} fallback={1} left="0,7× mais lenta" right="1,2× mais rápida" />
                  {em.boost && (
                    <label className="flex items-center gap-2 text-[11px] text-gray-300">
                      <input type="checkbox" checked={boost ?? true} onChange={e => setBoost(e.target.checked)} className="accent-emerald-400" />
                      Reforço de semelhança (speaker boost)
                    </label>
                  )}
                  <label className="space-y-1 text-[11px] text-gray-300">
                    Normalização do texto
                    <select value={normalization} onChange={e => setNormalization(e.target.value as typeof normalization)} className={field} aria-label="Normalização do texto">
                      <option value="">Padrão</option>
                      <option value="auto">Automática</option>
                      <option value="on">Ligada: lê números, datas e siglas por extenso</option>
                      <option value="off">Desligada: lê exatamente como está escrito</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-[11px] text-gray-300">
                    Semente (seed)
                    <input value={seed} onChange={e => setSeed(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="Aleatória" className={field} aria-label="Semente" />
                    <span className="block text-[10px] text-gray-600">Repita o número para tentar reproduzir a mesma leitura.</span>
                  </label>
                </>
              ) : om.speed ? (
                <Knob label="Velocidade" value={speed} onChange={setSpeed} min={0.25} max={4} step={0.05} fallback={1} left="0,25× mais lenta" right="4× mais rápida" />
              ) : (
                <p className="text-[11px] text-gray-500 sm:col-span-2">O GPT-4o mini TTS é controlado pelas instruções de tom acima. Para mudar a velocidade, escolha o TTS-1 HD ou o TTS-1.</p>
              )}
            </Advanced>
          </>
        )}

        {tab === 'music' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="space-y-1 text-[11px] text-gray-500">
                Modelo
                <select value={version} onChange={e => setVersion(e.target.value as typeof version)} aria-label="Versão do Suno" className={field}>
                  {SUNO_VERSIONS.map(v => <option key={v.id} value={v.id}>{v.label}: {v.hint}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[11px] text-gray-500">
                Tipo
                <select value={instrumental ? 'inst' : 'voz'} onChange={e => setInstrumental(e.target.value === 'inst')} aria-label="Instrumental ou com voz" className={field}>
                  <option value="inst">Instrumental (sem voz)</option>
                  <option value="voz">Com voz e letra</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px] text-gray-500">
                Duração
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} aria-label="Duração da trilha" className={field}>
                  {(model.durations || []).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button key={m.label} type="button" onClick={() => setMood(m.style)} aria-pressed={mood === m.style} className={chip(mood === m.style)}>{m.label}</button>
              ))}
            </div>
            <textarea value={mood} onChange={e => setMood(e.target.value.slice(0, MUSIC_STYLE_MAX))} rows={2} aria-label="Estilo da música"
              placeholder="Estilo: gênero, instrumentos, clima, andamento. Ex.: brazilian pop, acoustic guitar, upbeat, 110 bpm" className={`${field} resize-y`} />
            {!instrumental && (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                  Partes da música:
                  {LYRIC_TAGS.map(t => <button key={t} type="button" onClick={() => insertAt(lyricsRef.current, `\n${t}\n`, lyrics, setLyrics, MUSIC_LYRICS_MAX)} className={chip(false)}>{t}</button>)}
                </div>
                <textarea ref={lyricsRef} value={lyrics} onChange={e => setLyrics(e.target.value.slice(0, MUSIC_LYRICS_MAX))} rows={8} aria-label="Letra"
                  placeholder={'[Verse]\nEscreva a letra aqui...\n\n[Chorus]\nO refrão que gruda'} className={`${field} resize-y font-mono text-xs`} />
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                  Voz cantada:
                  {([['', 'Automática'], ['f', 'Feminina'], ['m', 'Masculina']] as const).map(([v, l]) => (
                    <button key={v || 'auto'} type="button" onClick={() => setVocalGender(v)} className={chip(vocalGender === v)}>{l}</button>
                  ))}
                  <span className="text-gray-600">{lyrics.length}/{MUSIC_LYRICS_MAX}</span>
                </div>
              </>
            )}
            <input value={negative} onChange={e => setNegative(e.target.value.slice(0, 200))} aria-label="O que evitar"
              placeholder={instrumental ? 'Evitar (opcional): ex.: heavy drums, distorted guitar. Já evitamos voz.' : 'Evitar (opcional): ex.: autotune, heavy drums'} className={field} />
            <Advanced>
              <Knob label="Peso do estilo" value={styleWeight} onChange={setStyleWeight} fallback={0.5} left="mais livre" right="segue o estilo à risca" />
              <Knob label="Estranheza" value={weirdness} onChange={setWeirdness} fallback={0.5} left="convencional" right="experimental" />
              {!instrumental && <Knob label="Peso da voz" value={audioWeight} onChange={setAudioWeight} fallback={0.5} left="leve" right="em destaque" />}
              <div className="space-y-1">
                <p className="text-[11px] text-gray-300">Variedade entre as versões</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setVariety(null)} className={chip(variety === null)}>Padrão</button>
                  {VARIETY.map((l, i) => <button key={l} type="button" onClick={() => setVariety(i)} className={chip(variety === i)}>{l}</button>)}
                </div>
              </div>
            </Advanced>
            <p className="text-[11px] text-gray-500">Cada pedido traz mais de uma versão; leva de 1 a 3 minutos.</p>
          </>
        )}

        {tab === 'sfx' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {SFX_PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => { setSfxText(p.label); setSfxEnglish(p.text); setSfxSeconds(p.seconds); }}
                  aria-pressed={sfxEnglish === p.text} className={chip(sfxEnglish === p.text)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input value={sfxText} onChange={e => { setSfxText(e.target.value); setSfxEnglish(''); }} maxLength={SFX_PROMPT_MAX} aria-label="Descrição do efeito"
                placeholder="Descreva o som: ex.: porta de madeira rangendo e batendo forte" className={`${field} sm:col-span-7`} />
              <select value={sfxSeconds} onChange={e => setSfxSeconds(Number(e.target.value))} aria-label="Duração do efeito" className={`${field} sm:col-span-3`}>
                {SFX_DURATIONS.map(s => <option key={s} value={s}>{s ? `${String(s).replace('.', ',')} s` : 'Automática'}</option>)}
              </select>
              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} className="accent-emerald-400" /> Em loop
              </label>
            </div>
            <Advanced>
              <Knob label="Fidelidade à descrição" value={influence} onChange={setInfluence} fallback={SFX_DEFAULT_INFLUENCE} left="mais criativo" right="ao pé da letra"
                help="Alta segue o texto literalmente; baixa deixa o gerador variar o som." />
              <p className="text-[11px] text-gray-500">A descrição vai traduzida para o inglês, que o gerador entende melhor. Loop cria um som que emenda sem corte, bom para ambientes.</p>
            </Advanced>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} aria-label="Nome na biblioteca"
            placeholder={tab === 'music' ? 'Título da música (opcional)' : 'Nome na biblioteca (opcional): ex.: Cliente X · abertura'} className={`${field} sm:flex-1`} />
          <button type="button" disabled={!!busy || !canGenerate || (tab === 'voice' && !voiceList.some(v => v.id === voiceId))}
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
  const scale = (job as GenJob & { creditScale?: number }).creditScale;
  const btn = 'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/10 text-gray-300 hover:text-white';
  return (
    <li className="rounded-2xl border border-white/[0.06] bg-black/30 p-3 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-semibold text-white truncate max-w-full">{name}</span>
        <span className="text-gray-500">{date} · {job.modelName}{job.credits ? ` · ${scale === 10 ? job.credits : job.credits * 10} créditos` : ''}</span>
        {job.status !== 'completed' && (
          <span className={job.status === 'failed' ? 'text-red-300' : 'text-amber-300'}>{STATUS_LABEL[job.status]}</span>
        )}
      </div>
      {type !== 'sfx' && job.prompt && <p className="text-[11px] text-gray-500 line-clamp-2">{job.prompt}</p>}
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
