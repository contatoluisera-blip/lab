import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const random = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const CosmicDust: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    return Array.from({ length: 500 }).map((_, i) => {
      const isLarge = random(i * 10) > 0.8;
      return {
        id: i,
        x: random(i) * 100, // percentage
        y: random(i + 100) * 100, // percentage
        size: isLarge ? random(i + 200) * 8 + 4 : random(i + 200) * 4 + 2, // px
        opacity: random(i + 300) * 0.8 + 0.4,
        speed: random(i + 400) * 1.2 + 0.3,
      };
    });
  }, []);

  return (
    <AbsoluteFill className="pointer-events-none">
      {particles.map((p) => {
        // move slowly upwards
        const currentY = p.y - (frame * p.speed * 0.05);
        // wrap around
        const wrappedY = ((currentY % 100) + 100) % 100;

        return (
          <div
            key={p.id}
            className="absolute rounded-full bg-brand-emerald"
            style={{
              left: `${p.x}%`,
              top: `${wrappedY}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px rgba(16, 185, 129, 1), 0 0 ${p.size * 5}px rgba(16, 185, 129, 0.6)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
