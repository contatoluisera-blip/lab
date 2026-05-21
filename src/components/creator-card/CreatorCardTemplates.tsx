import React from 'react';
import { Mail, Phone, Globe, MapPin, Camera } from 'lucide-react';

export interface CreatorCardData {
  nome: string;
  instagram: string;
  foto: string;
  cidade: string;
  titulo: string;
  nicho: string;
  publico: string;
  servicos: string;
  diferencial: string;
  portfolioUrl: string;
  whatsapp: string;
  email: string;
  outrosLinks: string;
  resultados: string;
  template: 'premium' | 'jovem' | 'clean' | 'dark';
  cta: string;
  
  // Dados processados pela IA
  headlineIA?: string;
  bioIA?: string;
  servicosIA?: string[];
}

export function CreatorCardPreview({ data, cardRef }: { data: CreatorCardData, cardRef: React.RefObject<HTMLDivElement | null> }) {
  // Escolher o template
  const isPremium = data.template === 'premium';
  const isJovem = data.template === 'jovem';
  const isClean = data.template === 'clean';
  const isDark = data.template === 'dark';

  const title = data.headlineIA || data.titulo || 'Criador de Conteúdo';
  const bio = data.bioIA || data.diferencial || 'Especialista em criar vídeos que retêm atenção e convertem seguidores em clientes.';
  const servicosBrutos = data.servicos ? data.servicos.split(',').map(s => s.trim()).filter(Boolean) : [];
  const servicos = data.servicosIA?.length ? data.servicosIA : (servicosBrutos.length ? servicosBrutos : ['Gravação e edição de vídeos verticais', 'Estratégia de conteúdo digital']);

  // Aspect ratio 9:16 (ex: 540x960) para ficar perfeito no celular
  return (
    <div className="flex justify-center w-full overflow-hidden bg-black/50 p-4 rounded-xl border border-white/10">
      <div 
        ref={cardRef} 
        id="creator-card-element"
        className={`w-[450px] min-h-[800px] rounded-3xl relative overflow-hidden flex flex-col shadow-2xl transition-all duration-500
          ${isPremium ? 'bg-gradient-to-br from-zinc-900 to-black text-white border border-yellow-500/30' : ''}
          ${isJovem ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white border border-pink-500/30' : ''}
          ${isClean ? 'bg-zinc-50 text-zinc-900 border border-zinc-200' : ''}
          ${isDark ? 'bg-[#0a0a0a] text-zinc-300 border border-zinc-800' : ''}
        `}
      >
        {/* Header / Imagem */}
        <div className="h-64 w-full relative overflow-hidden flex-shrink-0">
          {data.foto ? (
             <img src={data.foto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-500 text-sm">Sem foto</span>
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-8 right-8">
             <h1 className="text-3xl font-bold text-white mb-1 tracking-tight drop-shadow-md">{data.nome || 'Seu Nome'}</h1>
             <div id="link-insta" className="flex items-center gap-2 text-zinc-300 text-sm font-medium w-max">
               <Camera className="w-4 h-4" />
               {data.instagram || '@seuinstagram'}
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex-1 flex flex-col gap-8 relative z-10">
          
          {/* Headline & Bio */}
          <div className="space-y-3">
             <h2 className={`text-lg font-bold uppercase tracking-widest leading-snug
                ${isPremium ? 'text-yellow-400' : ''}
                ${isJovem ? 'text-pink-400' : ''}
                ${isClean ? 'text-indigo-600' : ''}
                ${isDark ? 'text-brand-emerald' : ''}
             `}>
               {title}
             </h2>
             <p className={`text-sm leading-relaxed ${isClean ? 'text-zinc-600' : 'text-zinc-400'}`}>
               {bio}
             </p>
          </div>

          {/* Serviços */}
          <div className="space-y-4">
             <h3 className={`text-sm font-bold uppercase tracking-widest border-b pb-2
                ${isClean ? 'border-zinc-200 text-zinc-800' : 'border-white/10 text-white'}
             `}>
               Especialidades
             </h3>
             <ul className="space-y-2">
               {servicos.map((servico, idx) => (
                 <li key={idx} className="flex items-start gap-2">
                   <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                      ${isPremium ? 'bg-yellow-500' : ''}
                      ${isJovem ? 'bg-pink-500' : ''}
                      ${isClean ? 'bg-indigo-500' : ''}
                      ${isDark ? 'bg-brand-emerald' : ''}
                   `} />
                   <span className={`text-sm ${isClean ? 'text-zinc-700' : 'text-zinc-300'}`}>{servico}</span>
                 </li>
               ))}
             </ul>
          </div>

          {/* Autoridade / Resultados */}
          {data.resultados && (
            <div className={`p-4 rounded-xl
                ${isClean ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-300 border border-white/5'}
            `}>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2
                 ${isClean ? 'text-zinc-900' : 'text-white'}
              `}>Destaques & Resultados</h3>
              <p className="text-sm whitespace-pre-line leading-relaxed">{data.resultados}</p>
            </div>
          )}

          <div className="flex-1" />

          {/* Contatos / CTA */}
          <div className="space-y-4 pt-4">
            <div id="btn-cta" className={`w-full text-center py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg
               ${isPremium ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black' : ''}
               ${isJovem ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : ''}
               ${isClean ? 'bg-zinc-900 text-white' : ''}
               ${isDark ? 'bg-brand-emerald text-black' : ''}
            `}>
               {data.cta || 'Solicitar Orçamento'}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
               {data.whatsapp && (
                 <div id="btn-whatsapp" className={`flex items-center justify-center gap-2 py-2.5 rounded-lg
                    ${isClean ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-300'}
                 `}>
                   <Phone className="w-3.5 h-3.5" /> WhatsApp
                 </div>
               )}
               {data.portfolioUrl && (
                 <div id="btn-portfolio" className={`flex items-center justify-center gap-2 py-2.5 rounded-lg
                    ${isClean ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-300'}
                 `}>
                   <Globe className="w-3.5 h-3.5" /> Portfólio
                 </div>
               )}
            </div>
            {data.email && (
                <div id="btn-email" className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs w-full
                   ${isClean ? 'text-zinc-500' : 'text-zinc-500'}
                `}>
                  <Mail className="w-3 h-3" /> {data.email}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
