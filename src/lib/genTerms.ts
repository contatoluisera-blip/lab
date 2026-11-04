// ─────────────────────────────────────────────────────────────
// Termos de uso da geração de imagens e vídeos (texto único).
// A página pública /termos-de-uso/geracao-ia e a janela de aceite leem daqui.
// Mudou o texto? Suba GEN_TERMS_VERSION em src/lib/generation.ts: todos aceitam de novo.
// ─────────────────────────────────────────────────────────────

export { GEN_TERMS_VERSION } from './generation';

export interface TermsSection {
  title: string;
  items: string[];
}

/** O essencial, mostrado na janela de aceite antes da primeira geração. */
export const GEN_TERMS_SUMMARY: string[] = [
  'É proibido gerar nudez, conteúdo sexual, qualquer conteúdo sexualizado envolvendo menores, violência explícita, ódio, golpes ou desinformação.',
  'É proibido usar o rosto, o corpo ou a voz de uma pessoa real sem autorização dela, inclusive de famosos e políticos.',
  'Você é responsável pelo que pede, pelos arquivos que envia e pelo uso do resultado, e precisa ter direito de usar as imagens e vídeos enviados.',
  'Pedidos e resultados passam por filtro automático e podem ser revisados pela equipe. Violação leva ao bloqueio da geração ou da conta, sem devolução dos créditos usados.',
  'Créditos de gerações que falham por erro técnico voltam automaticamente. Resultado diferente do esperado não é falha técnica.',
];

export const GEN_TERMS_SECTIONS: TermsSection[] = [
  {
    title: '1. O que é a geração de imagens e vídeos',
    items: [
      'A Creator Lab oferece a geração de imagens e vídeos por inteligência artificial a partir de textos (prompts), imagens e vídeos enviados por você.',
      'As gerações são processadas por provedores parceiros de IA (como a KIE AI e os modelos que ela disponibiliza, entre eles Google Veo, Nano Banana, Kling e Wan). Ao gerar, você também se sujeita às políticas de uso desses modelos.',
      'Estes termos complementam os Termos de Uso gerais da Creator Lab e valem para as abas Gerar imagem e Gerar vídeo e para qualquer recurso de geração que venha a existir.',
    ],
  },
  {
    title: '2. Conteúdo proibido',
    items: [
      'Nudez, conteúdo sexual ou pornográfico de qualquer tipo.',
      'Qualquer conteúdo que sexualize, explore ou coloque em risco crianças e adolescentes. Esses casos são preservados e comunicados às autoridades.',
      'Uso do rosto, do corpo ou da voz de uma pessoa real sem autorização dela (deepfake), inclusive de celebridades, autoridades e candidatos.',
      'Conteúdo enganoso: notícias falsas, montagens que atribuam a alguém falas ou atos que não aconteceram, golpes, fraudes e falsificação de documentos.',
      'Conteúdo eleitoral fora das regras da Justiça Eleitoral, incluindo deepfakes de candidatos e peças sem a identificação de uso de IA exigida pelo TSE.',
      'Discurso de ódio, discriminação, assédio, ameaça, incentivo à violência ou à automutilação, e violência explícita ou gore.',
      'Violação de direitos autorais, de marca ou de imagem de terceiros, e qualquer outro conteúdo ilegal no Brasil.',
    ],
  },
  {
    title: '3. Suas responsabilidades',
    items: [
      'Você é o único responsável pelos prompts que escreve, pelos arquivos que envia e pelo uso que faz dos resultados.',
      'Você declara ter os direitos e as autorizações necessárias sobre as imagens, vídeos e pessoas que aparecem nos arquivos enviados.',
      'Ao publicar um resultado, siga as regras de cada rede social e da lei sobre a identificação de conteúdo gerado por IA.',
      'Não tente contornar os filtros (por exemplo, com termos disfarçados ou em outro idioma). A tentativa é tratada como violação.',
    ],
  },
  {
    title: '4. Moderação e registro',
    items: [
      'Os pedidos passam por filtro automático antes de serem enviados, e os provedores aplicam filtros próprios.',
      'Para segurança e moderação, registramos o prompt, os arquivos enviados, os resultados, a data, o IP e o navegador de cada geração.',
      'A equipe da Creator Lab pode revisar pedidos e resultados a qualquer momento, inclusive os barrados pelo filtro.',
    ],
  },
  {
    title: '5. Bloqueio e penalidades',
    items: [
      'Em caso de violação, a Creator Lab pode bloquear a geração da conta, suspender ou encerrar a conta, sem aviso prévio nos casos graves.',
      'Créditos consumidos em gerações que violam estes termos não são devolvidos, e o bloqueio não dá direito a reembolso da assinatura.',
      'Indícios de crime são preservados e comunicados às autoridades competentes.',
    ],
  },
  {
    title: '6. Créditos e falhas',
    items: [
      'Cada geração consome créditos conforme o modelo e as opções escolhidas. O custo aparece antes de você confirmar.',
      'Se a geração falhar por erro técnico (do provedor ou da plataforma), os créditos voltam automaticamente para o seu saldo.',
      'Resultados diferentes do que você imaginou fazem parte da natureza da IA e não são falha técnica: nesses casos os créditos não voltam.',
      'Em horários de muita procura, os pedidos entram numa fila e são processados na ordem de chegada.',
    ],
  },
  {
    title: '7. Uso dos resultados e armazenamento',
    items: [
      'Respeitados estes termos e as políticas dos modelos, você pode usar os resultados, inclusive comercialmente.',
      'A IA pode gerar resultados parecidos para outras pessoas: não há garantia de exclusividade.',
      'Os resultados ficam disponíveis na sua conta. Os arquivos enviados são guardados pelo tempo necessário para processamento, moderação e segurança.',
      'Os modelos disponíveis, as opções e os custos em créditos podem mudar. Mudanças nestes termos exigem um novo aceite.',
    ],
  },
];
