import React from 'react';
import { interpolate } from 'remotion';

export const PropostasScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  return (
    <div style={{ width: '100%', height: '100%', WebkitFontSmoothing: 'antialiased', backgroundColor: '#050505', overflow: 'hidden', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '12px', color: '#10b981' }}>📄</span>
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>Motor Comercial B2B</span>
        </div>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', margin: '8px 0 0 0' }}>Gerador de Propostas</h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
            Compile argumentos comerciais inquebráveis conectando dados do seu diagnóstico e valores da calculadora.
        </p>
      </div>

      {/* Main Form Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#0f0f0f', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Seção 1: Base de Dados */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>1. Base de Dados (Vínculos)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Card Diagnóstico */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Diagnóstico (O Problema)</span>
                          <div style={{ backgroundColor: '#050505', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#9ca3af', fontSize: '11px' }}>-- Não vincular (Entrada Manual)</span>
                              <span style={{ color: '#6b7280', fontSize: '11px' }}>↕</span>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '10px', lineHeight: '1.4' }}>A IA usará os pontos fracos identificados para justificar a urgência do serviço.</span>
                      </div>

                      {/* Card Orçamento */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Orçamento (O Investimento)</span>
                          <div style={{ backgroundColor: '#050505', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#9ca3af', fontSize: '11px' }}>-- Não vincular (Preço Sob Demanda)</span>
                              <span style={{ color: '#6b7280', fontSize: '11px' }}>↕</span>
                          </div>
                          <span style={{ color: '#6b7280', fontSize: '10px', lineHeight: '1.4' }}>Fornece o valor validado tecnicamente, evitando que o cliente negocie margens não mapeadas.</span>
                      </div>
                  </div>
              </div>

              {/* Seção 2: Dados Complementares */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>2. Dados Complementares</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>Nome da Empresa/Cliente</label>
                          <div style={{ backgroundColor: '#050505', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>Ex: Clínica Sorriso Metálico</span>
                          </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>Objetivo Primário</label>
                          <div style={{ backgroundColor: '#050505', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>Ex: Aumentar agendamentos</span>
                          </div>
                      </div>
                  </div>

                  {/* Modo de Geração */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <label style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>Modo de Geração</label>
                      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#050505', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ color: '#6b7280', fontSize: '11px' }}>Rápida</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                              <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>Profissional</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ color: '#6b7280', fontSize: '11px' }}>Premium</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: '#10b981', borderRadius: '100px', padding: '16px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ color: '#050505', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>🚀 Gerar Proposta Comercial</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>✦ Consome 1 crédito por uso</span>
              </div>

          </div>
      </div>
    </div>
  );
};
