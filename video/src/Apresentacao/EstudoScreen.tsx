import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, Img, staticFile } from "remotion";

export const EstudoScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const entrance = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  // Scrolling Down
  const scrollY = spring({ frame: frame - 60, fps, config: { damping: 30, stiffness: 40 } });
  const yOffset = interpolate(scrollY, [0, 1], [0, -450]);

  // Focus on Progress Card (Starts at absolute 57:00 which is relative frame 150)
  const focusSpring = spring({ frame: frame - 150, fps, config: { damping: 15, stiffness: 60 } });
  
  // The progress card is originally at the top right (around x=1400, y=150).
  // Due to yOffset, its current y is 150 - 450 = -300.
  // We want to bring it to center (x=960, y=540) and scale it up.
  const progressScale = interpolate(focusSpring, [0, 1], [1, 2.5]);
  const progressX = interpolate(focusSpring, [0, 1], [0, -500]); 
  const progressY = interpolate(focusSpring, [0, 1], [0, 750]); 

  // Progress Bar Animation (0 to 100)
  const progressAnim = spring({ frame: frame - 180, fps, config: { damping: 15, stiffness: 20 } });
  const progressPercentage = Math.floor(interpolate(progressAnim, [0, 1], [0, 100]));
  const completedClasses = Math.floor(interpolate(progressAnim, [0, 1], [0, 62]));

  // Fade out everything else
  const otherOpacity = interpolate(focusSpring, [0, 1], [1, 0]);
  
  // Exit Animation
  const exitSpring = spring({ frame: frame - 350, fps, config: { damping: 14, stiffness: 60 } });
  const exitOpacity = Math.min(opacity, interpolate(exitSpring, [0, 1], [1, 0]));
  const exitScale = interpolate(exitSpring, [0, 1], [1, 1.2]);
  const exitBlur = interpolate(exitSpring, [0, 1], [0, 30]);

  return (
    <div 
      className="w-full h-full bg-transparent flex relative overflow-hidden text-white"
      style={{ 
        opacity: exitOpacity,
        filter: `blur(${exitBlur}px)`,
        transform: `scale(${exitScale})`
      }}
    >
      {/* Left Sidebar */}
      <div 
        className="w-[280px] h-full flex flex-col px-6 py-8 border-r border-white/5 bg-[#0a0f0d]/80 backdrop-blur-md z-10"
        style={{ opacity: otherOpacity }}
      >
        <Img src={staticFile("creator lab branco.png")} className="h-8 w-auto object-contain mb-12 self-start" />
        
        <div className="flex flex-col gap-2">
           {[
             { name: "Painel", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
             { name: "Estudo", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
             { name: "Diagnóstico de Perfil", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
           ].map((item, i) => (
             <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${item.name === 'Estudo' ? 'bg-brand-emerald/10 text-brand-emerald font-bold' : 'text-gray-400'}`}>
               <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
               {item.name}
             </div>
           ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-12 overflow-hidden relative">
        <div 
          className="w-full flex flex-col gap-10"
          style={{ transform: `translateY(${yOffset}px)` }}
        >
          
          {/* Header Row */}
          <div className="flex items-end justify-between w-full relative z-20">
            <div style={{ opacity: otherOpacity }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-brand-emerald/10 text-xs font-semibold text-white mb-3">
                <svg className="w-3.5 h-3.5 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Hub Acadêmico de Vídeo
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Estudo & Capacitação</h1>
              <p className="text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
                Aprenda a criar, filmar e editar conteúdos cinematográficos com qualidade profissional utilizando apenas o seu celular.
              </p>
            </div>

            {/* Global Progress Card (Target for Zoom) */}
            <div 
              className="w-80 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              style={{ 
                transform: `translate(${progressX}px, ${progressY}px) scale(${progressScale})`,
                transformOrigin: 'top right',
                zIndex: 50,
                // Adjust border to make it pop more when zoomed
                borderColor: `rgba(255,255,255, ${0.1 + (progressScale - 1)*0.05})`
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-medium">Seu Progresso de Estudos</span>
                <span className="text-sm font-bold text-brand-mint">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden mb-3 border border-white/5 relative">
                <div 
                  className="bg-brand-emerald h-full shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                <span>{completedClasses} de 62 aulas finalizadas</span>
              </div>
            </div>
          </div>

          <div style={{ opacity: otherOpacity }} className="flex flex-col gap-10">
            {/* Course Selector Tabs */}
            <div className="flex gap-4">
               <div className="group relative flex flex-col items-start gap-1 px-5 py-4 rounded-2xl border transition-all duration-300 text-left min-w-[200px] bg-brand-emerald/10 border-brand-emerald/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                 <div className="flex items-center justify-between w-full gap-2">
                   <span className="text-sm font-extrabold tracking-tight text-white">Creator Lab Mobile</span>
                   <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-emerald text-black">Avançado</span>
                 </div>
                 <span className="text-[11px] text-gray-400">Edição Cinematográfica</span>
                 <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-emerald rounded-full" />
               </div>
            </div>

            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-black via-[#0c0c0c] to-[#050505] shadow-2xl h-[340px] flex items-center">
              <div className="p-12 w-2/3 space-y-4 relative z-10">
                <span className="text-xs font-bold tracking-widest text-brand-emerald uppercase bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded">
                  Destaque do Curso
                </span>
                <h2 className="text-4xl font-extrabold text-white leading-tight">
                  Aprenda a Editar como um Profissional pelo Celular
                </h2>
                <p className="text-sm text-gray-300 font-light leading-relaxed max-w-lg">
                  O ecossistema completo para você dominar técnicas de enquadramento, iluminação, pré-produção e efeitos avançados com o Node Video e CapCut.
                </p>
                <div className="pt-4 flex gap-4">
                  <div className="px-6 py-3 bg-brand-emerald text-black font-bold text-sm rounded flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Assistir Introdução
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-brand-emerald/5 flex items-center justify-center">
                 <div className="absolute w-44 h-44 rounded-full bg-brand-emerald/20 blur-[80px]" />
                 <Img src={staticFile("imagem siteapp.png")} className="h-[250px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]" />
              </div>
            </div>

            {/* Modules Carousel - Módulo 1 */}
            <div className="space-y-4 mt-4">
               <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                 <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-extrabold text-white tracking-tight">Módulo 1: O Início</h3>
                   <span className="text-brand-mint/90 font-medium text-sm">• Fundamentos</span>
                 </div>
                 <span className="text-xs text-gray-400">12 aulas</span>
               </div>

               <div className="relative overflow-hidden w-full h-[280px]">
                 <div 
                   className="absolute left-0 top-0 flex gap-6"
                 >
                    {[1, 2, 3, 4, 5, 6].map((card, i) => (
                       <div key={card} className="w-[180px] h-[270px] rounded-xl border border-white/10 bg-[#0f0f0f]/60 relative overflow-hidden flex-shrink-0 group">
                          <Img src={staticFile(i % 2 === 0 ? "capa preta.png" : "capa verde.png")} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                          
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] text-gray-300 font-mono tracking-wider z-20">
                             10:45
                          </div>

                          <div className="absolute bottom-0 p-4 z-20 flex flex-col justify-end w-full">
                             <h4 className="text-sm font-bold text-white leading-snug drop-shadow-md">Aula {card}: Princípios da Edição Cinematográfica</h4>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* Modules Carousel - Módulo 2 */}
            <div className="space-y-4 mt-8 pb-32">
               <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                 <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-extrabold text-white tracking-tight">Módulo 2: Captação</h3>
                   <span className="text-brand-mint/90 font-medium text-sm">• Prática</span>
                 </div>
                 <span className="text-xs text-gray-400">5 aulas</span>
               </div>

               <div className="relative overflow-hidden w-full h-[280px]">
                 <div 
                   className="absolute left-0 top-0 flex gap-6"
                 >
                    {[1, 2, 3, 4, 5].map((card, i) => (
                       <div key={card} className="w-[180px] h-[270px] rounded-xl border border-white/10 bg-[#0f0f0f]/60 relative overflow-hidden flex-shrink-0 group">
                          <Img src={staticFile(i % 2 !== 0 ? "capa preta.png" : "capa verde.png")} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                          
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] text-gray-300 font-mono tracking-wider z-20">
                             14:10
                          </div>

                          <div className="absolute bottom-0 p-4 z-20 flex flex-col justify-end w-full">
                             <h4 className="text-sm font-bold text-white leading-snug drop-shadow-md">Aula {card}: Captação na Prática</h4>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            </div>

          </div>
          
        </div>
      </div>

    </div>
  );
};
