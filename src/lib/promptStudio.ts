// ─────────────────────────────────────────────────────────────
// Gerador de Prompts — campos do formulário (fonte única)
// A tela monta o formulário a partir daqui e o servidor usa os mesmos
// rótulos para descrever as escolhas à IA. Toda opção "auto" vira
// decisão assumida pela IA, listada no resultado.
// ─────────────────────────────────────────────────────────────

import { GenMode, getModel, maxImagesFor, modelsFor } from '@/lib/generation';

/** r2v: vídeo guiado por imagens de referência (personagem, produto, cenário), sem frame inicial. */
export type PromptMode = 'i2v' | 'r2v' | 'v2v' | 't2i' | 'i2i';

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
  { id: 'r2v', label: 'Reference to Video', description: 'Personagem, produto ou cenário de várias imagens guiam o vídeo.' },
  { id: 'v2v', label: 'Video to Video', description: 'Transforme um vídeo seu mantendo movimento, câmera e tempo.' },
  { id: 't2i', label: 'Text to Image', description: 'Crie uma imagem do zero a partir da descrição.' },
  { id: 'i2i', label: 'Image to Image', description: 'Edite uma imagem preservando o que importa.' },
];

export const PROMPT_FIELDS: PromptField[] = [
  // Plataforma
  { id: 'modelo', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['i2v'], kind: 'select',
    options: ['Seedance 2.5 (KIE AI)', 'Veo 3', 'Kling', 'Kling 4.0', 'Hailuo 2.3', 'Wan 2.7', 'Grok Imagine', 'PixVerse V6', 'Runway', 'Luma'] },
  { id: 'modeloRef', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['r2v'], kind: 'select',
    options: ['Veo 3', 'Kling 4.0', 'Seedance 2.5 (KIE AI)', 'Grok Imagine', 'PixVerse V6', 'Wan 2.7'],
    help: 'Define quantas referências cabem e como o prompt cita cada uma.' },
  { id: 'modeloVideo', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['v2v'], kind: 'select',
    options: ['Wan 2.6 (KIE AI)', 'Kling 3.0 Omni', 'Seedance 2 (vídeo de referência)', 'Luma Modify', 'Runway'] },
  { id: 'modeloImagem', label: 'Modelo / plataforma', group: 'Plataforma', modes: ['t2i', 'i2i'], kind: 'select',
    options: ['Nano Banana 2 (KIE AI)', 'Nano Banana Pro', 'Seedream (KIE AI)', 'GPT Image', 'Ideogram V3', 'Imagen 4', 'Midjourney', 'Flux'] },
  { id: 'proporcao', label: 'Proporção', group: 'Plataforma', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['9:16 (vertical)', '16:9 (horizontal)', '1:1 (quadrado)', '4:5 (feed)', '3:4', '21:9 (cinema)'],
    help: 'Com imagem ou vídeo de entrada, "Decidir por mim" herda a proporção do original.' },
  { id: 'duracao', label: 'Duração', group: 'Plataforma', modes: ['i2v', 'v2v'], kind: 'select',
    options: ['5 segundos', '8 segundos', '10 segundos', '15 segundos'] },
  { id: 'resolucao', label: 'Resolução', group: 'Plataforma', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['720p (teste)', '1080p (entrega)', '4K'] },

  // Cena
  { id: 'tipoEdicao', label: 'Tipo de edição', group: 'Cena', modes: ['i2i'], kind: 'select',
    options: ['Trocar o cenário', 'Trocar a luz', 'Mudar o estilo visual', 'Trocar roupa ou produto', 'Adicionar elemento', 'Remover elemento', 'Retoque e melhoria'] },
  { id: 'intensidade', label: 'Intensidade da mudança', group: 'Cena', modes: ['i2i'], kind: 'select',
    options: ['Sutil (retoque)', 'Moderada', 'Forte (transformação)'] },
  { id: 'transformacao', label: 'Tipo de transformação', group: 'Cena', modes: ['v2v'], kind: 'select',
    options: ['Restyle (mudar o estilo visual)', 'Trocar cenário / ambiente', 'Trocar personagem ou figurino', 'Trocar luz, hora do dia ou clima', 'Adicionar elemento ou efeito (VFX)', 'Remover elemento', 'Transferir o movimento para outro personagem', 'Mudar época / ambientação', 'Melhorar e limpar (nitidez, estabilidade)'] },
  { id: 'fidelidade', label: 'Fidelidade ao original', group: 'Cena', modes: ['v2v'], kind: 'select',
    options: ['Estrutura idêntica (só a aparência muda)', 'Moderada (mantém o movimento, reinterpreta formas)', 'Livre (reinterpretação criativa)'],
    help: 'Quanto mais fiel, menos a IA altera formas, posições e tempo.' },
  { id: 'alvo', label: 'Onde aplicar', group: 'Cena', modes: ['v2v'], kind: 'select',
    options: ['Quadro inteiro', 'Só o sujeito principal', 'Só o fundo / cenário', 'Só um objeto específico'] },
  { id: 'plano', label: 'Plano / enquadramento', group: 'Cena', modes: ['t2i', 'i2v'], kind: 'select',
    options: ['Plano geral', 'Plano de conjunto', 'Plano americano', 'Plano médio', 'Primeiro plano', 'Close', 'Detalhe'],
    help: 'Em Image to Video, "Decidir por mim" mantém o plano da imagem.' },
  { id: 'angulo', label: 'Ângulo', group: 'Cena', modes: ['t2i', 'i2v'], kind: 'select',
    options: ['Altura dos olhos', 'Plongée (de cima)', 'Contra-plongée (de baixo)', 'Zenital (top-down)', 'Holandês (inclinado)'] },
  { id: 'emocao', label: 'Emoção / atuação', group: 'Cena', modes: ['i2v', 'v2v', 't2i'], kind: 'text',
    placeholder: 'Ex.: cansada, mas determinada' },
  { id: 'ambiente', label: 'Movimento do ambiente', group: 'Cena', modes: ['i2v', 'v2v'], kind: 'select',
    options: ['Parado (só o sujeito se move)', 'Sutil (vento, partículas)', 'Moderado (figurantes, tráfego)', 'Intenso (chuva, multidão)'] },
  { id: 'velocidadeTempo', label: 'Velocidade do tempo', group: 'Cena', modes: ['i2v', 'v2v'], kind: 'select',
    options: ['Tempo real', 'Slow motion', 'Timelapse'] },
  { id: 'final', label: 'Final do plano', group: 'Cena', modes: ['i2v'], kind: 'select',
    options: ['Câmera desacelera e assenta', 'Sujeito termina numa pose', 'Foco termina num objeto', 'Corte em movimento (para transição)'] },

  // Câmera
  { id: 'cameraV2V', label: 'Câmera', group: 'Câmera', modes: ['v2v'], kind: 'select',
    options: ['Manter o movimento original', 'Estabilizar o movimento original', 'Adicionar aproximação lenta (push-in)', 'Adicionar afastamento lento (pull-back)', 'Adicionar câmera na mão sutil'] },
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
  { id: 'profundidade', label: 'Profundidade de campo', group: 'Lente e luz', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['Bem rasa (f/1.8)', 'Rasa moderada (f/2.8)', 'Média (f/5.6)', 'Profunda, tudo em foco (f/11)'] },
  { id: 'luz', label: 'Luz', group: 'Lente e luz', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['Manter a da imagem / do vídeo', 'Natural de dia', 'Golden hour', 'Céu nublado (suave)', 'Noite urbana (neon)', 'Estúdio softbox', 'Contraluz', 'Dramática (low-key)', 'Fluorescente / institucional'] },

  // Estilo
  { id: 'estilo', label: 'Estilo', group: 'Estilo', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['Realismo cinematográfico', 'Publicitário / institucional', 'Documental / jornalístico', 'Editorial de moda', 'Still de produto', 'UGC (celular, espontâneo)', '3D / CGI', 'Animação', 'Ilustração'] },
  { id: 'grade', label: 'Cor / color grade', group: 'Estilo', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['Natural levemente quente', 'Fria (teal / ciano)', 'Teal & orange', 'Alto contraste', 'Pastel / suave', 'Preto e branco', 'Filme vintage'] },
  { id: 'textura', label: 'Textura / realismo', group: 'Estilo', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'select',
    options: ['Grão fino e pele com poros (captação real)', 'Limpo e polido (publicidade)', 'Filme 35mm com grão aparente', 'Celular (sensor pequeno)'] },
  { id: 'referencia', label: 'Câmera ou filme de referência', group: 'Estilo', modes: ['i2v', 'v2v', 't2i', 'i2i'], kind: 'text',
    placeholder: 'Ex.: ARRI Alexa, Kodak Portra 400, estilo Wes Anderson' },

  // Som
  { id: 'audio', label: 'Áudio', group: 'Som', modes: ['i2v'], kind: 'select',
    options: ['Sem áudio', 'Ambiência + foley, sem música', 'Ambiência + foley + música', 'Ambiência + foley + fala'] },
  { id: 'audioV2V', label: 'Áudio', group: 'Som', modes: ['v2v'], kind: 'select',
    options: ['Manter o áudio original', 'Sem áudio', 'Novo: ambiência + foley', 'Novo: ambiência + foley + música'] },
  { id: 'fala', label: 'Fala exata (PT-BR)', group: 'Som', modes: ['i2v'], kind: 'text',
    placeholder: 'Só se houver fala. Ex.: "A gente não para."' },

  // Restrições
  { id: 'travar', label: 'O que travar', group: 'Restrições', modes: ['i2v', 'i2i'], kind: 'multi',
    options: ['Rosto e identidade', 'Cabelo e figurino', 'Produto', 'Logo e texto', 'Cenário', 'Pose', 'Composição'] },
  { id: 'preservarV2V', label: 'O que preservar do original', group: 'Restrições', modes: ['v2v'], kind: 'multi',
    options: ['Movimento e coreografia', 'Movimento de câmera', 'Tempo e ritmo', 'Rosto e identidade', 'Expressões e leitura labial', 'Figurino', 'Cenário', 'Composição e enquadramento', 'Produto e logo'] },
  { id: 'evitarV2V', label: 'O que evitar', group: 'Restrições', modes: ['v2v'], kind: 'multi',
    options: ['Flicker entre quadros', 'Deriva de identidade', 'Morphing', 'Mudar o movimento', 'Cortes / troca de plano', 'Texto gerado', 'Cara de IA (plástico)', 'Marca d\'água'] },
  { id: 'evitar', label: 'O que evitar', group: 'Restrições', modes: ['i2v', 't2i', 'i2i'], kind: 'multi',
    options: ['Cortes / troca de plano', 'Morphing', 'Texto gerado', 'Mãos em destaque', 'Tremor', 'Cara de IA (plástico)', 'Marca d\'água'] },
];

export const PROMPT_GROUPS: PromptField['group'][] = ['Plataforma', 'Cena', 'Câmera', 'Lente e luz', 'Estilo', 'Som', 'Restrições'];

export function fieldsForMode(mode: PromptMode) {
  // Reference to Video usa os campos de Image to Video (menos a lista de modelos, que tem a sua).
  return PROMPT_FIELDS.filter(f => f.modes.includes(mode) || (mode === 'r2v' && f.modes.includes('i2v') && f.id !== 'modelo'));
}

/** Modelo da ficha do Gerador → modelo disponível para gerar na Creator Lab. */
export function genModelFromChoices(mode: PromptMode, choices: Record<string, string | string[]>): string | null {
  const m = String(choices.modelo || choices.modeloRef || choices.modeloImagem || choices.modeloVideo || '');
  if (mode === 'v2v') return 'wan-v2v';
  const map: [RegExp, string][] = [
    [/kling 4/i, 'kling-4'], [/kling/i, 'kling-3'], [/veo/i, 'veo-fast'], [/seedance/i, 'seedance-fast'],
    [/hailuo/i, 'hailuo-23-std'], [/wan/i, 'wan-27'], [/grok/i, 'grok-imagine'], [/pixverse/i, 'pixverse-v6'], [/runway/i, 'runway'],
    [/nano banana pro/i, 'nano-banana-pro'], [/nano banana/i, 'nano-banana-2'], [/seedream/i, 'seedream-5-pro'],
    [/gpt image/i, 'gpt-image-2'], [/ideogram/i, 'ideogram-v3'], [/imagen/i, 'imagen4-fast'], [/flux/i, 'flux-3-klein'],
  ];
  for (const [re, id] of map) if (re.test(m)) return id;
  return null;
}

/** Imagens que o Gerador aceita em cada modo (as mesmas que a geração vai anexar). */
export const PROMPT_IMAGE_MODES: PromptMode[] = ['i2v', 'r2v', 'i2i', 'v2v'];

/**
 * Modelo de geração que a ficha aponta (ou o padrão da aba de geração) e quantas imagens ele aceita,
 * para o Gerador pedir exatamente as imagens que vão ser anexadas depois.
 */
export function promptImageTarget(mode: PromptMode, choices: Record<string, string | string[]>) {
  if (mode === 'v2v') return { modelId: null as string | null, max: 1, refSyntax: undefined as string | undefined };
  if (mode === 't2i') return { modelId: null as string | null, max: 0, refSyntax: undefined as string | undefined };
  const kind = mode === 'i2i' ? 'image' : 'video';
  const chosen = getModel(genModelFromChoices(mode, choices) || '');
  const model = chosen && chosen.modes.includes(mode as GenMode) ? chosen : modelsFor(kind, mode as GenMode)[0];
  const seconds = parseInt(String(choices.duracao || ''), 10);
  const max = maxImagesFor(model, mode as GenMode, Number.isFinite(seconds) ? { duration: seconds } : {});
  return { modelId: model.id, max, refSyntax: model.refSyntax?.[mode as GenMode] };
}

/** Texto principal pedido em cada modo. */
export const MAIN_TEXT: Record<PromptMode, { label: string; placeholder: string; required: boolean }> = {
  r2v: { label: 'O que deve acontecer no vídeo', required: true,
    placeholder: 'Ex.: a mulher da imagem 1 abre a caixa do produto da imagem 2 na cozinha da imagem 3 e sorri para a câmera.' },
  i2v: { label: 'O que deve acontecer no vídeo', required: false,
    placeholder: 'Ex.: a enfermeira levanta a cabeça quando um alarme toca e dá um passo decidido à frente. Quero algo tenso.' },
  t2i: { label: 'Descreva a imagem', required: true,
    placeholder: 'Ex.: criadora de conteúdo gravando com o celular num café em São Paulo, fim de tarde, para campanha de lançamento.' },
  v2v: { label: 'O que deve mudar no vídeo', required: true,
    placeholder: 'Ex.: transformar a cena em animação estilo stop motion de massinha, mantendo exatamente os movimentos e a câmera.' },
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
