import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

export const PricingScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // Start animation at 51.0s
  const startFrame = fps * 51.0;

  if (frame < startFrame) {
      return null;
  }

  // Animação de Fade In com Blur entre 51.0s e 52.0s (1 segundo)
  const opacityProgress = interpolate(
      frame,
      [startFrame, startFrame + fps * 1.0],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const blurProgress = interpolate(
      frame,
      [startFrame, startFrame + fps * 1.0],
      [30, 0], // Começa muito embaçado e fica nítido
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'transparent'
    }}>
        <div style={{
            opacity: opacityProgress,
            filter: `blur(${blurProgress}px)`
        }}>
            <h1 style={{
                color: 'white',
                fontSize: '80px', // Texto grande e minimalista
                fontWeight: 800, // Bold
                margin: 0,
                fontFamily: 'Poppins, sans-serif',
                letterSpacing: '2px'
            }}>
                Acesse mobilelab.com.br
            </h1>
        </div>
    </AbsoluteFill>
  );
};
