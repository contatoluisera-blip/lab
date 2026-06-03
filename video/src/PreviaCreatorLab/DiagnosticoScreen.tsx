import React from 'react';
import { Activity, Zap, Search } from 'lucide-react';
import { spring, interpolate, Easing } from 'remotion';

export const DiagnosticoScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // Typing animation starting at 13.8s
  const text = "luiserayt";
  const typingSpring = spring({ 
    frame: frame - fps * 13.8, 
    fps, 
    config: { damping: 20, stiffness: 40, overshootClamping: true } 
  });
  const typedLength = Math.round(interpolate(typingSpring, [0, 1], [0, text.length]));
  const inputValue = text.substring(0, typedLength);

  // Button click animation starting at 17s
  const clickSpring = spring({ 
    frame: frame - fps * 17, 
    fps, 
    config: { damping: 12, stiffness: 80 } 
  });
  // Scale goes down to 0.95 then back up.
  // Using simple interpolation for a bounce click
  const clickScale = interpolate(clickSpring, [0, 0.5, 1], [1, 0.93, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const isClicking = frame >= fps * 17 && frame <= fps * 17.5;
  const btnBg = isClicking ? '#059669' : '#10b981';

  // Form fade out at 17.5s
  const formOutSpring = spring({ frame: frame - fps * 17.5, fps, config: { damping: 20, stiffness: 40 } });
  const formOpacity = interpolate(formOutSpring, [0, 1], [1, 0]);

  // Results entrance
  const resOpacity = interpolate(frame, [fps * 18.0, fps * 18.5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Sequenced items for the results layout (start appearing at 18.5s)
  const item1Spring = spring({ frame: frame - fps * 18.5, fps, config: { damping: 15, stiffness: 60 } });
  const item2Spring = spring({ frame: frame - fps * 18.7, fps, config: { damping: 15, stiffness: 60 } });
  const item3Spring = spring({ frame: frame - fps * 18.9, fps, config: { damping: 15, stiffness: 60 } });
  const item4Spring = spring({ frame: frame - fps * 19.1, fps, config: { damping: 15, stiffness: 60 } });
  const item5Spring = spring({ frame: frame - fps * 19.3, fps, config: { damping: 15, stiffness: 60 } });
  const item6Spring = spring({ frame: frame - fps * 19.5, fps, config: { damping: 15, stiffness: 60 } });
  
  // Internal scroll (starts at 19.5s, ends at 28s) - Diminuída a velocidade e intensidade
  const scrollProgress = interpolate(
    frame,
    [fps * 19.5, fps * 28],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) }
  );
  // Scroll up to see the rest of the results (negative Y) - Ajustado para -720 para não sobrar espaço
  const contentY = interpolate(scrollProgress, [0, 1], [0, -720]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', WebkitFontSmoothing: 'antialiased', transform: `translateY(${contentY}px)`, backfaceVisibility: 'hidden', textRendering: 'geometricPrecision', padding: '24px 20px', gap: '20px' }}>
      
      {/* Container that holds Form and Results absolutely positioned over each other */}
      <div style={{ position: 'relative', width: '100%', flex: 1 }}>
         {/* Form Card (fades out) */}
         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity: formOpacity, display: formOpacity === 0 ? 'none' : 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Hub Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '4px 10px', alignSelf: 'flex-start', color: '#d1d5db', fontSize: '10px', fontFamily: 'sans-serif' }}>
               <Search size={12} color="#10b981" /> Inteligência Analítica
            </div>

            {/* Header Mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                Diagnóstico de Perfil
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                Auditoria automatizada baseada em métricas puras, constância e engajamento.
              </p>
            </div>

            {/* Form Card */}
            <div style={{ border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px 20px', backgroundColor: 'rgba(20, 20, 20, 0.4)', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#10b981" />
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>Nova Varredura</span>
               </div>

               {/* Input 1 */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#d1d5db', fontSize: '11px', fontFamily: 'sans-serif' }}>Seu @ no Instagram</label>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ color: '#6b7280', fontSize: '14px' }}>@</span>
                     <span style={{ color: 'white', fontSize: '14px', fontFamily: 'sans-serif' }}>{inputValue}</span>
                     {/* Cursor */}
                     {frame > fps * 13 && frame < fps * 16 && Math.floor(frame / 15) % 2 === 0 ? (
                       <span style={{ width: '2px', height: '14px', backgroundColor: '#10b981' }} />
                     ) : null}
                  </div>
               </div>

               {/* Input 2 */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#d1d5db', fontSize: '11px', fontFamily: 'sans-serif' }}>Tipo de Perfil</label>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ color: '#d1d5db', fontSize: '14px', fontFamily: 'sans-serif' }}>Criador / Influenciador</span>
                     <span style={{ color: 'white', fontSize: '10px' }}>▼</span>
                  </div>
               </div>

               {/* Submit Button */}
               <div style={{ backgroundColor: btnBg, transform: `scale(${clickScale})`, transition: 'background-color 0.1s', color: 'black', borderRadius: '999px', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '4px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                  <Search size={16} color="black" />
                  <span style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>{frame > fps * 17.2 ? 'AUDITANDO...' : 'AUDITAR PERFIL'}</span>
               </div>

               {/* Footer Note */}
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                  <Zap size={10} color="#10b981" />
                  <span style={{ fontSize: '10px', fontFamily: 'sans-serif' }}>Consome 1 crédito por uso</span>
               </div>
            </div>
         </div>

         {/* Results Layout (fades in) */}
         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity: resOpacity, display: resOpacity === 0 ? 'none' : 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
             
             {/* Header Section (item1) */}
             <div style={{ display: 'flex', gap: '16px', opacity: item1Spring, transform: `translateY(${interpolate(item1Spring, [0, 1], [20, 0])}px)` }}>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                     <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid #eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', fontSize: '24px', fontWeight: '900' }}>41</div>
                     <span style={{ fontSize: '10px', color: 'white', marginTop: '8px', fontWeight: 'bold' }}>BÁSICO</span>
                 </div>
                 <div style={{ flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>@luiserayt</div>
                     <div style={{ color: '#10b981', fontSize: '10px', marginBottom: '16px' }}>Confiança da Análise: 35%</div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '6px', width: '90%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '6px', width: '95%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '6px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '6px', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                     </div>
                 </div>
             </div>
             
             {/* Metrics Grid 2x2 (item2) */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', opacity: item2Spring, transform: `translateY(${interpolate(item2Spring, [0, 1], [20, 0])}px)` }}>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>SEGUIDORES</span>
                     <span style={{ fontSize: '18px', color: 'white', fontWeight: '900', marginTop: '4px' }}>31.905</span>
                 </div>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>POSTS ANALISADOS</span>
                     <span style={{ fontSize: '18px', color: 'white', fontWeight: '900', marginTop: '4px' }}>4</span>
                 </div>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>ENG. ROBUSTO</span>
                     <span style={{ fontSize: '18px', color: '#10b981', fontWeight: '900', marginTop: '4px' }}>0.83%</span>
                 </div>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>POSTS / SEMANA</span>
                     <span style={{ fontSize: '18px', color: 'white', fontWeight: '900', marginTop: '4px' }}>0.1</span>
                 </div>
             </div>

             {/* Categories Grid (item3) */}
             <div style={{ display: 'flex', gap: '8px', opacity: item3Spring, transform: `translateY(${interpolate(item3Spring, [0, 1], [20, 0])}px)` }}>
                 <div style={{ flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>NICHO / SEGMENTO</span>
                     <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', marginTop: '4px' }}>Educador em Tecnologia...</span>
                 </div>
                 <div style={{ flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '8px', color: '#9ca3af', fontWeight: 'bold' }}>TOM DE VOZ</span>
                     <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold', marginTop: '4px' }}>Descontraído</span>
                 </div>
             </div>

             {/* Notas por Área (item4) */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: item4Spring, transform: `translateY(${interpolate(item4Spring, [0, 1], [20, 0])}px)`, marginTop: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#10b981" />
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Notas por Área</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                     <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Completude</span>
                             <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '900' }}>70</span>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                             <div style={{ height: '4px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         </div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Posicionamento</span>
                             <span style={{ color: '#eab308', fontSize: '14px', fontWeight: '900' }}>50</span>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <div style={{ height: '4px', width: '90%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                             <div style={{ height: '4px', width: '70%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         </div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Constância</span>
                             <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '900' }}>2</span>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <div style={{ height: '4px', width: '85%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                             <div style={{ height: '4px', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         </div>
                     </div>
                     <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Engajamento</span>
                             <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '900' }}>19</span>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                             <div style={{ height: '4px', width: '50%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         </div>
                     </div>
                 </div>
             </div>

             {/* Oportunidades (item5) */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: item5Spring, transform: `translateY(${interpolate(item5Spring, [0, 1], [20, 0])}px)`, marginTop: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#eab308', fontSize: '14px' }}>⚠️</span>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Oportunidades de Melhoria</span>
                 </div>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 'bold' }}>Posicionamento</span>
                         <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '4px', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                         <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 'bold' }}>Constância</span>
                         <div style={{ height: '4px', width: '90%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                         <div style={{ height: '4px', width: '75%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                     </div>
                 </div>
             </div>

             {/* Footer Cards (item6) */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', opacity: item6Spring, transform: `translateY(${interpolate(item6Spring, [0, 1], [20, 0])}px)`, marginTop: '8px' }}>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                         <Activity size={14} color="#10b981" />
                         <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>Melhor Post (Relativo)</span>
                     </div>
                     <span style={{ fontSize: '10px', color: '#9ca3af' }}>Data: <span style={{ color: 'white', fontWeight: 'bold' }}>03/06/2025</span></span>
                     <span style={{ fontSize: '10px', color: '#9ca3af' }}>Tipo: <span style={{ color: 'white', fontWeight: 'bold' }}>Vídeo</span></span>
                     <span style={{ fontSize: '10px', color: '#9ca3af' }}>Engajamento: <span style={{ color: '#10b981', fontWeight: 'bold' }}>9.34%</span></span>
                     <span style={{ fontSize: '10px', color: '#60a5fa', textDecoration: 'underline', marginTop: '4px' }}>Ver Publicação</span>
                 </div>
                 <div style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                         <Search size={14} color="#3b82f6" />
                         <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>Padrões Analíticos</span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                         <span style={{ fontSize: '8px', color: '#9ca3af' }}>DEPENDÊNCIA VIRAL (CONCENTRAÇÃO)</span>
                         <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>84%</span>
                         <span style={{ fontSize: '8px', color: '#9ca3af', lineHeight: 1.2 }}>Acima de 50% indica que o perfil é carregado por 1 único post viral.</span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                         <span style={{ fontSize: '8px', color: '#9ca3af' }}>DOMÍNIO DE VÍDEO (REELS)</span>
                         <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>75% dos posts</span>
                     </div>
                 </div>
             </div>

         </div>
      </div>
    </div>
  );
};
