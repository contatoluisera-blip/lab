import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const PricingScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations for header
  const headerSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 60 } });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [30, 0]);

  // 3D Circular Entry for Cards
  // START card (Left)
  const startSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 50 } });
  const startX = interpolate(startSpring, [0, 1], [-800, 0]);
  const startY = interpolate(startSpring, [0, 1], [300, 0]);
  const startRotateY = interpolate(startSpring, [0, 1], [-90, 0]);
  const startRotateZ = interpolate(startSpring, [0, 1], [-15, 0]);
  const startScale = interpolate(startSpring, [0, 1], [0.5, 1]);
  const startOpacity = interpolate(startSpring, [0, 1], [0, 1]);

  // ELITE card (Right)
  const eliteSpring = spring({ frame: frame - 45, fps, config: { damping: 14, stiffness: 50 } });
  const eliteX = interpolate(eliteSpring, [0, 1], [800, 0]);
  const eliteY = interpolate(eliteSpring, [0, 1], [300, 0]);
  const eliteRotateY = interpolate(eliteSpring, [0, 1], [90, 0]);
  const eliteRotateZ = interpolate(eliteSpring, [0, 1], [15, 0]);
  const eliteScale = interpolate(eliteSpring, [0, 1], [0.5, 1]);
  const eliteOpacity = interpolate(eliteSpring, [0, 1], [0, 1]);

  // PRO card (Center, comes from bottom/front)
  const proSpring = spring({ frame: frame - 60, fps, config: { damping: 14, stiffness: 60 } });
  const proZ = interpolate(proSpring, [0, 1], [800, 0]);
  const proY = interpolate(proSpring, [0, 1], [400, 0]);
  const proRotateX = interpolate(proSpring, [0, 1], [60, 0]);
  const proScale = interpolate(proSpring, [0, 1], [0.5, 1]);
  const proOpacity = interpolate(proSpring, [0, 1], [0, 1]);

  // Button Glow Animation (pulsing opacities)
  const glowPulse = Math.sin(frame / 10) * 0.5 + 0.5; // Oscillates between 0 and 1

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent text-white pt-10" style={{ perspective: '2000px' }}>
      
      {/* Header */}
      <div 
        className="flex flex-col items-center mb-16"
        style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)` }}
      >
        <div className="text-[10px] font-bold text-brand-emerald tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10">
          Assinatura Premium
        </div>
        <h1 className="text-5xl font-extrabold mb-4">Escolha seu plano</h1>
        <p className="text-gray-400 text-sm">Tenha acesso a todo o laboratório no nível ideal para sua operação.</p>
      </div>

      {/* Cards Container */}
      <div className="flex items-center justify-center gap-6 relative w-[1200px]" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* START CARD */}
        <div 
          className="w-[320px] bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          style={{ 
            opacity: startOpacity,
            transform: `translate(${startX}px, ${startY}px) rotateY(${startRotateY}deg) rotateZ(${startRotateZ}deg) scale(${startScale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <h2 className="text-2xl font-bold mb-2">Start</h2>
          <div className="text-4xl font-extrabold mb-1">R$ 67<span className="text-sm text-gray-500 font-normal">/mês</span></div>
          <p className="text-[10px] text-gray-400 mb-6 min-h-[60px]">Para quem está começando a profissionalizar sua criação e quer ter acesso às principais ferramentas para analisar, precificar e estruturar melhor seus serviços.</p>
          
          <ul className="flex flex-col gap-3 mb-8 text-[11px] text-gray-300 flex-1">
            {["Acesso ao Diagnóstico de Perfil", "Acesso à Calculadora de Orçamento", "Acesso limitado ao Gerador de Ideias", "Acesso limitado ao Gerador de Propostas", "Apoio do Assistente de IA básico", "Controle básico de Ações"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                {item}
              </li>
            ))}
          </ul>
          
          <p className="text-[9px] text-gray-500 text-center italic mb-4">Ideal para criadores que querem sair do improviso e começar a vender com mais clareza.</p>
          
          <div className="relative">
             <div className="absolute inset-0 bg-white/20 blur-md rounded-full" style={{ opacity: glowPulse * 0.3 }} />
             <button className="w-full relative bg-[#1a1a1a] text-white font-bold text-[10px] py-4 rounded-full border border-white/10 hover:bg-[#222] transition-colors uppercase tracking-wider">
               Começar com o plano Start
             </button>
          </div>
        </div>

        {/* PRO CARD */}
        <div 
          className="w-[360px] bg-[#0c120f] border border-brand-emerald/40 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.15)] relative z-10"
          style={{ 
            opacity: proOpacity,
            transform: `translateY(${proY}px) translateZ(${proZ}px) rotateX(${proRotateX}deg) scale(${proScale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-emerald text-black text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            Melhor Valor
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Elite</h2>
          <div className="text-5xl font-extrabold mb-1">R$ 197<span className="text-sm text-gray-500 font-normal">/mês</span></div>
          <p className="text-[11px] text-gray-400 mb-6 min-h-[60px]">Para quem quer acessar a Creator Lab no nível mais completo, com ferramentas, conteúdos, gestão e suporte estratégico para operar com mais profissionalismo, consistência e visão de crescimento.</p>
          
          <ul className="flex flex-col gap-3 mb-8 text-[11px] text-gray-200 flex-1">
            {["Todos os recursos do plano Pro", "Suporte estratégico prioritário", "Acesso aos Cursos, Aulas e Lives com Luisera", "Conteúdos exclusivos de posicionamento B2B", "Consultoria de marca pessoal em grupo"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                {item}
              </li>
            ))}
          </ul>
          
          <p className="text-[10px] text-gray-500 text-center italic mb-4">Ideal para criadores, social medias e profissionais que querem levar a criação mobile para outro patamar.</p>
          
          <div className="relative">
             <div className="absolute inset-0 bg-brand-emerald blur-xl rounded-full" style={{ opacity: glowPulse * 0.6 + 0.2 }} />
             <button className="w-full relative bg-brand-emerald text-black font-extrabold text-[11px] py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] uppercase tracking-wider">
               Quero o plano Elite
             </button>
          </div>
        </div>

        {/* ELITE CARD */}
        <div 
          className="w-[320px] bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          style={{ 
            opacity: eliteOpacity,
            transform: `translate(${eliteX}px, ${eliteY}px) rotateY(${eliteRotateY}deg) rotateZ(${eliteRotateZ}deg) scale(${eliteScale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <div className="text-4xl font-extrabold mb-1">R$ 117<span className="text-sm text-gray-500 font-normal">/mês</span></div>
          <p className="text-[10px] text-gray-400 mb-6 min-h-[60px]">Para quem já atende clientes ou quer acelerar sua evolução com mais recursos, mais estrutura e mais capacidade de transformar análises, ideias e orçamentos em propostas comerciais completas.</p>
          
          <ul className="flex flex-col gap-3 mb-8 text-[11px] text-gray-300 flex-1">
            {["Acesso completo a todas as ferramentas", "Análises de Perfil ilimitadas", "Gerador de Ideias & Propostas avançados", "Apoio do Assistente de IA completo", "Histórico e Controle de Ações completo", "Gestão de Clientes integrada"].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                {item}
              </li>
            ))}
          </ul>
          
          <p className="text-[9px] text-gray-500 text-center italic mb-4">Ideal para quem quer vender com mais autoridade e organizar melhor sua operação.</p>
          
          <div className="relative">
             <div className="absolute inset-0 bg-white/20 blur-md rounded-full" style={{ opacity: glowPulse * 0.3 }} />
             <button className="w-full relative bg-[#1a1a1a] text-white font-bold text-[10px] py-4 rounded-full border border-white/10 hover:bg-[#222] transition-colors uppercase tracking-wider">
               Entrar no plano Pro
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
