import React from 'react';

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-brand-emerald mb-8">Política de Privacidade</h1>
        
        <p className="text-gray-300">
          A Creator Lab valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos as suas informações pessoais.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">1. Coleta de Dados</h2>
        <p className="text-gray-400 text-sm">
          Coletamos informações essenciais para o funcionamento da sua conta, como nome, e-mail e dados necessários para o processamento de pagamentos através dos nossos parceiros oficiais (Stripe).
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">2. Uso das Informações</h2>
        <p className="text-gray-400 text-sm">
          Utilizamos seus dados para fornecer, manter e melhorar nossos serviços. Informações de perfis analisados por você no Diagnóstico são processadas com segurança e não são expostas publicamente.
        </p>

        <h2 className="text-xl font-semibold mt-6 text-white">3. Segurança</h2>
        <p className="text-gray-400 text-sm">
          Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada. Todas as senhas e pagamentos são devidamente criptografados.
        </p>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-brand-mint hover:underline text-sm">Voltar para a página inicial</a>
        </div>
      </div>
    </div>
  );
}
