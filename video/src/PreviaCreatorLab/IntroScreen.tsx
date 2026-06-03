import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Img } from 'remotion';

export const IntroScreen: React.FC<{ fps: number }> = ({ fps }) => {
  const frame = useCurrentFrame();

  const logoFadeOut = interpolate(
      frame,
      [fps * 5.5, fps * 6.5],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        
        {/* Logo estática desde o frame 0 */}
        <div style={{
            opacity: logoFadeOut,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Img 
                src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/creator%20lab%20branco.png?alt=media&token=eac3e448-35d3-48f4-9188-b9162f2dc503"
                style={{
                    width: '800px',
                    objectFit: 'contain'
                }}
            />
        </div>

    </AbsoluteFill>
  );
};
