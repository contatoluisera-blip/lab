'use client';

import React, { useState } from 'react';
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
    question: 'Qual o melhor horário para postar no Reels neste fim de semana?',
    answer: 'Baseado no pico de atividade do seu nicho, a janela de maior tração ocorre entre as 11h30 e 13h00 (horário do almoço) do sábado e no domingo a partir das 18h. Se concentre em postar no domingo à noite para preparar o algoritmo para a semana comercial.'
  },
  {
    id: '2',
    question: 'Devo gravar os vídeos em 4K ou 1080p 60fps?',
    answer: 'O Instagram Reels e TikTok ainda comprimem vídeos em 4K massivamente. Recomenda-se gravar em 1080p a 60fps ou 30fps nativamente. Exportar nessa resolução garante transições mais limpas no upload sem acionar algoritmos de degradação da plataforma.'
  }
];

export default function AssistantPage() {
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
              placeholder="Ex: Qual lente devo usar para gravar um depoimento de cliente em um escritório pequeno?" 
              className="w-full glass-input min-h-[100px] resize-none text-lg leading-relaxed placeholder:text-gray-500/70"
            />
          </div>

          <div className="pt-2">
            <Button 
              className="w-full md:w-auto px-10 h-12 text-sm font-bold uppercase tracking-wider relative overflow-hidden group shadow-[0_0_15px_rgba(74,222,128,0.3)] border border-green-500/40 bg-gradient-to-r from-green-500/10 to-green-400/20 text-green-300 hover:bg-green-500 hover:text-black hidden-glow"
              onClick={handleAsk}
              disabled={loading}
              style={{
                transition: "all 0.3s ease",
              }}
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
