import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const CallToActionScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animação de entrada
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 40,
    },
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const translateY = interpolate(entrance, [0, 1], [50, 0]);
  const scale = interpolate(entrance, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center bg-transparent px-20 text-center">
      <div 
        style={{ 
          opacity, 
          transform: `translateY(${translateY}px) scale(${scale})` 
        }}
        className="max-w-4xl"
      >
        <div className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-brand-emerald text-sm font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
          Vagas Limitadas
        </div>
        
        <h1 className="text-5xl font-extrabold text-white leading-tight">
          Entre na pré-lista e garanta a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-emerald drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">melhor condição</span> da Creator Lab
        </h1>
      </div>
    </AbsoluteFill>
  );
};
