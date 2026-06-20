import React from 'react';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-brand-emerald mb-8">Termos de Uso</h1>
        
        <p className="text-gray-300">
          Bem-vindo à Creator Lab. Estes Termos de Uso regem o seu acesso e uso da nossa plataforma.
          Ao acessar ou utilizar a plataforma, você concorda em ficar vinculado a estes termos.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">1. Aceitação dos Termos</h2>
        <p className="text-gray-400 text-sm">
          Ao criar uma conta, acessar ou usar a Creator Lab, você confirma que leu, compreendeu e concorda em estar vinculado a estes Termos de Uso.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">2. Uso da Plataforma</h2>
        <p className="text-gray-400 text-sm">
          A Creator Lab fornece ferramentas de análise de perfil, geração de ideias, orçamentos e propostas. Você concorda em usar estas ferramentas apenas para fins lícitos e de acordo com as diretrizes da plataforma.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">3. Assinatura e Cancelamento</h2>
        <p className="text-gray-400 text-sm">
          Membros do Plano Fundador mantêm seus benefícios exclusivos enquanto a assinatura permanecer ativa. O cancelamento resultará na perda irrevogável destes benefícios e dos valores promocionais associados.
        </p>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-brand-mint hover:underline text-sm">Voltar para a página inicial</a>
        </div>
      </div>
    </div>
  );
}
