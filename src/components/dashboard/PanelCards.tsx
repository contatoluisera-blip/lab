'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  ArrowUpRight, Coins, GraduationCap, Lock, PlayCircle, ImagePlus, Film, Clapperboard, Lightbulb, Camera, Compass,
  ScanSearch, MessageSquare, Calculator, FileText, IdCard, Briefcase, Sparkles,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { readStudyProgress, StudyProgress } from '@/lib/client/studyProgress';
import { GenJob, GEN_MODELS, minCredits } from '@/lib/generation';
import { TOOL_COSTS, ToolId } from '@/lib/planConfig';
import { LoopVideo } from '@/components/landing/LoopVideo';

/* ─────────────────────────── Créditos ─────────────────────────── */

export function CreditsCard() {
  const { account, profileLoading } = useUserProfile();
  const hasPlan = !!account.plan;
  const pct = account.planCredits > 0 ? Math.min(100, Math.round((account.credits / account.planCredits) * 100)) : 0;
  const used = Math.max(0, account.planCredits - account.credits);
  const scenes = Math.floor(account.credits / 4);
  const images = account.credits;
  const renewal = account.renewsAt
    ? new Date(account.renewsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : account.status === 'manual' ? 'Manual' : '—';

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] p-6 md:p-7 text-white border border-brand-emerald/30 bg-[linear-gradient(140deg,#10b981_0%,#059669_34%,#065f46_72%,#043b2c_100%)] shadow-[0_30px_80px_-30px_rgba(16,185,129,0.6)]">
      <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-brand-mint/25 blur-3xl pointer-events-none" />
      <div className="absolute right-6 bottom-6 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute right-14 bottom-14 w-24 h-24 rounded-full border border-white/10 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-black/30 border border-white/15 text-brand-mint flex items-center justify-center shadow-lg"><Coins className="w-5 h-5" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-mint/80">Seus créditos</p>
            <p className="text-sm font-semibold">{hasPlan ? `Plano ${account.planLabel} · ${account.statusLabel}` : 'Sem plano ativo'}</p>
          </div>
        </div>
        <Link href="/dashboard/billing" aria-label="Ir para planos e faturamento"
          className="w-11 h-11 rounded-full bg-white/15 border border-white/20 hover:bg-white hover:text-[#043b2c] flex items-center justify-center transition-colors shadow-sm">
          <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative mt-6 flex items-end gap-3">
        <p className="text-6xl md:text-7xl font-extrabold tracking-tighter tabular-nums leading-none">{profileLoading ? '··' : account.credits}</p>
        {hasPlan && <p className="pb-2 text-sm font-semibold text-brand-mint/80">de {account.planCredits} no ciclo</p>}
      </div>

      <div className="relative mt-4 h-2 rounded-full bg-black/25 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-mint to-white shadow-[0_0_14px_rgba(167,243,208,0.8)] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Usados', value: hasPlan ? String(used) : '—' },
          { label: 'Renova', value: renewal },
          { label: 'Rende até', value: account.credits > 0 ? `${scenes} cenas` : '—', hint: account.credits > 0 ? `ou ${images} imagens` : '' },
        ].map(s => (
          <div key={s.label} className="min-w-0">
            <p className="text-base sm:text-lg font-bold tabular-nums whitespace-nowrap">{s.value}</p>
            <p className="text-[11px] font-medium text-brand-mint/75 leading-snug">{s.label}{s.hint && <span className="block">{s.hint}</span>}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/billing"
        className="relative mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#043b2c] text-sm font-bold hover:bg-brand-mint transition-colors shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
        {hasPlan ? 'Planos e faturamento' : 'Escolher um plano'} <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ─────────────────────────── Estudo ─────────────────────────── */

function Ring({ percent }: { percent: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} className="transition-all duration-1000" />
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StudyCard() {
  const { hasCourseAccess } = useUserProfile();
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  useEffect(() => { setProgress(readStudyProgress()); }, []);
  const p = progress;

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] backdrop-blur-xl p-6 md:p-7">
      <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-brand-emerald/15 blur-3xl pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-brand-emerald/15 text-brand-mint flex items-center justify-center"><GraduationCap className="w-5 h-5" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Área de estudo</p>
            <p className="text-sm font-semibold text-white">{p ? `${p.done} de ${p.total} aulas concluídas` : 'Carregando…'}</p>
          </div>
        </div>
        <Link href="/dashboard/estudo" aria-label="Abrir a área de estudo"
          className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
          <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative mt-5 flex items-center gap-6">
        <div className="relative shrink-0">
          <Ring percent={p?.percent ?? 0} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white tabular-nums">{p?.percent ?? 0}%</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">concluído</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {p?.courses.map(c => (
            <div key={c.id}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-semibold text-gray-200 truncate">{c.title}</span>
                <span className="text-gray-500 tabular-nums">{c.percent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-mint to-brand-emerald transition-all duration-700" style={{ width: `${c.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasCourseAccess ? (
        p?.next && (
          <Link href="/dashboard/estudo"
            className="relative mt-6 flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-brand-emerald/40 transition-colors">
            <PlayCircle className="w-8 h-8 text-brand-mint shrink-0" />
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest text-gray-500">{p.done ? 'Continuar' : 'Começar'} · {p.next.courseTitle}</span>
              <span className="block text-sm font-semibold text-white truncate">{p.next.videoTitle}</span>
            </span>
          </Link>
        )
      ) : (
        <Link href="/dashboard/billing"
          className="relative mt-6 flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-amber-400/20 hover:border-amber-400/50 transition-colors">
          <Lock className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs text-gray-300">Os cursos fazem parte do plano Elite. <span className="text-amber-300 font-semibold">Ver o Elite</span></span>
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────── Estúdio de geração ─────────────────────────── */

/** Exemplos reais de IA (os mesmos da página de vendas) nos quadros flutuantes. */
const FLOAT_FRAMES = [
  { rotate: -7, x: '0%', y: '12%', delay: '0s', ratio: '9 / 16', w: 'w-[34%]', label: 'Cena com IA · 9:16', z: 'z-10', media: { type: 'video', src: '/media/ia/gisele.mp4', poster: '/media/ia/gisele.jpg' } },
  { rotate: 4, x: '30%', y: '0%', delay: '1.2s', ratio: '4 / 5', w: 'w-[40%]', label: 'Frame com IA', z: 'z-20', media: { type: 'image', src: '/media/ia/frame-moradora.jpg' } },
  { rotate: 10, x: '64%', y: '16%', delay: '2.4s', ratio: '9 / 16', w: 'w-[32%]', label: 'Cena com IA · 9:16', z: 'z-10', media: { type: 'video', src: '/media/ia/pelucia.mp4', poster: '/media/ia/pelucia.jpg' } },
] as const;

/** Mídia de exemplo para os blocos de geração quando a pessoa ainda não gerou nada. */
const SAMPLE_VIDEO = { url: '/media/ia/fogo.mp4', type: 'video' };
const SAMPLE_IMAGE = { url: '/media/ia/frame-feirante.jpg', type: 'image' };

/** Últimas gerações concluídas da pessoa (para dar vida ao painel). */
export function useRecentGenerations(max = 6) {
  const { user } = useAuth();
  const [recent, setRecent] = useState<GenJob[]>([]);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gen_jobs'), where('uid', '==', user.uid), where('status', '==', 'completed'));
    return onSnapshot(q, snap => {
      setRecent(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<GenJob, 'id'>) }))
        .sort((a, b) => b.id.localeCompare(a.id)).slice(0, max));
    }, () => setRecent([]));
  }, [user, max]);
  return recent;
}

export function StudioShowcase() {

  const imageFrom = Math.min(...GEN_MODELS.filter(m => m.kind === 'image').map(minCredits));
  const videoFrom = Math.min(...GEN_MODELS.filter(m => m.kind === 'video').map(minCredits));

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#050907] p-6 md:p-10">
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 75% 40%, rgba(16,185,129,0.28), transparent 55%), radial-gradient(circle at 15% 90%, rgba(167,243,208,0.10), transparent 45%)' }} />
      <div className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(167,243,208,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.06) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
            <Sparkles className="w-3.5 h-3.5" /> Estúdio de geração
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-[1.1]">
            Da ideia à cena pronta, <span className="text-brand-mint">sem sair da Creator Lab.</span>
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-md">
            Dirija o prompt no Gerador, gere o frame com Nano Banana e anime com Kling ou Veo. Tudo com os seus créditos, num lugar só.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/imagens" className="group flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white/[0.06] border border-white/10 hover:border-brand-emerald/50 transition-colors">
              <ImagePlus className="w-4 h-4 text-brand-mint" />
              <span className="text-sm font-semibold text-white">Gerar imagem</span>
              <span className="px-2 py-1 rounded-full bg-black/40 text-[10px] font-mono text-gray-400">desde {imageFrom} cr</span>
            </Link>
            <Link href="/dashboard/videos" className="group flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black hover:brightness-110 transition-all">
              <Film className="w-4 h-4" />
              <span className="text-sm font-bold">Gerar vídeo</span>
              <span className="px-2 py-1 rounded-full bg-black/15 text-[10px] font-mono">desde {videoFrom} cr</span>
            </Link>
          </div>
        </div>

        {/* Quadros flutuantes de vidro */}
        <div className="relative h-[300px] md:h-[360px]" aria-hidden>
          {FLOAT_FRAMES.map((f, i) => (
            <div key={i}
              className={`absolute ${f.w} ${f.z} motion-safe:animate-[float_7s_ease-in-out_infinite]`}
              style={{ left: f.x, top: f.y, animationDelay: f.delay }}>
              <div className="rounded-2xl p-2 border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]"
                style={{ transform: `rotate(${f.rotate}deg)` }}>
                <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: f.ratio }}>
                  {f.media.type === 'video'
                    ? <LoopVideo src={f.media.src} poster={f.media.poster} className="absolute inset-0 w-full h-full object-cover" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={f.media.src} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-mint/70 rounded-tl" />
                  <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-mint/70 rounded-br" />
                </div>
                <p className="px-1 pt-2 pb-0.5 font-mono text-[9px] uppercase tracking-widest text-gray-300 truncate">{f.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Ferramentas ─────────────────────────── */

type Category = 'Criar' | 'Estratégia' | 'Negócio';
type Size = 'hero' | 'wide' | 'tile';

/** Tom de cada família: tudo dentro do verde da marca, com variação para dar ritmo ao mosaico. */
const TONE: Record<Category, { from: string; to: string; glow: string; text: string }> = {
  Criar: { from: '#34d399', to: '#059669', glow: 'rgba(16,185,129,0.45)', text: '#a7f3d0' },
  Estratégia: { from: '#5eead4', to: '#0d9488', glow: 'rgba(45,212,191,0.4)', text: '#99f6e4' },
  Negócio: { from: '#bef264', to: '#22c55e', glow: 'rgba(132,204,22,0.35)', text: '#d9f99d' },
};

interface ToolDef { name: string; desc: string; href: string; icon: React.ElementType; tool?: ToolId; cat: Category; cost?: string; size?: Size; badge?: string; pitch?: string }

const TOOLS: ToolDef[] = [
  { name: 'Gerar Vídeo', desc: 'Cenas com Kling, Veo e Wan', pitch: 'Anime um frame, crie do texto ou transforme um vídeo seu.', href: '/dashboard/videos', icon: Film, cat: 'Criar', cost: 'desde 3 cr', size: 'hero', badge: 'Novo' },
  { name: 'Gerar Imagem', desc: 'Frames com Nano Banana 2 e Pro', href: '/dashboard/imagens', icon: ImagePlus, cat: 'Criar', cost: 'desde 1 cr', size: 'wide', badge: 'Novo' },
  { name: 'Gerador de Prompts', desc: 'Direção de fotografia para IA', href: '/dashboard/prompt-studio', icon: Clapperboard, tool: 'prompts', cat: 'Criar', size: 'wide' },
  { name: 'Gerador de Ideias', desc: 'Roteiros prontos para gravar', href: '/dashboard/idea-generator', icon: Lightbulb, tool: 'ideas', cat: 'Criar' },
  { name: 'Hub de Referências', desc: 'Reels virais analisados', pitch: 'Reels que viralizaram, com a análise do gancho, do formato e do porquê funcionou.', href: '/dashboard/hub', icon: Compass, tool: 'hub', cat: 'Criar', size: 'wide' },
  { name: 'Foto de Estúdio', desc: 'Retrato profissional com IA', href: '/dashboard/estudia', icon: Camera, tool: 'estudia', cat: 'Criar' },
  { name: 'Diagnóstico de Perfil', desc: 'O que melhorar no seu perfil', pitch: 'Analisa seus Reels e mostra o que está segurando o crescimento do perfil.', href: '/dashboard/diagnosis', icon: ScanSearch, tool: 'diagnosis', cat: 'Estratégia', size: 'wide' },
  { name: 'Perguntas Rápidas', desc: 'Dúvidas de criação e mercado', href: '/dashboard/assistant', icon: MessageSquare, tool: 'assistant', cat: 'Estratégia' },
  { name: 'Calculadora', desc: 'Preço justo para cada projeto', pitch: 'Custo, lucro e preço final de cada projeto. Pare de chutar o valor do orçamento.', href: '/dashboard/calculator', icon: Calculator, tool: 'calculator', cat: 'Negócio', size: 'wide' },
  { name: 'Propostas', desc: 'Propostas que fecham contrato', href: '/dashboard/proposal', icon: FileText, tool: 'proposal', cat: 'Negócio' },
  { name: 'Cartão do Creator', desc: 'Seu portfólio em PDF', href: '/dashboard/creator-card', icon: IdCard, tool: 'creator-card', cat: 'Negócio' },
  { name: 'Meus Clientes', desc: 'Projetos e contatos', href: '/dashboard/clients', icon: Briefcase, tool: 'clients', cat: 'Negócio' },
];

const CATEGORIES: ('Todas' | Category)[] = ['Todas', 'Criar', 'Estratégia', 'Negócio'];

const PROMPT_SNIPPET = '[SHOT] Single continuous shot. Slow dolly push-in, 35mm, f/2.8, golden hour backlight…';

function TypingLine() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setN(PROMPT_SNIPPET.length); return; }
    const t = setInterval(() => setN(v => (v >= PROMPT_SNIPPET.length + 24 ? 0 : v + 1)), 55);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="font-mono text-[10.5px] leading-relaxed text-brand-mint/80">
      {PROMPT_SNIPPET.slice(0, n)}<span className="inline-block w-1.5 h-3 -mb-0.5 ml-0.5 bg-brand-mint animate-pulse" />
    </p>
  );
}

function ToolCard({ t, locked, cost, media }: { t: ToolDef; locked: boolean; cost: string; media?: { url: string; type: string } | null }) {
  const tone = TONE[t.cat];
  const size = t.size || 'tile';
  const span = size === 'hero' ? 'col-span-2 row-span-2' : size === 'wide' ? 'col-span-2' : '';
  const Icon = t.icon;

  return (
    <Link href={t.href}
      className={`group relative isolate flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#07100c] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_-24px_var(--tone)] ${span} ${size === 'hero' ? 'min-h-[340px] md:min-h-[360px]' : 'min-h-[172px]'}`}
      style={{ ['--tone' as string]: tone.glow } as React.CSSProperties}>
      {/* fundo: mídia real (Gerar vídeo/imagem) ou atmosfera do tom */}
      {media && (size === 'hero' || size === 'wide') && (
        <div className="absolute inset-0 -z-10">
          {media.type === 'video'
            ? <video src={`${media.url}#t=0.5`} muted playsInline autoPlay loop className="w-full h-full object-cover opacity-55 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={media.url} alt="" className="w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050907] via-[#050907]/70 to-[#050907]/10" />
        </div>
      )}
      <div className="absolute -z-10 -top-20 -right-16 w-56 h-56 rounded-full blur-3xl opacity-25 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: tone.glow }} />
      <div className="absolute -z-10 inset-x-6 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${tone.from}, transparent)` }} />
      {/* ícone gigante de fundo */}
      <Icon aria-hidden className="absolute -z-10 -bottom-6 -right-4 w-36 h-36 opacity-[0.05] group-hover:opacity-[0.1] group-hover:-rotate-6 transition-all duration-500" style={{ color: tone.text }} strokeWidth={1.2} />

      <div className="flex items-start justify-between gap-2">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#03140d] shadow-lg group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300"
          style={{ background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`, boxShadow: `0 10px 30px -8px ${tone.glow}` }}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </span>
        <div className="flex items-center gap-2">
          {t.badge && <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-[#03140d]" style={{ background: tone.from }}>{t.badge}</span>}
          <span className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 text-gray-300 flex items-center justify-center transition-all duration-300 group-hover:text-[#03140d] group-hover:border-transparent group-hover:bg-[var(--tone)]"
            style={{ ['--tone' as string]: tone.from } as React.CSSProperties}>
            {locked ? <Lock className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </span>
        </div>
      </div>

      {size === 'wide' && t.href.includes('prompt-studio') && (
        <div className="my-3 p-3 rounded-xl bg-black/40 border border-white/[0.06]"><TypingLine /></div>
      )}

      <div className={size === 'hero' ? 'space-y-3' : 'mt-4'}>
        {size === 'hero' && (
          <div className="flex flex-wrap gap-1.5">
            {['Kling 3.0', 'Veo 3.1', 'Wan 2.6'].map(m => (
              <span key={m} className="px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur text-[10px] font-semibold text-gray-200">{m}</span>
            ))}
          </div>
        )}
        <p className={`${size === 'hero' ? 'text-3xl md:text-4xl' : 'text-[15px] md:text-base'} font-bold text-white leading-tight tracking-tight`}>{t.name}</p>
        <p className={`${size === 'hero' ? 'text-sm text-gray-300 max-w-xs' : 'text-xs text-gray-400'} ${size === 'wide' && t.pitch ? 'max-w-sm' : ''} mt-1 leading-snug`}>{size !== 'tile' && t.pitch ? t.pitch : t.desc}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border"
            style={{ color: tone.text, borderColor: `${tone.from}40`, background: `${tone.from}14` }}>
            {locked ? 'outro plano' : cost}
          </span>
          {size === 'hero' && !locked && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-b from-[#34d399] to-[#10b981] text-black text-xs font-bold shadow-[0_10px_30px_-8px_rgba(16,185,129,0.8)]">
              Gerar cena <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ToolTiles({ recent }: { recent: GenJob[] }) {
  const { hasToolAccess } = useUserProfile();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('Todas');
  const list = useMemo(() => TOOLS.filter(t => cat === 'Todas' || t.cat === cat), [cat]);
  const lastVideo = recent.find(j => j.kind === 'video')?.outputs?.[0] || SAMPLE_VIDEO;
  const lastImage = recent.find(j => j.kind === 'image')?.outputs?.[0] || SAMPLE_IMAGE;

  return (
    <section aria-labelledby="painel-ferramentas" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="painel-ferramentas" className="text-2xl font-bold text-white tracking-tight">Ferramentas</h2>
          <p className="text-sm text-gray-500 mt-1">Tudo o que você precisa para criar, se posicionar e vender.</p>
        </div>
        <div role="tablist" aria-label="Filtrar ferramentas" className="flex gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-x-auto">
          {CATEGORIES.map(c => (
            <button key={c} role="tab" type="button" aria-selected={cat === c} onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${cat === c
                ? 'bg-gradient-to-b from-brand-mint to-brand-neon text-[#03140d]'
                : 'text-gray-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 grid-flow-dense">
        {list.map(t => {
          const locked = t.tool ? !hasToolAccess(t.tool) : false;
          const cost = t.cost ?? (t.tool ? (TOOL_COSTS[t.tool] === 0 ? 'grátis' : `${TOOL_COSTS[t.tool]} cr`) : '');
          const media = t.href.endsWith('/videos') ? lastVideo : t.href.endsWith('/imagens') ? lastImage : null;
          return <ToolCard key={t.href} t={t} locked={locked} cost={cost} media={media} />;
        })}
      </div>
    </section>
  );
}
