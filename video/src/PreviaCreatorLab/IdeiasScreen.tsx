import React from 'react';
import { interpolate, spring } from 'remotion';

export const IdeiasScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // O componente aparece a partir de 42.3s, mas renderizamos a partir do start.
  // O clique vai acontecer em 42.5s
  const clickFrame = fps * 42.5;
  const buttonPressProgress = interpolate(frame, [clickFrame, clickFrame + 3, clickFrame + 6], [1, 0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const buttonOpacityProgress = interpolate(frame, [clickFrame, clickFrame + 3, clickFrame + 6], [1, 0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '100%', height: '100%', WebkitFontSmoothing: 'antialiased', backgroundColor: '#050505', overflow: 'hidden', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '12px', color: '#10b981' }}>💡</span>
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>Motor Criativo</span>
        </div>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', margin: '8px 0 0 0' }}>Gerador de Ideias</h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
            Receba roteiros estruturados baseados na dor do seu cliente e no escopo vendido.
        </p>
      </div>

      {/* Main Form Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Toggle Box */}
          <div style={{ backgroundColor: '#0f0f0f', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#10b981', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                  <span style={{ color: '#050505', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Modo Estratégico</span>
              </div>
              <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Modo Livre</span>
          </div>

          <div style={{ backgroundColor: '#0f0f0f', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Alert */}
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ color: '#10b981', fontSize: '12px', lineHeight: '1.5', display: 'block' }}>Use o diagnóstico e o orçamento aprovado para gerar ideias que não extrapolam a capacidade de produção.</span>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Cliente / Projeto</label>
                  <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontSize: '14px' }}>luiserayt</span>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>↕</span>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Diagnóstico (Problema)</label>
                  <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontSize: '14px' }}>@luiserayt - Nota: (25/05/2026)</span>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>↕</span>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Orçamento (Escopo)</label>
                  <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontSize: '14px' }}>Pacote: 4 vídeos - R$ 3.650 (22/05/2026)</span>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>↕</span>
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Qtd Ideias</label>
                      <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'white', fontSize: '14px' }}>4</span>
                      </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Foco Criativo</label>
                      <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'white', fontSize: '14px' }}>Autoridade</span>
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>↕</span>
                      </div>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#9ca3af', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Observações / Restrições (Opcional)</label>
                  <div style={{ backgroundColor: '#050505', borderRadius: '10px', padding: '14px', minHeight: '80px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#d1d5db', fontSize: '14px' }}>Gravação em ambiente interno.</span>
                  </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                      backgroundColor: '#10b981', 
                      borderRadius: '100px', 
                      padding: '16px', 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      transform: `scale(${buttonPressProgress})`,
                      opacity: buttonOpacityProgress
                  }}>
                      <span style={{ color: '#050505', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>⚡ Gerar Ideias Alinhadas</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>✦ Consome 1 crédito por uso</span>
              </div>
          </div>
      </div>
    </div>
  );
};
