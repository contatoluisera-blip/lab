'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  Lightbulb, Sparkles, Copy, CheckCircle2, FileDown, ChevronDown, Compass, X, Search, Eye,
  Zap, Clapperboard, ListChecks, CalendarClock, Film, Scissors, Target, AlertTriangle, MessageSquareText, Repeat,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';
import { streamTool, parseModelJson, callTool } from '@/lib/client/api';
import { AUTO, IDEA_FIELDS, IDEA_GROUPS, IdeaV2, IdeasResultV2 } from '@/lib/ideaStudio';
import { IDEAS_MAX, ideasCost } from '@/lib/planConfig';
import { HubItem, formatCount, hubSearchText, normalizeText } from '@/lib/hub';

type Choices = Record<string, string>;
type Esboco = { titulo: string; formato: string; etapaFunil: string; duracaoSeg: number; angulo: string };
type Slot = { esboco: Esboco; status: 'loading' | 'done' | 'error'; idea?: IdeaV2; error?: string };

const EXPAND_CONCURRENCY = 5;

/** Roteiro incompleto (raro) conta como falha e é refeito sem custo. */
const isComplete = (idea: any): idea is IdeaV2 =>
  !!idea?.titulo && Array.isArray(idea.beats) && idea.beats.length >= 3 && Array.isArray(idea.takes) && idea.takes.length >= 1;

const fmtTime = (s: number) => `${Math.round(s)}s`;

function scriptText(idea: IdeaV2) {
  return [
    `IDEIA: ${idea.titulo}`,
    `${idea.formato} · ${idea.etapaFunil} · ${idea.pilar} · ${idea.duracaoSeg}s`,
    '',
    `GANCHO (${idea.ganchos.tipo})`,
    `Falado: ${idea.ganchos.falado}`,
    `Texto na tela: ${idea.ganchos.textoTela}`,
    `Visual: ${idea.ganchos.visual}`,
    '',
    'ROTEIRO',
    ...idea.beats.map(b => `[${fmtTime(b.inicio)}–${fmtTime(b.fim)}] VISUAL: ${b.visual}${b.fala ? ` | FALA: "${b.fala}"` : ''}${b.textoTela ? ` | TELA: ${b.textoTela}` : ''}${b.som ? ` | SOM: ${b.som}` : ''}`),
    '',
    `CTA: ${idea.cta}`,
    '',
    'TAKES',
    ...idea.takes.map(t => `${t.numero}. ${t.descricao} — ${t.plano}, ${t.angulo}, ${t.movimento} (${t.local})`),
    '',
    `EDIÇÃO: ${idea.edicao.ritmo} Legendas: ${idea.edicao.legendas} Trilha: ${idea.edicao.trilha} Efeitos: ${idea.edicao.efeitos}`,
    ...(idea.legenda ? ['', 'LEGENDA DO POST', idea.legenda.texto, '', `Palavras-chave: ${idea.legenda.palavrasChave.join(', ')}`] : []),
  ].join('\n');
}

export default function IdeaGeneratorPage() {
  const { user } = useAuth();
  const { hasToolAccess, canUseTool, refreshProfile } = useUserProfile();

  // Briefing
  const [cliente, setCliente] = useState('');
  const [nicho, setNicho] = useState('');
  const [publico, setPublico] = useState('');
  const [pedido, setPedido] = useState('');
  const [choices, setChoices] = useState<Choices>({});
  const [quantidade, setQuantidade] = useState(5);
  const [diagnosisId, setDiagnosisId] = useState('');
  const [calculationId, setCalculationId] = useState('');
  const [hubRefs, setHubRefs] = useState<HubItem[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Dados do usuário
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);

  // Resultado
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<IdeasResultV2 | null>(null);
  const [legacy, setLegacy] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [captionBusy, setCaptionBusy] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; clientName: string; createdAt: string; count: number; first: string }[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const cost = ideasCost(quantidade);

  // Diagnósticos e orçamentos do usuário (para vincular).
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [d, c] = await Promise.all([
          getDocs(query(collection(db, 'diagnoses'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'calculations'), where('userId', '==', user.uid))),
        ]);
        const byDate = (a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '');
        setDiagnostics(d.docs.map(x => ({ id: x.id, ...x.data() } as any)).sort(byDate));
        setCalculations(c.docs.map(x => ({ id: x.id, ...x.data() } as any)).sort(byDate));
      } catch (e) {
        console.error('[ideias] falha ao carregar diagnósticos/orçamentos:', e);
      }
    })();
  }, [user]);

  // Últimas rodadas do usuário (painel "Ideias recentes").
  const loadHistory = React.useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'ideas'), where('userId', '==', user.uid)));
      setHistory(snap.docs.map(d => {
        const data = d.data() as any;
        const list = data.result_json?.ideias || data.result_json?.ideias_geradas || [];
        return { id: d.id, clientName: data.clientName || data.modo || 'Avulso', createdAt: data.createdAt || '', count: list.length, first: list[0]?.titulo || '' };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8));
    } catch (e) {
      console.error('[ideias] falha ao carregar histórico:', e);
    }
  }, [user]);

  /** Reabre uma rodada salva (do histórico da página ou de Minhas Ações). */
  const openSaved = React.useCallback(async (id: string) => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'ideas', id));
      if (!snap.exists() || snap.data().userId !== user.uid) return;
      const data = snap.data();
      setSlots([]); setRoundId(null); setError('');
      if (data.result_json?.version === 2) {
        setLegacy(null);
        setResult(data.result_json);
        setSavedId(snap.id);
        const b = data.briefing || {};
        setCliente(b.cliente || ''); setNicho(b.nicho || ''); setPublico(b.publico || ''); setPedido(b.pedido || '');
        setChoices(b.choices || {}); setQuantidade(b.quantidade || 5);
      } else {
        setResult(null); setSavedId(null);
        setLegacy(data.result_json);
        setCliente(data.clientName || '');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('[ideias] falha ao abrir histórico:', e);
    }
  }, [user]);

  // Histórico (?id=) e referência vinda do Hub (?hub=).
  useEffect(() => {
    if (!user) return;
    loadHistory();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) openSaved(id);
    const hubId = params.get('hub');
    if (hubId) {
      getDoc(doc(db, 'hub_videos', hubId)).then(snap => {
        if (!snap.exists()) return;
        const v = snap.data(); const ai = v.ai || {};
        setHubRefs([{ id: snap.id, url: v.url, author: v.author, thumb: v.thumb, views: v.views, likes: v.likes, comments: v.comments, postedAt: v.postedAt, score: v.score, nicho: ai.nicho, tema: ai.tema, formato: ai.formato, gancho: ai.gancho, tipoGancho: ai.tipoGancho, porque: ai.porqueFuncionou, resumo: ai.resumoVisual, kw: ai.palavrasChave || [], caption: '' }]);
        if (ai.nicho) setNicho(n => n || ai.nicho);
      }).catch(e => console.error('[ideias] falha ao carregar referência do hub:', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const decidedCount = (group: string) => IDEA_FIELDS.filter(f => f.group === group && choices[f.id] && choices[f.id] !== AUTO).length;

  const saveRound = async (base: Omit<IdeasResultV2, 'ideias'>, done: IdeaV2[], briefing: any, existingId: string | null) => {
    if (!user || !done.length) return existingId;
    const full: IdeasResultV2 = { ...base, ideias: done };
    try {
      if (existingId) {
        await updateDoc(doc(db, 'ideas', existingId), { result_json: full });
        return existingId;
      }
      const ref = await addDoc(collection(db, 'ideas'), {
        userId: user.uid,
        modo: diagnosisId ? 'estrategico' : 'livre',
        clientName: cliente || nicho || 'Avulso',
        briefing,
        result_json: full,
        createdAt: new Date().toISOString(),
      });
      return ref.id;
    } catch (e) {
      console.error('[ideias] falha ao salvar:', e);
      return existingId;
    }
  };

  /** Roteiriza uma ideia da rodada (sem custo; o servidor limita a 3 tentativas). */
  const expandIdea = async (rid: string, index: number, autoRetry = true): Promise<IdeaV2> => {
    try {
      const text = await streamTool('/api/tools/idea-generator/expand', { roundId: rid, index });
      const idea = parseModelJson<IdeaV2>(text);
      if (!isComplete(idea)) throw new Error('O roteiro veio incompleto.');
      return idea;
    } catch (err) {
      if (autoRetry) return expandIdea(rid, index, false);
      throw err;
    }
  };

  const handleGenerate = async () => {
    const check = canUseTool('ideas', cost);
    if (!check.ok) { setError(check.message!); return; }
    if (!nicho.trim() && !diagnosisId) { setError('Informe o nicho ou vincule um diagnóstico.'); return; }

    setLoading(true);
    setError('');
    setResult(null);
    setLegacy(null);
    setSavedId(null);
    setSlots([]);
    setProgress('Planejando a rodada: linha estratégica e esboço de cada ideia...');

    const briefing = { cliente, nicho, publico, pedido, choices, quantidade };
    const rid = crypto.randomUUID();
    setRoundId(rid);
    try {
      // Etapa 1: planejamento (cobra os créditos da rodada).
      const planText = await streamTool('/api/tools/idea-generator', {
        ...briefing, roundId: rid, diagnosisId: diagnosisId || undefined, calculationId: calculationId || undefined, hubRefs: hubRefs.map(r => r.id),
      });
      let plan: Omit<IdeasResultV2, 'version' | 'ideias'> & { esbocos: Esboco[] };
      try {
        plan = parseModelJson(planText);
      } catch {
        throw new Error('A conexão caiu antes de o planejamento terminar. Se os créditos foram descontados e não voltarem em alguns minutos, avise o suporte.');
      }
      refreshProfile();
      const base = { version: 2 as const, resumoEstrategico: plan.resumoEstrategico, decisoes: plan.decisoes, planoDiaria: plan.planoDiaria };
      setResult({ ...base, ideias: [] });

      // Etapa 2: roteiro de cada ideia em paralelo; aparecem conforme ficam prontas.
      const local: Slot[] = plan.esbocos.map(e => ({ esboco: e, status: 'loading' }));
      setSlots([...local]);
      setProgress(`Roteirizando as ideias... 0 de ${local.length} prontas`);
      let next = 0;
      let ready = 0;
      await Promise.all(Array.from({ length: Math.min(EXPAND_CONCURRENCY, local.length) }, async () => {
        while (next < local.length) {
          const i = next++;
          try {
            local[i] = { ...local[i], status: 'done', idea: await expandIdea(rid, i) };
          } catch (err: any) {
            local[i] = { ...local[i], status: 'error', error: err.message || 'Falhou ao roteirizar.' };
          }
          ready++;
          setSlots([...local]);
          setProgress(`Roteirizando as ideias... ${ready} de ${local.length} prontas`);
        }
      }));

      const done = local.filter(sl => sl.status === 'done').map(sl => sl.idea!);
      setResult({ ...base, ideias: done });
      setSavedId(await saveRound(base, done, briefing, null));
      loadHistory();
      if (user && done.length) addNotification(user.uid, 'Ideias prontas', `${done.length} roteiros gerados para ${cliente || nicho}.`, 'success');
      if (done.length < local.length) setError(`${local.length - done.length} ideia(s) não foram roteirizadas. Use "Tentar de novo" no card (sem custo).`);
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar as ideias agora.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const retrySlot = async (index: number) => {
    if (!roundId || !result) return;
    setSlots(prev => prev.map((sl, i) => (i === index ? { ...sl, status: 'loading', error: undefined } : sl)));
    try {
      const idea = await expandIdea(roundId, index, false);
      const updated = slots.map((sl, i) => (i === index ? { ...sl, status: 'done' as const, idea } : sl));
      setSlots(updated);
      const done = updated.filter(sl => sl.status === 'done').map(sl => sl.idea!);
      const { ideias: _, ...base } = result;
      setResult({ ...base, ideias: done });
      setSavedId(await saveRound(base, done, { cliente, nicho, publico, pedido, choices, quantidade }, savedId));
      if (done.length === slots.length) setError('');
    } catch (err: any) {
      setSlots(prev => prev.map((sl, i) => (i === index ? { ...sl, status: 'error', error: err.message } : sl)));
    }
  };

  const generateCaption = async (index: number) => {
    if (!result) return;
    const check = canUseTool('caption');
    if (!check.ok) { setError(check.message!); return; }
    setCaptionBusy(index);
    setError('');
    try {
      const res = await callTool<IdeaV2['legenda']>('/api/tools/idea-caption', {
        idea: result.ideias[index], nicho, cliente, compliance: choices.compliance,
      });
      const ideias = result.ideias.map((idea, i) => (i === index ? { ...idea, legenda: res.data } : idea));
      const next = { ...result, ideias };
      setResult(next);
      const target = result.ideias[index];
      setSlots(prev => prev.map(sl => (sl.idea === target ? { ...sl, idea: ideias[index] } : sl)));
      refreshProfile();
      if (savedId) await updateDoc(doc(db, 'ideas', savedId), { result_json: next }).catch(e => console.error('[ideias] falha ao salvar legenda:', e));
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar a legenda.');
    } finally {
      setCaptionBusy(null);
    }
  };

  const copyIdea = (idea: IdeaV2, i: number) => {
    navigator.clipboard.writeText(scriptText(idea));
    setCopied(i);
    setTimeout(() => setCopied(null), 1800);
  };

  const downloadPDF = async () => {
    const el = document.getElementById('pdf-report-content');
    if (!el) return;
    setLoadingPdf(true);
    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const hidden = el.querySelectorAll('.no-pdf');
      hidden.forEach(b => ((b as HTMLElement).style.display = 'none'));
      const imgData = await htmlToImage.toPng(el, { backgroundColor: '#0a0a0a', pixelRatio: 2 });
      hidden.forEach(b => ((b as HTMLElement).style.display = ''));
      const img = new Image();
      img.src = imgData;
      await new Promise(r => { img.onload = r; });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [img.width, img.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`Ideias_${(cliente || nicho || 'Creator_Lab').replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
      setError(`Falha ao gerar PDF: ${err.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Cards na ordem do plano: ideias prontas e vagas ainda em roteirização (ou com falha).
  const cardList: { idea?: IdeaV2; i: number; slot?: Slot; k: number }[] = slots.length
    ? (() => {
        let d = 0;
        return slots.map((slot, k) => (slot.status === 'done'
          ? { idea: result?.ideias[d] ?? slot.idea, i: d++, slot, k }
          : { idea: undefined, i: -1, slot, k }));
      })()
    : (result?.ideias || []).map((idea, i) => ({ idea, i, k: i }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-neon bg-brand-neon/10 text-sm font-medium w-fit mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-white">Motor Criativo</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gerador de Ideias</h1>
          <p className="text-gray-400">Roteiros prontos para gravar: gancho, fala, texto na tela e takes. O que você deixar em "Decidir por mim", a IA decide e explica.</p>
        </div>
        {(result || legacy) && (
          <Button onClick={downloadPDF} disabled={loadingPdf}
            className="bg-brand-neon/20 text-brand-neon hover:bg-brand-neon hover:text-black border border-brand-neon/50 h-11">
            <FileDown className="w-4 h-4 mr-2" />{loadingPdf ? 'Processando...' : 'Baixar PDF'}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Briefing */}
        <div className="space-y-6">
          <GlassCard className="p-6 border-white/10 space-y-5">
            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm break-words">{error}</div>}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente / projeto</label>
              <input list="idea-clients" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ex.: Clínica Sorriso Pleno" className="w-full glass-input h-11" />
              <datalist id="idea-clients">{Array.from(new Set(diagnostics.map(d => d.handle).filter(Boolean))).map(h => <option key={h} value={h} />)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nicho *</label>
                <input value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex.: Odontologia estética" className="w-full glass-input h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Público</label>
                <input value={publico} onChange={e => setPublico(e.target.value)} placeholder="Ex.: mulheres 25–45" className="w-full glass-input h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tema ou pedido da rodada</label>
              <textarea value={pedido} onChange={e => setPedido(e.target.value)} rows={3} maxLength={1500}
                placeholder="Ex.: lentes de contato dental, focando nas dúvidas sobre desgaste e naturalidade" className="w-full glass-input text-sm resize-y" />
            </div>

            {/* Vínculos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diagnóstico</label>
                <select value={diagnosisId} onChange={e => setDiagnosisId(e.target.value)} className="w-full glass-input h-11 text-sm [&>option]:bg-black">
                  <option value="">Não vincular</option>
                  {diagnostics.map(d => <option key={d.id} value={d.id}>@{d.handle} · nota {d.nota_final}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Orçamento</label>
                <select value={calculationId} onChange={e => setCalculationId(e.target.value)} className="w-full glass-input h-11 text-sm [&>option]:bg-black">
                  <option value="">Não vincular</option>
                  {calculations.map(c => <option key={c.id} value={c.id}>{c.clientName} · {c.video_quantity} vídeos</option>)}
                </select>
              </div>
            </div>

            {/* Referências do Hub */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Referências do Hub</label>
                <button type="button" onClick={() => setPickerOpen(true)} className="text-xs text-brand-mint hover:underline flex items-center gap-1"><Compass className="w-3.5 h-3.5" /> Escolher</button>
              </div>
              {hubRefs.length === 0 ? (
                <p className="text-[11px] text-gray-500">Até 3 reels virais como inspiração: a IA usa o mecanismo (gancho, estrutura, ritmo), nunca copia.</p>
              ) : (
                <div className="flex gap-2">
                  {hubRefs.map(r => (
                    <div key={r.id} className="relative w-16 aspect-[9/16] rounded-lg overflow-hidden border border-white/10 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.thumb} alt={r.tema} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setHubRefs(hubRefs.filter(x => x.id !== r.id))} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-white" aria-label="Remover referência"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decisões por grupo */}
            <div className="space-y-2">
              {IDEA_GROUPS.map(group => {
                const fields = IDEA_FIELDS.filter(f => f.group === group);
                const open = openGroup === group;
                const n = decidedCount(group);
                return (
                  <div key={group} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                    <button type="button" onClick={() => setOpenGroup(open ? null : group)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.03]">
                      <span>{group}</span>
                      <span className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                        {n > 0 ? `${n} de ${fields.length} definidos` : 'IA decide'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 space-y-3">
                        {fields.map(f => (
                          <div key={f.id}>
                            <label className="block text-xs font-medium text-gray-300 mb-1.5">{f.label}</label>
                            {f.kind === 'select' ? (
                              <select value={choices[f.id] || AUTO} onChange={e => setChoices({ ...choices, [f.id]: e.target.value })} className="w-full glass-input text-sm [&>option]:bg-black">
                                <option value={AUTO}>Decidir por mim</option>
                                {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input value={choices[f.id] || ''} maxLength={300} onChange={e => setChoices({ ...choices, [f.id]: e.target.value })} placeholder={f.placeholder} className="w-full glass-input text-sm" />
                            )}
                            {f.help && <p className="text-[10px] text-gray-500 mt-1">{f.help}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quantidade de ideias</label>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: IDEAS_MAX }, (_, i) => i + 1).map(n => (
                  <button key={n} type="button" onClick={() => setQuantidade(n)}
                    className={`h-9 rounded-lg text-sm font-bold border transition-colors ${quantidade === n ? 'bg-brand-neon text-black border-brand-neon' : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'}`}>{n}</button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">Até 5 ideias: 1 crédito · de 6 a 10: 2 créditos.</p>
            </div>

            <div>
              {hasToolAccess('ideas') ? (
                <Button onClick={handleGenerate} disabled={loading}
                  className="w-full h-12 text-sm uppercase tracking-wider bg-brand-neon text-black hover:shadow-[0_0_20px_rgba(189,255,0,0.4)]">
                  {loading
                    ? <span className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4 animate-spin" /> Criando...</span>
                    : <span className="flex items-center gap-2 justify-center"><Lightbulb className="w-4 h-4" /> Gerar {quantidade} {quantidade === 1 ? 'ideia' : 'ideias'}</span>}
                </Button>
              ) : (
                <UpgradeGate locked requiredPlan="Pro" mode="button" />
              )}
              {!loading && <CreditNotice toolId="ideas" cost={cost} />}
              {loading && <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed">{progress} <br />O planejamento leva ~30 s; depois as ideias aparecem conforme ficam prontas.</p>}
            </div>
          </GlassCard>

          {history.length > 0 && (
            <GlassCard className="p-5 border-white/5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-brand-neon" /> Ideias recentes</h3>
              <div className="space-y-1.5">
                {history.map(h => (
                  <button key={h.id} type="button" onClick={() => openSaved(h.id)} disabled={loading}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${savedId === h.id ? 'bg-brand-neon/10 border-brand-neon/30' : 'bg-black/20 hover:bg-white/5 border-white/5'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-neon">
                      {h.clientName} · {h.count} {h.count === 1 ? 'ideia' : 'ideias'} · {h.createdAt ? new Date(h.createdAt).toLocaleDateString('pt-BR') : ''}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{h.first || 'Sem título'}</p>
                  </button>
                ))}
              </div>
              <Link href="/dashboard/actions" className="block mt-3 text-[11px] text-gray-500 hover:text-white">Ver tudo em Minhas Ações →</Link>
            </GlassCard>
          )}
        </div>

        {/* Resultado */}
        <div id="pdf-report-content" className="space-y-6">
          {!result && !legacy && (
            <GlassCard className="min-h-[420px] flex flex-col items-center justify-center opacity-50 border-white/5 p-8 text-center">
              <Lightbulb className="w-16 h-16 text-brand-neon/30 mb-4" />
              <p className="text-gray-400">Preencha o essencial (nicho e tema) e defina o que quiser. O resto, a IA decide e explica.</p>
            </GlassCard>
          )}

          {result && (
            <>
              <GlassCard className="p-6 border-brand-neon/20 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-neon mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Linha estratégica</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{result.resumoEstrategico}</p>
                </div>
                {result.decisoes?.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Decisões que a IA assumiu ({result.decisoes.length})</summary>
                    <ul className="mt-3 space-y-2">{result.decisoes.map((d, i) => <li key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-brand-neon/40">{d}</li>)}</ul>
                  </details>
                )}
                {result.planoDiaria && (
                  <details>
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Plano da diária</summary>
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result.planoDiaria}</p>
                  </details>
                )}
              </GlassCard>

              {cardList.map(({ idea, i, slot, k }) => !idea ? (
                <SlotCard key={`slot-${k}`} slot={slot!} number={k + 1} onRetry={() => retrySlot(k)} disabled={loading} />
              ) : (
                <GlassCard key={`idea-${k}`} className="p-6 border-white/10 space-y-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[11px] font-bold text-brand-neon uppercase tracking-widest">Ideia {k + 1}</p>
                      <h3 className="text-xl font-bold text-white mt-1">{idea.titulo}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[idea.formato, idea.etapaFunil, idea.pilar, `${idea.duracaoSeg}s`, idea.execucao.dificuldade].map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => copyIdea(idea, i)} className="no-pdf flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white">
                      {copied === i ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-neon" /> : <Copy className="w-3.5 h-3.5" />} {copied === i ? 'Copiado' : 'Copiar roteiro'}
                    </button>
                  </div>

                  {/* Gancho */}
                  <div className="rounded-xl bg-brand-neon/5 border border-brand-neon/20 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-neon flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Gancho · {idea.ganchos.tipo}</p>
                    {idea.ganchos.falado && <p className="text-lg font-semibold text-white">“{idea.ganchos.falado}”</p>}
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      <p className="text-gray-300"><span className="text-gray-500">Texto na tela:</span> {idea.ganchos.textoTela}</p>
                      <p className="text-gray-300"><span className="text-gray-500">1º segundo:</span> {idea.ganchos.visual}</p>
                    </div>
                  </div>

                  {/* Roteiro em beats */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Roteiro</p>
                    <div className="space-y-2">
                      {idea.beats.map((b, j) => (
                        <div key={j} className="grid grid-cols-[56px_1fr] gap-3 rounded-lg bg-black/30 border border-white/5 p-3">
                          <span className="text-xs font-mono font-bold text-brand-neon">{fmtTime(b.inicio)}–{fmtTime(b.fim)}</span>
                          <div className="space-y-1 text-sm">
                            {b.fala && <p className="text-white">“{b.fala}”</p>}
                            <p className="text-gray-400 text-xs"><span className="text-gray-500">Visual:</span> {b.visual}</p>
                            {b.textoTela && <p className="text-gray-400 text-xs"><span className="text-gray-500">Tela:</span> {b.textoTela}</p>}
                            {b.som && <p className="text-gray-500 text-xs"><span>Som:</span> {b.som}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-xs">
                    {[['Loop aberto', idea.retencao.loopAberto], ['Virada', idea.retencao.virada], ['Recompensa', idea.retencao.recompensa]].map(([l, v]) => (
                      <div key={l} className="rounded-lg bg-black/30 border border-white/5 p-3"><p className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" /> {l}</p><p className="text-gray-300">{v}</p></div>
                    ))}
                  </div>

                  <p className="text-sm"><span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mr-2">CTA</span><span className="text-white font-medium">{idea.cta}</span></p>

                  <details>
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Clapperboard className="w-3.5 h-3.5" /> Takes e edição</summary>
                    <ol className="mt-3 space-y-1.5 text-xs text-gray-300">
                      {idea.takes.map(t => <li key={t.numero}><span className="font-bold text-white">{t.numero}.</span> {t.descricao} <span className="text-gray-500">— {t.plano}, {t.angulo}, {t.movimento} · {t.local}</span></li>)}
                    </ol>
                    <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs text-gray-300">
                      <p><span className="text-gray-500"><Scissors className="inline w-3 h-3" /> Ritmo:</span> {idea.edicao.ritmo}</p>
                      <p><span className="text-gray-500">Legendas na tela:</span> {idea.edicao.legendas}</p>
                      <p><span className="text-gray-500">Trilha:</span> {idea.edicao.trilha}</p>
                      <p><span className="text-gray-500">Efeitos:</span> {idea.edicao.efeitos}</p>
                    </div>
                  </details>

                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-black/30 border border-white/5 p-3"><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Por que funciona</p><p className="text-gray-300">{idea.porqueFunciona}</p></div>
                    <div className="rounded-lg bg-black/30 border border-white/5 p-3">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Execução · {idea.execucao.tempoGravacao}</p>
                      <p className="text-gray-300">{idea.execucao.riscos}</p>
                    </div>
                  </div>
                  {idea.referenciaUsada && <p className="text-[11px] text-gray-500 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> {idea.referenciaUsada}</p>}

                  {/* Legenda (à parte) */}
                  {idea.legenda ? (
                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><MessageSquareText className="w-3.5 h-3.5" /> Legenda do post · capa: “{idea.legenda.capa}”</p>
                        <button onClick={() => navigator.clipboard.writeText(`${idea.legenda!.texto}`)} className="no-pdf text-xs text-brand-mint hover:underline">Copiar</button>
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{idea.legenda.texto}</p>
                      <p className="text-[11px] text-gray-500">Palavras-chave de busca: {idea.legenda.palavrasChave.join(' · ')}</p>
                    </div>
                  ) : null}

                  <div className="no-pdf flex flex-wrap gap-2 pt-1">
                    {!idea.legenda && !loading && (
                      <button onClick={() => generateCaption(i)} disabled={captionBusy !== null}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50">
                        <MessageSquareText className="w-3.5 h-3.5" /> {captionBusy === i ? 'Escrevendo legenda...' : 'Gerar legenda · 1 crédito'}
                      </button>
                    )}
                    {savedId && (
                      <Link href={`/dashboard/prompt-studio?idea=${savedId}&i=${i}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-500/15 border border-purple-500/40 text-white hover:bg-purple-500/25">
                        <Clapperboard className="w-3.5 h-3.5" /> Gerar prompt de cena
                      </Link>
                    )}
                  </div>
                </GlassCard>
              ))}
            </>
          )}

          {legacy && <LegacyResult data={legacy} />}
        </div>
      </div>

      {pickerOpen && <HubPicker selected={hubRefs} onClose={() => setPickerOpen(false)} onChange={setHubRefs} />}
    </div>
  );
}

/** Ideia ainda em roteirização, ou que falhou (pode tentar de novo sem custo). */
function SlotCard({ slot, number, onRetry, disabled }: { slot: Slot; number: number; onRetry: () => void; disabled: boolean }) {
  return (
    <GlassCard className={`p-6 border-white/10 space-y-2 ${slot.status === 'loading' ? 'animate-pulse' : ''}`}>
      <p className="text-[11px] font-bold text-brand-neon uppercase tracking-widest">Ideia {number}</p>
      <h3 className="text-lg font-bold text-white">{slot.esboco.titulo}</h3>
      <p className="text-xs text-gray-500">{slot.esboco.formato} · {slot.esboco.etapaFunil} · {slot.esboco.duracaoSeg}s</p>
      <p className="text-sm text-gray-400">{slot.esboco.angulo}</p>
      {slot.status === 'loading' ? (
        <p className="text-xs text-brand-mint flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 animate-spin" /> Roteirizando...</p>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-red-400">{slot.error}</p>
          <button onClick={onRetry} disabled={disabled} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50">Tentar de novo (sem custo)</button>
        </div>
      )}
    </GlassCard>
  );
}

/** Ideias geradas antes da versão 2 (abertas pelo histórico). */
function LegacyResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-6 border-white/10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Resumo (versão anterior do gerador)</p>
        <p className="text-sm text-gray-300">{data?.resumo_estrategico}</p>
      </GlassCard>
      {(data?.ideias_geradas || []).map((idea: any, i: number) => (
        <GlassCard key={i} className="p-6 border-white/10 space-y-2 text-sm">
          <h3 className="text-lg font-bold text-white">{idea.titulo}</h3>
          <p className="text-white">“{idea.gancho}”</p>
          <p className="text-gray-400">{idea.conceito}</p>
          <p className="text-gray-300 whitespace-pre-wrap">{idea.roteiro_base}</p>
          <ul className="text-xs text-gray-400 list-disc list-inside">{(idea.lista_takes || []).map((t: string, j: number) => <li key={j}>{t}</li>)}</ul>
          <p className="text-xs text-gray-400">CTA: {idea.cta}</p>
        </GlassCard>
      ))}
    </div>
  );
}

/** Escolha de até 3 reels do Hub como referência. */
function HubPicker({ selected, onClose, onChange }: { selected: HubItem[]; onClose: () => void; onChange: (v: HubItem[]) => void }) {
  const [items, setItems] = useState<(HubItem & { _s: string })[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const meta = await getDoc(doc(db, 'hub_catalog', 'meta'));
        if (meta.exists()) {
          const pages = (meta.data() as any).pages as number;
          const all = await Promise.all(Array.from({ length: pages }, (_, p) => getDoc(doc(db, 'hub_catalog', `page_${p}`))));
          setItems(all.flatMap(s => (s.exists() ? (s.data().items as HubItem[]) : [])).map(i => ({ ...i, _s: hubSearchText(i) })));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const terms = normalizeText(q).split(/\s+/).filter(Boolean);
    return items.filter(i => terms.every(t => i._s.includes(t))).slice(0, 60);
  }, [items, q]);

  const toggle = (item: HubItem) => {
    if (selected.some(s => s.id === item.id)) onChange(selected.filter(s => s.id !== item.id));
    else if (selected.length < 3) onChange([...selected, item]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#0b0f0d] border border-white/10 rounded-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Compass className="w-5 h-5 text-brand-neon" /> Referências do Hub <span className="text-xs text-gray-500 font-normal">{selected.length}/3</span></h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 text-white" aria-label="Fechar"><X className="w-4 h-4" /></button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Busque por tema, nicho, formato ou gancho" className="w-full glass-input !pl-10" />
        </div>
        {loading ? <p className="text-center text-gray-500 py-10">Carregando…</p> : filtered.length === 0 ? <p className="text-center text-gray-500 py-10">Nenhuma referência encontrada.</p> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto">
            {filtered.map(item => {
              const on = selected.some(s => s.id === item.id);
              return (
                <button key={item.id} type="button" onClick={() => toggle(item)} className={`text-left rounded-xl overflow-hidden border ${on ? 'border-brand-neon ring-2 ring-brand-neon/40' : 'border-white/5'} bg-black/30`}>
                  <div className="relative aspect-[9/16] bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumb} alt={item.tema} loading="lazy" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/70 px-1.5 rounded flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(item.views)}</span>
                    {on && <CheckCircle2 className="absolute top-1 right-1 w-5 h-5 text-brand-neon" />}
                  </div>
                  <p className="p-1.5 text-[10px] text-gray-300 line-clamp-2">{item.tema}</p>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-brand-neon text-black text-sm font-bold">Usar {selected.length} referência{selected.length === 1 ? '' : 's'}</button>
        </div>
      </div>
    </div>
  );
}
