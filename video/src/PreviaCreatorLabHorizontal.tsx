import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PreviaCreatorLab } from './PreviaCreatorLab';
import { CosmicDust } from './Apresentacao/CosmicDust';

export const PreviaCreatorLabHorizontal: React.FC = () => {
  const originalWidth = 2160;
  const originalHeight = 3830;
  
  // A escala necessária para fazer a altura do vídeo vertical (3830) caber na altura do vídeo 4K (2160)
  const scale = 2160 / 3830;

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background cósmico preenchendo as bordas do vídeo horizontal */}
      <AbsoluteFill style={{ zIndex: 0, opacity: 0.5 }}>
        <CosmicDust />
      </AbsoluteFill>
      
      {/* Vídeo Vertical Original Centralizado e Redimensionado */}
      <div 
        style={{ 
          width: originalWidth, 
          height: originalHeight, 
          transform: `scale(${scale})`,
          position: 'relative',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <PreviaCreatorLab />
      </div>
    </AbsoluteFill>
  );
};
