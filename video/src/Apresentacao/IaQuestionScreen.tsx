import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const IaQuestionScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const entrance = spring({ frame: frame, fps, config: { damping: 14, stiffness: 60 } });
  const entranceOpacity = interpolate(entrance, [0, 1], [0, 1]);
  const entranceY = interpolate(entrance, [0, 1], [50, 0]);

  // Typing animation
  const typeSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 30, overshootClamping: true } });
  const typeProgress = interpolate(typeSpring, [0, 1], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const questionText = "Como configurar o app BlackMagic Camera no iPhone para gravar um b-roll de produto com visual cinematográfico?";
  const typedQuestion = questionText.substring(0, Math.round(typeProgress * questionText.length));

  // Initial zoomed-in state focusing on text box
  const baseScale = 1.6;
  const baseX = 0;
  const baseY = 50;

  // Pan to button (button is on the left and below text box)
  // To look at button (left, down), container moves RIGHT (positive X) and UP (negative Y)
  const panSpring = spring({ frame: frame - 100, fps, config: { damping: 15, stiffness: 60 } });
  const panScale = interpolate(panSpring, [0, 1], [baseScale, 2.5]);
  const panX = interpolate(panSpring, [0, 1], [baseX, 380]);
  const panY = interpolate(panSpring, [0, 1], [baseY, -20]);

  // Click effect
  const isClicking = frame > 130 && frame < 140;

  // Zoom out to reveal answer
  const revealSpring = spring({ frame: frame - 140, fps, config: { damping: 14, stiffness: 50 } });
  const finalScale = interpolate(revealSpring, [0, 1], [panScale, 0.85]);
  const finalX = interpolate(revealSpring, [0, 1], [panX, 0]);
  const finalY = interpolate(revealSpring, [0, 1], [panY, -150]);

  // Answer fade in
  const answerOpacity = interpolate(frame, [150, 165], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const answerY = interpolate(frame, [150, 165], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const currentScale = frame < 140 ? panScale : finalScale;
  const currentX = frame < 140 ? panX : finalX;
  const currentY = frame < 140 ? panY : finalY;

  // Exit transition starting at frame 270
  const exitSpring = spring({ frame: frame - 270, fps, config: { damping: 14, stiffness: 60 } });
  const exitScale = interpolate(exitSpring, [0, 1], [1, 1.2]);
  const exitOpacity = interpolate(exitSpring, [0, 1], [1, 0]);
  const exitBlur = interpolate(exitSpring, [0, 1], [0, 30]);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center bg-transparent text-white pt-20"
      style={{ 
        opacity: Math.min(entranceOpacity, exitOpacity),
        filter: `blur(${exitBlur}px)`,
        transform: `scale(${exitScale})`
      }}
    >
      <div 
        className="w-[900px] flex flex-col gap-8 relative"
        style={{ 
          transform: `scale(${currentScale}) translate(${currentX}px, ${currentY}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Header */}
        <div style={{ transform: `translateY(${entranceY}px)` }}>
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1 rounded-full text-[10px] text-gray-300 mb-4">
             <svg className="w-3 h-3 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Assistência e Consulta Tática
          </div>
          <h2 className="text-4xl font-extrabold mb-2">Perguntas Rápidas</h2>
          <p className="text-sm text-gray-400">Um hub ágil para tirar dúvidas pontuais sobre câmeras, estratégias on-the-fly e negócios B2B sem rodeios.</p>
        </div>

        {/* Question Box */}
        <div className="neo-glass-panel rounded-2xl p-6 border border-white/5 bg-[#080d0b] shadow-[0_0_30px_rgba(16,185,129,0.05)]" style={{ transform: `translateY(${entranceY}px)` }}>
           <div className="flex items-center gap-2 mb-4 font-bold text-sm">
             <svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
             O que você precisa resolver agora?
           </div>
           
           <div className="bg-[#050806] border border-white/5 rounded-xl p-4 min-h-[120px] mb-6">
              {typeProgress === 0 ? (
                 <span className="text-gray-600 text-sm">Ex: Como configurar o shutter angle no app BlackMagic Cam para gravar em 24fps e evitar cintilação de lâmpadas LED?</span>
              ) : (
                 <span className="text-white text-sm leading-relaxed">{typedQuestion}</span>
              )}
           </div>

           <div className="flex flex-col items-start gap-2">
              <button className={`bg-brand-emerald text-black font-extrabold text-sm py-3 px-6 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all ${isClicking ? 'scale-95 brightness-90' : ''}`}>
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 PERGUNTAR AO CÉREBRO IA
              </button>
              <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 ml-4 mt-2">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                 1º Uso Gratuito (Teste)
              </div>
           </div>
        </div>

        {/* Answer Section */}
        <div style={{ opacity: answerOpacity, transform: `translateY(${answerY}px)` }}>
           <div className="flex items-center gap-2 mb-4 font-bold text-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Mural de Respostas
           </div>

           <div className="neo-glass-panel rounded-2xl p-6 border border-white/5 bg-[#080d0b] shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              {/* Sent question */}
              <div className="bg-[#1a1c1a] rounded-xl p-4 text-sm mb-6 max-w-[80%] ml-auto border border-white/5">
                 {questionText}
              </div>

              {/* Received answer */}
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-brand-emerald/10 flex items-center justify-center flex-shrink-0 border border-brand-emerald/20">
                    <svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                 </div>
                 <div className="text-sm text-gray-300 leading-relaxed">
                    Para b-rolls de produtos de alto impacto, configure o codec para Apple ProRes 422 HQ (ou HEVC a 100Mbps se precisar economizar armazenamento) em resolução 4K a 24fps. Defina o Shutter Angle fixo em 180° (equivalente a Shutter Speed de 1/48s) para manter o desfoque de movimento natural do cinema. Selecione o perfil de cor Apple Log ou BlackMagic Design Film para obter o máximo alcance dinâmico (Dynamic Range) e grave o balanço de brancos manualmente usando um cartão de cinza 18% (ex: 5600K para externas sob luz solar). Dica extra: Utilize a lente teleobjetiva (3x ou equivalente a 77mm) para comprimir os planos de fundo e evitar as distorções esféricas nas bordas do produto.
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
