import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import {
  Sparkles, Check, HelpCircle, TrendingUp, Lightbulb, GraduationCap, ArrowRight, Zap, Clock, DollarSign,
  CheckCircle2, Star, PlayCircle, Compass, Clapperboard, Film, ImagePlus, Camera, ScanSearch, MessageSquare,
  Calculator, FileText, IdCard, Briefcase, Rocket,
} from 'lucide-react';
import PricingSection from '@/app/PricingSection';
import { LoopVideo } from '@/components/landing/LoopVideo';

const feedbacks = [
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint1.jpeg?alt=media&token=84a37184-0121-45af-93ca-a017124e91e2",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint10.jpeg?alt=media&token=fc755d1d-39df-4c4d-9613-6be8f7009433",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint11.jpeg?alt=media&token=c05cb365-b451-48de-98a5-85520ebf0283",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint12.jpeg?alt=media&token=a78632e2-2ffd-4312-acc4-d333d44c58b7",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint13.jpeg?alt=media&token=6d9abd66-75c2-45e9-9f2b-902f30752b5f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint14.jpeg?alt=media&token=ed7a1b73-3258-4031-8eeb-bb25718f0cb6",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint15.jpeg?alt=media&token=f5d6983a-3fb0-41d0-b969-b2ef635c40e0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint16.jpeg?alt=media&token=672201d1-d6e9-4e7d-a9f5-e4e40d5ea853",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint17.jpeg?alt=media&token=70dd18c0-0dc3-4dea-83af-9f9301d7582a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint18.jpeg?alt=media&token=d81f23ec-20f0-421c-af5c-263556ccad3d",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint2.jpeg?alt=media&token=d63ae003-533c-4e74-9e30-c16a51742ef0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint3.jpeg?alt=media&token=faf8d697-e0d9-4ec3-a869-666aa77dd09a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint4.jpeg?alt=media&token=15673ef5-df6f-44a3-9d42-984f7d6a7dfe",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint5.jpeg?alt=media&token=fe4d00e4-94f7-4e30-88a7-e9e75b566761",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint6.jpeg?alt=media&token=3ea761d0-0877-4f9f-89d9-6ff255ddd246",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint7.jpeg?alt=media&token=adc53f02-08a2-4c99-87c7-531375c5c3cc",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint8.jpeg?alt=media&token=fb28488e-7c54-4ea4-9b08-0cecee11fc1f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint9.jpeg?alt=media&token=1eafdc48-4cb0-4337-8d48-7443b19358ef",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint%2019.jpeg?alt=media&token=c10f71cd-02dc-4f49-b7ba-ae8712b0ca05"
];

const videos3D = [
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=50be0413-d146-4bf7-808d-7357a22afcfa",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=7053dfb0-5cb3-493f-8135-edeaa696c5ed",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=2d6aa720-5db7-4529-b230-3fe6ba54b644",
  "https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=552167a4-3920-4e63-bfef-6298160641e3"
];

/* ─────────────────────────── Conteúdo ─────────────────────────── */

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

const COURSES = [
  { title: 'Mobile Lab', kind: 'Curso completo', line: 'Do enquadramento à edição avançada, tudo pelo celular.', status: 'Disponível' },
  { title: '3D pelo Celular', kind: 'Masterclass', line: 'Tracking 3D, objetos virtuais e efeitos FOOH no NodeVideo.', status: 'Disponível' },
  { title: 'Criação com IA', kind: 'Novo curso', line: 'Imagem, vídeo, voz e trilha com IA, gastando pouco e com qualidade de entrega.', status: 'Em produção' },
  { title: 'Entregas Rápidas', kind: 'Novo curso', line: 'Cobertura de eventos com entrega no mesmo dia, 100% mobile.', status: 'Em breve' },
];

const FAQ = [
  { q: 'Já uso o ChatGPT de graça. Por que pagar?', a: 'Porque aqui o método do audiovisual já vem pronto. Você não precisa saber pedir: escolhe opções, a ferramenta escreve o roteiro, o prompt técnico ou a proposta. E a geração de imagem e vídeo já está dentro, sem outra assinatura.' },
  { q: 'Não tenho tempo para aprender uma plataforma nova.', a: 'Cada ferramenta entrega em minutos e foi feita para o celular. Você abre, preenche o essencial e sai com o resultado. Os cursos ficam para quando quiser evoluir a técnica.' },
  { q: 'Como funcionam os créditos?', a: 'Cada plano traz créditos por mês. Ferramentas de texto custam 1 ou 2 créditos; imagens e vídeos a partir de 1, conforme o modelo e a qualidade. O custo aparece antes de você confirmar, e se a geração falhar por erro técnico, o crédito volta sozinho.' },
  { q: 'Serve para o meu nicho?', a: 'Sim. O Gerador de Ideias parte do seu nicho, o Hub mostra referências dele e o Diagnóstico analisa qualquer perfil. Creators, social medias, videomakers e agências usam a mesma base.' },
  { q: 'Os cursos estão em todos os planos?', a: 'Os cursos fazem parte do plano Elite. Start e Pro dão acesso às ferramentas, incluindo a geração de imagem e vídeo.' },
  { q: 'Posso cancelar quando quiser?', a: 'Pode. A assinatura é mensal, sem fidelidade. Você cancela pela própria área de planos.' },
];

/* ─────────────────────────── Peças visuais ─────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-emerald/25 bg-brand-emerald/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-mint">
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, accent, sub }: { eyebrow: React.ReactNode; title: string; accent?: string; sub?: string }) {
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

/** Mosaico do app flutuando no herói (ilustração da interface, com dados de exemplo). */
function HeroMosaic() {
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

/* ─────────────────────────── Página ─────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent overflow-hidden selection:bg-brand-emerald/30">

      {/* Brilhos de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-brand-jade/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[25%] right-[-10%] w-[35%] h-[50%] bg-brand-emerald/[0.07] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-brand-mint/5 blur-[150px] rounded-full" />
      </div>

      {/* Navegação */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl h-16 rounded-2xl neo-glass flex items-center justify-between px-5 md:px-8 border border-white/5">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Creator Lab Logo" width={32} height={32} className="rounded-lg" />
          <Image src="/logo-text.png" alt="Creator Lab" width={192} height={40} className="w-32 md:w-44 object-contain" />
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-400">
          <a href="#como-funciona" className="hover:text-brand-mint transition-colors">Como funciona</a>
          <a href="#exemplos" className="hover:text-brand-mint transition-colors">Exemplos</a>
          <a href="#ferramentas" className="hover:text-brand-mint transition-colors">Ferramentas</a>
          <a href="#cursos" className="hover:text-brand-mint transition-colors">Cursos</a>
          <a href="#planos" className="hover:text-brand-mint transition-colors">Planos</a>
          <Link href="/login" className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-white hover:border-brand-emerald/50 transition-colors">Entrar</Link>
        </nav>
        <Link href="/login" className="md:hidden px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm text-white">Entrar</Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 pt-28 md:pt-32 pb-24 space-y-28 md:space-y-36">

        {/* 1. Herói */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-4 items-center pt-6">
          <div className="space-y-7 text-center lg:text-left">
            <Eyebrow><Zap className="w-3.5 h-3.5" /> Criação mobile e IA num app só</Eyebrow>
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-[3.6rem] xl:text-[4rem] font-extrabold tracking-tight text-white leading-[1.02] text-balance">
              Do roteiro à cena pronta.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-neon">Tudo pelo celular, em minutos.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              A Creator Lab junta tudo o que você usa para criar e vender: roteiro pronto, prompt com direção de cinema,
              geração de <strong className="text-white">imagem e vídeo com IA</strong>, orçamento e proposta. E os cursos para dominar a técnica.
              Sem pular de app em app, sem dez assinaturas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a href="#planos" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 flex items-center gap-2 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.7)]">
                  Começar agora <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#como-funciona" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> Ver como funciona
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-gray-500">
              {['Assinatura mensal, sem fidelidade', 'Feito para o celular', 'Crédito volta se a IA falhar'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" /> {t}</span>
              ))}
            </div>
          </div>
          <HeroMosaic />
        </section>

        {/* Modelos */}
        <section aria-label="Modelos de IA disponíveis" className="-mt-12 md:-mt-20">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-gray-600 mb-4">Os modelos de IA que você usa aqui dentro</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {['Kling 4.0', 'Google Veo 3.1', 'Seedance 2', 'Nano Banana Pro', 'GPT Image 2', 'Seedream 5', 'Hailuo 2.3', 'Wan 2.7', 'Runway', 'Claude'].map(m => (
              <span key={m} className="px-4 py-2 rounded-full border border-white/[0.07] bg-white/[0.03] text-sm font-semibold text-gray-300">{m}</span>
            ))}
          </div>
        </section>

        {/* 2. Vídeo */}
        <section className="space-y-8">
          <SectionTitle eyebrow={<><PlayCircle className="w-3.5 h-3.5" /> Tour pela plataforma</>} title="Veja a Creator Lab" accent="por dentro" />
          <div className="relative max-w-4xl mx-auto group">
            <div className="absolute -inset-4 bg-brand-emerald/15 blur-[80px] rounded-[40px] group-hover:bg-brand-emerald/25 transition-all duration-700 pointer-events-none" />
            <div className="relative rounded-[28px] p-2 border border-white/10 bg-white/[0.04] backdrop-blur">
              <div className="rounded-[22px] overflow-hidden bg-[#050505] aspect-video">
                <iframe
                  id="panda-20b25815-5523-4c8d-abbc-27c4bcf8839f"
                  src="https://player-vz-be549932-da9.tv.pandavideo.com.br/embed/?v=20b25815-5523-4c8d-abbc-27c4bcf8839f&autoplay=true"
                  style={{ border: 'none' }}
                  className="w-full h-full"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Um app no lugar de vários */}
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

        {/* 4. Como funciona */}
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

        {/* 4.5 Galeria */}
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

        {/* 5. Ferramentas */}
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

        {/* 6. Cursos */}
        <section id="cursos" className="space-y-12 scroll-mt-28">
          <SectionTitle
            eyebrow={<><GraduationCap className="w-3.5 h-3.5" /> Cursos com Luisera</>}
            title="Aprenda a técnica."
            accent="Execute com a ferramenta."
            sub="A Creator Lab também é escola. Os cursos ensinam o porquê; as ferramentas fazem o trabalho pesado."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COURSES.map((c, i) => {
              const live = c.status === 'Disponível';
              return (
                <div key={c.title} className={`relative overflow-hidden rounded-[26px] border p-5 flex flex-col gap-4 min-h-[220px] ${live ? 'border-brand-emerald/30 bg-[linear-gradient(160deg,rgba(16,185,129,0.16),rgba(3,20,13,0.3))]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500">0{i + 1}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${live ? 'bg-brand-emerald text-[#03140d]' : 'bg-white/[0.06] text-gray-400 border border-white/10'}`}>{c.status}</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[11px] uppercase tracking-widest text-brand-mint/80">{c.kind}</p>
                    <h3 className="text-xl font-bold text-white mt-1">{c.title}</h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{c.line}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-500">Cursos incluídos no plano Elite. As novas aulas entram na plataforma sem custo extra.</p>
        </section>

        {/* 7. Para quem */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              icon: Rocket, tag: 'Está começando', title: 'Comece já com cara de profissional.',
              items: ['Roteiro pronto quando não sabe o que postar', 'Prompt técnico sem precisar saber o jargão', 'Preço justo desde o primeiro cliente', 'Cursos do básico ao 3D e IA'],
            },
            {
              icon: TrendingUp, tag: 'Já trabalha com isso', title: 'Entregue mais rápido e cobre melhor.',
              items: ['Imagem e vídeo com IA sem outra assinatura', 'Proposta em PDF em minutos, não em horas', 'Diagnóstico do perfil do cliente antes da reunião', 'Clientes e entregas organizados'],
            },
          ].map(card => (
            <div key={card.tag} className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 space-y-5">
              <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-brand-emerald/10 blur-3xl pointer-events-none" />
              <span className="relative inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-mint"><card.icon className="w-4 h-4" /> {card.tag}</span>
              <h3 className="relative text-2xl font-extrabold text-white tracking-tight">{card.title}</h3>
              <ul className="relative space-y-3">
                {card.items.map(i => <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300"><Check className="w-4 h-4 text-brand-emerald mt-0.5 shrink-0" /> {i}</li>)}
              </ul>
            </div>
          ))}
        </section>

        {/* 8. Prova */}
        <section className="space-y-14 overflow-hidden">
          <SectionTitle
            eyebrow={<><Star className="w-3.5 h-3.5" /> Comunidade</>}
            title="Quem já usa,"
            accent="conta."
            sub="Prints reais de alunos e criadores que aplicaram o método."
          />
          <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r before:from-[#050505] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-[#050505] after:to-transparent">
            <style>{`
              @keyframes slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .animate-slide { animation: slide 50s linear infinite; }
              .animate-slide:hover { animation-play-state: paused; }
              @media (prefers-reduced-motion: reduce) { .animate-slide { animation: none; } }
            `}</style>
            <div className="flex animate-slide gap-5 w-max px-4">
              {[...feedbacks, ...feedbacks].map((src, index) => (
                <div key={index} className="w-[200px] h-[320px] sm:w-[240px] sm:h-[380px] flex-shrink-0 relative group rounded-3xl overflow-hidden border border-white/[0.07] bg-white/[0.03] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Feedback ${(index % feedbacks.length) + 1}`} className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-center text-2xl md:text-3xl font-extrabold text-white tracking-tight">Feito por alunos, <span className="text-brand-mint">em 3D pelo celular.</span></h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {videos3D.map((src, idx) => (
                <div key={idx} className="relative group w-full">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-brand-emerald/40 via-brand-mint/10 to-brand-jade/40 rounded-[1.75rem] blur-lg opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-brand-emerald/20 bg-[#050505] shadow-2xl">
                    <iframe src={`${src}&autoplay=false`} className="w-full h-full absolute top-0 left-0" style={{ border: 'none' }}
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Planos */}
        <section id="planos" className="space-y-12 scroll-mt-28">
          <SectionTitle
            eyebrow={<><Zap className="w-3.5 h-3.5" /> Planos</>}
            title="Escolha o ritmo"
            accent="da sua operação."
            sub="Acesso imediato. Créditos todo mês para usar nas ferramentas e nas gerações de imagem e vídeo."
          />
          <PricingSection />
        </section>

        {/* 10. Perguntas */}
        <section className="max-w-3xl mx-auto space-y-10">
          <SectionTitle eyebrow={<><HelpCircle className="w-3.5 h-3.5" /> Perguntas frequentes</>} title="Antes de você" accent="decidir." />
          <div className="space-y-3">
            {FAQ.map(f => (
              <details key={f.q} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] open:border-brand-emerald/30 open:bg-brand-emerald/[0.05] transition-colors">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 text-white font-semibold">
                  {f.q}
                  <span className="w-8 h-8 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-brand-mint transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-sm text-gray-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 11. Quem fez */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="col-span-12 md:col-span-5 relative group">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-brand-emerald/25 via-brand-mint/5 to-brand-jade/25 blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            <div className="relative rounded-[28px] overflow-hidden border border-brand-emerald/25 bg-[#050505]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/mockup-app.png" alt="Luisera, criador da Creator Lab" className="w-full object-cover object-top h-[320px] md:h-[520px] group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 space-y-5">
            <Eyebrow>Quem construiu isso</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Criada por <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald">Luisera</span>, para quem cria no ritmo do celular.
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>São anos criando vídeos 100% pelo celular para marcas, artistas e autoridades, e ensinando outros criadores a fazer o mesmo. O gargalo nunca foi a câmera: era o tempo perdido entre uma ferramenta e outra, e a falta de método para cobrar.</p>
              <p>A Creator Lab junta o que eu uso no dia a dia num lugar só. Cada ferramenta nasceu de uma demanda real de gravação, de cliente ou de entrega com prazo curto.</p>
            </div>
            <div className="p-5 rounded-2xl bg-brand-emerald/[0.07] border border-brand-emerald/20 text-brand-mint font-semibold leading-relaxed">
              “Quem entrega rápido e com qualidade é quem fica com o cliente. A ferramenta certa é o que dá esse tempo.”
            </div>
          </div>
        </section>

        {/* 12. Chamada final */}
        <section className="relative overflow-hidden rounded-[36px] border border-brand-emerald/30 p-8 md:p-14 text-center bg-[linear-gradient(140deg,#10b981_0%,#059669_34%,#065f46_72%,#043b2c_100%)] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.7)]">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-mint/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-black/30 blur-3xl pointer-events-none" />
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05] text-balance">Sua próxima entrega pode sair hoje.</h2>
            <p className="text-brand-mint/90 text-lg">Roteiro, cena com IA, orçamento e proposta, tudo no celular.</p>
            <a href="#planos" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#043b2c] font-bold text-lg hover:bg-brand-mint transition-colors shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)]">
              Escolher meu plano <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 Creator Lab. Criação mobile e IA num app só.</p>
          <nav className="flex flex-wrap gap-5">
            <a href="/termos-de-uso" className="hover:text-brand-mint">Termos de uso</a>
            <a href="/termos-de-uso/geracao-ia" className="hover:text-brand-mint">Termos da geração com IA</a>
            <a href="/politica-de-privacidade" className="hover:text-brand-mint">Privacidade</a>
            <Link href="/login" className="hover:text-brand-mint">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
