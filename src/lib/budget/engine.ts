// ─────────────────────────────────────────────────────────────
// Motor de precificação da Calculadora de Orçamento (determinístico, sem IA)
// Dois modos sobre a mesma base:
// - tradicional: captação + edição pelo celular (cálculo original);
// - ia: operação com geração de imagem e vídeo por IA (100% ou parte do vídeo).
// A base comum é a mesma: valor da hora (custo fixo, nível, região, porte),
// direitos de uso, prazo e o gross-up de impostos, taxa e reserva comercial.
// A tela usa este arquivo para a prévia ao vivo; o servidor, para o resultado.
// ─────────────────────────────────────────────────────────────

import { GEN_MODELS, USD_TO_BRL, quote } from '@/lib/generation';
import { PLAN_CONFIGS, PlanId } from '@/lib/planConfig';

export const CONFIG = {
  hourly_rates: { iniciante: 45, junior: 65, pleno: 95, senior: 140, especialista: 200 },
  regional_factors: {
    interior_pequeno: 0.88, interior_medio: 0.95, capital_comum: 1.0, capital_premium: 1.08, sao_paulo_capital: 1.08, remoto_nacional: 1.0,
  },
  client_size_multiplier: { micro: 1.0, pequeno: 1.10, medio: 1.20, grande: 1.30, multinacional: 1.50 },
  usage_rights: {
    organico: 0, organico_trafego_local_3m: 0.08, trafego_local_forte: 0.12, trafego_nacional: 0.25, site_ads_12m: 0.35, uso_amplo: 0.5,
  },
  deadline_multipliers: { flexivel: 0.95, normal: 1.0, rapido: 1.10, urgente: 1.20, imediatissimo: 1.35 },
};

const RESERVA_COMERCIAL = 0.15;
const TAXA_PAGAMENTO = 0.025;

export type BudgetMode = 'tradicional' | 'ia';

export interface DetailItem { label: string; valor: string; desc: string; grupo?: 'base' | 'ia' | 'tempo' | 'fechamento' }

export const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const n = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

/* ─────────────────────── Operação com IA: opções ─────────────────────── */

export interface AiTool { id: string; label: string; hint: string; costPerUnit: number | null }

/** Custo de vídeo por segundo gerado (R$), a partir do preço oficial das APIs (KIE) no catálogo da Creator Lab. */
function perSecond(modelId: string, config: Record<string, unknown>) {
  const model = GEN_MODELS.find(m => m.id === modelId)!;
  const q = quote(model, config);
  const seconds = Number(config.duration) || 5;
  return Number(((q.usd * USD_TO_BRL) / seconds).toFixed(3));
}

export const AI_VIDEO_TOOLS: AiTool[] = [
  { id: 'kling-std', label: 'Kling 3.0 Padrão (720p)', hint: 'Preço de API', costPerUnit: perSecond('kling-3', { quality: 'std', duration: 5, audio: false }) },
  { id: 'kling-pro', label: 'Kling 3.0 Pro (1080p)', hint: 'Preço de API', costPerUnit: perSecond('kling-3', { quality: 'pro', duration: 5, audio: false }) },
  { id: 'kling-pro-audio', label: 'Kling 3.0 Pro com áudio', hint: 'Preço de API', costPerUnit: perSecond('kling-3', { quality: 'pro', duration: 5, audio: true }) },
  { id: 'veo-fast', label: 'Veo 3.1 Fast (1080p, som)', hint: 'Preço de API', costPerUnit: perSecond('veo-fast', { resolution: '1080p', duration: 8 }) },
  { id: 'veo-quality', label: 'Veo 3.1 Quality (1080p, som)', hint: 'Preço de API', costPerUnit: perSecond('veo-quality', { resolution: '1080p', duration: 8 }) },
  { id: 'wan-v2v', label: 'Wan 2.6 vídeo para vídeo (1080p)', hint: 'Preço de API', costPerUnit: perSecond('wan-v2v', { resolution: '1080p', duration: 5 }) },
  { id: 'veo-lite', label: 'Veo 3.1 Lite (1080p, som)', hint: 'Preço de API', costPerUnit: perSecond('veo-lite', { resolution: '1080p', duration: 8 }) },
  { id: 'kling-4', label: 'Kling 4.0 (1080p)', hint: 'Preço de API', costPerUnit: perSecond('kling-4', { resolution: '1080p', duration: 5 }) },
  { id: 'kling-turbo', label: 'Kling 3.0 Turbo (1080p, som)', hint: 'Preço de API', costPerUnit: perSecond('kling-turbo', { resolution: '1080p', duration: 5 }) },
  { id: 'seedance-fast', label: 'Seedance 2 Fast (720p, som)', hint: 'Preço de API', costPerUnit: perSecond('seedance-fast', { resolution: '720p', duration: 5 }) },
  { id: 'hailuo-23-pro', label: 'Hailuo 2.3 Pro (1080p)', hint: 'Preço de API', costPerUnit: perSecond('hailuo-23-pro', { resolution: '1080P', duration: 6 }) },
  { id: 'wan-27', label: 'Wan 2.7 (1080p)', hint: 'Preço de API', costPerUnit: perSecond('wan-27', { resolution: '1080p', duration: 5 }) },
  { id: 'grok-imagine', label: 'Grok Imagine (720p, som)', hint: 'Preço de API', costPerUnit: perSecond('grok-imagine', { resolution: '720p', duration: 10 }) },
  { id: 'creator-lab', label: 'Créditos da Creator Lab', hint: 'Calculado pelo valor do crédito no seu plano', costPerUnit: null },
  { id: 'custom', label: 'Outra ferramenta (informar R$ por segundo)', hint: 'Assinatura própria, Higgsfield, Runway…', costPerUnit: null },
];

export const AI_IMAGE_TOOLS: AiTool[] = [
  { id: 'nb2', label: 'Nano Banana 2 (2K)', hint: 'Preço de API', costPerUnit: Number((0.06 * USD_TO_BRL).toFixed(3)) },
  { id: 'nb-pro', label: 'Nano Banana Pro (2K)', hint: 'Preço de API', costPerUnit: Number((0.09 * USD_TO_BRL).toFixed(3)) },
  { id: 'gpt-image-2', label: 'GPT Image 2 (2K)', hint: 'Preço de API', costPerUnit: Number((0.05 * USD_TO_BRL).toFixed(3)) },
  { id: 'seedream-5', label: 'Seedream 5.0 Pro (2K)', hint: 'Preço de API', costPerUnit: Number((0.07 * USD_TO_BRL).toFixed(3)) },
  { id: 'flux-klein', label: 'FLUX 3 Klein (2K)', hint: 'Preço de API', costPerUnit: Number((0.0125 * USD_TO_BRL).toFixed(3)) },
  { id: 'creator-lab', label: 'Créditos da Creator Lab', hint: 'Calculado pelo valor do crédito no seu plano', costPerUnit: null },
  { id: 'custom', label: 'Outra ferramenta (informar R$ por imagem)', hint: 'Midjourney, Freepik…', costPerUnit: null },
];

/** Tentativas geradas para cada take aprovado (o que vai para o lixo também custa). */
export const DISCARD_LEVELS = {
  baixo: { label: 'Baixo: cenas simples, ação lenta', factor: 1.5 },
  medio: { label: 'Médio: pessoas, movimento, alguns ajustes', factor: 2.5 },
  alto: { label: 'Alto: personagem consistente, ação complexa, lip sync', factor: 4 },
} as const;

export const AI_COMPLEXITY = {
  simples: { label: 'Simples: cenas avulsas, sem personagem fixo', factor: 0.7 },
  media: { label: 'Média: narrativa curta, personagem recorrente', factor: 1 },
  complexa: { label: 'Complexa: storytelling, consistência, VFX, fala sincronizada', factor: 1.5 },
} as const;

/** Créditos da Creator Lab por unidade, usando o catálogo atual. */
const CL_CREDITS_PER_SECOND = (() => {
  const k = GEN_MODELS.find(m => m.id === 'kling-3')!;
  return quote(k, { quality: 'pro', duration: 5, audio: false }).credits / 5;
})();
const CL_CREDITS_PER_IMAGE = (() => {
  const m = GEN_MODELS.find(x => x.id === 'nano-banana-2')!;
  return quote(m, { resolution: '2K' }).credits;
})();

/** Valor de um crédito no plano (preço do plano ÷ créditos do mês). */
export function creditValue(plan?: string | null) {
  const cfg = PLAN_CONFIGS[(plan as PlanId) || 'pro'] || PLAN_CONFIGS.pro;
  const price = Number(cfg.price.replace(/[^\d,]/g, '').replace(',', '.')) || 117;
  return price / cfg.credits;
}

export interface AiDetails {
  ai_share: number;              // % do vídeo final feito com IA (10 a 100)
  seconds_per_video: number;     // duração final de cada vídeo
  scenes_per_video: number;      // cenas/takes de IA por vídeo
  video_tool: string;
  custom_video_cost: number;     // R$ por segundo (ferramenta própria)
  discard_level: keyof typeof DISCARD_LEVELS;
  frames_per_scene: number;      // frames gerados como imagem antes de animar
  image_tool: string;
  custom_image_cost: number;     // R$ por imagem
  voice: 'nenhuma' | 'ia' | 'locutor';
  voice_cost_per_min: number;    // R$ por minuto (IA de voz ou cachê de locutor)
  music_cost: number;            // R$ por projeto (trilha licenciada ou IA)
  script_included: boolean;      // você escreve o roteiro
  complexity: keyof typeof AI_COMPLEXITY;
  revision_rounds: number;
  subscriptions: { id: string; name: string; value: number }[]; // assinaturas de IA (mensal)
  plan?: string | null;          // plano do usuário (para o valor do crédito)
}

export const DEFAULT_AI_DETAILS: AiDetails = {
  ai_share: 100,
  seconds_per_video: 30,
  scenes_per_video: 6,
  video_tool: 'kling-pro',
  custom_video_cost: 0,
  discard_level: 'medio',
  frames_per_scene: 1,
  image_tool: 'nb2',
  custom_image_cost: 0,
  voice: 'nenhuma',
  voice_cost_per_min: 0,
  music_cost: 0,
  script_included: true,
  complexity: 'media',
  revision_rounds: 2,
  subscriptions: [],
};

/** Custo unitário efetivo (R$) das ferramentas escolhidas. */
export function aiUnitCosts(d: AiDetails) {
  const cv = creditValue(d.plan);
  const videoTool = AI_VIDEO_TOOLS.find(t => t.id === d.video_tool) || AI_VIDEO_TOOLS[1];
  const imageTool = AI_IMAGE_TOOLS.find(t => t.id === d.image_tool) || AI_IMAGE_TOOLS[0];
  const perSecondCost = videoTool.id === 'custom' ? n(d.custom_video_cost)
    : videoTool.id === 'creator-lab' ? CL_CREDITS_PER_SECOND * cv : videoTool.costPerUnit || 0;
  const perImageCost = imageTool.id === 'custom' ? n(d.custom_image_cost)
    : imageTool.id === 'creator-lab' ? CL_CREDITS_PER_IMAGE * cv : imageTool.costPerUnit || 0;
  return { perSecondCost, perImageCost, videoTool, imageTool, creditValue: cv };
}

/** Custos diretos de IA do projeto (prévia ao vivo e servidor usam a mesma conta). */
export function aiDirectCosts(d: AiDetails, videoQuantity: number) {
  const q = Math.max(1, Math.round(n(videoQuantity, 1)));
  const share = Math.min(100, Math.max(10, n(d.ai_share, 100))) / 100;
  const seconds = Math.max(3, n(d.seconds_per_video, 30));
  const scenes = Math.max(1, Math.round(n(d.scenes_per_video, 6)));
  const tries = DISCARD_LEVELS[d.discard_level]?.factor ?? 2.5;
  const { perSecondCost, perImageCost } = aiUnitCosts(d);

  const aiSeconds = q * seconds * share;
  const aiScenes = q * scenes * share;
  const video = aiSeconds * perSecondCost * tries;
  const images = aiScenes * Math.max(0, n(d.frames_per_scene, 1)) * perImageCost * tries;
  const voice = d.voice === 'nenhuma' ? 0 : q * (seconds / 60) * n(d.voice_cost_per_min);
  const music = n(d.music_cost);
  // Variação natural da geração (refação inesperada): reserva sobre o que é gerado.
  const risk = (video + images) * 0.2;
  return { q, share, seconds, scenes, tries, aiSeconds, aiScenes, video, images, voice, music, risk, total: video + images + voice + music + risk, perSecondCost, perImageCost };
}

/** Horas de trabalho humano numa operação com IA. */
function aiHours(d: AiDetails, q: number, scenes: number, seconds: number, share: number, tries: number, externalCapture: boolean, captureHours: number) {
  const cx = AI_COMPLEXITY[d.complexity]?.factor ?? 1;
  const aiScenes = scenes * share;
  const roteiro = d.script_included ? 0.75 * cx : 0;
  const direcao = aiScenes * 0.15 * cx;                        // escrever e ajustar prompts
  const geracao = aiScenes * 0.12 * tries;                     // gerar, assistir e escolher cada tentativa
  const frames = aiScenes * Math.max(0, n(d.frames_per_scene, 1)) * 0.05 * tries;
  const montagem = (0.5 + (seconds / 60)) * cx;                // montagem, cor, legenda, exportação
  const som = d.voice !== 'nenhuma' || n(d.music_cost) > 0 ? 0.3 : 0;
  const revisao = Math.max(0, Math.round(n(d.revision_rounds, 2))) * 0.4;
  const tradicional = (1 - share) * 1.5;                       // parte filmada/editada do jeito tradicional
  const perVideo = { roteiro, direcao, geracao: geracao + frames, montagem, som, revisao, tradicional };
  const sumPerVideo = Object.values(perVideo).reduce((a, b) => a + b, 0);

  let vol = 1.0;
  if (q >= 3 && q <= 5) vol = 0.9;
  if (q >= 6 && q <= 10) vol = 0.8;
  if (q >= 11) vol = 0.7;

  const capture = externalCapture && share < 1 ? captureHours : 0;
  const total = sumPerVideo * vol * q + capture + 2.0; // +2h de briefing e administração
  return { perVideo, vol, capture, total };
}

/* ─────────────────────── Cálculo completo ─────────────────────── */

export function calculateBudget(body: any) {
  const {
    mode = 'tradicional',
    personal_info = {},
    recurrent_costs = [],
    experience = {},
    client_info = {},
    service_details = {},
    custom_equipment = [],
    extra_costs = {},
    tax_percentage = 6,
  } = body || {};
  const ai: AiDetails = { ...DEFAULT_AI_DETAILS, ...(body?.ai_details || {}) };

  const detalhamento: DetailItem[] = [];

  // 1. Horas faturáveis
  const hours_per_day = n(personal_info.hours_per_day, 8) || 8;
  const days_per_month = n(personal_info.days_per_month, 22) || 22;
  const billable_hours_month = hours_per_day * days_per_month * 0.6;
  detalhamento.push({ grupo: 'base', label: 'Horas Faturáveis Mensais', valor: `${billable_hours_month.toFixed(0)}h`, desc: `Considerando ${hours_per_day}h/dia em ${days_per_month} dias, com eficiência de 60%.` });

  // 2. Custos fixos
  const total_recurrent_costs = (recurrent_costs as any[]).reduce((s, c) => s + n(c.value), 0);
  detalhamento.push({ grupo: 'base', label: 'Custos Fixos (Mensal)', valor: fmt(total_recurrent_costs), desc: 'Soma de todos os gastos recorrentes informados (internet, softwares, aluguel, etc).' });

  // 3. Amortização de equipamentos
  const total_equip_monthly = (custom_equipment as any[]).reduce((s, eq) => s + (n(eq.value) * 0.8) / (n(eq.life_months, 36) || 36), 0);
  detalhamento.push({ grupo: 'base', label: 'Amortização de Equipamentos', valor: fmt(total_equip_monthly), desc: 'Custo mensal para repor seus equipamentos no futuro.' });

  // 4. Valor da hora
  const imposto_rate = n(tax_percentage) / 100;
  const custo_hora_minimo = (total_recurrent_costs + total_equip_monthly) / billable_hours_month;
  const creator_level = experience.level || 'pleno';
  const hora_mercado = CONFIG.hourly_rates[creator_level as keyof typeof CONFIG.hourly_rates] || 95;
  const regional_factor = CONFIG.regional_factors[client_info.region_type as keyof typeof CONFIG.regional_factors] || 1.0;
  const client_size_mult = CONFIG.client_size_multiplier[client_info.size as keyof typeof CONFIG.client_size_multiplier] || 1.0;
  const valor_hora_base = Math.max(custo_hora_minimo * 1.5, hora_mercado) * regional_factor * client_size_mult;
  detalhamento.push({ grupo: 'base', label: 'Valor da Hora Técnica', valor: fmt(valor_hora_base), desc: `Ajustado pelo seu custo mínimo (${fmt(custo_hora_minimo)}/h), nível ${String(creator_level).toUpperCase()} e porte do cliente.` });

  const q = Math.max(1, Math.round(n(service_details.video_quantity, 1)));
  let horas_estimadas = 0;
  let custo_ia = 0;
  let ia_subs_rateio = 0;
  let aiInfo: ReturnType<typeof aiDirectCosts> | null = null;

  if (mode === 'ia') {
    // 5a. Horas da operação com IA
    const direct = aiDirectCosts({ ...ai }, q);
    aiInfo = direct;
    const hours = aiHours(ai, q, direct.scenes, direct.seconds, direct.share, direct.tries, !!service_details.external_capture, n(service_details.capture_hours, 4));
    horas_estimadas = hours.total;
    const pv = hours.perVideo;
    detalhamento.push({
      grupo: 'tempo', label: 'Tempo Estimado do Projeto', valor: `${horas_estimadas.toFixed(1)}h`,
      desc: `Por vídeo: roteiro ${pv.roteiro.toFixed(1)}h, direção de prompts ${pv.direcao.toFixed(1)}h, geração e curadoria ${pv.geracao.toFixed(1)}h, montagem ${pv.montagem.toFixed(1)}h, som ${pv.som.toFixed(1)}h, revisões ${pv.revisao.toFixed(1)}h${pv.tradicional ? `, parte tradicional ${pv.tradicional.toFixed(1)}h` : ''}. Fator de escala ${Math.round(hours.vol * 100)}% para ${q} vídeos${hours.capture ? ` + ${hours.capture}h de captação` : ''} + 2h de briefing.`,
    });

    // 5b. Custos diretos de IA
    detalhamento.push({ grupo: 'ia', label: 'Geração de Vídeo com IA', valor: fmt(direct.video), desc: `${direct.aiSeconds.toFixed(0)}s de vídeo com IA (${Math.round(direct.share * 100)}% do total) × ${fmt(direct.perSecondCost)}/s × ${direct.tries} tentativas por take aprovado.` });
    if (direct.images > 0) detalhamento.push({ grupo: 'ia', label: 'Frames (Imagens com IA)', valor: fmt(direct.images), desc: `${Math.round(direct.aiScenes * n(ai.frames_per_scene, 1))} frames × ${fmt(direct.perImageCost)} × ${direct.tries} tentativas.` });
    if (direct.voice > 0) detalhamento.push({ grupo: 'ia', label: ai.voice === 'locutor' ? 'Locução (Locutor)' : 'Voz com IA', valor: fmt(direct.voice), desc: `${((direct.seconds / 60) * q).toFixed(1)} min de áudio × ${fmt(n(ai.voice_cost_per_min))}/min.` });
    if (direct.music > 0) detalhamento.push({ grupo: 'ia', label: 'Trilha / Licença de Música', valor: fmt(direct.music), desc: 'Valor informado para o projeto.' });
    detalhamento.push({ grupo: 'ia', label: 'Reserva de Variação da Geração', valor: fmt(direct.risk), desc: '20% sobre o custo de geração para cobrir refações que fogem do previsto.' });

    // 5c. Assinaturas de IA (rateio pelas horas do projeto)
    const subs_monthly = (ai.subscriptions || []).reduce((s, x) => s + n(x.value), 0);
    ia_subs_rateio = subs_monthly * Math.min(1, horas_estimadas / billable_hours_month);
    if (ia_subs_rateio > 0) detalhamento.push({ grupo: 'ia', label: 'Rateio das Assinaturas de IA', valor: fmt(ia_subs_rateio), desc: `${fmt(subs_monthly)}/mês de assinaturas, proporcional às ${horas_estimadas.toFixed(1)}h do projeto.` });

    custo_ia = direct.total + ia_subs_rateio;
  } else {
    // 5. Horas do projeto tradicional
    const h_captacao = service_details.external_capture ? n(service_details.capture_hours, 4) || 4 : 0;
    let t_roteiro_pv = 0.5, t_edicao_pv = 1.0;
    const t_revisao_pv = 0.5;
    const complexity = service_details.edit_complexity || 'media';
    if (complexity === 'facil') { t_edicao_pv = 0.5; t_roteiro_pv = 0.2; }
    if (complexity === 'dificil') { t_edicao_pv = 2.5; t_roteiro_pv = 1.0; }
    let vol_factor = 1.0;
    if (q >= 3 && q <= 5) vol_factor = 0.90;
    if (q >= 6 && q <= 10) vol_factor = 0.80;
    if (q >= 11) vol_factor = 0.70;
    const total_repetible = ((t_roteiro_pv + t_edicao_pv + t_revisao_pv) * vol_factor) * q;
    horas_estimadas = total_repetible + h_captacao + 2.0;
    detalhamento.push({ grupo: 'tempo', label: 'Tempo Estimado do Projeto', valor: `${horas_estimadas.toFixed(1)}h`, desc: `${h_captacao}h captação + ${total_repetible.toFixed(1)}h produção (com fator de escala para ${q} vídeos).` });
  }

  // 6. Custo técnico
  const custo_tecnico = horas_estimadas * valor_hora_base;
  detalhamento.push({ grupo: 'tempo', label: 'Custo Técnico Fixo', valor: fmt(custo_tecnico), desc: 'Tempo Estimado x Valor da Hora Técnica.' });

  // 7. Extras
  const total_extras = ['freelancers', 'stock_footage', 'soundtrack', 'vectors', 'others'].reduce((s, k) => s + n(extra_costs?.[k]), 0);
  if (total_extras > 0) detalhamento.push({ grupo: 'fechamento', label: 'Custos Adicionais da Produção', valor: fmt(total_extras), desc: 'Soma de freelancers, banco de imagens, trilhas e outros.' });

  // 8. Direitos
  const usage = service_details.usage_rights || 'organico';
  const direitos_pct = CONFIG.usage_rights[usage as keyof typeof CONFIG.usage_rights] || 0;
  const valor_direitos = custo_tecnico * direitos_pct;
  if (valor_direitos > 0) detalhamento.push({ grupo: 'fechamento', label: 'Licenciamento de Imagem', valor: fmt(valor_direitos), desc: `Adicional de ${(direitos_pct * 100).toFixed(0)}% pelo escopo de direitos autorais e veiculação.` });

  // 9. Prazo
  const deadline_mult = CONFIG.deadline_multipliers[(service_details.deadline_type || 'normal') as keyof typeof CONFIG.deadline_multipliers] || 1.0;
  const base_sem_prazo = custo_tecnico + total_extras + valor_direitos + custo_ia;
  const subtotal = base_sem_prazo * deadline_mult;
  if (deadline_mult > 1.0) detalhamento.push({ grupo: 'fechamento', label: 'Taxa de Urgência', valor: fmt(subtotal - base_sem_prazo), desc: `Acréscimo de ${((deadline_mult - 1) * 100).toFixed(0)}% por conta do prazo de entrega.` });

  // 10. Gross-up
  const precoFinal = subtotal / (1 - imposto_rate - TAXA_PAGAMENTO - RESERVA_COMERCIAL);
  const imposto_valor = precoFinal * imposto_rate;
  const taxa_valor = precoFinal * TAXA_PAGAMENTO;
  const reserva_valor = precoFinal * RESERVA_COMERCIAL;
  detalhamento.push({ grupo: 'fechamento', label: 'Impostos Fiscais e Taxas', valor: fmt(imposto_valor + taxa_valor), desc: `Imposto declarado (${(imposto_rate * 100).toFixed(1)}%) + Gateway (${(TAXA_PAGAMENTO * 100).toFixed(1)}%).` });
  detalhamento.push({ grupo: 'fechamento', label: 'Reserva Comercial e Lucro', valor: fmt(reserva_valor), desc: `Margem estratégica de ${(RESERVA_COMERCIAL * 100).toFixed(0)}% para absorver negociações ou converter em lucro líquido.` });

  const roundedFinal = Math.ceil(precoFinal / 10) * 10;
  const roundedMin = Math.ceil((subtotal / (1 - imposto_rate - TAXA_PAGAMENTO)) / 10) * 10;

  // Custos x margem (no preço recomendado)
  const custo_tempo = horas_estimadas * custo_hora_minimo;           // o que o seu tempo custa de verdade
  const custo_real = custo_ia + total_extras + custo_tempo;
  const impostos_taxas = roundedFinal * (imposto_rate + TAXA_PAGAMENTO);
  const lucro = roundedFinal - impostos_taxas - custo_real;
  const analise = {
    custoIa: fmt(custo_ia), custoIaNum: custo_ia,
    custoTempo: fmt(custo_tempo), custoTempoNum: custo_tempo,
    extras: fmt(total_extras), extrasNum: total_extras,
    impostos: fmt(impostos_taxas), impostosNum: impostos_taxas,
    lucro: fmt(lucro), lucroNum: lucro,
    margemPct: Math.round((lucro / roundedFinal) * 100),
    precoNum: roundedFinal,
    horas: Number(horas_estimadas.toFixed(1)),
    ...(aiInfo ? { segundosIa: Math.round(aiInfo.aiSeconds), precoPorSegundo: fmt(roundedFinal / (aiInfo.seconds * q)) } : {}),
  };

  const clientName = client_info.company_name || 'o cliente';
  const argumentoVenda = mode === 'ia'
    ? `Orçamento dimensionado para ${q} vídeo(s) de ${aiInfo!.seconds}s com ${Math.round(aiInfo!.share * 100)}% de produção em IA para ${clientName}. O cálculo considerou ${horas_estimadas.toFixed(1)}h de direção, geração, curadoria e montagem, o custo real das gerações (incluindo as tentativas descartadas) e o nível ${String(creator_level).toUpperCase()}.`
    : `Orçamento dimensionado para produção de ${q} vídeos de ${service_details.sub_type ? String(service_details.sub_type).replace('_', ' ') : 'vídeo mobile'} para ${clientName}. O cálculo considerou o nível ${String(creator_level).toUpperCase()}, tempo estimado técnico de ${horas_estimadas.toFixed(1)}h e o custo operacional de manutenção dos seus equipamentos declarados.`;

  return {
    mode,
    precoMinimo: fmt(roundedMin),
    precoRecomendado: fmt(roundedFinal),
    precoPremium: fmt(roundedFinal * 1.4),
    precoPorVideo: fmt(roundedFinal / q),
    raciocinio: `Base técnica de ${fmt(custo_tecnico)}${custo_ia ? ` + ${fmt(custo_ia)} de custos de IA` : ''} + extras e direitos. Gross-up aplicado para proteger ${(imposto_rate * 100).toFixed(1)}% de impostos e 15% de margem.`,
    argumentoVenda,
    detalhamento,
    analise,
  };
}

/** Estimativa a partir do roteiro: ~2,5 palavras faladas por segundo e um take a cada ~5 s ou por cena marcada. */
export function estimateFromScript(script: string) {
  const text = script.trim();
  if (!text) return null;
  const sceneMarks = (text.match(/^\s*(cena|take|plano|\[?\d+[\].:)-])/gim) || []).length;
  const spoken = text.replace(/^\s*(cena|take|plano)[^\n]*$/gim, '').split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(5, Math.round(spoken / 2.5));
  const scenes = Math.max(1, sceneMarks || Math.round(seconds / 5));
  return { seconds, scenes, words: spoken };
}
