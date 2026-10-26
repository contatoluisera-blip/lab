// ─────────────────────────────────────────────────────────────
// Gerador de Ideias — briefing e formato do resultado (fonte única)
// Mesma lógica do Gerador de Prompts: todo campo pode ficar em
// "Decidir por mim"; a IA decide e explica em "decisoes".
// ─────────────────────────────────────────────────────────────

import { HUB_FORMATS, HUB_HOOKS } from './hub';

export const AUTO = 'auto';

export interface IdeaField {
  id: string;
  label: string;
  group: 'Marca e público' | 'Estratégia' | 'Formato' | 'Produção';
  kind: 'select' | 'text';
  options?: string[];
  placeholder?: string;
  help?: string;
}

export const IDEA_GROUPS: IdeaField['group'][] = ['Marca e público', 'Estratégia', 'Formato', 'Produção'];

export const IDEA_FIELDS: IdeaField[] = [
  // Marca e público
  { id: 'tipoMarca', label: 'Tipo de marca', group: 'Marca e público', kind: 'select',
    options: ['Profissional liberal', 'Negócio local', 'E-commerce', 'Infoproduto / curso', 'Marca pessoal / criador', 'Empresa B2B', 'Instituição pública'] },
  { id: 'oferta', label: 'Oferta ou produto em foco', group: 'Marca e público', kind: 'text', placeholder: 'Ex.: lentes de contato dental' },
  { id: 'diferencial', label: 'Diferencial', group: 'Marca e público', kind: 'text', placeholder: 'Ex.: planejamento digital do sorriso antes de começar' },
  { id: 'dor', label: 'Dor do público', group: 'Marca e público', kind: 'text', placeholder: 'Ex.: vergonha de sorrir em fotos' },
  { id: 'desejo', label: 'Desejo do público', group: 'Marca e público', kind: 'text', placeholder: 'Ex.: sorriso natural, sem cara de dentadura' },
  { id: 'objecao', label: 'Principal objeção', group: 'Marca e público', kind: 'text', placeholder: 'Ex.: medo de desgastar os dentes' },
  { id: 'compliance', label: 'Regras do nicho', group: 'Marca e público', kind: 'select',
    options: ['Saúde (conselhos profissionais: sem promessa de resultado)', 'Jurídico (OAB: sem captação direta)', 'Financeiro (sem promessa de ganho)', 'Alimentos e suplementos', 'Sem regras específicas'],
    help: 'A IA evita formatos e promessas vetados pelo nicho.' },

  // Estratégia
  { id: 'funil', label: 'Etapa do funil', group: 'Estratégia', kind: 'select',
    options: ['Descoberta (alcance)', 'Consideração (autoridade e confiança)', 'Conversão (venda e agendamento)', 'Fidelização (comunidade)'] },
  { id: 'pilar', label: 'Pilar de conteúdo', group: 'Estratégia', kind: 'select',
    options: ['Autoridade', 'Educação', 'Prova social', 'Bastidores', 'Entretenimento', 'Oferta', 'Quebra de objeção', 'Misturar pilares'] },
  { id: 'emocao', label: 'Emoção dominante', group: 'Estratégia', kind: 'select',
    options: ['Curiosidade', 'Identificação', 'Desejo / aspiração', 'Alívio', 'Urgência', 'Humor', 'Confiança'] },
  { id: 'cta', label: 'CTA desejado', group: 'Estratégia', kind: 'select',
    options: ['Seguir o perfil', 'Salvar o vídeo', 'Comentar uma palavra-chave', 'Chamar no direct / WhatsApp', 'Clicar no link', 'Agendar / comprar', 'Compartilhar'] },
  { id: 'plataforma', label: 'Plataforma', group: 'Estratégia', kind: 'select',
    options: ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'Todas (vertical)'] },

  // Formato
  { id: 'formato', label: 'Formato', group: 'Formato', kind: 'select', options: [...HUB_FORMATS].filter(f => f !== 'Outro') },
  { id: 'duracao', label: 'Duração alvo', group: 'Formato', kind: 'select', options: ['15 segundos', '30 segundos', '45 segundos', '60 segundos', '90 segundos'] },
  { id: 'apresentador', label: 'Quem aparece', group: 'Formato', kind: 'select',
    options: ['Rosto do especialista', 'Voz em off, sem rosto', 'Sem rosto e sem voz (texto na tela)', 'Cliente / paciente', 'Equipe'] },
  { id: 'tom', label: 'Tom', group: 'Formato', kind: 'select', options: ['Didático', 'Provocativo', 'Humor', 'Inspirador', 'Íntimo / conversa', 'Premium / sofisticado'] },
  { id: 'variedade', label: 'Variedade da rodada', group: 'Formato', kind: 'select',
    options: ['Mix de formatos', 'Mesmo formato, ângulos diferentes', 'Série (episódios conectados)'] },

  // Produção
  { id: 'producao', label: 'Nível de produção', group: 'Produção', kind: 'select', options: ['Simples (só celular)', 'Intermediário (celular + luz/microfone)', 'Avançado (câmera de cinema)'] },
  { id: 'locacao', label: 'Locação', group: 'Produção', kind: 'text', placeholder: 'Ex.: consultório, recepção, rua' },
  { id: 'recursos', label: 'Recursos disponíveis', group: 'Produção', kind: 'text', placeholder: 'Ex.: tripé, ring light, gimbal, drone' },
  { id: 'equipe', label: 'Equipe', group: 'Produção', kind: 'select', options: ['Sozinho', 'Com um ajudante', 'Equipe de filmagem'] },
  { id: 'diaria', label: 'Tempo de diária', group: 'Produção', kind: 'select', options: ['Até 1 hora', 'Meio período', 'Dia inteiro'] },
  { id: 'restricoes', label: 'Restrições', group: 'Produção', kind: 'text', placeholder: 'Ex.: não mostrar pacientes, sem música' },
];

export const DIFICULDADES = ['Simples', 'Média', 'Complexa'] as const;

export interface IdeaV2 {
  titulo: string;
  pilar: string;
  etapaFunil: string;
  formato: string;
  duracaoSeg: number;
  ganchos: { falado: string; textoTela: string; visual: string; tipo: string };
  beats: { inicio: number; fim: number; visual: string; fala: string; textoTela: string; som: string }[];
  retencao: { loopAberto: string; virada: string; recompensa: string };
  cta: string;
  takes: { numero: number; descricao: string; plano: string; angulo: string; movimento: string; local: string }[];
  edicao: { ritmo: string; legendas: string; trilha: string; efeitos: string };
  porqueFunciona: string;
  execucao: { dificuldade: string; tempoGravacao: string; riscos: string };
  referenciaUsada: string;
  /** Gerada à parte, por 1 crédito. */
  legenda?: { texto: string; palavrasChave: string[]; capa: string };
}

export interface IdeasResultV2 {
  version: 2;
  resumoEstrategico: string;
  decisoes: string[];
  planoDiaria: string;
  ideias: IdeaV2[];
}

export { HUB_HOOKS };
