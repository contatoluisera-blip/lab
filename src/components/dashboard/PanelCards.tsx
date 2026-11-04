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
    <div className="relative h-full overflow-hidden rounded-[28px] p-6 md:p-7 text-[#03140d] bg-[linear-gradient(135deg,#d1fae5_0%,#a7f3d0_38%,#6ee7b7_72%,#34d399_100%)] shadow-[0_30px_80px_-30px_rgba(52,211,153,0.65)]">
      <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      <div className="absolute right-6 bottom-6 w-40 h-40 rounded-full border border-[#03140d]/10 pointer-events-none" />
      <div className="absolute right-14 bottom-14 w-24 h-24 rounded-full border border-[#03140d]/10 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#03140d] text-brand-mint flex items-center justify-center shadow-lg"><Coins className="w-5 h-5" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#03140d]/60">Seus créditos</p>
            <p className="text-sm font-semibold">{hasPlan ? `Plano ${account.planLabel} · ${account.statusLabel}` : 'Sem plano ativo'}</p>
          </div>
        </div>
        <Link href="/dashboard/billing" aria-label="Ir para planos e faturamento"
          className="w-11 h-11 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors shadow-sm">
          <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative mt-6 flex items-end gap-3">
        <p className="text-6xl md:text-7xl font-extrabold tracking-tighter tabular-nums leading-none">{profileLoading ? '··' : account.credits}</p>
        {hasPlan && <p className="pb-2 text-sm font-semibold text-[#03140d]/60">de {account.planCredits} no ciclo</p>}
      </div>

      <div className="relative mt-4 h-2 rounded-full bg-[#03140d]/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#03140d] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Usados', value: hasPlan ? String(used) : '—' },
          { label: 'Renova', value: renewal },
          { label: 'Rende até', value: account.credits > 0 ? `${scenes} cenas` : '—', hint: account.credits > 0 ? `ou ${images} imagens` : '' },
        ].map(s => (
          <div key={s.label} className="min-w-0">
            <p className="text-base sm:text-lg font-bold tabular-nums whitespace-nowrap">{s.value}</p>
            <p className="text-[11px] font-medium text-[#03140d]/60 leading-snug">{s.label}{s.hint && <span className="block">{s.hint}</span>}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/billing"
        className="relative mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#03140d] text-brand-mint text-sm font-bold hover:bg-black transition-colors">
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

const FLOAT_FRAMES = [
  { rotate: -7, x: '0%', y: '12%', delay: '0s', ratio: '9 / 16', w: 'w-[34%]', label: 'Vídeo · 9:16', z: 'z-10' },
  { rotate: 4, x: '30%', y: '0%', delay: '1.2s', ratio: '4 / 5', w: 'w-[40%]', label: 'Imagem · 2K', z: 'z-20' },
  { rotate: 10, x: '64%', y: '16%', delay: '2.4s', ratio: '9 / 16', w: 'w-[32%]', label: 'Cena · 1080p', z: 'z-10' },
];

export function StudioShowcase() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<GenJob[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gen_jobs'), where('uid', '==', user.uid), where('status', '==', 'completed'));
    return onSnapshot(q, snap => {
      setRecent(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<GenJob, 'id'>) }))
        .sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3));
    }, () => setRecent([]));
  }, [user]);

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
          {FLOAT_FRAMES.map((f, i) => {
            const job = recent[i];
            const out = job?.outputs?.[0];
            return (
              <div key={i}
                className={`absolute ${f.w} ${f.z} motion-safe:animate-[float_7s_ease-in-out_infinite]`}
                style={{ left: f.x, top: f.y, animationDelay: f.delay }}>
                <div className="rounded-2xl p-2 border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  style={{ transform: `rotate(${f.rotate}deg)` }}>
                  <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-brand-emerald/25 via-black/40 to-brand-mint/10" style={{ aspectRatio: f.ratio }}>
                    {out ? (out.type === 'video'
                      ? <video src={`${out.url}#t=0.5`} muted playsInline autoPlay loop className="w-full h-full object-cover" />
                      // eslint-disable-next-line @next/next/no-img-element
                      : <img src={out.url} alt="" className="w-full h-full object-cover" />)
                      : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {i === 1 ? <ImagePlus className="w-8 h-8 text-white/30" /> : <Film className="w-7 h-7 text-white/30" />}
                        </div>
                      )}
                    <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-mint/70 rounded-tl" />
                    <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-mint/70 rounded-br" />
                  </div>
                  <p className="px-1 pt-2 pb-0.5 font-mono text-[9px] uppercase tracking-widest text-gray-300 truncate">
                    {job ? `${job.modelName} · ${job.config?.aspect || ''}` : f.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Ferramentas ─────────────────────────── */

type Category = 'Criar' | 'Estratégia' | 'Negócio';

const TOOLS: { name: string; desc: string; href: string; icon: React.ElementType; tool?: ToolId; cat: Category; cost?: string }[] = [
  { name: 'Gerar Vídeo', desc: 'Cenas com Kling, Veo e Wan', href: '/dashboard/videos', icon: Film, cat: 'Criar', cost: 'desde 3 cr' },
  { name: 'Gerar Imagem', desc: 'Frames com Nano Banana', href: '/dashboard/imagens', icon: ImagePlus, cat: 'Criar', cost: 'desde 1 cr' },
  { name: 'Gerador de Prompts', desc: 'Direção de fotografia para IA', href: '/dashboard/prompt-studio', icon: Clapperboard, tool: 'prompts', cat: 'Criar' },
  { name: 'Gerador de Ideias', desc: 'Roteiros prontos para gravar', href: '/dashboard/idea-generator', icon: Lightbulb, tool: 'ideas', cat: 'Criar' },
  { name: 'Hub de Referências', desc: 'Reels virais analisados', href: '/dashboard/hub', icon: Compass, tool: 'hub', cat: 'Criar' },
  { name: 'Foto de Estúdio', desc: 'Retrato profissional com IA', href: '/dashboard/estudia', icon: Camera, tool: 'estudia', cat: 'Criar' },
  { name: 'Diagnóstico de Perfil', desc: 'O que melhorar no seu perfil', href: '/dashboard/diagnosis', icon: ScanSearch, tool: 'diagnosis', cat: 'Estratégia' },
  { name: 'Perguntas Rápidas', desc: 'Dúvidas de criação e mercado', href: '/dashboard/assistant', icon: MessageSquare, tool: 'assistant', cat: 'Estratégia' },
  { name: 'Calculadora', desc: 'Preço justo para cada projeto', href: '/dashboard/calculator', icon: Calculator, tool: 'calculator', cat: 'Negócio' },
  { name: 'Propostas', desc: 'Propostas que fecham contrato', href: '/dashboard/proposal', icon: FileText, tool: 'proposal', cat: 'Negócio' },
  { name: 'Cartão do Creator', desc: 'Seu portfólio em PDF', href: '/dashboard/creator-card', icon: IdCard, tool: 'creator-card', cat: 'Negócio' },
  { name: 'Meus Clientes', desc: 'Projetos e contatos', href: '/dashboard/clients', icon: Briefcase, tool: 'clients', cat: 'Negócio' },
];

const CATEGORIES: ('Todas' | Category)[] = ['Todas', 'Criar', 'Estratégia', 'Negócio'];

export function ToolTiles() {
  const { hasToolAccess } = useUserProfile();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('Todas');
  const list = useMemo(() => TOOLS.filter(t => cat === 'Todas' || t.cat === cat), [cat]);

  return (
    <section aria-labelledby="painel-ferramentas" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="painel-ferramentas" className="text-2xl font-bold text-white tracking-tight">Ferramentas</h2>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {list.map(t => {
          const locked = t.tool ? !hasToolAccess(t.tool) : false;
          const cost = t.cost ?? (t.tool ? (TOOL_COSTS[t.tool] === 0 ? 'grátis' : `${TOOL_COSTS[t.tool]} cr`) : '');
          return (
            <Link key={t.href} href={t.href}
              className="group relative flex flex-col justify-between min-h-[160px] p-4 md:p-5 rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] hover:border-brand-emerald/40 hover:from-brand-emerald/[0.10] transition-all duration-300">
              <div className="flex items-start justify-between gap-2">
                <span className="w-11 h-11 rounded-2xl bg-black/40 border border-white/[0.06] text-brand-mint flex items-center justify-center group-hover:scale-105 transition-transform">
                  <t.icon className="w-5 h-5" />
                </span>
                <span className="w-9 h-9 rounded-full bg-black/40 border border-white/[0.06] text-gray-400 group-hover:bg-brand-emerald group-hover:text-black group-hover:border-brand-emerald flex items-center justify-center transition-all">
                  {locked ? <Lock className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-4 h-4" />}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm md:text-[15px] font-bold text-white leading-snug">{t.name}</p>
                <p className="text-[11px] md:text-xs text-gray-500 mt-1 leading-snug">{t.desc}</p>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-brand-mint/80">{locked ? 'outro plano' : cost}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
