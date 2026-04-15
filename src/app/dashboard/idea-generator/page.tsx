'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Lightbulb, Send, Copy, CheckCircle2 } from 'lucide-react';

export default function IdeaGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert form data to object
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/tools/idea-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setResult(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `
    Title: ${result.title}
    Concept: ${result.coreConcept}
    Hook: ${result.hookSuggestions[0]}
    Format: ${result.structure.join(' > ')}
    Technical Notes: ${result.technicalNotes.join(', ')}
    `;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center flex-shrink-0 text-brand-emerald">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gerador de Ideias</h1>
          <p className="text-gray-400 text-sm">Gere conceitos estruturados de conteúdo com notas de execução técnica.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nicho / Tópico</label>
                <input 
                  required
                  name="niche"
                  type="text" 
                  placeholder="ex: Fitness para iniciantes" 
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Objetivo do Conteúdo</label>
                <select name="goal" className="w-full glass-input [&>option]:bg-black">
                  <option value="engagement">Aumentar Engajamento</option>
                  <option value="conversion">Gerar Vendas / Conversão</option>
                  <option value="education">Educar a Audiência</option>
                  <option value="entertainment">Puro Entretenimento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Equipamento Disponível</label>
                <input 
                  name="gear"
                  type="text" 
                  placeholder="ex: iPhone 15, tripé, ring light" 
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contexto / Cenário</label>
                <input 
                  name="context"
                  type="text" 
                  placeholder="ex: Na minha sala de estar, de dia" 
                  className="w-full glass-input"
                />
              </div>

              <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
                {!loading && <Send className="w-4 h-4 mr-2" />}
                Gerar Conceito (-1 Crédito)
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {result ? (
            <GlassCard className="p-6 relative glow-border bg-[#0a0a0a]/90">
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-gray-400">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <h3 className="text-xl font-bold text-brand-mint mb-2 pr-10">{result.title}</h3>
              <p className="text-gray-300 text-sm mb-6">{result.coreConcept}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sugestão de Gancho</h4>
                  <p className="text-sm border-l-2 border-brand-emerald pl-3 text-gray-200">
                    "{result.hookSuggestions[0]}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estrutura</h4>
                  <ul className="text-sm text-gray-300 space-y-1 pl-4 list-disc marker:text-brand-emerald">
                    {result.structure.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Execução Técnica</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.technicalNotes.map((note: string, idx: number) => (
                      <span key={idx} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="h-full border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 text-gray-500 min-h-[400px]">
              <Lightbulb className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-sm">Envie seus critérios para gerar uma ideia estruturada.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
