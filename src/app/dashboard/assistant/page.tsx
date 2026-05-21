'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Sparkles, Send, BrainCircuit, Clock } from 'lucide-react';

interface QnA {
  id: string;
  question: string;
  answer: string;
  isNew?: boolean;
}

const MOCK_HISTORY: QnA[] = [
  {
    id: '1',
    question: 'Como configurar o app BlackMagic Camera no iPhone para gravar um b-roll de produto com visual cinematográfico?',
    answer: 'Para b-rolls de produtos de alto impacto, configure o codec para Apple ProRes 422 HQ (ou HEVC a 100Mbps se precisar economizar armazenamento) em resolução 4K a 24fps. Defina o Shutter Angle fixo em 180° (equivalente a Shutter Speed de 1/48s) para manter o desfoque de movimento natural do cinema. Selecione o perfil de cor Apple Log ou BlackMagic Design Film para obter o máximo alcance dinâmico (Dynamic Range) e grave o balanço de brancos manualmente usando um cartão de cinza 18% (ex: 5600K para externas sob luz solar). Dica extra: Utilize a lente teleobjetiva (3x ou equivalente a 77mm) para comprimir os planos de fundo e evitar as distorções esféricas nas bordas do produto.'
  },
  {
    id: '2',
    question: 'Como criar o efeito Saber Neon (brilho nas bordas de elementos) no Node Video usando composição por nós?',
    answer: 'No Node Video, siga o fluxo de composição: 1. Crie uma Composição 2D ou 3D e importe o clipe com o elemento recortado (use a ferramenta Auto-Cutout ou crie uma máscara). 2. Adicione um novo nó de Efeito clicando no botão (+) > Estilização > Glow (Brilho). 3. Ajuste as propriedades do nó: defina a cor do Glow no matiz desejado (ex: ciano #00ffff). Ajuste o Threshold para 0.20 (para iluminar apenas os contornos de alta luz), a Intensity para 1.8 e o Scattering (espalhamento) para 1.5. 4. Para dar oscilação realista, clique em "Add Property" > Generator > Flicker, configurando a Frequency em 6Hz e Amplitude em 0.25. Isso gerará uma emissão pulsante fiel de néon na timeline sem degradação do canal alfa.'
  },
  {
    id: '3',
    question: 'Qual a fórmula recomendada para precificar um contrato de 10 vídeos curtos (Reels/TikTok) para um cliente B2B?',
    answer: 'A precificação estratégica deve considerar a soma de custos fixos, taxa horária técnica, depreciação e direitos patrimoniais. Fórmula recomendada: Valor total = (Tempo estimado em horas × Taxa horária de edição) + Depreciação de equipamentos + Licença de uso comercial (B2B). Por exemplo: 10 vídeos com média de 3 horas por vídeo (planejamento, gravação e edição) totalizam 30 horas. Com uma taxa de R$ 80/hora = R$ 2.400,00. Adicione 10% de depreciação de hardware/software (R$ 240,00) e 20% pela licença comercial dos direitos de uso dos vídeos (R$ 480,00). Valor final sugerido: R$ 3.120,00 (R$ 312 por vídeo). Insira sempre uma cláusula contratual limitando as rodadas de alteração a 2 por vídeo para blindar sua margem operacional contra retrabalhos infinitos.'
  }
];

export default function AssistantPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit } = useUserProfile();
  
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Combine mock history with session generated answers
  const [history, setHistory] = useState<QnA[]>(MOCK_HISTORY);

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Por favor, digite sua dúvida antes de enviar.');
      return;
    }
    
    // Check access and consume credit
    const creditResult = await consumeCredit('assistant');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits' 
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.' 
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tools/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao conectar com o Assistente.');
      }
      
      const newAction: QnA = {
        id: Date.now().toString(),
        question: resData.data.question,
        answer: resData.data.answer,
        isNew: true
      };

      setHistory([newAction, ...history]);
      setQuestion(''); // Clear input after successful ask
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-green-400 bg-green-400/10 text-sm font-medium w-fit mb-2">
          <BrainCircuit className="w-4 h-4" />
          <span className="text-white">Assistência e Consulta Tática</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Perguntas Rápidas</h1>
        <p className="text-gray-400">Um hub ágil para tirar dúvidas pontuais sobre câmeras, estratégias on-the-fly e negócios B2B sem rodeios.</p>
      </div>

      {/* Input Form Module */}
      <GlassCard glow className="p-8">
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              O que você precisa resolver agora?
            </label>
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Como configurar o shutter angle no app BlackMagic Cam para gravar em 24fps e evitar cintilação de lâmpadas LED?" 
              className="w-full glass-input min-h-[100px] resize-none text-lg leading-relaxed placeholder:text-gray-500/70"
            />
          </div>

          <div className="pt-2 flex flex-col items-start gap-2">
            {hasToolAccess('assistant') ? (
              <div className="flex flex-col items-start">
                <Button 
                  className="w-full md:w-auto px-10 h-12 text-sm font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(74,222,128,0.3)] border border-green-500/40 bg-gradient-to-r from-green-500/10 to-green-400/20 text-green-300 hover:bg-green-500 hover:text-black hidden-glow"
                  onClick={handleAsk}
                  disabled={loading}
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Sparkles className="w-4 h-4 animate-spin" /> Buscando Resposta...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Send className="w-4 h-4" /> Perguntar ao Cérebro IA
                    </span>
                  )}
                </Button>
                {!loading && <CreditNotice toolId="assistant" />}
              </div>
            ) : (
              <UpgradeGate locked={true} requiredPlan="Pro" mode="button" label="Assistente — Disponível no Plano Pro" />
            )}
          </div>
        </div>
      </GlassCard>

      {/* Answer History / Feed */}
      <div className="space-y-6 mt-12">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Mural de Respostas
        </h3>

        {history.map((item) => (
          <GlassCard 
            key={item.id} 
            className={`p-6 border-white/5 transition-all duration-700 ${item.isNew ? 'animate-in fade-in slide-in-from-top-4 border-green-400/30' : ''}`}
            glow
          >
            <div className="space-y-4">
              {/* Question bubble */}
              <div className="inline-block bg-[#1a1a1a]/60 px-5 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                <p className="text-gray-300 text-sm font-medium">{item.question}</p>
              </div>

              {/* Answer block */}
              <div className="flex gap-4 items-start pl-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 text-green-400 border border-green-500/20 mt-1 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="bg-green-900/10 px-6 py-4 rounded-2xl rounded-tr-sm w-full">
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
