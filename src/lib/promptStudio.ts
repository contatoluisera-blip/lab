// ─────────────────────────────────────────────────────────────
// Gerador de Prompts — campos do formulário (fonte única)
// A tela monta o formulário a partir daqui e o servidor usa os mesmos
// rótulos para descrever as escolhas à IA. Toda opção "auto" vira
// decisão assumida pela IA, listada no resultado.
// ─────────────────────────────────────────────────────────────

export type PromptMode = 'i2v' | 't2i' | 'i2i';

export const AUTO = 'auto';

export interface PromptField {
  id: string;
  label: string;
  /** Grupo visual do formulário. */
  group: 'Plataforma' | 'Cena' | 'Câmera' | 'Lente e luz' | 'Estilo' | 'Som' | 'Restrições';
  modes: PromptMode[];
  kind: 'select' | 'multi' | 'text';
  options?: string[];
  placeholder?: string;
  help?: string;
}

export const PROMPT_MODES: { id: PromptMode; label: string; description: string }[] = [
  { id: 'i2v', label: 'Image to Video', description: 'Anime uma imagem com câmera, ação e som.' },
  { id: 't2i', label: 'Text to Image', description: 'Crie uma imagem do zero a partir da descrição.' },
  { id: 'i2i', label: 'Image to Image', description: 'Edite uma imagem preservando o que importa.' },
];

export const PROMPT_FIELDS: PromptField[] = [
  // Plataforma
  { id: 'modelo', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['i2v'], kind: 'select',
    options: ['Seedance 2.5 (KIE AI)', 'Veo 3', 'Kling', 'Runway', 'Luma'] },
  { id: 'modeloImagem', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['t2i', 'i2i'], kind: 'select',
    options: ['Nano Banana 2 (KIE AI)', 'Seedream (KIE AI)', 'GPT Image', 'Midjourney', 'Flux'] },
  { id: 'proporcao', label: 'Proporção', group: 'Plataforma', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['9:16 (vertical)', '16:9 (horizontal)', '1:1 (quadrado)', '4:5 (feed)', '3:4', '21:9 (cinema)'],
    help: 'Em Image to Video e Image to Image, "Decidir por mim" herda a proporção da imagem.' },
  { id: 'duracao', label: 'Duração', group: 'Plataforma', modes: ['i2v'], kind: 'select',
    options: ['5 segundos', '8 segundos', '10 segundos', '15 segundos'] },
  { id: 'resolucao', label: 'Resolução', group: 'Plataforma', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['720p (teste)', '1080p (entrega)', '4K'] },

  // Cena
  { id: 'tipoEdicao', label: 'Tipo de edição', group: 'Cena', modes: ['i2i'], kind: 'select',
    options: ['Trocar o cenário', 'Trocar a luz', 'Mudar o estilo visual', 'Trocar roupa ou produto', 'Adicionar elemento', 'Remover elemento', 'Retoque e melhoria'] },
  { id: 'intensidade', label: 'Intensidade da mudança', group: 'Cena', modes: ['i2i'], kind: 'select',
    options: ['Sutil (retoque)', 'Moderada', 'Forte (transformação)'] },
  { id: 'plano', label: 'Plano / enquadramento', group: 'Cena', modes: ['t2i', 'i2v'], kind: 'select',
    options: ['Plano geral', 'Plano de conjunto', 'Plano americano', 'Plano médio', 'Primeiro plano', 'Close', 'Detalhe'],
    help: 'Em Image to Video, "Decidir por mim" mantém o plano da imagem.' },
  { id: 'angulo', label: 'Ângulo', group: 'Cena', modes: ['t2i', 'i2v'], kind: 'select',
    options: ['Altura dos olhos', 'Plongée (de cima)', 'Contra-plongée (de baixo)', 'Zenital (top-down)', 'Holandês (inclinado)'] },
  { id: 'emocao', label: 'Emoção / atuação', group: 'Cena', modes: ['i2v', 't2i'], kind: 'text',
    placeholder: 'Ex.: cansada, mas determinada' },
  { id: 'ambiente', label: 'Movimento do ambiente', group: 'Cena', modes: ['i2v'], kind: 'select',
    options: ['Parado (só o sujeito se move)', 'Sutil (vento, partículas)', 'Moderado (figurantes, tráfego)', 'Intenso (chuva, multidão)'] },
  { id: 'velocidadeTempo', label: 'Velocidade do tempo', group: 'Cena', modes: ['i2v'], kind: 'select',
    options: ['Tempo real', 'Slow motion', 'Timelapse'] },
  { id: 'final', label: 'Final do plano', group: 'Cena', modes: ['i2v'], kind: 'select',
    options: ['Câmera desacelera e assenta', 'Sujeito termina numa pose', 'Foco termina num objeto', 'Corte em movimento (para transição)'] },

  // Câmera
  { id: 'camera', label: 'Movimento de câmera', group: 'Câmera', modes: ['i2v'], kind: 'select',
    options: ['Travada (tripé)', 'Aproximação (push-in)', 'Afastamento (pull-back)', 'Lateral (truck)', 'Panorâmica (pan)', 'Tilt', 'Grua (crane)', 'Órbita (arco)', 'Seguir (tracking)', 'Conduzir (leading)', 'Câmera na mão (handheld)', 'Drone', 'FPV', 'Chicote (whip pan)', 'Vertigo (dolly zoom)', 'Rack focus', 'Zoom óptico'] },
  { id: 'velocidadeCamera', label: 'Velocidade da câmera', group: 'Câmera', modes: ['i2v'], kind: 'select',
    options: ['Lenta e constante', 'Média', 'Rápida e enérgica'] },
  { id: 'suporte', label: 'Suporte', group: 'Câmera', modes: ['i2v'], kind: 'select',
    options: ['Tripé', 'Dolly', 'Gimbal', 'Steadicam', 'Na mão', 'Drone'] },

  // Lente e luz
  { id: 'lente', label: 'Lente', group: 'Lente e luz', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['14–18mm (ultra-wide)', '24mm (grande-angular)', '35mm (natural)', '50mm (neutra)', '85mm (retrato)', '135mm+ (tele)', 'Macro 100mm', 'Anamórfica'],
    help: 'Com imagem, "Decidir por mim" herda a lente aparente.' },
  { id: 'profundidade', label: 'Profundidade de campo', group: 'Lente e luz', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['Bem rasa (f/1.8)', 'Rasa moderada (f/2.8)', 'Média (f/5.6)', 'Profunda, tudo em foco (f/11)'] },
  { id: 'luz', label: 'Luz', group: 'Lente e luz', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['Manter a da imagem', 'Natural de dia', 'Golden hour', 'Céu nublado (suave)', 'Noite urbana (neon)', 'Estúdio softbox', 'Contraluz', 'Dramática (low-key)', 'Fluorescente / institucional'] },

  // Estilo
  { id: 'estilo', label: 'Estilo', group: 'Estilo', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['Realismo cinematográfico', 'Publicitário / institucional', 'Documental / jornalístico', 'Editorial de moda', 'Still de produto', 'UGC (celular, espontâneo)', '3D / CGI', 'Animação', 'Ilustração'] },
  { id: 'grade', label: 'Cor / color grade', group: 'Estilo', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['Natural levemente quente', 'Fria (teal / ciano)', 'Teal & orange', 'Alto contraste', 'Pastel / suave', 'Preto e branco', 'Filme vintage'] },
  { id: 'textura', label: 'Textura / realismo', group: 'Estilo', modes: ['i2v', 't2i', 'i2i'], kind: 'select',
    options: ['Grão fino e pele com poros (captação real)', 'Limpo e polido (publicidade)', 'Filme 35mm com grão aparente', 'Celular (sensor pequeno)'] },
  { id: 'referencia', label: 'Câmera ou filme de referência', group: 'Estilo', modes: ['i2v', 't2i', 'i2i'], kind: 'text',
    placeholder: 'Ex.: ARRI Alexa, Kodak Portra 400, estilo Wes Anderson' },

  // Som
  { id: 'audio', label: 'Áudio', group: 'Som', modes: ['i2v'], kind: 'select',
    options: ['Sem áudio', 'Ambiência + foley, sem música', 'Ambiência + foley + música', 'Ambiência + foley + fala'] },
  { id: 'fala', label: 'Fala exata (PT-BR)', group: 'Som', modes: ['i2v'], kind: 'text',
    placeholder: 'Só se houver fala. Ex.: "A gente não para."' },

  // Restrições
  { id: 'travar', label: 'O que travar', group: 'Restrições', modes: ['i2v', 'i2i'], kind: 'multi',
    options: ['Rosto e identidade', 'Cabelo e figurino', 'Produto', 'Logo e texto', 'Cenário', 'Pose', 'Composição'] },
  { id: 'evitar', label: 'O que evitar', group: 'Restrições', modes: ['i2v', 't2i', 'i2i'], kind: 'multi',
    options: ['Cortes / troca de plano', 'Morphing', 'Texto gerado', 'Mãos em destaque', 'Tremor', 'Cara de IA (plástico)', 'Marca d\'água'] },
];

export const PROMPT_GROUPS: PromptField['group'][] = ['Plataforma', 'Cena', 'Câmera', 'Lente e luz', 'Estilo', 'Som', 'Restrições'];

export function fieldsForMode(mode: PromptMode) {
  return PROMPT_FIELDS.filter(f => f.modes.includes(mode));
}

/** Texto principal pedido em cada modo. */
export const MAIN_TEXT: Record<PromptMode, { label: string; placeholder: string; required: boolean }> = {
  i2v: { label: 'O que deve acontecer no vídeo', required: false,
    placeholder: 'Ex.: a enfermeira levanta a cabeça quando um alarme toca e dá um passo decidido à frente. Quero algo tenso.' },
  t2i: { label: 'Descreva a imagem', required: true,
    placeholder: 'Ex.: criadora de conteúdo gravando com o celular num café em São Paulo, fim de tarde, para campanha de lançamento.' },
  i2i: { label: 'O que deve mudar na imagem', required: true,
    placeholder: 'Ex.: trocar o fundo por um estúdio branco infinito, mantendo a pessoa exatamente igual.' },
};

export interface PromptResult {
  leituraImagem: string | null;
  ficha: { item: string; valor: string }[];
  prompt: string;
  negativePrompt: string | null;
  decisoes: string[];
  perguntas: string[];
  seFalhar: string;
}
