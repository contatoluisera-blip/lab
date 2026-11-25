import React from 'react';
import { ArrowRight, AudioLines, Check, Clapperboard, Film, ImagePlus, Lightbulb, Sparkles, X } from 'lucide-react';
import { LoopVideo } from '@/components/landing/LoopVideo';
import { SectionTitle } from '@/components/landing/sections';

// Guia rápido mostrado antes de liberar a aula: como a Creator Lab funciona, os motores de IA
// e a comparação com o jeito comum de criar com IA (sem citar outras plataformas por nome).

const ENGINES: { group: string; icon: React.ElementType; items: string[] }[] = [
  { group: 'Vídeo', icon: Film, items: ['Kling 4.0', 'Seedance 2', 'Google Veo 3.1', 'Hailuo 2.3', 'Wan 2.7', 'Grok Imagine', 'PixVerse V6', 'Runway'] },
  { group: 'Imagem', icon: ImagePlus, items: ['Nano Banana Pro', 'Nano Banana 2', 'GPT Image 2 (do ChatGPT)', 'Seedream 5', 'FLUX', 'Ideogram', 'Imagen 4'] },
  { group: 'Áudio', icon: AudioLines, items: ['Vozes ElevenLabs', 'Trilhas com Suno', 'Efeitos sonoros'] },
];

const COMMON = [
  'Uma assinatura em dólar para cada coisa, com IOF e câmbio mudando todo mês',
  'Prompt em inglês que você mesmo precisa escrever e acertar',
  'Gerador sem roteiro, sem direção de cena e sem ninguém para tirar dúvida',
  'Outro app para roteiro, outro para orçamento, outro para proposta',
];

const OURS = [
  'Um plano em reais, com os principais motores de IA no mesmo saldo',
  'Você escreve a ideia em português e recebe o prompt com direção de cinema',
  'Roteiro, imagem, vídeo, áudio e montagem no mesmo fluxo',
  'Orçamento, proposta e cursos com suporte em português',
];

export function AulaGuide() {
  return (
    <>
      {/* 1. Da ideia ao vídeo */}
      <section className="space-y-10">
        <SectionTitle
          eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Guia rápido</>}
          title="Da ideia simples"
          accent="à cena pronta."
          sub="Você não precisa saber o jargão técnico. Escreve do seu jeito, a Creator Lab faz a direção e você gera nos melhores motores de IA."
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_0.8fr] gap-4 items-stretch">
          <Step n="01" icon={Lightbulb} title="Escreva a ideia">
            <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-200 italic leading-relaxed">“Um senhor vendendo frutas na feira, de manhã cedo, sorrindo para a câmera.”</p>
            <p className="text-xs text-gray-500">Em português, do jeito que vier na cabeça.</p>
          </Step>
          <Arrow />
          <Step n="02" icon={Clapperboard} title="Receba o prompt com direção">
            <p className="rounded-2xl border border-brand-emerald/25 bg-brand-emerald/[0.06] p-4 font-mono text-[11px] text-brand-mint/90 leading-relaxed">
              Medium close-up of an elderly fruit vendor at a street market, soft golden morning light, 50mm lens, shallow depth of field, warm documentary tone…
            </p>
            <p className="text-xs text-gray-500">Câmera, lente, luz e estilo decididos pelo Gerador de Prompts.</p>
          </Step>
          <Arrow />
          <Step n="03" icon={Film} title="Gere a imagem e a cena">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/ia/frame-feirante.jpg" alt="Frame gerado com IA: feirante sorrindo na feira" loading="lazy" className="w-full aspect-video object-cover" />
            </div>
            <p className="text-xs text-gray-500">Depois é só animar o frame em vídeo.</p>
          </Step>
        </div>
      </section>

      {/* 2. Motores */}
      <section className="space-y-10">
        <SectionTitle
          eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Motores de IA</>}
          title="Os modelos que todo mundo comenta,"
          accent="num login só."
          sub="Escolha o motor certo para cada cena, com o custo aparecendo antes de gerar. Se a geração falhar, o crédito volta."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ENGINES.map(g => (
            <div key={g.group} className="rounded-[26px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 space-y-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-mint"><g.icon className="w-4 h-4" /> {g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map(m => <span key={m} className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-black/30 text-sm font-semibold text-gray-200">{m}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            { src: '/media/ia/fogo.mp4', poster: '/media/ia/fogo.jpg' },
            { src: '/media/ia/pelucia.mp4', poster: '/media/ia/pelucia.jpg' },
            { src: '/media/ia/gisele.mp4', poster: '/media/ia/gisele.jpg' },
            { src: '/media/ia/campanha.mp4', poster: '/media/ia/campanha.jpg' },
          ].map(v => (
            <div key={v.src} className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 bg-black">
              <LoopVideo src={v.src} poster={v.poster} label="Cena gerada com IA na Creator Lab" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500">Cenas geradas com IA dentro da Creator Lab.</p>
      </section>

      {/* 3. Comparação sem nomes */}
      <section className="space-y-10">
        <SectionTitle
          eyebrow={<><Sparkles className="w-3.5 h-3.5" /> Por que aqui</>}
          title="Você não precisa de mais"
          accent="uma assinatura em dólar."
          sub="Muita gente já paga por geradores de IA de fora. A diferença é o que vem junto."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-6 md:p-8 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">O jeito comum de criar com IA</p>
            <ul className="space-y-3.5">
              {COMMON.map(t => <li key={t} className="flex items-start gap-3 text-sm text-gray-400"><X className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" /> {t}</li>)}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-[28px] border border-brand-emerald/30 p-6 md:p-8 space-y-5 bg-[linear-gradient(140deg,rgba(16,185,129,0.18),rgba(6,95,70,0.12)_50%,rgba(3,20,13,0.4))]">
            <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-emerald/25 blur-3xl pointer-events-none" />
            <p className="relative text-xs font-bold uppercase tracking-widest text-brand-mint">Com a Creator Lab</p>
            <ul className="relative space-y-3.5">
              {OURS.map(t => <li key={t} className="flex items-start gap-3 text-sm text-white"><Check className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" /> {t}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon: Icon, title, children }: { n: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 space-y-4 flex flex-col">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-neon to-brand-jade text-[#03140d] flex items-center justify-center"><Icon className="w-5 h-5" strokeWidth={2.2} /></span>
        <span className="font-mono text-xs text-gray-500">{n}</span>
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-brand-mint" aria-hidden>
      <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
    </div>
  );
}
