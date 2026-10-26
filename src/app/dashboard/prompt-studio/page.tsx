'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Clapperboard, Sparkles, Copy, Check, ImagePlus, X, Wand2, ListChecks, HelpCircle, LifeBuoy, ScanEye, ChevronDown, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { streamTool, parseModelJson } from '@/lib/client/api';
import { addNotification } from '@/lib/notifications';
import {
  AUTO, MAIN_TEXT, PROMPT_GROUPS, PROMPT_MODES, PromptMode, PromptResult, fieldsForMode,
} from '@/lib/promptStudio';

type Choices = Record<string, string | string[]>;
type Images = Partial<Record<'inicial' | 'final' | 'base' | 'referencia', string>>;

const IMAGE_SLOTS: Record<PromptMode, { role: keyof Images; label: string; required: boolean }[]> = {
  i2v: [
    { role: 'inicial', label: 'Imagem inicial', required: true },
    { role: 'final', label: 'Último frame (opcional)', required: false },
  ],
  i2i: [
    { role: 'base', label: 'Imagem a editar', required: true },
    { role: 'referencia', label: 'Referência de estilo (opcional)', required: false },
  ],
  t2i: [],
};

/** Reduz a imagem para no máximo 1600px (JPEG) antes de enviar: mais rápido e dentro do limite do servidor. */
async function resizeImage(file: File, max = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-jade/15 text-brand-mint border border-brand-jade/30 hover:bg-brand-jade/25 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

export default function PromptStudioPage() {
  const { user } = useAuth();
  const { hasToolAccess, canUseTool, refreshProfile } = useUserProfile();

  const [mode, setMode] = useState<PromptMode>('i2v');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState<Choices>({});
  const [images, setImages] = useState<Images>({});
  const [openGroup, setOpenGroup] = useState<string | null>('Plataforma');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<PromptResult | null>(null);
  const [resultMode, setResultMode] = useState<PromptMode>('i2v');
  const [history, setHistory] = useState<{ id: string; mode: PromptMode; description: string; createdAt: string }[]>([]);

  const fields = fieldsForMode(mode);
  const main = MAIN_TEXT[mode];

  const loadHistory = React.useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'prompts'), where('userId', '==', user.uid)));
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 8);
      setHistory(items);
    } catch (e) {
      console.error('[prompts] falha ao carregar histórico:', e);
    }
  }, [user]);

  // Abre um prompt salvo (?id=) e carrega o histórico.
  useEffect(() => {
    if (!user) return;
    loadHistory();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) openSaved(id);
    // Vindo do Gerador de Ideias (?idea=<id>&i=<n>): frame-chave da abertura da ideia.
    const ideaId = params.get('idea');
    if (ideaId) {
      getDoc(doc(db, 'ideas', ideaId)).then(snap => {
        if (!snap.exists() || snap.data().userId !== user?.uid) return;
        const data = snap.data();
        const idea = data.result_json?.ideias?.[Number(params.get('i') || 0)];
        if (!idea) return;
        changeMode('t2i');
        setChoices({ proporcao: '9:16 (vertical)' });
        setDescription(`Frame de abertura do vídeo "${idea.titulo}" (${idea.formato}, nicho: ${data.briefing?.nicho || 'não informado'}). Primeiro segundo: ${idea.ganchos?.visual} Cena: ${idea.beats?.[0]?.visual || ''}`.slice(0, 2000));
      }).catch(err => console.error('[prompts] falha ao carregar a ideia:', err));
    }
    // Vindo do Hub de Referências (?hub=<id>): Text to Image com a estética do reel como referência.
    const hubId = params.get('hub');
    if (hubId) {
      getDoc(doc(db, 'hub_videos', hubId)).then(snap => {
        if (!snap.exists()) return;
        const v = snap.data();
        const ai = v.ai || {};
        changeMode('t2i');
        setDescription(`Referência: reel viral de @${v.author} (${ai.nicho}, ${ai.formato}). Estética a recriar: ${ai.resumoVisual} Tema: ${ai.tema}.`);
      }).catch(err => console.error('[prompts] falha ao carregar referência do hub:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openSaved = async (id: string) => {
    const snap = await getDoc(doc(db, 'prompts', id));
    if (!snap.exists() || snap.data().userId !== user?.uid) return;
    const data = snap.data();
    setMode(data.mode);
    setResultMode(data.mode);
    setDescription(data.description || '');
    setChoices(data.choices || {});
    setResult(data.result);
    setError('');
  };

  const changeMode = (m: PromptMode) => {
    setMode(m);
    setImages({});
    setError('');
  };

  const setChoice = (id: string, value: string | string[]) => setChoices(prev => ({ ...prev, [id]: value }));

  const toggleMulti = (id: string, option: string) => {
    const current = Array.isArray(choices[id]) ? (choices[id] as string[]) : [];
    setChoice(id, current.includes(option) ? current.filter(o => o !== option) : [...current, option]);
  };

  const handleImage = async (role: keyof Images, file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Envie a imagem em JPG, PNG ou WEBP.');
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      setImages(prev => ({ ...prev, [role]: dataUrl }));
      setError('');
    } catch {
      setError('Não foi possível ler essa imagem. Tente outro arquivo.');
    }
  };

  const handleGenerate = async () => {
    const check = canUseTool('prompts');
    if (!check.ok) { setError(check.message!); return; }

    const missingImage = IMAGE_SLOTS[mode].find(s => s.required && !images[s.role]);
    if (missingImage) { setError(`Envie a ${missingImage.label.toLowerCase()}.`); return; }
    if (main.required && !description.trim()) { setError(`Preencha "${main.label}".`); return; }

    setLoading(true);
    setError('');
    setResult(null);
    setProgress(IMAGE_SLOTS[mode].length ? 'Lendo a imagem e montando a ficha técnica...' : 'Montando a ficha técnica...');

    try {
      const relevantChoices = Object.fromEntries(
        Object.entries(choices).filter(([id]) => fields.some(f => f.id === id))
      );
      const text = await streamTool('/api/tools/prompt-studio', {
        mode, description, choices: relevantChoices, images,
      }, (partial) => {
        if (partial.trim()) setProgress(`Escrevendo o prompt... (${partial.trim().length} caracteres)`);
      });
      const data = parseModelJson<PromptResult>(text);
      if (!data.prompt) throw new Error('A IA não devolveu o prompt. Tente de novo.');

      setResult(data);
      setResultMode(mode);
      refreshProfile();

      if (user) {
        await addDoc(collection(db, 'prompts'), {
          userId: user.uid,
          mode,
          description,
          choices: relevantChoices,
          result: data,
          createdAt: new Date().toISOString(),
        }).catch(e => console.error('[prompts] falha ao salvar:', e));
        loadHistory();
        addNotification(user.uid, 'Prompt pronto', `Seu prompt de ${PROMPT_MODES.find(m => m.id === mode)!.label} foi gerado.`, 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar o prompt agora.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-jade bg-brand-jade/10 text-sm font-medium w-fit mb-2">
          <Clapperboard className="w-4 h-4" />
          <span className="text-white">Direção de IA</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Gerador de Prompts</h1>
        <p className="text-gray-400">Prompts com precisão de direção de fotografia para vídeo e imagem com IA. O que você deixar em "Decidir por mim", a IA decide e explica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard glow className="p-6">
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brand-jade" />
              Novo Prompt
            </h2>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm break-words">{error}</div>
            )}

            {/* Modo */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PROMPT_MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => changeMode(m.id)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${mode === m.id
                    ? 'bg-brand-jade/20 border-brand-jade/50 text-white shadow-[0_0_12px_rgba(6,95,70,0.35)]'
                    : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-5">{PROMPT_MODES.find(m => m.id === mode)!.description}</p>

            <div className="space-y-5">
              {/* Imagens */}
              {IMAGE_SLOTS[mode].length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {IMAGE_SLOTS[mode].map(slot => (
                    <div key={slot.role}>
                      <p className="text-xs font-medium text-gray-300 mb-1.5">{slot.label}</p>
                      {images[slot.role] ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/5] bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={images[slot.role]} alt={slot.label} className="w-full h-full object-contain" />
                          <button type="button" onClick={() => setImages(prev => ({ ...prev, [slot.role]: undefined }))}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black" aria-label="Remover imagem">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 aspect-[4/5] rounded-xl border border-dashed border-white/15 bg-black/20 text-gray-500 hover:border-brand-jade/50 hover:text-brand-mint cursor-pointer transition-colors">
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-[11px] text-center px-2">Toque para enviar</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                            onChange={e => { handleImage(slot.role, e.target.files?.[0]); e.target.value = ''; }} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Descrição principal */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {main.label}{!main.required && <span className="text-gray-500 font-normal"> (opcional)</span>}
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={2000}
                  placeholder={main.placeholder} className="w-full glass-input text-sm resize-y" />
              </div>

              {/* Ficha técnica por grupos */}
              <div className="space-y-2">
                {PROMPT_GROUPS.map(group => {
                  const groupFields = fields.filter(f => f.group === group);
                  if (!groupFields.length) return null;
                  const decidedCount = groupFields.filter(f => {
                    const v = choices[f.id];
                    return Array.isArray(v) ? v.length > 0 : !!v && v !== AUTO;
                  }).length;
                  const open = openGroup === group;
                  return (
                    <div key={group} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                      <button type="button" onClick={() => setOpenGroup(open ? null : group)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.03]">
                        <span>{group}</span>
                        <span className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                          {decidedCount > 0 ? `${decidedCount} de ${groupFields.length} definidos` : 'IA decide'}
                          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </span>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 space-y-4">
                          {groupFields.map(field => (
                            <div key={field.id}>
                              <label className="block text-xs font-medium text-gray-300 mb-1.5">{field.label}</label>
                              {field.kind === 'select' && (
                                <select value={(choices[field.id] as string) || AUTO} onChange={e => setChoice(field.id, e.target.value)}
                                  className="w-full glass-input text-sm">
                                  <option value={AUTO}>Decidir por mim</option>
                                  {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              )}
                              {field.kind === 'text' && (
                                <input type="text" value={(choices[field.id] as string) || ''} maxLength={300}
                                  onChange={e => setChoice(field.id, e.target.value)} placeholder={field.placeholder}
                                  className="w-full glass-input text-sm" />
                              )}
                              {field.kind === 'multi' && (
                                <div className="flex flex-wrap gap-1.5">
                                  {field.options!.map(o => {
                                    const active = Array.isArray(choices[field.id]) && (choices[field.id] as string[]).includes(o);
                                    return (
                                      <button key={o} type="button" onClick={() => toggleMulti(field.id, o)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${active
                                          ? 'bg-brand-jade/25 border-brand-jade/60 text-white'
                                          : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'}`}>
                                        {o}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              {field.help && <p className="text-[10px] text-gray-500 mt-1">{field.help}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                {hasToolAccess('prompts') ? (
                  <Button
                    className="w-full h-12 text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(6,95,70,0.3)] bg-gradient-to-r from-brand-jade to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(6,95,70,0.6)]"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4 animate-spin" /> Dirigindo...</span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center"><Clapperboard className="w-4 h-4" /> Gerar Prompt</span>
                    )}
                  </Button>
                ) : (
                  <UpgradeGate locked={true} requiredPlan="Pro" mode="button" />
                )}
                {!loading && <CreditNotice toolId="prompts" />}
                {loading && <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">{progress || 'Processando...'}</p>}
              </div>
            </div>
          </GlassCard>

          {history.length > 0 && (
            <GlassCard className="p-5 border-white/5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-jade" /> Prompts recentes
              </h3>
              <div className="space-y-1.5">
                {history.map(h => (
                  <button key={h.id} type="button" onClick={() => openSaved(h.id)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-mint">
                      {PROMPT_MODES.find(m => m.id === h.mode)?.label} · {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{h.description || 'Sem descrição'}</p>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Resultado */}
        <div className="lg:col-span-3">
          {!result ? (
            <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center opacity-50 border-white/5">
              <Clapperboard className="w-16 h-16 text-brand-jade/30 mb-4" />
              <p className="text-gray-400 font-medium text-center px-8">
                Escolha o tipo, envie a imagem quando houver e defina o que quiser. O resto, a IA decide e explica.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Ficha técnica */}
              <GlassCard glow className="p-6 border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-jade mb-4">
                  Ficha técnica · {PROMPT_MODES.find(m => m.id === resultMode)?.label}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.ficha?.map(f => (
                    <div key={f.item} className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{f.item}</p>
                      <p className="text-sm font-semibold text-white leading-snug">{f.valor}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Prompt */}
              <GlassCard className="p-6 border-brand-jade/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Prompt</h3>
                  <CopyButton text={result.prompt} label="Copiar prompt" />
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200 bg-black/40 border border-white/5 rounded-xl p-4 font-mono">{result.prompt}</pre>
                {result.negativePrompt && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Negative prompt</p>
                      <CopyButton text={result.negativePrompt} />
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-xs text-gray-400 bg-black/40 border border-white/5 rounded-xl p-3 font-mono">{result.negativePrompt}</pre>
                  </div>
                )}
              </GlassCard>

              {result.leituraImagem && (
                <GlassCard className="p-5 border-white/5 flex gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0 h-fit"><ScanEye className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Leitura da imagem</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.leituraImagem}</p>
                  </div>
                </GlassCard>
              )}

              {result.decisoes?.length > 0 && (
                <GlassCard className="p-5 border-white/5">
                  <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4 text-brand-jade" /> Decisões que a IA assumiu</p>
                  <ul className="space-y-2">
                    {result.decisoes.map((d, i) => <li key={i} className="text-sm text-gray-300 leading-relaxed pl-3 border-l-2 border-brand-jade/40">{d}</li>)}
                  </ul>
                </GlassCard>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.perguntas?.length > 0 && (
                  <GlassCard className="p-5 border-white/5">
                    <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-amber-300" /> Para refinar</p>
                    <ul className="space-y-2 list-disc list-inside">
                      {result.perguntas.map((q, i) => <li key={i} className="text-sm text-gray-300 leading-relaxed">{q}</li>)}
                    </ul>
                  </GlassCard>
                )}
                {result.seFalhar && (
                  <GlassCard className="p-5 border-white/5">
                    <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-red-300" /> Se a geração falhar</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.seFalhar}</p>
                  </GlassCard>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
