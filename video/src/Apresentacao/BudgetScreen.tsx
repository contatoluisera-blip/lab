import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const BudgetScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animation for changing selections
  const highlightPremium = frame > 100;
  
  // Captação Animation
  const isCaptacaoSim = frame > 130;
  const showHorasBox = spring({
    frame: frame - 130,
    fps,
    config: { damping: 14, stiffness: 80 }
  });
  const horasBoxHeight = interpolate(showHorasBox, [0, 1], [0, 80], { extrapolateRight: "clamp" });
  const horasBoxOpacity = interpolate(showHorasBox, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  
  const horasTyped = interpolate(frame, [150, 160], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  // Final button animation
  const showFinalPrice = frame > 190;
  const btnClicking = frame > 190 && frame < 200;

  return (
    <div className="w-[1200px] h-[900px] flex flex-col bg-transparent text-white font-sans relative">
      
      {/* Title Section (Matching screenshot) */}
      <div className="mb-8">
         <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 bg-white/5 text-xs font-bold text-gray-300 mb-4">
           <svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
           </svg>
           Motor de Precificação
         </div>
         <h1 className="text-4xl font-extrabold mb-2">Calculadora de Orçamento</h1>
         <p className="text-gray-400 text-sm">Dimensione pacotes de forma realista baseando-se em custos fixos, horas técnicas e proteção de imagem.</p>
      </div>

      <div className="flex gap-6">
        {/* Left Column */}
        <div className="flex-[2] flex flex-col gap-6">
          
          <div className="neo-glass-panel rounded-2xl p-6 border border-white/5 relative">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <svg className="w-5 h-5 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               1. Perfil e Contexto
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Nível do Criador</label>
                <div className="glass-input text-sm flex justify-between font-bold">
                  <span>Pleno</span>
                  <span className="text-gray-500">▼</span>
                </div>
                <p className="text-brand-emerald text-xs mt-2 font-bold">3 a 5 anos. Consistência e fluxo de trabalho sólido.</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Localização (Região)</label>
                <div className="flex gap-2">
                  <div className="glass-input text-sm flex-1 flex justify-between font-bold"><span>SP</span><span>▼</span></div>
                  <div className="glass-input text-sm flex-[2] flex justify-between font-bold"><span>São Paulo</span><span>▼</span></div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Usado para aplicar o fator regional do custo de vida.</p>
              </div>
            </div>

            <label className="text-sm font-bold text-gray-300 block mb-2">Modo de Oferta</label>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${!highlightPremium ? 'border-brand-emerald bg-brand-glow/20' : 'border-white/10'} transition-all`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${!highlightPremium ? 'bg-brand-emerald shadow-[0_0_10px_#10b981]' : 'bg-transparent border border-gray-500'}`} />
                  <span className="font-bold text-sm">Mercado / Lean</span>
                </div>
                <p className="text-[10px] text-gray-400">Foco em volume e viabilidade. 1 revisão, edição objetiva.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-transparent border border-gray-500" />
                  <span className="font-bold text-sm">Profissional / Padrão</span>
                </div>
                <p className="text-[10px] text-gray-400">Equilíbrio ideal. 2 revisões, edição personalizada e roteiro.</p>
              </div>
              <div className={`p-4 rounded-xl border ${highlightPremium ? 'border-brand-emerald bg-brand-glow/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/10'} transition-all duration-500`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${highlightPremium ? 'bg-brand-emerald shadow-[0_0_10px_#10b981]' : 'bg-transparent border border-gray-500'}`} />
                  <span className="font-bold text-sm">Premium</span>
                </div>
                <p className="text-[10px] text-gray-400">Marcas maiores. Múltiplas revisões, edição estratégica.</p>
              </div>
            </div>
          </div>

          <div className="neo-glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <svg className="w-5 h-5 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               2. Escopo Técnico
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Quantidade de Vídeos</label>
                <div className="glass-input text-sm font-bold">8</div>
                <p className="text-gray-500 text-[10px] mt-2">O Fator de Volume será aplicado automaticamente.</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Complexidade de Edição</label>
                <div className="glass-input text-sm flex justify-between font-bold">
                  <span>Intermediária (Dinâmica, B-rolls)</span>
                  <span className="text-gray-500">▼</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="font-bold text-sm block">Inclui Captação de Imagem?</span>
                    <span className="text-xs text-gray-500">Define se haverá deslocamento e gravação física.</span>
                  </div>
                  <div className="flex bg-black/50 rounded-lg p-1 border border-white/5">
                     <button className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${isCaptacaoSim ? 'bg-brand-emerald text-black shadow-[0_0_15px_#10b981]' : 'text-gray-400'}`}>Sim</button>
                     <button className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!isCaptacaoSim ? 'bg-[#222] text-white' : 'text-gray-400'}`}>Não</button>
                  </div>
               </div>
               
               {/* Expandable Horas Box */}
               <div style={{ height: horasBoxHeight, opacity: horasBoxOpacity, overflow: 'hidden' }}>
                  <label className="text-sm font-bold text-gray-300 block mb-2">Horas de Captação Estimadas</label>
                  <div className="flex items-center gap-4">
                    <div className="glass-input w-24 text-center font-bold relative flex items-center justify-center">
                      {horasTyped > 0 ? "4" : ""}
                    </div>
                    <span className="text-sm text-gray-400">Horas no local (inclui montagem e desmontagem)</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="neo-glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <svg className="w-5 h-5 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               3. Direitos e Entrega
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Uso de Imagem e Direitos</label>
                <div className="glass-input text-sm flex justify-between font-bold">
                  <span>Orgânico + Tráfego Local (Até 3 meses) [+8%]</span>
                  <span className="text-gray-500">▼</span>
                </div>
                <p className="text-gray-500 text-[10px] mt-2">Acresce percentual sobre o valor técnico.</p>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Tipo de Prazo</label>
                <div className="glass-input text-sm flex justify-between font-bold">
                  <span>Prazo Padrão (Ex: 7 a 15 dias úteis)</span>
                  <span className="text-gray-500">▼</span>
                </div>
                <p className="text-gray-500 text-[10px] mt-2">Aplica multiplicador de urgência.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Cost and Final Button */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="neo-glass-panel rounded-2xl p-6 border border-white/5">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                 Seu Custo Operacional
              </div>
              <span className="text-brand-emerald font-normal cursor-pointer text-xs">Ajustar Custos</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              A calculadora amortiza os custos do seu equipamento e assinaturas de software no valor da sua hora. Para ajustar os fatores (Smartphone, PC, Impostos), clique em Ajustar Custos.
            </p>
          </div>

          <button 
            className={`glass-button-primary w-full py-4 text-sm mt-4 flex items-center justify-center gap-2 transition-all duration-300 ${btnClicking ? 'scale-95 brightness-75' : showFinalPrice ? 'shadow-[0_0_30px_rgba(16,185,129,0.5)]' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            DIMENSIONAR PREÇO FINAL
          </button>
          
          <div className="flex justify-center items-center gap-2 text-brand-emerald text-xs mt-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Consome 1 crédito por uso
          </div>
        </div>
      </div>
    </div>
  );
};
