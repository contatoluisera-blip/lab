import React from 'react';
import {
  ArrowRight, Briefcase, Calculator, Camera, CheckCircle2, Clapperboard, Clock, Compass, DollarSign, FileText, Film, IdCard,
  ImagePlus, Lightbulb, MessageSquare, ScanSearch, Sparkles, Zap,
} from 'lucide-react';
import { LoopVideo } from '@/components/landing/LoopVideo';

// Peças e seções compartilhadas entre a página de vendas (/) e a captação de leads (/lista).

const SCATTERED = [
  'Um chat de IA para o roteiro',
  'Outro site para a imagem',
  'Mais uma assinatura para o vídeo',
  'Planilha para o orçamento',
  'Documento para a proposta',
  'Pasta de prints de referência',
  'Curso solto no YouTube',
  'Bloco de notas de clientes',
];

const FLOW = [
  { step: 'Planeje', icon: Lightbulb, line: 'Roteiro com gancho, fala e takes, a partir de reels que já viralizaram.', tools: ['Gerador de Ideias', 'Hub de Referências', 'Diagnóstico'] },
  { step: 'Dirija', icon: Clapperboard, line: 'Câmera, lente e luz escolhidas por você ou decididas pela IA. Sai o prompt pronto.', tools: ['Gerador de Prompts'] },
  { step: 'Gere', icon: Film, line: 'Frame e cena com os melhores modelos de IA, usando os seus créditos.', tools: ['Gerar Imagem', 'Gerar Vídeo', 'Foto de Estúdio'] },
  { step: 'Venda', icon: DollarSign, line: 'Preço calculado, proposta em PDF e o cliente organizado.', tools: ['Calculadora', 'Propostas', 'Clientes'] },
];

type Tone = 'emerald' | 'teal' | 'lime';
const TONES: Record<Tone, { from: string; to: string; glow: string; text: string }> = {
  emerald: { from: '#34d399', to: '#059669', glow: 'rgba(16,185,129,0.45)', text: '#a7f3d0' },
  teal: { from: '#5eead4', to: '#0d9488', glow: 'rgba(45,212,191,0.4)', text: '#99f6e4' },
  lime: { from: '#bef264', to: '#22c55e', glow: 'rgba(132,204,22,0.35)', text: '#d9f99d' },
};

const TOOLS: { name: string; line: string; icon: React.ElementType; tone: Tone; size?: 'hero' | 'wide'; tag?: string; media?: { src: string; type: 'video' | 'image'; poster?: string } }[] = [
  { name: 'Gerar Vídeo', line: 'Anime um frame, crie a cena do zero ou transforme um vídeo seu. Kling, Veo, Seedance, Hailuo, Wan e mais no mesmo lugar.', icon: Film, tone: 'emerald', size: 'hero', tag: 'Novo', media: { src: '/media/ia/fogo.mp4', type: 'video', poster: '/media/ia/fogo.jpg' } },
  { name: 'Gerar Imagem', line: 'Frames, capas e cenas com Nano Banana, GPT Image 2, Seedream, FLUX e Ideogram, de 1K a 4K.', icon: ImagePlus, tone: 'emerald', size: 'wide', tag: 'Novo', media: { src: '/media/ia/frame-feirante.jpg', type: 'image' } },
  { name: 'Gerador de Prompts', line: 'Image, Text e Video to Video com ficha de direção de fotografia. Chega de vídeo de IA com cara de IA.', icon: Clapperboard, tone: 'emerald', size: 'wide' },
  { name: 'Gerador de Ideias', line: 'Roteiros prontos para gravar: ganchos, fala exata e takes.', icon: Lightbulb, tone: 'emerald' },
  { name: 'Hub de Referências', line: 'Reels virais com a análise do porquê funcionaram.', icon: Compass, tone: 'emerald' },
  { name: 'Foto de Estúdio', line: 'Uma selfie vira retrato profissional.', icon: Camera, tone: 'emerald' },
  { name: 'Diagnóstico de Perfil', line: 'Descubra o que está segurando o crescimento do perfil, seu ou do cliente.', icon: ScanSearch, tone: 'teal', size: 'wide', media: { src: '/media/ia/diagnostico.mp4', type: 'video', poster: '/media/ia/diagnostico.jpg' } },
  { name: 'Perguntas Rápidas', line: 'Dúvidas de criação e mercado, na hora.', icon: MessageSquare, tone: 'teal' },
  { name: 'Calculadora', line: 'Custo, lucro e preço final de cada projeto, sem chute.', icon: Calculator, tone: 'lime', size: 'wide' },
  { name: 'Propostas', line: 'Proposta em PDF em minutos.', icon: FileText, tone: 'lime' },
  { name: 'Cartão do Creator', line: 'Seu portfólio e serviços num PDF.', icon: IdCard, tone: 'lime' },
  { name: 'Meus Clientes', line: 'Projetos, status e entregas.', icon: Briefcase, tone: 'lime' },
];

/** Exemplos reais gerados com IA (vídeos curtos em /public/media/ia). */
const GALLERY = [
  { src: '/media/ia/pelucia.mp4', poster: '/media/ia/pelucia.jpg', title: 'Narrativa com personagem', tag: 'Storytelling' },
  { src: '/media/ia/fogo-2.mp4', poster: '/media/ia/fogo-2.jpg', title: 'Tipografia 3D na paisagem', tag: 'Campanha' },
  { src: '/media/ia/campanha.mp4', poster: '/media/ia/campanha.jpg', title: 'Direção de luz dramática', tag: 'Institucional' },
  { src: '/media/ia/fogo.mp4', poster: '/media/ia/fogo.jpg', title: 'Plano aéreo sem drone', tag: 'Documental' },
];

const FRAMES = [
  { src: '/media/ia/frame-feirante.jpg', title: 'Retrato na feira', ratio: 'aspect-video' },
  { src: '/media/ia/frame-familia.jpg', title: 'Cena em família', ratio: 'aspect-video' },
];

/* ─────────────────────────── Peças visuais ─────────────────────────── */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, accent, sub }: { eyebrow: React.ReactNode; title: string; accent?: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto space-y-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
        {title} {accent && <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">{accent}</span>}
      </h2>
      {sub && <p className="text-gray-400 leading-relaxed">{sub}</p>}
    </div>
  );
}

/** Headline principal: a mesma na página de vendas e na captação de leads. */
export function HeroHeadline() {
  return (
    <h1 className="text-[2.5rem] sm:text-6xl lg:text-[3.6rem] xl:text-[4rem] font-extrabold tracking-tight text-white leading-[1.02] text-balance">
      Do roteiro à cena pronta.{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-neon">Tudo pelo celular, em minutos.</span>
    </h1>
  );
}

/** Mosaico do app flutuando no herói (ilustração da interface, com dados de exemplo). */
export function HeroMosaic() {
  const glass = 'rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]';
  return (
    <div className="relative h-[460px] sm:h-[520px] w-full max-w-[520px] mx-auto" aria-hidden>
      <div className="absolute inset-10 rounded-full bg-brand-emerald/25 blur-[90px]" />

      {/* Cena sendo gerada */}
      <div className={`absolute left-[4%] top-[6%] w-[46%] p-2.5 ${glass} motion-safe:animate-[float_7s_ease-in-out_infinite]`} style={{ rotate: '-5deg' }}>
        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#03140d]">
          <LoopVideo src="/media/ia/gisele.mp4" poster="/media/ia/gisele.jpg" label="Cena gerada com IA" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-white/70 rounded-tl" />
          <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-white/70 rounded-br" />
          <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 text-[9px] font-mono uppercase tracking-widest text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> Pronto
          </span>
        </div>
        <p className="px-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-gray-300">Cena com IA · 9:16</p>
      </div>

      {/* Roteiro pronto */}
      <div className={`absolute right-[0%] top-[0%] w-[52%] p-4 ${glass} motion-safe:animate-[float_8s_ease-in-out_infinite]`} style={{ animationDelay: '1s', rotate: '3deg' }}>
        <p className="flex items-center gap-2 text-[11px] font-bold text-white"><Lightbulb className="w-3.5 h-3.5 text-brand-mint" /> Roteiro pronto</p>
        <div className="mt-3 space-y-2">
          {['Gancho: “Essa cena não existe.”', 'Fala: “Era só uma foto do celular…”', 'Take 3: tela dividida, antes e depois'].map(l => (
            <p key={l} className="text-[10.5px] text-gray-300 leading-snug pl-2 border-l-2 border-brand-emerald/50">{l}</p>
          ))}
        </div>
      </div>

      {/* Prompt com direção */}
      <div className={`absolute right-[2%] top-[38%] w-[56%] p-4 ${glass} motion-safe:animate-[float_9s_ease-in-out_infinite]`} style={{ animationDelay: '2s', rotate: '-2deg' }}>
        <p className="flex items-center gap-2 text-[11px] font-bold text-white"><Clapperboard className="w-3.5 h-3.5 text-brand-mint" /> Prompt com direção</p>
        <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-brand-mint/85">[SHOT] Single continuous shot. Slow dolly push-in, 35mm, f/2.8, golden hour…<span className="inline-block w-1.5 h-3 ml-0.5 -mb-0.5 bg-brand-mint animate-pulse" /></p>
      </div>

      {/* Orçamento */}
      <div className={`absolute left-[10%] bottom-[2%] w-[58%] p-4 rounded-3xl text-[#03140d] bg-[linear-gradient(140deg,#a7f3d0,#34d399_60%,#10b981)] shadow-[0_30px_60px_-20px_rgba(16,185,129,0.7)] motion-safe:animate-[float_7.5s_ease-in-out_infinite]`} style={{ animationDelay: '0.5s', rotate: '2deg' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Calculadora</p>
          <Calculator className="w-4 h-4" />
        </div>
        <p className="mt-1 text-2xl font-extrabold tracking-tight leading-tight">Orçamento pronto</p>
        <div className="mt-2 space-y-1">
          {['Custo, lucro e preço calculados', 'Proposta em PDF enviada'].map(l => (
            <p key={l} className="text-[11px] font-semibold opacity-80 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {l}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Seções ─────────────────────────── */

export function OneAppSection() {
  return (
    <section className="space-y-12">
      <SectionTitle
        eyebrow={<><Clock className="w-3.5 h-3.5" /> Menos abas, mais entrega</>}
        title="Pare de montar o quebra-cabeça"
        accent="a cada projeto."
        sub="Roteiro num lugar, imagem em outro, vídeo em outro, orçamento na planilha. Cada troca de app é tempo que não volta. Aqui o fluxo inteiro está junto, com o mesmo login e o mesmo saldo."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-6 md:p-8 overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">O jeito de sempre</p>
          <div className="flex flex-wrap gap-2.5">
            {SCATTERED.map((t, i) => (
              <span key={t} className="px-3.5 py-2 rounded-xl border border-white/[0.08] bg-black/30 text-sm text-gray-500 line-through decoration-red-400/60"
                style={{ rotate: `${(i % 3) - 1}deg` }}>{t}</span>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">8 ferramentas, 8 logins, várias assinaturas em dólar.</p>
        </div>
        <div className="relative rounded-[28px] border border-brand-emerald/30 p-6 md:p-8 overflow-hidden bg-[linear-gradient(140deg,rgba(16,185,129,0.18),rgba(6,95,70,0.12)_50%,rgba(3,20,13,0.4))]">
          <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-emerald/25 blur-3xl pointer-events-none" />
          <p className="relative text-xs font-bold uppercase tracking-widest text-brand-mint mb-5">Com a Creator Lab</p>
          <ul className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {['Roteiro e ideias', 'Prompt com direção', 'Imagem com IA', 'Vídeo com IA', 'Orçamento', 'Proposta em PDF', 'Referências virais', 'Cursos e aulas'].map(t => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-white"><CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" /> {t}</li>
            ))}
          </ul>
          <p className="relative mt-6 text-sm text-brand-mint font-semibold">1 app, 1 login, 1 saldo de créditos.</p>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="space-y-12 scroll-mt-28">
      <SectionTitle
        eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Como funciona</>}
        title="Quatro passos entre a ideia"
        accent="e o pagamento."
      />
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="hidden md:block absolute top-9 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-brand-emerald/50 to-transparent" />
        {FLOW.map((f, i) => (
          <div key={f.step} className="relative rounded-[26px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-neon to-brand-jade text-[#03140d] flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]">
                <f.icon className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <span className="font-mono text-xs text-gray-500">0{i + 1}</span>
            </div>
            <h3 className="text-xl font-bold text-white">{f.step}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.line}</p>
            <div className="flex flex-wrap gap-1.5">
              {f.tools.map(t => <span key={t} className="px-2.5 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-semibold text-brand-mint">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExamplesSection() {
  return (
    <section id="exemplos" className="space-y-12 scroll-mt-28">
      <SectionTitle
        eyebrow={<><Film className="w-3.5 h-3.5" /> Feito com IA</>}
        title="Qualidade de entrega,"
        accent="não de teste."
        sub="Frames e cenas gerados com IA, com o mesmo método de direção que você aplica aqui dentro."
      />

      {/* Da foto à cena */}
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-5 md:gap-8 rounded-[32px] border border-white/[0.07] bg-[#050907] p-5 md:p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.25), transparent 60%)' }} />
        <figure className="relative mx-auto w-full max-w-[280px] space-y-3">
          <div className="rounded-3xl p-2 border border-white/15 bg-white/[0.05] backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/ia/frame-moradora.jpg" alt="Frame gerado com IA: moradora sorrindo em frente a um conjunto habitacional" loading="lazy" className="w-full aspect-[9/16] object-cover rounded-2xl" />
          </div>
          <figcaption className="text-center"><span className="font-mono text-[10px] uppercase tracking-widest text-brand-mint">1 · Frame</span><span className="block text-sm text-gray-400">Gerar Imagem</span></figcaption>
        </figure>
        <div className="relative flex md:flex-col items-center justify-center gap-3 text-brand-mint">
          <span className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent to-brand-emerald/60" />
          <span className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-neon to-brand-jade text-[#03140d] flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(16,185,129,0.8)]">
            <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
          </span>
          <span className="text-xs font-semibold text-gray-300 text-center">Prompt com<br className="hidden md:block" /> direção</span>
          <span className="hidden md:block w-px h-16 bg-gradient-to-t from-transparent to-brand-emerald/60" />
        </div>
        <figure className="relative mx-auto w-full max-w-[280px] space-y-3">
          <div className="rounded-3xl p-2 border border-brand-emerald/40 bg-brand-emerald/[0.08] backdrop-blur shadow-[0_30px_80px_-30px_rgba(16,185,129,0.7)]">
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black">
              <LoopVideo src="/media/ia/gisele.mp4" poster="/media/ia/gisele.jpg" label="Cena em vídeo gerada a partir do frame" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
          <figcaption className="text-center"><span className="font-mono text-[10px] uppercase tracking-widest text-brand-mint">2 · Cena</span><span className="block text-sm text-gray-400">A mesma pessoa, agora em movimento</span></figcaption>
        </figure>
      </div>

      {/* Cenas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {GALLERY.map(g => (
          <figure key={g.src} className="group relative aspect-[9/16] rounded-[26px] overflow-hidden border border-white/[0.08] bg-black">
            <LoopVideo src={g.src} poster={g.poster} label={g.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <span className="px-2 py-0.5 rounded-full bg-brand-emerald/90 text-[9px] font-bold uppercase tracking-widest text-[#03140d]">{g.tag}</span>
              <figcaption className="mt-2 text-sm font-semibold text-white leading-snug">{g.title}</figcaption>
            </div>
          </figure>
        ))}
      </div>

      {/* Frames */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {FRAMES.map(f => (
          <figure key={f.src} className="group relative rounded-[26px] overflow-hidden border border-white/[0.08] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={`Frame gerado com IA: ${f.title.toLowerCase()}`} loading="lazy" className={`w-full ${f.ratio} object-cover group-hover:scale-105 transition-transform duration-700`} />
            <figcaption className="absolute left-4 bottom-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs font-semibold text-white">
              <ImagePlus className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5 text-brand-mint" />{f.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ToolsSection() {
  return (
    <section id="ferramentas" className="space-y-12 scroll-mt-28">
      <SectionTitle
        eyebrow={<><Zap className="w-3.5 h-3.5" /> 12 ferramentas</>}
        title="Cada uma resolve uma tarefa."
        accent="Em minutos."
        sub="Feitas para quem cria pelo celular e não tem tempo a perder com ferramenta genérica."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 grid-flow-dense">
        {TOOLS.map(t => {
          const tone = TONES[t.tone];
          const span = t.size === 'hero' ? 'col-span-2 row-span-2' : t.size === 'wide' ? 'col-span-2' : '';
          return (
            <div key={t.name}
              className={`group relative isolate overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#07100c] p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${span} ${t.size === 'hero' ? 'min-h-[340px]' : 'min-h-[180px]'}`}>
              <div className="absolute -z-10 -top-20 -right-16 w-56 h-56 rounded-full blur-3xl opacity-25 group-hover:opacity-60 transition-opacity duration-500" style={{ background: tone.glow }} />
              <div className="absolute -z-10 inset-x-6 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${tone.from}, transparent)` }} />
              <t.icon aria-hidden className="absolute -z-10 -bottom-6 -right-4 w-36 h-36 opacity-[0.05] group-hover:opacity-[0.1] group-hover:-rotate-6 transition-all duration-500" style={{ color: tone.text }} strokeWidth={1.2} />
              {t.media && (
                <div className="absolute -z-10 inset-0">
                  {t.media.type === 'video'
                    ? <LoopVideo src={t.media.src} poster={t.media.poster} className={`w-full h-full object-cover ${t.name.startsWith('Diagn') ? 'object-top opacity-40' : 'opacity-60'} group-hover:scale-105 transition-transform duration-700`} />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={t.media.src} alt="" loading="lazy" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050907] via-[#050907]/75 to-[#050907]/10" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#03140d] group-hover:scale-110 group-hover:-rotate-3 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`, boxShadow: `0 10px 30px -8px ${tone.glow}` }}>
                  <t.icon className="w-5 h-5" strokeWidth={2.2} />
                </span>
                {t.tag && <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-[#03140d]" style={{ background: tone.from }}>{t.tag}</span>}
              </div>
              <div className={t.size === 'hero' ? 'space-y-3' : 'mt-5'}>
                {t.size === 'hero' && (
                  <div className="flex flex-wrap gap-1.5">
                    {['Imagem → vídeo', 'Texto → vídeo', 'Vídeo → vídeo'].map(m => (
                      <span key={m} className="px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-semibold text-gray-200">{m}</span>
                    ))}
                  </div>
                )}
                <h3 className={`${t.size === 'hero' ? 'text-3xl md:text-4xl' : 'text-base'} font-bold text-white tracking-tight leading-tight`}>{t.name}</h3>
                <p className={`${t.size === 'hero' ? 'text-sm text-gray-300 max-w-sm' : 'text-xs text-gray-400'} mt-1.5 leading-relaxed`}>{t.line}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
