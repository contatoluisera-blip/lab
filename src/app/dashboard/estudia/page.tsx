'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Camera, Sparkles, UploadCloud, Download, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { addNotification } from '@/lib/notifications';

export default function EstudIAPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit } = useUserProfile();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setError('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Por favor, envie uma imagem do rosto.');
      return;
    }

    // Verifica acesso
    const creditResult = await consumeCredit('estudia');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits'
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.'
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }

    setLoading(true);
    setError('');
    setResultUrl(null);
    
    try {
      // Converte imagem para base64 para enviar para a API
      const base64Image = await fileToBase64(selectedFile);

      const response = await fetch('/api/tools/estudia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, userId: user?.uid })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar a imagem. Tente novamente mais tarde.');
      }
      
      setResultUrl(resData.imageUrl);

      if (user) {
        addNotification(
          user.uid,
          'Retrato Gerado',
          `Sua foto profissional foi gerada com sucesso pelo Estúd.IA!`,
          'success'
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultUrl) {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = `estudia-retrato-${Date.now()}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-teal-400 bg-teal-400/10 text-sm font-medium w-fit mb-2">
          <Camera className="w-4 h-4 text-teal-400" />
          <span className="text-white">Estúd.IA — Fotografia de Alta Fidelidade</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Fotos Profissionais IA</h1>
        <p className="text-gray-400 max-w-2xl">
          Transforme selfies ou fotos comuns em retratos corporativos premium para seu perfil, currículo ou cartão de visitas. Nossa IA preserva sua identidade e ajusta a iluminação para padrão de estúdio.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-teal-400" />
              1. Envie sua Foto
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Para melhores resultados, use uma foto de rosto com boa iluminação frontal e sem óculos de sol.
            </p>

            <div className="relative">
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${previewUrl ? 'border-teal-500/50 bg-teal-500/5' : 'border-white/20 bg-black/20 hover:bg-white/5 hover:border-white/30'}`}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full p-2">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Trocar foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
                    <p className="mb-2 text-sm text-gray-300"><span className="font-semibold text-teal-400">Clique para enviar</span> ou arraste e solte</p>
                    <p className="text-xs text-gray-500">JPG, PNG (Max. 5MB)</p>
                  </div>
                )}
                <input id="file-upload" type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </GlassCard>

          <div className="pt-2">
            {hasToolAccess('estudia') ? (
              <Button 
                className="w-full h-14 text-sm uppercase tracking-wider font-bold relative overflow-hidden group bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                onClick={handleGenerate}
                disabled={loading || !selectedFile}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Sparkles className="w-5 h-5 animate-spin" /> PROCESSANDO NO ESTÚDIO (ISSO PODE LEVAR ALGUNS SEGUNDOS)...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Sparkles className="w-5 h-5" /> GERAR RETRATO PROFISSIONAL
                  </span>
                )}
              </Button>
            ) : (
              <UpgradeGate locked={true} requiredPlan="Start" mode="button" />
            )}
            {!loading && <CreditNotice toolId="estudia" />}
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-6">
          <GlassCard className="p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-400" />
              2. Resultado Final
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] border border-white/5 bg-black/40 rounded-2xl relative overflow-hidden p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 text-center p-6">
                  <div className="w-16 h-16 border-4 border-t-teal-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <p className="text-teal-400 font-medium text-sm animate-pulse">
                    Aplicando iluminação de estúdio e ajustando textura...
                  </p>
                  <p className="text-xs text-gray-500">
                    O NanoBanana 2 está processando sua imagem em alta qualidade.
                  </p>
                </div>
              ) : resultUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                  <img src={resultUrl} alt="Retrato Gerado" className="max-w-full max-h-[400px] object-contain rounded-xl shadow-2xl" />
                  
                  <Button 
                    onClick={handleDownload}
                    className="mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" /> Baixar Imagem (Alta Qualidade)
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Seu retrato profissional aparecerá aqui.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
