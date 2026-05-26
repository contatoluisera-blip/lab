import React from "react";
import { Img, staticFile } from "remotion";

export const MobilePhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative">
      {/* Physical Buttons */}
      {/* Silent switch */}
      <div className="absolute left-[-4px] top-[110px] w-[4px] h-[25px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Volume Up */}
      <div className="absolute left-[-4px] top-[160px] w-[4px] h-[50px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Volume Down */}
      <div className="absolute left-[-4px] top-[230px] w-[4px] h-[50px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-l-[3px] shadow-[-2px_0_4px_rgba(0,0,0,0.5)] border-l border-y border-white/30 z-0" />
      {/* Power Button */}
      <div className="absolute right-[-4px] top-[190px] w-[4px] h-[80px] bg-gradient-to-b from-[#777] via-[#999] to-[#555] rounded-r-[3px] shadow-[2px_0_4px_rgba(0,0,0,0.5)] border-r border-y border-white/30 z-0" />

      {/* Main Metallic Frame */}
      <div className="w-[360px] h-[720px] rounded-[55px] p-[2px] bg-gradient-to-br from-[#a0a0a0] via-[#3d3d3d] to-[#808080] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(255,255,255,0.4)] relative z-10">
        
        {/* Inner Black Bezel */}
        <div className="w-full h-full rounded-[53px] p-[10px] bg-black shadow-[inset_0_0_10px_rgba(0,0,0,1)]">
          
          {/* Screen Area */}
          <div className="w-full h-full rounded-[43px] bg-[#050505] relative overflow-hidden flex flex-col">
            
            {/* Glass Screen Reflection */}
            <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-white/10 via-white/5 to-transparent pointer-events-none transform -rotate-[20deg] translate-x-[30%] -translate-y-[40%] z-50 mix-blend-overlay" />

            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-40 shadow-[inset_0_0_8px_rgba(255,255,255,0.1),0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-between px-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#111] shadow-[inset_0_0_6px_rgba(255,255,255,0.15)] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald shadow-[0_0_6px_rgba(16,185,129,0.8)] mr-1 opacity-80 animate-pulse" />
            </div>

            {/* Topbar inside the app */}
            <div className="w-full bg-[#0a0a0a] border-b border-white/5 py-3 px-5 flex items-center justify-between pt-12 z-20">
              <Img src={staticFile("creator lab verde.png")} className="h-6 w-auto" />
              <div className="w-8 h-8 rounded-full bg-brand-emerald/20 border border-brand-emerald/30 flex items-center justify-center">
                <span className="text-xs text-brand-emerald font-bold">L</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative bg-[#0a0a0a] p-4 flex flex-col gap-4">
              {children}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
