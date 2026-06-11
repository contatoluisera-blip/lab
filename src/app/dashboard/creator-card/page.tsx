'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { CreatorCardPreview, CreatorCardData } from '@/components/creator-card/CreatorCardTemplates';
import { 
  IdCard, Sparkles, Download, Image as ImageIcon, Briefcase, 
  User, Link as LinkIcon, Settings, Target, Zap
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';

export default function CreatorCardPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit } = useUserProfile();
  
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [modo, setModo] = useState<'rapido' | 'completo'>('rapido');
  const [fotoUrl, setFotoUrl] = useState('');
  
  const [formData, setFormData] = useState<CreatorCardData>({
    nome: '',
    instagram: '',
    foto: '',
    cidade: '',
    titulo: '',
    nicho: '',
    publico: '',
    servicos: '',
    diferencial: '',
    portfolioUrl: '',
    whatsapp: '',
    email: '',
    outrosLinks: '',
    resultados: '',
    template: 'dark',
    cta: 'Solicitar Orçamento',
  });

  // Carregar dados iniciais do usuário
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      let initialName = user.displayName || '';
      let initialEmail = user.email || '';
      let initialPhoto = '';
      
      const savedSettings = localStorage.getItem('asa_settings');
      if (savedSettings) {
        try {
          const data = JSON.parse(savedSettings);
          if (data.name) initialName = data.name;
          if (data.corporateEmail) initialEmail = data.corporateEmail;
        } catch (e) {}
      }

      setFormData(prev => ({
        ...prev,
        nome: prev.nome || initialName,
        email: prev.email || initialEmail,
      }));
      // A foto não é mais pré-carregada para incentivar o usuário a fazer o upload
    };
    
    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFotoUrl(result);
        setFormData(prev => ({ ...prev, foto: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAndDownload = async () => {
    if (!formData.nome || !formData.titulo || !formData.nicho) {
      alert('Preencha pelo menos Nome, Título Profissional e Nicho de atuação.');
      return;
    }

    const creditResult = await consumeCredit('creator-card');
    if (!creditResult.ok) {
      alert(creditResult.reason === 'no_credits' 
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano.' 
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tools/creator-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          nicho: formData.nicho,
          publico: formData.publico,
          diferencial: formData.diferencial,
          servicos: formData.servicos.split(',').map(s => s.trim()).filter(Boolean)
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar conteúdo com IA');
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        headlineIA: data.headline,
        bioIA: data.bio,
        servicosIA: data.servicosFormatados
      }));

      // Esperar renderização do React e carregamento de imagens antes do html2canvas
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!cardRef.current) return;
      
      const cardEl = cardRef.current;
      const cardRect = cardEl.getBoundingClientRect();
      
      // Calcular a altura do PDF mantendo a proporção EXATA do elemento na tela para não achatar
      const pdfWidth = 108;
      const pdfHeight = (cardRect.height * pdfWidth) / cardRect.width;

      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const imgData = await htmlToImage.toPng(cardEl, {
        pixelRatio: 2,
        style: {
          borderRadius: '0px', // Remove a borda arredondada na hora de tirar a foto para preencher o PDF
        }
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Links clicáveis calculados dinamicamente
      const addLinkToPdf = (id: string, url: string) => {
        const el = document.getElementById(id);
        if (!el || !url) return;
        const rect = el.getBoundingClientRect();
        
        // Calcular posição e tamanho relativos ao card
        const x = ((rect.left - cardRect.left) / cardRect.width) * pdfWidth;
        const y = ((rect.top - cardRect.top) / cardRect.height) * pdfHeight;
        const w = (rect.width / cardRect.width) * pdfWidth;
        const h = (rect.height / cardRect.height) * pdfHeight;
        
        pdf.link(x, y, w, h, { url });
      };

      if (formData.instagram) {
        let urlInsta = formData.instagram.trim();
        if (!urlInsta.startsWith('http')) {
           urlInsta = `https://instagram.com/${urlInsta.replace('@', '')}`;
        }
        addLinkToPdf('link-insta', urlInsta);
      }
      
      let whatsAppUrl = '';
      if (formData.whatsapp) {
        whatsAppUrl = `https://wa.me/${formData.whatsapp.replace(/\D/g, '')}`;
        addLinkToPdf('btn-whatsapp', whatsAppUrl);
      }
      
      let portUrl = '';
      if (formData.portfolioUrl) {
        portUrl = formData.portfolioUrl.trim();
        if (!portUrl.startsWith('http')) {
           portUrl = `https://${portUrl}`;
        }
        addLinkToPdf('btn-portfolio', portUrl);
      }
      
      if (formData.email) {
        addLinkToPdf('btn-email', `mailto:${formData.email.trim()}`);
      }
      
      // CTA Button
      const mainLink = portUrl || whatsAppUrl;
      if (mainLink) {
         addLinkToPdf('btn-cta', mainLink);
      }

      pdf.save(`CreatorCard_${formData.nome.replace(/\s+/g, '')}.pdf`);

      if (user) {
        addNotification(
          user.uid,
          'Cartão do Creator Gerado',
          `O cartão profissional em PDF para ${formData.nome} foi criado com sucesso!`,
          'success'
        );
      }

    } catch (err: any) {
      console.error(err);
      alert(`Erro no Mídia Kit: ${err.message || 'Falha desconhecida'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-blue-400 bg-blue-500/10 text-sm font-medium w-fit mb-2">
          <IdCard className="w-4 h-4" />
          <span className="text-white">Identidade Profissional</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Cartão do Creator</h1>
        <p className="text-gray-400 font-light tracking-wide max-w-2xl">
          Transforme suas informações em um PDF profissional, clicável e pronto para enviar por WhatsApp e fechar parcerias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-2 border-white/5 flex gap-3">
            <button 
              onClick={() => setModo('rapido')}
              className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${modo === 'rapido' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Modo Rápido
            </button>
            <button 
              onClick={() => setModo('completo')}
              className={`flex-1 py-3 px-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${modo === 'completo' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Modo Completo
            </button>
          </GlassCard>

          <GlassCard className="p-8 border-white/5 space-y-8">
            
            {/* Bloco 1: Identidade */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <User className="w-5 h-5 text-blue-400" />
                 <h2 className="text-lg font-bold text-white">Identidade Básica</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Nome Profissional</label>
                   <input name="nome" value={formData.nome} onChange={handleChange} className="w-full glass-input" placeholder="Ex: Luisera" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Instagram (@)</label>
                   <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full glass-input" placeholder="@seuinstagram" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Foto de Perfil</label>
                 <div className="flex items-center gap-4">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Avatar" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors border border-white/10">
                      Escolher Imagem
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Título Profissional</label>
                   <input name="titulo" value={formData.titulo} onChange={handleChange} className="w-full glass-input" placeholder="Ex: Criador Mobile, Videomaker" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Nicho Principal</label>
                   <input name="nicho" value={formData.nicho} onChange={handleChange} className="w-full glass-input" placeholder="Ex: Gastronomia, Moda, Saúde" />
                 </div>
               </div>
            </div>

            {/* Bloco 2: Serviços e Oferta */}
            <div className="space-y-6 pt-4">
               <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <Briefcase className="w-5 h-5 text-brand-mint" />
                 <h2 className="text-lg font-bold text-white">Serviços e Posicionamento</h2>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Para quem você cria?</label>
                 <input name="publico" value={formData.publico} onChange={handleChange} className="w-full glass-input" placeholder="Ex: Restaurantes, Lojas Locais, Infoprodutores" />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Serviços Principais (separados por vírgula)</label>
                 <input name="servicos" value={formData.servicos} onChange={handleChange} className="w-full glass-input" placeholder="Ex: Cobertura Mobile, Edição de Reels, Roteiros" />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Qual seu principal diferencial?</label>
                 <textarea name="diferencial" value={formData.diferencial} onChange={handleChange} className="w-full glass-input min-h-[80px]" placeholder="Ex: Entrego vídeos com qualidade profissional no mesmo dia da gravação usando apenas celular." />
               </div>
            </div>

            {/* Bloco Completo (Opcional) */}
            {modo === 'completo' && (
              <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-4">
                 <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                   <Target className="w-5 h-5 text-purple-400" />
                   <h2 className="text-lg font-bold text-white">Autoridade e Resultados</h2>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Principais Destaques e Números</label>
                   <textarea name="resultados" value={formData.resultados} onChange={handleChange} className="w-full glass-input min-h-[100px]" placeholder="+120 vídeos produzidos&#10;Marcas atendidas: Nike, Apple&#10;Especialista em retenção" />
                 </div>
              </div>
            )}

            {/* Bloco 3: Contatos e Visual */}
            <div className="space-y-6 pt-4">
               <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <LinkIcon className="w-5 h-5 text-yellow-400" />
                 <h2 className="text-lg font-bold text-white">Contatos e Visual</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp (Apenas números)</label>
                   <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full glass-input" placeholder="5511999999999" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Link do Portfólio</label>
                   <input name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} className="w-full glass-input" placeholder="https://..." />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Botão Principal (CTA)</label>
                   <input name="cta" value={formData.cta} onChange={handleChange} className="w-full glass-input" placeholder="Solicitar Orçamento" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Estilo Visual</label>
                   <select name="template" value={formData.template} onChange={handleChange} className="w-full glass-input appearance-none">
                     <option value="dark">Dark & Elegante (Verde Neon)</option>
                     <option value="premium">Premium (Preto e Dourado)</option>
                     <option value="jovem">Jovem (Roxo e Pink)</option>
                     <option value="clean">Clean (Claro e Moderno)</option>
                   </select>
                 </div>
               </div>
            </div>

          </GlassCard>
        </div>

        {/* Preview & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
             <GlassCard className="p-6 border-white/5 space-y-6 flex flex-col items-center">
                
                {hasToolAccess('creator-card') ? (
                  <div className="w-full space-y-4">
                    <Button 
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden group"
                      onClick={handleGenerateAndDownload}
                      disabled={loading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Sparkles className="w-4 h-4 animate-spin text-white" /> Gerando Mídia Kit...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          <Zap className="w-4 h-4 text-yellow-300" /> GERAR PDF
                        </span>
                      )}
                    </Button>
                    <div className="flex justify-center">
                       {!loading && <CreditNotice toolId="creator-card" />}
                    </div>
                  </div>
                ) : (
                  <UpgradeGate locked={true} requiredPlan="Pro" mode="button" label="Cartão do Creator — Disponível nos Planos" />
                )}

             </GlassCard>

             {/* Live Preview do Cartão */}
             <div className="w-full transform origin-top md:scale-90 lg:scale-100 flex justify-center">
                <CreatorCardPreview data={formData} cardRef={cardRef} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
