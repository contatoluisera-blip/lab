import React from 'react';
import { interpolate, spring, Easing } from 'remotion';

export const OrcamentoScreen: React.FC<{ frame: number, fps: number }> = ({ frame, fps }) => {
  // Entra a partir de 35.8s com um fade in
  const startFrame = fps * 35.8;
  const fadeInProgress = interpolate(frame, [startFrame, startFrame + fps * 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scaleProgress = interpolate(frame, [startFrame, startFrame + fps * 0.5], [0.95, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Spring animation for cards appearing sequentially
  const cardSpringConfig = { damping: 14, mass: 0.5, stiffness: 40 };
  const card1Spring = spring({ frame: frame - (startFrame + fps * 0.4), fps, config: cardSpringConfig });
  const card2Spring = spring({ frame: frame - (startFrame + fps * 0.6), fps, config: cardSpringConfig });
  const card3Spring = spring({ frame: frame - (startFrame + fps * 0.8), fps, config: cardSpringConfig });

  const card1Y = interpolate(card1Spring, [0, 1], [40, 0]);
  const card1Opacity = interpolate(card1Spring, [0, 1], [0, 1]);

  const card2Y = interpolate(card2Spring, [0, 1], [40, 0]);
  const card2Opacity = interpolate(card2Spring, [0, 1], [0, 1]);

  const card3Y = interpolate(card3Spring, [0, 1], [40, 0]);
  const card3Opacity = interpolate(card3Spring, [0, 1], [0, 1]);

  // Scroll sutil para a tela
  // Parte 1: Mostrar os preços (Rola para baixo para revelar o Premium)
  // Parte 2: Rola mais para baixo para mostrar o detalhamento de custos, 2 frames depois
  const scrollY = interpolate(frame, 
    [startFrame + fps, startFrame + fps * 2.5, startFrame + fps * 2.5 + 2, startFrame + fps * 6.5], 
    [0, -150, -150, -1000], 
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  return (
    <div style={{ width: '100%', height: '100%', WebkitFontSmoothing: 'antialiased', backgroundColor: '#050505', overflow: 'hidden', opacity: fadeInProgress, transform: `scale(${scaleProgress})` }}>
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '24px', transform: `translateY(${scrollY}px)` }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', marginTop: '20px' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Orçamento Dimensionado</h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Este orçamento considera 4 vídeos verticais curtos, até 4 horas de captação, edição simples, legendas, capa simples, e entrega em prazo normal. Não inclui arquivos brutos ou motion avançado.
            </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            
            {/* Card 1: Mínimo Saudável */}
            <div style={{ opacity: card1Opacity, transform: `translateY(${card1Y}px)`, backgroundColor: '#0f0f0f', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Mínimo Saudável</span>
                <span style={{ fontSize: '32px', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>R$ 3.050</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Sem margem comercial/negociação. Valor piso da operação.</span>
            </div>

            {/* Card 2: Preço Recomendado */}
            <div style={{ opacity: card2Opacity, transform: `translateY(${card2Y}px)`, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', padding: '24px', border: '1px solid #10b981', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>✦ PREÇO RECOMENDADO</span>
                </div>
                <span style={{ fontSize: '40px', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>R$ 3.650</span>
                <div style={{ display: 'inline-block', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '100px', width: 'fit-content', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>R$ 913 <span style={{ fontWeight: 'normal' }}>por vídeo</span></span>
                </div>
            </div>

            {/* Card 3: Modo Premium */}
            <div style={{ opacity: card3Opacity, transform: `translateY(${card3Y}px)`, backgroundColor: '#0f0f0f', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Modo Premium</span>
                <span style={{ fontSize: '32px', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>R$ 6.050</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Margem de lucro maximizada para clientes exigentes.</span>
            </div>

        </div>

        {/* Breakdown / Descritivo Dinâmico */}
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px', opacity: card3Opacity, transform: `translateY(${card3Y}px)` }}>
            
            <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', margin: '0 12px', fontStyle: 'italic', lineHeight: '1.5' }}>
                A precificação considera 17.8h técnicas estimadas. Valor base regional da hora operando a R$ 102,6/h. Custos diretos previstos de R$ 450.
            </p>

            <h2 style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', margin: '12px 0 4px 0', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>DETALHAMENTO DA COMPOSIÇÃO DE PREÇO</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '60px' }}>
                
                {/* Card 1 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Valor Hora Base</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Custo de vida + amortização de equipamentos + licenças.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 102,6</span>
                </div>

                {/* Card 2 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Tempo Técnico Estimado</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Captação, edição, roteiro e revisões (com desconto de volume).</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>17.8h</span>
                </div>

                {/* Card 3 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Custo Técnico Fixo</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Horas totais x Valor da Hora Base.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 1.829,97</span>
                </div>

                {/* Card 4 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Custos Diretos</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Deslocamento, alimentação, trilhas e banco de imagens.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 450</span>
                </div>

                {/* Card 5 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Direitos de Imagem</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Adicional de 8% pelo escopo e licença de uso.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 146,39</span>
                </div>

                {/* Card 6 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Risco Operacional</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Fundo de 4% para atrasos, refações e imprevistos.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 73,19</span>
                </div>

                {/* Card 7 */}
                <div style={{ backgroundColor: '#0f0f0f', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>Subtotal Técnico</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Custos + Direitos + Risco Operacional.</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>R$ 2.499,55</span>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};
