import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, Img, staticFile } from "remotion";

export const DashboardScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation for the dashboard window
  const entrance = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  // Cursor animation
  const cursorX = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 60 } });
  const cursorY = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 60 } });
  
  // Starting cursor bottom right, moving to "Diagnóstico de Perfil" card (which is in the middle of top row)
  const mouseX = interpolate(cursorX, [0, 1], [1500, 1000]);
  const mouseY = interpolate(cursorY, [0, 1], [900, 500]);

  const isClicking = frame > 60 && frame < 70;

  // Exit animation starting at frame 78 (which aligns with absolute frame 608)
  const exit = spring({ frame: frame - 78, fps, config: { damping: 14, stiffness: 80 } });
  const opacityOut = interpolate(exit, [0, 1], [1, 0]);
  const blur = interpolate(exit, [0, 1], [0, 20]);
  const scale = interpolate(exit, [0, 1], [1, 1.1]);
  
  return (
    <div 
      className="w-full h-full bg-transparent flex relative overflow-hidden text-white"
      style={{ 
        opacity: Math.min(opacity, opacityOut),
        filter: `blur(${blur}px)`,
        transform: `scale(${scale})`
      }}
    >
      {/* Left Sidebar */}
      <div className="w-[280px] h-full flex flex-col px-6 py-8 border-r border-white/5 bg-[#0a0f0d]/60 backdrop-blur-sm">
        <Img src={staticFile("creator lab branco.png")} className="h-8 w-auto object-contain mb-12 self-start" />
        
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/10 text-brand-emerald font-bold text-sm">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             Painel
           </div>
           
           {[
             { name: "Estudo", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
             { name: "Diagnóstico de Perfil", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
             { name: "Calculadora de Orçamento", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
             { name: "Gerador de Ideias", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
             { name: "Gerador de Propostas", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
             { name: "Cartão do Creator", icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" },
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-3 px-4 py-3 text-gray-400 font-medium text-sm hover:text-white transition-colors">
               <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
               {item.name}
             </div>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-16 overflow-y-auto">
        <div className="flex justify-end mb-10 w-full">
          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative shadow-lg">
             <Img src={staticFile("imagem siteapp.png")} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="text-center mb-16">
          <p className="text-gray-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Segunda-Feira - 25 de Maio</p>
          <h1 className="text-6xl text-white font-light">Boa tarde,<br /><span className="font-extrabold tracking-tight">Luis.</span></h1>
        </div>

        {/* Grid Tools */}
        <div className="max-w-5xl mx-auto w-full grid grid-cols-3 gap-6">
          
          {/* Gerador de Ideias */}
          <div className="neo-glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-start gap-4 transition-all">
            <div className="text-brand-emerald">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Gerador de Ideias</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Insira seu nicho para receber conceitos estruturados de conteúdo, cena por cena.</p>
            </div>
          </div>

          {/* Diagnóstico de Perfil */}
          <div className={`neo-glass-panel rounded-3xl p-8 border ${isClicking ? 'border-brand-emerald bg-brand-emerald/10 scale-95' : 'border-white/5'} flex flex-col items-start gap-4 transition-all`}>
            <div className="text-[#3b82f6]">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Diagnóstico de Perfil</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Analise seu posicionamento atual e descubra falhas e oportunidades de melhoria.</p>
            </div>
          </div>

          {/* Calculadora de Orçamento */}
          <div className="neo-glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-start gap-4 transition-all">
            <div className="text-gray-400">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(156,163,175,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Calculadora de Orçamento</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Precifique com segurança usando dados de complexidade, equipamento e direitos.</p>
            </div>
          </div>

          {/* Gerador de Propostas */}
          <div className="neo-glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-start gap-4 transition-all">
            <div className="text-brand-emerald">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Gerador de Propostas</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Crie narrativas estratégicas e argumentações comerciais para seus projetos.</p>
            </div>
          </div>

          {/* Assistente IA */}
          <div className="neo-glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-start gap-4 transition-all">
            <div className="text-brand-emerald">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Assistente IA</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Tire dúvidas rápidas de roteiro, captação, edição ou posicionamento.</p>
            </div>
          </div>

          {/* Cartão do Creator */}
          <div className="neo-glass-panel rounded-3xl p-8 border border-white/5 flex flex-col items-start gap-4 transition-all">
            <div className="text-[#3b82f6]">
              <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Cartão do Creator</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">Gere um PDF profissional interativo com seus serviços, contatos e portfólio.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Mouse Cursor */}
      <div 
        className="absolute z-50 pointer-events-none"
        style={{ 
          transform: `translate(${mouseX}px, ${mouseY}px) ${isClicking ? 'scale(0.8)' : 'scale(1)'}`,
          transformOrigin: 'top left'
        }}
      >
        <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4-4.4 4.5z" stroke="black" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>

    </div>
  );
};
