import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile, Sequence } from "remotion";
import React from "react";
import { MobileMockup } from "./MockupsUI";
import { DashboardScreen } from "./DashboardScreen";

export const Fase2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text1 = "Todas as respostas\n";
  const text2 = "em um lugar...";

  const textSpring1 = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 80, overshootClamping: true } });
  const chars1 = Math.round(interpolate(textSpring1, [0, 1], [0, text1.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));

  const textSpring2 = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 80, overshootClamping: true } });
  const chars2 = Math.round(interpolate(textSpring2, [0, 1], [0, text2.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));

  // Fade out text to show the app
  const textOpacity = interpolate(frame, [100, 130], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  // Reveal logo and mockups
  const appOpacityIn = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const appOpacityOut = interpolate(frame, [250, 270], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const appBlurOut = interpolate(frame, [250, 270], [0, 20], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const appOpacity = Math.min(appOpacityIn, appOpacityOut);

  const appSlideUp = spring({
    frame: frame - 120,
    fps,
    config: {
      damping: 12,
      stiffness: 90,
    },
  });
  
  const translateY = interpolate(appSlideUp, [0, 1], [1000, 0]);
  const scale = interpolate(appSlideUp, [0, 1], [0.9, 1.15]);

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center bg-transparent p-10">
      
      {/* Main highlight text */}
      <div 
        style={{ opacity: textOpacity, position: 'absolute', width: '100%' }}
        className="text-[100px] font-bold tracking-tight text-center leading-[0.85] text-white"
      >
        {text1.substring(0, chars1)}<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-jade">
          {text2.substring(0, chars2)}
        </span>
      </div>

      {/* App reveal (Mockups) */}
      <div 
        style={{ 
          opacity: appOpacity,
          filter: `blur(${appBlurOut}px)`,
          transform: `translateY(${translateY}px) scale(${scale})`
        }}
        className="flex items-center justify-center gap-16 w-full h-full absolute"
      >
        <div className="flex flex-col gap-4 text-center items-center">
          <Img 
            src={staticFile("creator lab verde.png")} 
            className="h-40 w-auto object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4"
          />
          <div className="text-gray-400 mt-4">Sistema operacional de inteligência<br/>para criadores mobile.</div>
          <div className="mt-8 glass-button-primary self-center px-8 text-sm">Criado por <span className="font-bold text-white ml-2">Luisera</span></div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-brand-glow blur-[100px] opacity-30 mix-blend-screen rounded-full" />
          <MobileMockup />
        </div>
      </div>

      {/* Dashboard App */}
      <Sequence from={260} durationInFrames={190}>
        <div className="w-full h-full flex flex-col items-center justify-center">
           <DashboardScreen />
        </div>
      </Sequence>

    </AbsoluteFill>
  );
};

