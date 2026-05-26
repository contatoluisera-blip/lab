import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";

export const DiagnosisScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation to simulate typing "@luiserayt" with curved easing
  const text = "@luiserayt";
  const typingSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 60, overshootClamping: true } });
  const typedLength = Math.round(interpolate(typingSpring, [0, 1], [0, text.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  const inputValue = text.substring(0, typedLength);

  // Pan to show button (move sidebar up) with spring
  const panSpring = spring({ frame: frame - 85, fps, config: { damping: 15, stiffness: 80 } });
  const panY = interpolate(panSpring, [0, 1], [100, -30]);
  
  // Click button
  const isClicking = frame > 100 && frame < 110;
  
  // Move sidebar to final position with spring
  const shiftSpring = spring({ frame: frame - 115, fps, config: { damping: 14, stiffness: 70 } });
  const shiftX = interpolate(shiftSpring, [0, 1], [420, 0]);
  const shiftY = interpolate(shiftSpring, [0, 1], [-30, 0]);
  const sidebarScale = interpolate(shiftSpring, [0, 1], [1.3, 1]);

  // Right panel reveal
  const rightPanelOpacity = interpolate(frame, [135, 145], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  // Auditing states
  const cardsOpacity = interpolate(frame, [150, 170], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div className="w-[1300px] h-[1050px] flex gap-6 bg-transparent text-white font-sans p-6 relative">
      
      {/* Sidebar: Nova Varredura */}
      <div 
        style={{ 
          transform: `translateX(${shiftX}px) translateY(${frame < 115 ? panY : shiftY}px) scale(${sidebarScale})`,
          zIndex: 50
        }}
        className="w-[300px] h-fit neo-glass-panel rounded-2xl p-6 flex flex-col border border-brand-emerald/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] absolute left-6"
      >
        <div className="flex items-center gap-2 text-brand-neon font-bold text-xl mb-8">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Nova Varredura
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm text-gray-400">Seu @ no Instagram</label>
          <div className="glass-input flex items-center border border-white/10">
            <span className="text-gray-500 mr-2">@</span>
            <span>{inputValue}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <label className="text-sm text-gray-400">Tipo de Perfil</label>
          <div className="glass-input border border-white/10 flex justify-between items-center text-sm">
            <span>Criador / Influenciador</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button 
          className={`glass-button-primary mt-auto text-sm py-3 transition-all ${isClicking || frame > 110 ? 'scale-95 brightness-75 bg-brand-jade text-white' : ''}`}
        >
          {frame > 110 ? 'AUDITANDO...' : 'AUDITAR PERFIL'}
        </button>
      </div>

      {/* Main Panel: Results */}
      <div 
        style={{ opacity: rightPanelOpacity }}
        className="flex-1 flex flex-col gap-4 ml-[320px]"
      >
        
        {/* Metric Cards Top */}
        <div className="grid grid-cols-4 gap-4" style={{ opacity: cardsOpacity }}>
          {[
            { title: "SEGUIDORES", value: "31.905" },
            { title: "POSTS ANALISADOS", value: "4", sub: "Últimos 12 meses" },
            { title: "ENG. ROBUSTO", value: "0.83%", color: "text-brand-neon" },
            { title: "POSTS / SEMANA", value: "0.1" },
          ].map((card, i) => (
            <div key={i} className="neo-glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-500 font-bold mb-3">{card.title}</span>
              <span className={`text-3xl font-bold ${card.color || 'text-white'}`}>{card.value}</span>
              {card.sub && <span className="text-[10px] text-gray-600 mt-2">{card.sub}</span>}
            </div>
          ))}
        </div>

        {/* Middle Row (Nicho, Tom, Formato) */}
        <div className="grid grid-cols-3 gap-4" style={{ opacity: cardsOpacity }}>
          {[
            { title: "NICHO / SEGMENTO", value: "Educador em Tecnologia Mobile e Inteligência Artificial", iconColor: "text-brand-emerald bg-brand-emerald/10" },
            { title: "TOM DE VOZ", value: "Descontraído", iconColor: "text-blue-400 bg-blue-400/10" },
            { title: "FORMATO PREDOMINANTE", value: "Postagens", iconColor: "text-purple-400 bg-purple-400/10" },
          ].map((card, i) => (
            <div key={i} className="neo-glass-panel rounded-xl p-6 flex flex-col justify-center">
               <div className={`w-10 h-10 rounded-full mb-4 flex items-center justify-center ${card.iconColor}`}>
                  <div className="w-4 h-4 rounded-full bg-current opacity-50" />
               </div>
               <span className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-wider">{card.title}</span>
               <span className="text-sm font-bold text-white leading-snug">{card.value}</span>
            </div>
          ))}
        </div>

        {/* Bottom Section (Notas por Área) */}
        <div className="neo-glass-panel rounded-2xl p-6 flex flex-col gap-6" style={{ opacity: cardsOpacity }}>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="font-bold text-lg">Notas por Área</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             {[
               { title: "Completude", score: 70, desc: "Setup do Perfil. Avalia a presença de recursos vitais como foto, bio otimizada, links e categoria.", color: "text-brand-emerald", bg: "bg-brand-emerald", border: "border-brand-emerald/20", light: "bg-brand-emerald/5" },
               { title: "Posicionamento", score: 50, desc: "Clareza e CTAs. Mede o grau de especialização, uso inteligente do nome e chamadas para ação.", color: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-500/20", light: "bg-yellow-500/5" },
               { title: "Constância", score: 2, desc: "Frequência e Ritmo. Analisa a regularidade e o intervalo das postagens ao longo dos últimos 12 meses.", color: "text-red-500", bg: "bg-red-500", border: "border-red-500/20", light: "bg-red-500/5" },
               { title: "Engajamento", score: 19, desc: "Resposta vs Meta. Compara as interações reais com o esperado pelo seu tamanho.", color: "text-red-500", bg: "bg-red-500", border: "border-red-500/20", light: "bg-red-500/5" },
               { title: "Conteúdo", score: 100, desc: "Mix de Formatos. Verifica a variação e priorização de formatos dinâmicos de alto alcance como Reels.", color: "text-brand-emerald", bg: "bg-brand-emerald", border: "border-brand-emerald/20", light: "bg-brand-emerald/5" },
               { title: "Comentários", score: 50, desc: "Tom e Conversação. Mede a qualidade das conversas geradas, além de apenas 'palminhas'.", color: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-500/20", light: "bg-yellow-500/5" }
             ].map((n, i) => (
                <div key={i} className={`rounded-xl p-5 border ${n.border} ${n.light}`}>
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-white">{n.title}</span>
                     <span className={`font-black text-2xl ${n.color}`}>{n.score}</span>
                   </div>
                   <div className="w-full h-1 bg-black/40 rounded-full mb-3 overflow-hidden">
                     <div className={`h-full ${n.bg}`} style={{ width: `${n.score}%` }} />
                   </div>
                   <p className="text-[10px] text-gray-400 leading-relaxed">{n.desc}</p>
                </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};

