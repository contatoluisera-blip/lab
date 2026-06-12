import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';

export const FinalCardsScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // Text "E TEM MAIS..." Animation
  // Fade in from 40.0s to 41.0s to ensure it doesn't show up earlier
  const textFadeIn = interpolate(frame, [fps * 40.0, fps * 41.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Fades out and blurs out between 43.0 and 43.5s
  const textFadeOut = interpolate(frame, [fps * 43.0, fps * 43.5], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Combine opacities
  const textOpacity = textFadeIn * textFadeOut;
  const textBlur = interpolate(frame, [fps * 43.0, fps * 43.5], [0, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cardsData = [
      {
          icon: '💡',
          title: 'Gerador de Ideias',
          description: 'Gere ideias de vídeos alinhadas ao perfil analisado e ao orçamento gerado. Cada sugestão detalha cena, texto/roteiro, estrutura audiovisual e tempo sugerido, agindo como um braço direito criativo e estratégico.'
      },
      {
          icon: '📄',
          title: 'Gerador de Proposta',
          description: 'Conecte tudo e transforme o diagnóstico, o orçamento e as ideias em uma proposta comercial clara e organizada em PDF prontinha para enviar. O cliente entende o problema, a solução e percebe seu valor estratégico.'
      },
      {
          icon: '💬',
          title: 'Assistente de IA',
          description: 'Um assistente de IA focado em filmmaking (CapCut, BlackMagic Cam, Node Video) e business B2B para tirar dúvidas rápidas, destravar roteiros, sugerir técnicas de edição e estruturar argumentos de negociação.'
      },
      {
          icon: '🕒',
          title: 'Controle de Cliente',
          description: 'Painel para gerenciar clientes ativos, acompanhar entregas, marcar status de vídeos, anexar links de aprovação de materiais e monitorar pagamentos. Tudo organizado em um local exclusivo.'
      }
  ];

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        
        {/* Texto "E TEM MAIS..." centralizado */}
        {frame >= fps * 40.0 && frame < fps * 44.0 && (
            <div style={{
                position: 'absolute',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                opacity: textOpacity,
                filter: `blur(${textBlur}px)`
            }}>
                <h1 style={{
                    color: 'white',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 800,
                    fontSize: '120px',
                    letterSpacing: '5px',
                    margin: 0,
                    textShadow: '0 0 40px rgba(16,185,129,0.4)'
                }}>
                    E TEM MAIS...
                </h1>
            </div>
        )}

        {/* Container dos Cards */}
        {frame >= fps * 43.5 && (() => {
            const slideOutX = interpolate(
                frame,
                [fps * 50.0, fps * 50.8],
                [0, -4500],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
            );

            return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '64px', 
                    width: '3200px', // Aumentado para 2 colunas
                    padding: '40px',
                    transform: `translateX(${slideOutX}px)`
                }}>
                {cardsData.map((card, index) => {
                    const startFrame = fps * 43.8 + (index * fps * 1.0); // Stagger de 1.0s por card
                    
                    const flipProgress = interpolate(
                        frame,
                        [startFrame, startFrame + fps * 1.5], // Animação de 1.5s
                        [90, 0], 
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) } 
                    );

                    const opacityProgress = interpolate(
                        frame,
                        [startFrame, startFrame + fps * 0.5], 
                        [0, 1], 
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    return (
                        <div key={index} style={{
                            backgroundColor: '#0a0d0c',
                            borderRadius: '40px', // Aumentado
                            border: '2px solid rgba(16,185,129,0.2)',
                            padding: '64px', // Aumentado
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '40px', // Aumentado
                            transform: `perspective(2000px) rotateY(${flipProgress}deg)`,
                            opacity: opacityProgress,
                            boxShadow: '0 30px 60px rgba(0,0,0,0.5)', // Sombra maior
                            transformOrigin: 'left center'
                        }}>
                            <div style={{ 
                                width: '120px', // Aumentado
                                height: '120px', // Aumentado
                                borderRadius: '24px', // Aumentado
                                border: '2px solid rgba(16,185,129,0.3)',
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                fontSize: '60px', // Aumentado
                                backgroundColor: 'rgba(16,185,129,0.05)'
                            }}>
                                {card.icon}
                            </div>
                            
                            <h2 style={{
                                color: 'white',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '64px', // Aumentado
                                fontWeight: 700,
                                margin: 0
                            }}>
                                {card.title}
                            </h2>

                            <p style={{
                                color: '#9ca3af',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '38px', // Aumentado
                                lineHeight: '1.6',
                                margin: 0
                            }}>
                                {card.description}
                            </p>
                        </div>
                    );
                })}
            </div>
            );
        })()}
        
    </AbsoluteFill>
  );
};
