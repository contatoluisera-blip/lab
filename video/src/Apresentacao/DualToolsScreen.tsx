import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, Sequence } from "remotion";
import { MobilePhoneMockup } from "./MobilePhoneMockup";

const MobileBudget: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animation for "Sim" toggle and filling
  const isCaptacaoSim = frame > 60;
  const showHorasBox = spring({ frame: frame - 60, fps, config: { damping: 14, stiffness: 80 } });
  const horasBoxHeight = interpolate(showHorasBox, [0, 1], [0, 50], { extrapolateRight: "clamp" });
  const horasBoxOpacity = interpolate(showHorasBox, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const horasTyped = interpolate(frame, [80, 90], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  const btnClicking = frame > 120 && frame < 130;
  
  // Auto-scroll animation to reveal results
  // Starts after button click (frame 140) and scrolls up by -600px over 100 frames
  const scrollSpring = spring({ frame: frame - 140, fps, config: { damping: 20, stiffness: 60 } });
  const scrollY = interpolate(scrollSpring, [0, 1], [0, -750]);

  return (
    <MobilePhoneMockup>
      <div 
        className="flex flex-col gap-4 w-full"
        style={{ transform: `translateY(${scrollY}px)` }}
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Calculadora</h2>
          <p className="text-[9px] text-gray-400">Dimensione pacotes com custos e horas técnicas.</p>
        </div>
        
        {/* Context and Scope */}
        <div className="neo-glass-panel rounded-xl p-3 border border-white/5 flex flex-col gap-3">
          <h3 className="font-bold text-xs text-brand-emerald">1. Perfil e Contexto</h3>
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">Nível do Criador</label>
            <div className="glass-input text-[10px] py-1.5 px-2 flex justify-between font-bold">
              <span>Pleno</span><span className="text-gray-500">▼</span>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">Quantidade de Vídeos</label>
            <div className="glass-input text-[10px] py-1.5 px-2 font-bold">8</div>
          </div>
          
          <div className="pt-2 border-t border-white/10">
             <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[9px]">Inclui Captação?</span>
                <div className="flex bg-black/50 rounded p-1">
                   <button className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${isCaptacaoSim ? 'bg-brand-emerald text-black shadow-[0_0_10px_#10b981]' : 'text-gray-400'}`}>Sim</button>
                   <button className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${!isCaptacaoSim ? 'bg-[#222] text-white' : 'text-gray-400'}`}>Não</button>
                </div>
             </div>
             <div style={{ height: horasBoxHeight, opacity: horasBoxOpacity, overflow: 'hidden' }}>
                <label className="text-[9px] font-bold text-gray-400 block mb-1">Horas Estimadas</label>
                <div className="glass-input text-[10px] py-1.5 px-2 relative w-16 text-center font-bold">
                  {horasTyped > 0 ? "4" : ""}
                </div>
             </div>
          </div>
        </div>

        {/* Operational Costs Details */}
        <div className="neo-glass-panel rounded-xl p-3 border border-white/5 flex flex-col gap-3">
          <h3 className="font-bold text-xs text-brand-emerald flex justify-between">
            Seu Custo Operacional
            <span className="text-[8px] text-gray-500 font-normal">Ocultar Detalhes</span>
          </h3>
          
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">Smartphone</label>
            <div className="glass-input text-[10px] py-1.5 px-2 flex justify-between font-bold">
              <span>iPhone 15</span><span className="text-gray-500">▼</span>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">Computador</label>
            <div className="glass-input text-[10px] py-1.5 px-2 flex justify-between font-bold">
              <span>Intermediário (PC/Note)</span><span className="text-gray-500">▼</span>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">Perfil Fiscal</label>
            <div className="glass-input text-[10px] py-1.5 px-2 flex justify-between font-bold">
              <span>Simples Nacional (~6%)</span><span className="text-gray-500">▼</span>
            </div>
          </div>
          
          <div className="pt-2">
            <label className="text-[9px] font-bold text-gray-400 block mb-2">Softwares Pagos Ativos</label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-[9px] text-gray-300">
                <input type="checkbox" readOnly checked className="accent-brand-emerald" /> CapCut Pro
              </label>
              <label className="flex items-center gap-2 text-[9px] text-gray-300">
                <input type="checkbox" readOnly checked className="accent-brand-emerald" /> Canva Pro
              </label>
              <label className="flex items-center gap-2 text-[9px] text-gray-300">
                <input type="checkbox" readOnly checked={false} className="accent-brand-emerald" /> Adobe Premiere
              </label>
              <label className="flex items-center gap-2 text-[9px] text-gray-300">
                <input type="checkbox" readOnly checked className="accent-brand-emerald" /> Armazenamento (Cloud)
              </label>
            </div>
          </div>
        </div>

        {/* Button */}
        <button className={`glass-button-primary w-full py-3 text-[10px] font-bold flex items-center justify-center transition-all ${btnClicking ? 'scale-95 brightness-75' : ''}`}>
          DIMENSIONAR PREÇO FINAL
        </button>

        {/* Results Area (Revealed by scroll) */}
        <div className={`mt-4 mb-8 flex flex-col gap-4 transition-all duration-700 ${frame > 130 ? 'opacity-100' : 'opacity-0'}`}>
           <h3 className="text-lg font-bold text-center">Orçamento Dimensionado</h3>
           <p className="text-[8px] text-gray-400 text-center leading-relaxed">
             Este orçamento considera 4 vídeos verticais curtos, até 0 horas de captação, edição simples, legendas...
           </p>

           <div className="flex flex-col gap-3">
             <div className="neo-glass-panel rounded-xl p-4 border border-white/5 text-center">
               <span className="text-[8px] text-gray-500 font-bold tracking-widest mb-1 block uppercase">Mínimo Saudável</span>
               <span className="text-xl font-bold text-white">R$ 2.250</span>
               <p className="text-[7px] text-gray-500 mt-2">Sem margem comercial. Valor piso.</p>
             </div>
             <div className="neo-glass-panel rounded-xl p-4 border border-brand-emerald bg-brand-emerald/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-brand-emerald" />
               <span className="text-[9px] text-brand-emerald font-bold tracking-widest mb-1 block uppercase flex justify-center items-center gap-1">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 Preço Recomendado
               </span>
               <span className="text-3xl font-extrabold text-white">R$ 2.650</span>
               <div className="mt-3 inline-block px-2 py-0.5 rounded-full border border-brand-emerald/30 bg-brand-emerald/20 text-[8px] text-brand-emerald font-bold">
                 R$ 663 por vídeo
               </div>
             </div>
             <div className="neo-glass-panel rounded-xl p-4 border border-white/5 text-center">
               <span className="text-[8px] text-gray-500 font-bold tracking-widest mb-1 block uppercase">Modo Premium</span>
               <span className="text-xl font-bold text-white">R$ 4.400</span>
               <p className="text-[7px] text-gray-500 mt-2">Margem de lucro maximizada.</p>
             </div>
           </div>
        </div>
      </div>
    </MobilePhoneMockup>
  );
};

const MobileIdeaGenerator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btnClicking = frame > 100 && frame < 110;
  
  // Auto-scroll animation to reveal results
  // Starts after button click (frame 120) and scrolls up by a larger amount very smoothly
  const scrollSpring = spring({ frame: frame - 120, fps, config: { damping: 60, stiffness: 12 } });
  const scrollY = interpolate(scrollSpring, [0, 1], [0, -1350]);
  
  const resultsOpacity = interpolate(frame, [110, 120], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <MobilePhoneMockup>
      <div 
        className="flex flex-col gap-3 h-full relative"
        style={{ transform: `translateY(${scrollY}px)` }}
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-1">
             <svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             Gerador de Ideias
          </h2>
          <p className="text-[8px] text-gray-400">Receba roteiros estruturados baseados na dor do seu cliente e no escopo vendido.</p>
        </div>

        {/* Tabs */}
        <div className="neo-glass-panel rounded-xl p-1 border border-white/5 flex gap-1">
           <div className="flex-1 text-center bg-brand-emerald text-black font-bold text-[8px] py-2 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.3)]">
             MODO ESTRATÉGICO
           </div>
           <div className="flex-1 text-center text-gray-400 font-bold text-[8px] py-2">
             MODO LIVRE
           </div>
        </div>
        
        {/* Form Container */}
        <div className="neo-glass-panel rounded-xl p-3 border border-white/5 flex flex-col gap-3">
          
          <div className="border border-brand-emerald/30 bg-brand-emerald/5 p-2 rounded-lg text-[8px] text-brand-emerald leading-relaxed">
            Use o diagnóstico e o orçamento aprovado para gerar ideias que não extrapolam a capacidade de produção.
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Cliente / Projeto</label>
            <div className="glass-input text-[9px] py-2 px-2 flex justify-between items-center font-bold">
              <span>luiserayt</span>
              <svg className="w-2 h-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Diagnóstico (Problema)</label>
            <div className="glass-input text-[9px] py-2 px-2 flex justify-between items-center font-bold">
              <span>@luiserayt - Nota: (22/05/2026)</span>
              <svg className="w-2 h-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Orçamento (Escopo)</label>
            <div className="glass-input text-[9px] py-2 px-2 flex justify-between items-center font-bold">
              <span>Pacote: 4 vídeos - R$ 2.650...</span>
              <svg className="w-2 h-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Qtd Ideias</label>
              <div className="glass-input text-[9px] py-2 px-2 font-bold">4</div>
            </div>
            <div>
              <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Foco Criativo</label>
              <div className="glass-input text-[9px] py-2 px-2 flex justify-between items-center font-bold">
                <span>Autoridade</span>
                <svg className="w-2 h-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Observações / Restrições</label>
            <div className="glass-input text-[9px] py-2 px-2 text-gray-500 h-10 flex items-start">
              Ex: Não mostrar rosto...
            </div>
          </div>

          <button className={`glass-button-primary w-full py-3 text-[9px] mt-2 font-bold transition-all ${btnClicking ? 'scale-95 brightness-75 bg-brand-jade' : ''}`}>
            {frame > 110 ? 'GERANDO IDEIAS...' : 'GERAR IDEIAS ALINHADAS'}
          </button>
        </div>

        {/* Generated Results Area */}
        <div className={`mt-4 mb-8 flex flex-col gap-4 transition-opacity duration-500 ${frame > 115 ? 'opacity-100' : 'opacity-0'}`}>
           
           {/* Plano Estratégico */}
           <div className="neo-glass-panel rounded-xl p-4 border border-white/5">
             <h3 className="text-sm font-bold text-white mb-4">Plano Criativo Estratégico</h3>
             
             <div className="mb-4">
               <h4 className="text-[8px] font-bold text-brand-emerald mb-1 uppercase tracking-widest flex items-center gap-1">
                 <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Visão Geral
               </h4>
               <p className="text-[8px] text-gray-300 leading-relaxed">
                 Para melhorar o desempenho do criador @luiserayt, optamos por uma estratégia que reforça a autoridade no nicho de tecnologia. A ênfase será dada à criação de vídeos educativos que ressoem com o público-alvo.
               </p>
             </div>

             <div className="mb-4">
               <h4 className="text-[8px] font-bold text-brand-emerald mb-1 uppercase tracking-widest flex items-center gap-1">
                 <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 Direção Criativa
               </h4>
               <p className="text-[8px] text-gray-300 leading-relaxed">
                 O visual dos vídeos deve ser limpo e focado em elementos práticos de ensino, usando cenário caseiro bem arrumado. O tom será de um mentor próximo que simplifica conceitos complexos.
               </p>
             </div>

             <div className="pt-3 border-t border-white/10">
               <h4 className="text-[8px] font-bold text-brand-emerald mb-1 uppercase tracking-widest flex items-center gap-1">
                 <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Organização da Gravação
               </h4>
               <p className="text-[8px] text-gray-300 leading-relaxed">
                 Recomenda-se começar a gravação pela ambientação e configuração do cenário. Primeiro, grave todos os takes de introdução ao direto da câmera.
               </p>
             </div>
           </div>

           <h3 className="text-sm font-bold text-white mb-1">Ideias de Conteúdo</h3>

           {/* Ideia 1 */}
           <div className="neo-glass-panel rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[7px] font-bold text-gray-300">IDEIA 1</span>
                <span className="text-[7px] text-brand-emerald uppercase font-bold tracking-wider">Desmistificando IA</span>
              </div>
              <h4 className="text-sm font-bold mb-3">Desmistificando a IA</h4>
              
              <div className="border border-brand-emerald/30 bg-brand-emerald/10 p-3 rounded-lg mb-4">
                <span className="text-[7px] text-brand-emerald block mb-1">Gancho sugerido:</span>
                <p className="text-[10px] font-bold text-white leading-tight">
                  "Você já se perguntou como a Inteligência Artificial transforma seu smartphone?"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                   <h5 className="text-[7px] text-gray-400 font-bold mb-1 flex items-center gap-1"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> CONCEITO</h5>
                   <p className="text-[8px] text-gray-300">Explicações diretas com exemplos visuais práticos usando objetos do cotidiano.</p>
                </div>
                <div>
                   <h5 className="text-[7px] text-gray-400 font-bold mb-1 uppercase">Lista de Takes</h5>
                   <ul className="text-[8px] text-gray-300 list-disc pl-2">
                     <li>Abertura falando pra câmera</li>
                     <li>Demonstrando funcionalidade</li>
                   </ul>
                </div>
              </div>

              <div className="bg-[#111] p-3 rounded-lg border border-white/5 mb-3">
                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">CAPTAÇÃO</h5>
                 <p className="text-[7px] text-gray-300 mb-2">Grave em área bem iluminada da casa, mantendo a câmera fixa.</p>
                 
                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">EDIÇÃO</h5>
                 <p className="text-[7px] text-gray-300 mb-2">Use cortes rápidos para partes explicativas.</p>

                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">ATENÇÃO (RETENÇÃO)</h5>
                 <p className="text-[7px] text-brand-emerald font-bold">Evite longas explicações sem referência visual.</p>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-white/5">
                 <div>
                   <span className="text-[7px] text-gray-500 block mb-0.5">CALL TO ACTION</span>
                   <p className="text-[8px] font-bold">Acesse o link na bio para saber mais.</p>
                 </div>
                 <div className="text-right">
                   <span className="text-[7px] text-gray-500 block mb-0.5">TEMPO EST.</span>
                   <p className="text-[8px] font-bold">1 hora</p>
                 </div>
              </div>
           </div>

           {/* Ideia 2 */}
           <div className="neo-glass-panel rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[7px] font-bold text-gray-300">IDEIA 2</span>
                <span className="text-[7px] text-brand-emerald uppercase font-bold tracking-wider">Hackeando seu Smartphone</span>
              </div>
              <h4 className="text-sm font-bold mb-3">Hackeando seu smartphone</h4>
              
              <div className="border border-brand-emerald/30 bg-brand-emerald/10 p-3 rounded-lg mb-4">
                <span className="text-[7px] text-brand-emerald block mb-1">Gancho sugerido:</span>
                <p className="text-[10px] font-bold text-white leading-tight">
                  "Descubra hacks que você ainda não usa no seu smartphone!"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                   <h5 className="text-[7px] text-gray-400 font-bold mb-1 flex items-center gap-1"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> CONCEITO</h5>
                   <p className="text-[8px] text-gray-300">Hands-on com dicas práticas e uso de telas divididas para comparações.</p>
                </div>
                <div>
                   <h5 className="text-[7px] text-gray-400 font-bold mb-1 uppercase">Lista de Takes</h5>
                   <ul className="text-[8px] text-gray-300 list-disc pl-2">
                     <li>Introdução em frente à câmera</li>
                     <li>Shows close-ups de tela de smartphone</li>
                   </ul>
                </div>
              </div>

              <div className="bg-[#111] p-3 rounded-lg border border-white/5 mb-3">
                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">CAPTAÇÃO</h5>
                 <p className="text-[7px] text-gray-300 mb-2">Utilize um tripé para gravação estável e ajuste o foco na tela.</p>
                 
                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">EDIÇÃO</h5>
                 <p className="text-[7px] text-gray-300 mb-2">Adicione setas e destaques visuais no vídeo para facilitar.</p>

                 <h5 className="text-[7px] text-gray-400 font-bold mb-1">ATENÇÃO (RETENÇÃO)</h5>
                 <p className="text-[7px] text-brand-emerald font-bold">Mantenha energia alta e explore visualmente cada ponto.</p>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-white/5">
                 <div>
                   <span className="text-[7px] text-gray-500 block mb-0.5">CALL TO ACTION</span>
                   <p className="text-[8px] font-bold">Para mais hacks, siga meu perfil e veja o link na bio.</p>
                 </div>
                 <div className="text-right">
                   <span className="text-[7px] text-gray-500 block mb-0.5">TEMPO EST.</span>
                   <p className="text-[8px] font-bold">1.5 horas</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </MobilePhoneMockup>
  );
};

export const DualToolsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide up animations from bottom with curved spring
  const slide1 = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 70 } });
  const slide2 = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 70 } }); 

  const y1 = interpolate(slide1, [0, 1], [1000, 0]);
  const y2 = interpolate(slide2, [0, 1], [1000, 0]);

  // 3D Spin Exit Animation starting at frame 200 (absolute 34:00)
  const spinExit1 = spring({ frame: frame - 200, fps, config: { damping: 14, stiffness: 60 } });
  const rotateY1 = interpolate(spinExit1, [0, 1], [0, 90]);
  const scaleOut1 = interpolate(spinExit1, [0, 1], [1, 0.5]);
  const opacityOut1 = interpolate(spinExit1, [0.8, 1], [1, 0]); // Fade out at the very end of spin

  const spinExit2 = spring({ frame: frame - 210, fps, config: { damping: 14, stiffness: 60 } });
  const rotateY2 = interpolate(spinExit2, [0, 1], [0, -90]);
  const scaleOut2 = interpolate(spinExit2, [0, 1], [1, 0.5]);
  const opacityOut2 = interpolate(spinExit2, [0.8, 1], [1, 0]);

  return (
    <div className="w-full h-full flex items-center justify-center gap-28 bg-transparent text-white" style={{ perspective: '2000px' }}>
      <div style={{ transform: `translateY(${y1}px) rotateY(${rotateY1}deg) scale(${scaleOut1})`, opacity: opacityOut1, transformStyle: 'preserve-3d' }}>
        <MobileBudget />
      </div>
      <div style={{ transform: `translateY(${y2}px) rotateY(${rotateY2}deg) scale(${scaleOut2})`, opacity: opacityOut2, transformStyle: 'preserve-3d' }}>
        <MobileIdeaGenerator />
      </div>
    </div>
  );
};
