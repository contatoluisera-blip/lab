import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence, spring } from "remotion";
import React from "react";
import { DiagnosisScreen } from "./DiagnosisScreen";
import { DualToolsScreen } from "./DualToolsScreen";
import { CreatorCardScreen } from "./CreatorCardScreen";

const ScreenContainer: React.FC<{ children: React.ReactNode, startFrame: number, title: string, duration: number, baseScale?: number, targetScale?: number, hideWindow?: boolean, offsetY?: number }> = ({ children, startFrame, title, duration, baseScale = 0.95, targetScale = 1.15, hideWindow = false, offsetY = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const opacityIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  // Fade out / Blur out
  const fadeOutFrame = duration - 20;
  const opacityOut = interpolate(frame, [fadeOutFrame, duration], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const blurOut = interpolate(frame, [fadeOutFrame, duration], [0, 20], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const opacity = Math.min(opacityIn, opacityOut);
  
  const scaleAnim = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 }
  });
  const scale = interpolate(scaleAnim, [0, 1], [baseScale, targetScale]);

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center bg-transparent">
      <div 
        style={{ opacity, filter: `blur(${blurOut}px)`, transform: `scale(${scale}) translateY(${offsetY}px)` }}
        className="w-full h-full flex flex-col items-center justify-center p-10 relative"
      >
        <h2 className="text-3xl font-bold text-white mb-6 bg-[#1a2b24] px-6 py-2 rounded-full border border-brand-emerald/30 z-10 shadow-lg">
          {title}
        </h2>
        <div className={`relative ${hideWindow ? '' : 'rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.15)] border border-brand-emerald/20 bg-[var(--color-surface)]'} overflow-hidden`}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Fase3: React.FC = () => {
  return (
    <AbsoluteFill className="bg-transparent">
      
      {/* Diagnóstico Screen */}
      <Sequence from={0} durationInFrames={230}>
        <ScreenContainer 
          startFrame={0} 
          duration={230}
          title="Diagnóstico de Perfil Analítico"
          baseScale={0.7}
          targetScale={0.85}
        >
          <DiagnosisScreen />
        </ScreenContainer>
      </Sequence>

      {/* Dual Tools (Mobile Views) Screen */}
      <Sequence from={210} durationInFrames={250}>
        <ScreenContainer 
          startFrame={210} 
          duration={250}
          title="Hub de Ferramentas"
          baseScale={0.9}
          targetScale={1.1}
          hideWindow={true}
          offsetY={-80}
        >
          <DualToolsScreen />
        </ScreenContainer>
      </Sequence>

      {/* Cartão do Creator Screen */}
      <Sequence from={430} durationInFrames={300}>
        <ScreenContainer 
          startFrame={430} 
          duration={300}
          title="Exportação de Cartão de Visitas (PDF)"
          baseScale={0.9}
          targetScale={1.1}
          hideWindow={true}
        >
          <CreatorCardScreen />
        </ScreenContainer>
      </Sequence>

    </AbsoluteFill>
  );
};

