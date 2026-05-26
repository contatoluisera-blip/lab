import React from "react";
import { interpolate, useCurrentFrame, Img, staticFile, useVideoConfig, spring } from "remotion";

export const MobileMockup: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered entrances
  const startFrame = 125;
  const logoSpring = spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 80 } });
  const textSpring = spring({ frame: frame - (startFrame + 5), fps, config: { damping: 14, stiffness: 80 } });
  const formSpring = spring({ frame: frame - (startFrame + 10), fps, config: { damping: 14, stiffness: 80 } });

  const logoY = interpolate(logoSpring, [0, 1], [50, 0]);
  const textY = interpolate(textSpring, [0, 1], [50, 0]);
  const formY = interpolate(formSpring, [0, 1], [100, 0]);

  // Animate email typing
  const emailText = "usuario@gen.com";
  const emailTypedLength = Math.floor(
    interpolate(frame, [150, 180], [0, emailText.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
  );
  const emailVal = emailText.substring(0, emailTypedLength);

  // Animate password typing
  const passText = "••••••••";
  const passTypedLength = Math.floor(
    interpolate(frame, [190, 210], [0, passText.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })
  );
  const passVal = passText.substring(0, passTypedLength);
  
  // Animate button click
  const isClicking = frame > 230 && frame < 240;

  return (
    <div className="relative">
      {/* Physical Buttons */}
      {/* Silent switch */}
      <div className="absolute left-[-4px] top-[130px] w-[4px] h-[30px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Volume Up */}
      <div className="absolute left-[-4px] top-[190px] w-[4px] h-[60px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Volume Down */}
      <div className="absolute left-[-4px] top-[270px] w-[4px] h-[60px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Power Button */}
      <div className="absolute right-[-4px] top-[220px] w-[4px] h-[90px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-r-[3px] shadow-[2px_0_4px_rgba(0,0,0,0.5)] border-r border-y border-white/30 z-0" />

      {/* Main Metallic Frame */}
      <div className="w-[380px] h-[780px] rounded-[55px] p-[2px] bg-gradient-to-br from-[#a0a0a0] via-[#3d3d3d] to-[#808080] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(255,255,255,0.4)] relative z-10">
        
        {/* Inner Black Bezel */}
        <div className="w-full h-full rounded-[53px] p-[10px] bg-black shadow-[inset_0_0_10px_rgba(0,0,0,1)]">
          
          {/* Screen Area */}
          <div className="w-full h-full rounded-[43px] bg-[#050505] relative overflow-hidden flex flex-col items-center p-6 justify-center">
            
            {/* Glass Screen Reflection */}
            <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-white/10 via-white/5 to-transparent pointer-events-none transform -rotate-[20deg] translate-x-[30%] -translate-y-[40%] z-50 mix-blend-overlay" />

            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-40 shadow-[inset_0_0_8px_rgba(255,255,255,0.1),0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-between px-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#111] shadow-[inset_0_0_6px_rgba(255,255,255,0.15)] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald shadow-[0_0_6px_rgba(16,185,129,0.8)] mr-1 opacity-80 animate-pulse" />
            </div>

            {/* Glows */}
            <div className="absolute top-20 w-64 h-64 bg-brand-emerald/20 rounded-full blur-[60px] opacity-70" />

        <div className="flex justify-center w-full mb-12 relative z-10" style={{ transform: `translateY(${logoY}px)`, opacity: logoSpring }}>
          <Img 
            src={staticFile("creator lab verde.png")} 
            className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          />
        </div>

        <div className="w-full relative p-[1px] rounded-[24px] overflow-hidden shadow-2xl" style={{ transform: `translateY(${formY}px)`, opacity: formSpring }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-emerald/40 via-blue-500/10 to-brand-mint/30 opacity-40" />
          
          <div className="relative rounded-[23px] bg-[#0c0c0d]/95 backdrop-blur-3xl p-6 border border-white/5">
            <div className="text-center mb-6" style={{ transform: `translateY(${textY}px)`, opacity: textSpring }}>
              <h2 className="text-xl font-bold text-white">Acesse o Hub</h2>
              <p className="text-gray-400 text-[10px] mt-1">Insira suas credenciais para entrar.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">E-mail</label>
                <div className="w-full h-10 glass-input text-white text-xs flex items-center border border-white/10 relative">
                   {emailVal}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">Senha</label>
                <div className="w-full h-10 glass-input text-white text-xs flex items-center border border-white/10 relative">
                   <span className="tracking-[0.2em]">{passVal}</span>
                </div>
              </div>
            </div>

            <button className={`w-full mt-6 h-12 text-xs uppercase tracking-wider glass-button-primary transition-all duration-100 ${isClicking ? 'scale-95 brightness-75' : ''}`}>
              ENTRAR
            </button>
          </div>
        </div>

        <p className="text-center text-[9px] text-gray-500 mt-8 relative z-10" style={{ opacity: textSpring }}>
           Acesso restrito a usuários autorizados.
        </p>

          </div>
        </div>
      </div>
    </div>
  );
};
