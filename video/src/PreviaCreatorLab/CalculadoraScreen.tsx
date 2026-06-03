import React from 'react';
import { Calculator, Monitor, Clock, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { interpolate, spring, Easing } from 'remotion';

export const CalculadoraScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // Entrada suave sequencial dos elementos (starts parallel to jump zoom)
  const slowSpringConfig = { damping: 20, stiffness: 25, mass: 1.5 };
  const headerSpring = spring({ frame: frame - fps * 24.7, fps, config: slowSpringConfig });
  const card1Spring = spring({ frame: frame - fps * 25.3, fps, config: slowSpringConfig });
  const card2Spring = spring({ frame: frame - fps * 25.9, fps, config: slowSpringConfig });
  const card3Spring = spring({ frame: frame - fps * 26.5, fps, config: slowSpringConfig });

  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerY = interpolate(headerSpring, [0, 1], [20, 0]);
  
  const card1Opacity = interpolate(card1Spring, [0, 1], [0, 1]);
  const card1Y = interpolate(card1Spring, [0, 1], [30, 0]);

  const card2Opacity = interpolate(card2Spring, [0, 1], [0, 1]);
  const card2Y = interpolate(card2Spring, [0, 1], [30, 0]);

  const card3Opacity = interpolate(card3Spring, [0, 1], [0, 1]);
  const card3Y = interpolate(card3Spring, [0, 1], [30, 0]);

  // Simulated typing (fluido e espaçado)
  const nivelCriadorProgress = interpolate(frame, [fps * 27.5, fps * 28.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const nivelCriador = nivelCriadorProgress > 0.5 ? "Júnior" : "Pleno";

  const typingLocationProgress = interpolate(frame, [fps * 28.5, fps * 29.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const locationValue = typingLocationProgress > 0.5 ? "Brasília - DF" : "SP";

  const toggleOfertaProgress = interpolate(frame, [fps * 29.5, fps * 30.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });

  const typingVideosProgress = interpolate(frame, [fps * 30.5, fps * 31.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const videosValue = typingVideosProgress > 0.5 ? "4" : "";

  const toggleCaptaProgress = interpolate(frame, [fps * 31.5, fps * 32.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });

  const typingHorasProgress = interpolate(frame, [fps * 32.5, fps * 33.0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const horasValue = typingHorasProgress > 0.5 ? "4" : "";

  // Botão click animation
  const buttonClickProgress = interpolate(frame, [fps * 35.5, fps * 35.7, fps * 35.9], [1, 0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  
  // Scroll da tela até o final (agora com curva de velocidade e mais longo)
  const screenScrollY = interpolate(
     frame,
     [fps * 27.0, fps * 35.0], // Scroll fluido de 27 até 35
     [0, -1180], // Ajustado para descer até o botão
     { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );
  
  return (
    <div style={{ width: '100%', height: '100%', WebkitFontSmoothing: 'antialiased', backgroundColor: '#050505', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', transform: `translateY(${screenScrollY}px)` }}>
        
        {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: headerOpacity, transform: `translateY(${headerY}px)` }}>
         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content' }}>
           <Calculator size={14} color="#10b981" />
           <span style={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold' }}>Motor de Precificação</span>
         </div>
         <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Calculadora de Orçamento</h1>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
             <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
             <div style={{ height: '4px', width: '85%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
             <div style={{ height: '4px', width: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
         </div>
      </div>

      {/* Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
         
         {/* Card 1: Perfil e Contexto */}
         <div style={{ opacity: card1Opacity, transform: `translateY(${card1Y}px)`, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={16} color="#10b981" />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>1. Perfil e Contexto</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Nível do Criador</span>
                    <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '12px', color: nivelCriador === 'Júnior' ? 'white' : '#d1d5db' }}>{nivelCriador}</span>
                       <ChevronDown size={14} color="#9ca3af" />
                    </div>
                    <div style={{ height: '4px', width: '90%', backgroundColor: 'rgba(16, 185, 129, 0.3)', borderRadius: '4px', marginTop: '2px' }} />
                    <div style={{ height: '4px', width: '60%', backgroundColor: 'rgba(16, 185, 129, 0.3)', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Localização (Região)</span>
                    <div style={{ padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'white' }}>{locationValue}</span>
                <ChevronDown size={14} color="#6b7280" />
              </div>
                    <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2px' }} />
                    <div style={{ height: '4px', width: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Modo de Oferta</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {/* Option 1 */}
                    <div style={{ 
                        backgroundColor: toggleOfertaProgress > 0.5 ? '#0f0f0f' : 'rgba(16, 185, 129, 0.05)', 
                        border: toggleOfertaProgress > 0.5 ? '1px solid rgba(255,255,255,0.05)' : '1px solid #10b981', 
                        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {toggleOfertaProgress > 0.5 ? (
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
                            ) : (
                                <CheckCircle2 size={12} color="#10b981" />
                            )}
                            <span style={{ fontSize: '10px', color: toggleOfertaProgress > 0.5 ? '#d1d5db' : 'white', fontWeight: 'bold' }}>Mercado / Lean</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                        <div style={{ height: '4px', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                    {/* Option 2 */}
                    <div style={{ 
                        backgroundColor: toggleOfertaProgress > 0.5 ? 'rgba(16, 185, 129, 0.05)' : '#0f0f0f', 
                        border: toggleOfertaProgress > 0.5 ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {toggleOfertaProgress > 0.5 ? (
                                <CheckCircle2 size={12} color="#10b981" />
                            ) : (
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
                            )}
                            <span style={{ fontSize: '10px', color: toggleOfertaProgress > 0.5 ? 'white' : '#d1d5db', fontWeight: 'bold' }}>Profissional</span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                        <div style={{ height: '4px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                    {/* Option 3 */}
                    <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
                            <span style={{ fontSize: '10px', color: '#d1d5db', fontWeight: 'bold' }}>Premium</span>
                        </div>
                        <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '4px' }} />
                        <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                        <div style={{ height: '3px', width: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                </div>
            </div>
         </div>

         {/* Card 2: Escopo Técnico */}
         <div style={{ opacity: card2Opacity, transform: `translateY(${card2Y}px)`, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#10b981" />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>2. Escopo Técnico</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Quantidade de Vídeos</span>
                    <div style={{ backgroundColor: '#0f0f0f', border: typingVideosProgress > 0 && typingVideosProgress < 1 ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', height: '40px' }}>
                       <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{videosValue}</span>
                       {typingVideosProgress > 0 && typingVideosProgress < 1 && <div style={{ width: '2px', height: '14px', backgroundColor: '#10b981', marginLeft: '2px' }} />}
                    </div>
                    <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2px' }} />
                    <div style={{ height: '3px', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Complexidade de Edição</span>
                    <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '40px' }}>
                       <span style={{ fontSize: '12px', color: '#d1d5db' }}>Intermediária (Dinâmi...</span>
                       <ChevronDown size={14} color="#9ca3af" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Inclui Captação de Imagem?</span>
                    <div style={{ height: '3px', width: '150px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: toggleCaptaProgress > 0.5 ? '#10b981' : 'transparent', padding: '8px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '12px', color: toggleCaptaProgress > 0.5 ? 'black' : '#9ca3af', fontWeight: 'bold' }}>Sim</span>
                    </div>
                    <div style={{ backgroundColor: toggleCaptaProgress > 0.5 ? 'transparent' : 'rgba(255,255,255,0.05)', padding: '8px 16px' }}>
                        <span style={{ fontSize: '12px', color: toggleCaptaProgress > 0.5 ? '#9ca3af' : 'white', fontWeight: 'bold' }}>Não</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Horas de Captação Estimadas</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#0f0f0f', border: typingHorasProgress > 0 && typingHorasProgress < 1 ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', height: '40px', width: '80px', justifyContent: 'center' }}>
                       <span style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>{horasValue}</span>
                       {typingHorasProgress > 0 && typingHorasProgress < 1 && <div style={{ width: '2px', height: '14px', backgroundColor: '#10b981', marginLeft: '2px' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                        <div style={{ height: '3px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    </div>
                </div>
            </div>
         </div>

         {/* Card 3: Direitos e Entrega */}
         <div style={{ opacity: card3Opacity, transform: `translateY(${card3Y}px)`, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>3. Direitos e Entrega</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Uso de Imagem e Direitos</span>
                    <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '10px', color: '#d1d5db' }}>Orgânico + Tráfego...</span>
                       <ChevronDown size={14} color="#9ca3af" />
                    </div>
                    <div style={{ height: '3px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Tipo de Prazo</span>
                    <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '10px', color: '#d1d5db' }}>Prazo Padrão (Ex...</span>
                       <ChevronDown size={14} color="#9ca3af" />
                    </div>
                    <div style={{ height: '3px', width: '80%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2px' }} />
                </div>
            </div>
         </div>
         
          {/* Card Custo Operacional */}
          <div style={{ opacity: card3Opacity, transform: `translateY(${card3Y}px)`, backgroundColor: 'rgba(20, 20, 20, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Monitor size={16} color="#10b981" />
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Seu Custo Operacional</span>
                </div>
                <span style={{ fontSize: '10px', color: '#047857' }}>Ocultar Detalhes</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Smartphone</span>
                <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '12px', color: 'white' }}>iPhone 16</span>
                   <ChevronDown size={14} color="#9ca3af" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Computador</span>
                <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '12px', color: 'white' }}>Intermediário (PC/Note)</span>
                   <ChevronDown size={14} color="#9ca3af" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Perfil Fiscal</span>
                <div style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '12px', color: 'white' }}>MEI (~3%)</span>
                   <ChevronDown size={14} color="#9ca3af" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Softwares Pagos Ativos</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CheckCircle2 size={10} color="white" />
                        </div>
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>CapCut Pro</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CheckCircle2 size={10} color="white" />
                        </div>
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>Canva Pro</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'transparent' }}>
                        </div>
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>Adobe Premiere</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CheckCircle2 size={10} color="white" />
                        </div>
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>Armazenamento (Google/iCloud)</span>
                    </div>
                </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div style={{ transform: `scale(${buttonClickProgress})`, width: '100%', padding: '16px', backgroundColor: '#34d399', borderRadius: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px', boxShadow: '0px 0px 30px rgba(52, 211, 153, 0.4)' }}>
              <Calculator size={16} color="black" />
              <span style={{ color: 'black', fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>DIMENSIONAR PREÇO FINAL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '80px' }}>
             <ShieldCheck size={12} color="#047857" />
             <span style={{ fontSize: '10px', color: '#6b7280' }}>Consome 1 crédito por uso</span>
          </div>
          
      </div>
      </div>
    </div>
  );
};
