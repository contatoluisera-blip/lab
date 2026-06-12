import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring, Img, staticFile } from "remotion";
import { MobilePhoneMockup } from "./MobilePhoneMockup";

export const CreatorCardScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const contentFade = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  
  // Left side slide in
  const leftSlide = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 80 } });
  const leftX = interpolate(leftSlide, [0, 1], [-100, 0]);
  
  // Right side slide in
  const rightSlide = spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 80 } });
  const rightX = interpolate(rightSlide, [0, 1], [100, 0]);

  // Typing animations for the realtime effect
  const typeSpring = spring({ frame: frame - 60, fps, config: { damping: 14, stiffness: 60, overshootClamping: true } });
  const typeProgress = interpolate(typeSpring, [0, 1], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const nomeText = "Luis Freitas";
  const nomeTyped = nomeText.substring(0, Math.round(typeProgress * nomeText.length));

  const instaText = "luiserayt";
  const instaTyped = instaText.substring(0, Math.round(typeProgress * instaText.length));

  const tituloText = "Criador Mobile";
  const tituloTyped = tituloText.substring(0, Math.round(typeProgress * tituloText.length));

  // Exit transition starting at frame 202 (41:10 absolute)
  const exitSpring = spring({ frame: frame - 202, fps, config: { damping: 14, stiffness: 60 } });
  const exitScale = interpolate(exitSpring, [0, 1], [1, 1.15]); // Zoom in to blur out
  const exitOpacity = interpolate(exitSpring, [0, 1], [1, 0]);
  const exitBlur = interpolate(exitSpring, [0, 1], [0, 30]);

  return (
    <div 
      className="w-full h-full flex items-start justify-center gap-12 bg-transparent text-white pt-10" 
      style={{ 
         opacity: Math.min(contentFade, exitOpacity),
         filter: `blur(${exitBlur}px)`,
         transform: `scale(${exitScale})`
      }}
    >
      
      {/* LEFT SIDE: Form */}
      <div 
        className="w-[45%] h-[90%] flex flex-col"
        style={{ transform: `translateX(${leftX}px)` }}
      >
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 border border-brand-emerald/30 bg-[#0a1612] px-3 py-1 rounded-full text-[10px] text-gray-300 mb-4">
             <svg className="w-3 h-3 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
             Identidade Profissional
          </div>
          <h2 className="text-3xl font-extrabold mb-2">Cartão do Creator</h2>
          <p className="text-xs text-gray-400">Transforme suas informações em um PDF profissional, clicável e pronto para enviar por WhatsApp e fechar parcerias.</p>
        </div>

        <div className="neo-glass-panel rounded-xl p-2 border border-white/5 flex gap-2 mb-4 w-1/2">
           <div className="flex-1 text-center bg-[#2f78ff] text-white font-bold text-[9px] py-2 rounded shadow-[0_0_15px_rgba(47,120,255,0.4)]">
             MODO RÁPIDO
           </div>
           <div className="flex-1 text-center text-gray-400 font-bold text-[9px] py-2">
             MODO COMPLETO
           </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto pr-4 flex flex-col gap-6" style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}>
            
            {/* Section 1 */}
            <div className="neo-glass-panel rounded-xl p-5 border border-white/5 flex flex-col gap-4">
               <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Identidade Básica</h3>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Nome Profissional</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{nomeTyped}</div>
                 </div>
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Instagram (@)</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{instaTyped}</div>
                 </div>
               </div>

               <div>
                 <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Foto de Perfil</label>
                  <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative">
                      <img src={staticFile("imagem siteapp.png")} className="w-full h-full object-cover" />
                   </div>
                   <button className="bg-[#1a222c] border border-white/10 rounded px-3 py-1.5 text-[9px] font-bold text-gray-300">Escolher Imagem</button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Título Profissional</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{tituloTyped}</div>
                 </div>
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Nicho Principal</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{frame > 60 ? "Política" : ""}</div>
                 </div>
               </div>
            </div>

            {/* Section 2 */}
            <div className="neo-glass-panel rounded-xl p-5 border border-white/5 flex flex-col gap-4">
               <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Serviços e Posicionamento</h3>
               
               <div>
                 <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Para quem você cria?</label>
                 <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{frame > 70 ? "Agências e Artistas" : ""}</div>
               </div>
               <div>
                 <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Serviços Principais (Separados por vírgula)</label>
                 <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{frame > 80 ? "Cobertura realtime, edição complexa" : ""}</div>
               </div>
               <div>
                 <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Qual seu principal diferencial?</label>
                 <div className="glass-input text-xs py-2 px-3 font-bold bg-[#0d1117] border-[#222a35] h-16 flex items-start leading-relaxed text-gray-300">
                    {frame > 90 ? "Efeitos 3D em tempo real.\nEdição com IA pelo celular." : ""}
                 </div>
               </div>
            </div>

             {/* Section 3 */}
             <div className="neo-glass-panel rounded-xl p-5 border border-white/5 flex flex-col gap-4">
               <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-brand-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> Contatos e Visual</h3>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">WhatsApp (Apenas Números)</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{frame > 100 ? "61983347857" : ""}</div>
                 </div>
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Link do Portfólio</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#151a21] border-[#222a35] h-9 flex items-center">{frame > 100 ? "luisera.com.br" : ""}</div>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Botão Principal (CTA)</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#0d1117] border-[#222a35] h-9 flex items-center">{frame > 110 ? "ENTRAR EM CONTATO" : ""}</div>
                 </div>
                 <div>
                   <label className="text-[8px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Estilo Visual</label>
                   <div className="glass-input text-xs py-2 px-3 font-bold bg-[#0d1117] border-[#222a35] h-9 flex items-center">{frame > 110 ? "Dark & Elegante (Verde Neon)" : ""}</div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Phone Mockup */}
      <div 
        className="w-[30%] h-[95%] flex flex-col items-center relative"
        style={{ transform: `translateX(${rightX}px)` }}
      >
        <div className="w-full neo-glass-panel rounded-2xl p-4 mb-4 border border-white/5 flex flex-col items-center">
           <button className="bg-brand-emerald text-black font-extrabold text-sm py-3 px-6 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] w-[80%] flex justify-center items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             GERAR PDF
           </button>
           <p className="text-[8px] text-brand-emerald/70 mt-2 flex items-center gap-1">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             Consome 1 crédito por uso
           </p>
        </div>

        <div className="transform origin-top scale-[0.8] w-[400px]">
           <MobilePhoneMockup>
              <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex flex-col border border-white/10 rounded-[35px]">
                 
                 {/* Image Header */}
                 <div className="h-[250px] w-full relative">
                    <img src={staticFile("imagem siteapp.png")} className="w-full h-full object-cover object-top opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                    
                    <div className="absolute bottom-4 left-6">
                      <h1 className="text-3xl font-extrabold tracking-tight">{nomeTyped}</h1>
                      <div className="flex items-center gap-1 mt-1 text-gray-300">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                         <span className="text-xs font-medium">@{instaTyped}</span>
                      </div>
                    </div>
                 </div>

                 <div className="flex-1 p-6 flex flex-col">
                    <h2 className="text-brand-emerald font-extrabold tracking-widest text-sm uppercase mb-3">{tituloTyped}</h2>
                    <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                      {frame > 90 ? "Efeitos 3D em tempo real. Edição com IA pelo celular." : ""}
                    </p>

                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-3 border-b border-white/10 pb-2">ESPECIALIDADES</h3>
                    <ul className="text-xs text-gray-300 flex flex-col gap-2 mb-auto">
                       {frame > 80 && (
                         <>
                           <li className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> Cobertura realtime
                           </li>
                           <li className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" /> edição complexa
                           </li>
                         </>
                       )}
                    </ul>

                    {/* Footer Actions */}
                    <div className="mt-6 flex flex-col gap-3">
                       <button className="w-full bg-brand-emerald text-black font-extrabold py-3 rounded text-xs">
                         ENTRAR EM CONTATO
                       </button>
                       <div className="grid grid-cols-2 gap-2">
                          <button className="bg-[#1a1a1a] text-xs font-medium py-2 rounded flex justify-center items-center gap-2 border border-white/5">
                             <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                             WhatsApp
                          </button>
                          <button className="bg-[#1a1a1a] text-xs font-medium py-2 rounded flex justify-center items-center gap-2 border border-white/5">
                             <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                             Portfólio
                          </button>
                       </div>
                       <div className="text-center mt-2 flex items-center justify-center gap-1 text-[8px] text-gray-500">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          luiserafreitasyt@gmail.com
                       </div>
                    </div>
                 </div>
              </div>
           </MobilePhoneMockup>
        </div>

      </div>
    </div>
  );
};
