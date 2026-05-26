import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import React from "react";

const Question: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  
  // Fade in and fade out
  const opacity = interpolate(
    frame,
    [0, 10, 40, 50],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  return (
    <div style={{ opacity }} className="absolute inset-0 flex justify-center text-4xl text-gray-400 font-sans max-w-4xl text-center leading-relaxed mx-auto mt-4">
      {text}
    </div>
  );
};

export const Fase1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const scale = interpolate(bounce, [0, 1], [0.85, 1]);
  const opacity = interpolate(frame, [250, 280], [1, 0], { extrapolateRight: "clamp" });
  const blur = interpolate(frame, [250, 280], [0, 10], { extrapolateRight: "clamp" });

  const questions = [
    "Quanto eu devo cobrar?",
    "O perfil desse cliente realmente tem potencial?",
    "Que tipo de conteúdo eu proporia?",
    "Como justifico meu orçamento?",
  ];

  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: `blur(${blur}px)`,
        backgroundColor: 'transparent' // Background is now handled by index.tsx
      }}
      className="flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Subtle Background Glows matching the app */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-glow blur-[120px] rounded-full opacity-30 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-emerald blur-[150px] rounded-full opacity-10 mix-blend-screen" />

      <div className="flex flex-col items-center w-full px-8">
        <div
          style={{
            transform: `scale(${scale})`,
            opacity: Math.min(1, frame / 10),
          }}
          className="text-[100px] font-bold tracking-tight text-white mb-6 text-center leading-[0.85]"
        >
          Você já se<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-brand-jade">perguntou...</span>
        </div>

        <div className="relative w-full h-20">
          {questions.map((q, i) => (
            <Sequence
              key={i}
              from={40 + i * 50}
              durationInFrames={50}
              name={`Question ${i + 1}`}
            >
              <Question text={q} />
            </Sequence>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};


