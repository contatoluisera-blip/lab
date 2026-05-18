import { NextResponse } from 'next/server';

const CONFIG = {
  hourly_rates: {
    iniciante: 45,
    junior: 65,
    pleno: 95,
    senior: 140,
    especialista: 200
  },
  income_defaults: {
    iniciante: 2500,
    junior: 3500,
    pleno: 5000,
    senior: 8000,
    especialista: 12000
  },
  billable_hours_month: {
    iniciante: 70,
    junior: 80,
    pleno: 85,
    senior: 90,
    especialista: 90
  },
  regional_factors: {
    interior_pequeno: 0.88,
    interior_medio: 0.95,
    capital_comum: 1.0,
    capital_premium: 1.08,
    sao_paulo_capital: 1.08,
    remoto_nacional: 1.0
  },
  offer_modes: {
    mercado_lean: {
      commercial_reserve: 0.15,
      default_revision_rounds: 1,
      positioning_factor: 1.0
    },
    profissional_padrao: {
      commercial_reserve: 0.18,
      default_revision_rounds: 2,
      positioning_factor: 1.25
    },
    premium: {
      commercial_reserve: 0.22,
      default_revision_rounds: 2,
      positioning_factor: 1.65
    }
  },
  tax_profiles: {
    mei: 0.03,
    simples_inicial: 0.06,
    pf_autonomo: 0.15,
    nao_sei: 0.06
  },
  payment_fees: {
    pix: 0,
    transferencia: 0,
    boleto_gateway: 0.015,
    cartao_link: 0.025,
    plataforma: 0.15
  },
  usage_rights: {
    organico: 0,
    organico_trafego_local_3m: 0.08,
    trafego_local_forte: 0.12,
    trafego_nacional: 0.25,
    site_ads_12m: 0.35,
    uso_amplo: 0.5
  },
  deadline_multipliers: {
    normal: 1.0,
    rapido: 1.15,
    urgente: 1.35,
    fim_de_semana: 1.5
  },
  software_db: {
    capcut_free: 0,
    capcut_pro: 40,
    canva_free: 0,
    canva_pro: 35,
    adobe_premiere: 65,
    adobe_express: 23,
    adobe_photoshop: 65,
    adobe_after_effects: 65,
    adobe_stock: 139,
    google_one_30gb: 4.5,
    google_one_100gb: 9.99,
    google_ai_pro_5tb: 96.99,
    ia_generica: 100
  },
  equipment_db: {
    nenhum: { replacement_value: 0, life_months: 1, residual_rate: 0 },
    // iPhones
    iphone_11_usado: { replacement_value: 1800, life_months: 24, residual_rate: 0.2 },
    iphone_12: { replacement_value: 2500, life_months: 30, residual_rate: 0.3 },
    iphone_13: { replacement_value: 3200, life_months: 36, residual_rate: 0.35 },
    iphone_14: { replacement_value: 4000, life_months: 36, residual_rate: 0.35 },
    iphone_15: { replacement_value: 5000, life_months: 36, residual_rate: 0.4 },
    iphone_15_pro: { replacement_value: 6500, life_months: 36, residual_rate: 0.4 },
    iphone_15_pro_max: { replacement_value: 8000, life_months: 36, residual_rate: 0.45 },
    iphone_16_128gb: { replacement_value: 8499, life_months: 36, residual_rate: 0.45 },
    iphone_16_pro: { replacement_value: 10500, life_months: 36, residual_rate: 0.45 },
    iphone_16_pro_max: { replacement_value: 12500, life_months: 36, residual_rate: 0.45 },
    // Samsung Galaxy
    galaxy_s23_fe: { replacement_value: 2800, life_months: 30, residual_rate: 0.3 },
    galaxy_s23: { replacement_value: 3500, life_months: 36, residual_rate: 0.35 },
    galaxy_s23_ultra: { replacement_value: 5000, life_months: 36, residual_rate: 0.35 },
    galaxy_s24: { replacement_value: 5000, life_months: 36, residual_rate: 0.4 },
    galaxy_s24_ultra: { replacement_value: 8000, life_months: 36, residual_rate: 0.4 },
    galaxy_a54_a55: { replacement_value: 2000, life_months: 30, residual_rate: 0.3 },
    // Outros Androids
    motorola_edge_50_fusion: { replacement_value: 1950, life_months: 30, residual_rate: 0.35 },
    xiaomi_redmi_note: { replacement_value: 1500, life_months: 30, residual_rate: 0.25 },
    xiaomi_poco: { replacement_value: 2000, life_months: 30, residual_rate: 0.25 },
    android_intermediario_generico: { replacement_value: 2500, life_months: 30, residual_rate: 0.3 },
    
    // Outros equipamentos
    kit_audio_basico: { replacement_value: 300, life_months: 24, residual_rate: 0.2 },
    kit_audio_wireless: { replacement_value: 700, life_months: 36, residual_rate: 0.2 },
    kit_luz_basico: { replacement_value: 600, life_months: 36, residual_rate: 0.2 },
    kit_luz_profissional: { replacement_value: 1500, life_months: 36, residual_rate: 0.2 },
    gimbal_tripe: { replacement_value: 900, life_months: 36, residual_rate: 0.3 },
    notebook_edicao_intermediario: { replacement_value: 5500, life_months: 48, residual_rate: 0.4 },
    notebook_edicao_profissional: { replacement_value: 12000, life_months: 48, residual_rate: 0.45 }
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      creator_level = 'pleno',
      region_type = 'sao_paulo_capital',
      service_type = 'pacote_8_reels_mobile_lean',
      offer_mode = 'mercado_lean',
      client_type = 'pequeno_negocio',
      video_quantity = 8,
      capture_included = true,
      capture_hours = 4,
      edit_complexity = 'simples_intermediaria',
      revision_rounds = 1,
      usage_rights = 'organico_trafego_local_3m',
      deadline_type = 'normal',
      selected_smartphone = 'iphone_16_128gb',
      selected_computer = 'notebook_edicao_intermediario',
      selected_audio_kit = 'kit_audio_wireless',
      selected_light_kit = 'kit_luz_basico',
      selected_software = ['capcut_pro', 'canva_pro', 'google_one_100gb'],
      tax_profile = 'simples_inicial',
    } = body;

    // 1. Calcular Custo de Equipamentos e Software
    function calcEquipCost(eqId: string) {
      if (!eqId || eqId === 'nenhum') return 0;
      const eq = CONFIG.equipment_db[eqId as keyof typeof CONFIG.equipment_db];
      if (!eq) return 0;
      return (eq.replacement_value * (1 - eq.residual_rate)) / eq.life_months;
    }

    let total_software_cost = 0;
    if (Array.isArray(selected_software)) {
      selected_software.forEach(sw => {
        total_software_cost += CONFIG.software_db[sw as keyof typeof CONFIG.software_db] || 0;
      });
    }

    const total_equip_cost = 
      calcEquipCost(selected_smartphone) + 
      calcEquipCost(selected_computer) + 
      calcEquipCost(selected_audio_kit) + 
      calcEquipCost(selected_light_kit) +
      calcEquipCost('gimbal_tripe'); // Default adicionado para equiparar a simulação

    // 2. Definir Valor Base da Hora
    const creator = creator_level as keyof typeof CONFIG.hourly_rates;
    const income_presumida = CONFIG.income_defaults[creator] || 5000;
    const horas_faturaveis = CONFIG.billable_hours_month[creator] || 85;
    const imposto_rate = CONFIG.tax_profiles[tax_profile as keyof typeof CONFIG.tax_profiles] || 0.06;
    const impostos_estimados_mes = income_presumida * imposto_rate;

    const hora_minima_sustentavel = (income_presumida + impostos_estimados_mes + total_software_cost + total_equip_cost) / horas_faturaveis;
    const hora_mercado = CONFIG.hourly_rates[creator] || 95;

    const regional_factor = CONFIG.regional_factors[region_type as keyof typeof CONFIG.regional_factors] || 1.0;
    
    const valor_hora_base = Math.max(hora_mercado, hora_minima_sustentavel) * regional_factor;

    // 3. Calcular Horas Estimadas
    const q = Number(video_quantity) || 8;
    const h_captacao = capture_included ? (Number(capture_hours) || 4) : 0;

    let t_roteiro_pv = 0.25, t_edicao_pv = 0.75, t_legenda_pv = 0.25, t_revisao_pv = 0.20;
    let t_fixed = 8.5; 

    if (offer_mode === 'profissional_padrao') {
       t_roteiro_pv = 0.5; t_edicao_pv = 1.25; t_legenda_pv = 0.40; t_revisao_pv = 0.40;
       t_fixed = 14.5;
    } else if (offer_mode === 'premium') {
       t_roteiro_pv = 0.8; t_edicao_pv = 2.0; t_legenda_pv = 0.70; t_revisao_pv = 0.60;
       t_fixed = 22.5;
    }

    let vol_factor = 1.0;
    if (q >= 3 && q <= 5) vol_factor = 0.92;
    if (q >= 6 && q <= 10) vol_factor = 0.82;
    if (q >= 11 && q <= 20) vol_factor = 0.75;
    if (q >= 21) vol_factor = 0.68;

    const repetible_time_per_video = (t_roteiro_pv + t_edicao_pv + t_legenda_pv + t_revisao_pv);
    const total_repetible = (repetible_time_per_video * vol_factor) * q;

    const horas_estimadas = t_fixed + total_repetible + h_captacao;

    // 4. Custos Diretos
    let custos_diretos = 450;
    if (offer_mode === 'profissional_padrao') custos_diretos = 650;
    if (offer_mode === 'premium') custos_diretos = 1100;

    // 5. Custo Técnico e Adicionais
    const technical_cost = horas_estimadas * valor_hora_base;

    const direitos_pct = CONFIG.usage_rights[usage_rights as keyof typeof CONFIG.usage_rights] || 0.08;
    const valor_direitos = technical_cost * direitos_pct;

    const operational_risk = technical_cost * 0.04;

    const subtotal = technical_cost + custos_diretos + valor_direitos + operational_risk;

    // 6. Fechamento (Gross-up)
    const taxa_pagamento = 0.025; // default cartao_link
    const reserva_comercial = CONFIG.offer_modes[offer_mode as keyof typeof CONFIG.offer_modes]?.commercial_reserve || 0.15;
    const deadline_mult = CONFIG.deadline_multipliers[deadline_type as keyof typeof CONFIG.deadline_multipliers] || 1.0;

    const subtotal_com_prazo = subtotal * deadline_mult;

    const calc_price = (reserva: number) => subtotal_com_prazo / (1 - imposto_rate - taxa_pagamento - reserva);

    const price_recommended = calc_price(reserva_comercial);
    const price_min = calc_price(0); // Sem reserva comercial
    const price_premium = calc_price(CONFIG.offer_modes['premium'].commercial_reserve) * 1.5; 

    // Arredondamentos
    const precoFinal = Math.round(price_recommended / 50) * 50;
    const precoMinimo = Math.round(price_min / 50) * 50;
    const precoPremium = Math.round(price_premium / 50) * 50;
    const precoPorVideo = Math.round(precoFinal / q);

    // Formatar como string amigável
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

    // Raciocínio (Mock explicativo atualizado)
    const argumentoVenda = `Este orçamento considera ${q} vídeos verticais curtos, até ${h_captacao} horas de captação, edição ${edit_complexity.replace('_', ' ')}, legendas, capa simples, e entrega em prazo ${deadline_type}. Não inclui arquivos brutos ou motion avançado.`;

    const resultData = {
      precoMinimo: fmt(precoMinimo),
      precoRecomendado: fmt(precoFinal),
      precoPremium: fmt(precoPremium),
      precoPorVideo: fmt(precoPorVideo),
      raciocinio: `A precificação considera ${horas_estimadas.toFixed(1)}h técnicas estimadas. Valor base regional da hora operando a ${fmt(valor_hora_base)}/h. Custos diretos previstos de ${fmt(custos_diretos)}.`,
      argumentoVenda
    };

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
