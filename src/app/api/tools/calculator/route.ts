import { NextResponse } from 'next/server';

const CONFIG = {
  hourly_rates: {
    iniciante: 45,
    junior: 65,
    pleno: 95,
    senior: 140,
    especialista: 200
  },
  regional_factors: {
    interior_pequeno: 0.88,
    interior_medio: 0.95,
    capital_comum: 1.0,
    capital_premium: 1.08,
    sao_paulo_capital: 1.08,
    remoto_nacional: 1.0
  },
  client_size_multiplier: {
    micro: 1.0,
    pequeno: 1.10,
    medio: 1.20,
    grande: 1.30,
    multinacional: 1.50
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
    flexivel: 0.95,
    normal: 1.0,
    rapido: 1.10,
    urgente: 1.20,
    imediatissimo: 1.35
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      personal_info = {},
      recurrent_costs = [],
      experience = {},
      client_info = {},
      service_details = {},
      custom_equipment = [],
      extra_costs = {},
      tax_percentage = 6
    } = body;

    const detalhamento: { label: string; valor: string; desc: string }[] = [];
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 1. Horas Faturáveis no Mês
    const hours_per_day = Number(personal_info.hours_per_day) || 8;
    const days_per_month = Number(personal_info.days_per_month) || 22;
    const total_work_hours = hours_per_day * days_per_month;
    // Assume 60% of time is billable (rest is admin, prospect, idle)
    const billable_hours_month = total_work_hours * 0.6;
    detalhamento.push({
      label: 'Horas Faturáveis Mensais',
      valor: `${billable_hours_month.toFixed(0)}h`,
      desc: `Considerando ${hours_per_day}h/dia em ${days_per_month} dias, com eficiência de 60%.`
    });

    // 2. Somar Custos Recorrentes
    let total_recurrent_costs = 0;
    recurrent_costs.forEach((c: any) => {
      total_recurrent_costs += Number(c.value) || 0;
    });
    detalhamento.push({
      label: 'Custos Fixos (Mensal)',
      valor: fmt(total_recurrent_costs),
      desc: 'Soma de todos os gastos recorrentes informados (internet, softwares, aluguel, etc).'
    });

    // 3. Somar Amortização de Equipamentos
    let total_equip_monthly = 0;
    custom_equipment.forEach((eq: any) => {
      const val = Number(eq.value) || 0;
      const life = Number(eq.life_months) || 36;
      const residual = 0.2; // assumindo 20% valor de revenda
      const amort = (val * (1 - residual)) / life;
      total_equip_monthly += amort;
    });
    detalhamento.push({
      label: 'Amortização de Equipamentos',
      valor: fmt(total_equip_monthly),
      desc: 'Custo mensal para repor seus equipamentos no futuro.'
    });

    // 4. Valor Base da Hora
    const imposto_rate = (Number(tax_percentage) || 0) / 100;
    // Custo base por hora
    const custo_hora_minimo = (total_recurrent_costs + total_equip_monthly) / billable_hours_month;
    
    // Valor de mercado pelo nível
    const creator_level = experience.level || 'pleno';
    const hora_mercado = CONFIG.hourly_rates[creator_level as keyof typeof CONFIG.hourly_rates] || 95;
    
    // Pegar o maior para garantir sustentabilidade, e aplicar fator regional
    const regional_factor = CONFIG.regional_factors[client_info.region_type as keyof typeof CONFIG.regional_factors] || 1.0;
    const client_size_mult = CONFIG.client_size_multiplier[client_info.size as keyof typeof CONFIG.client_size_multiplier] || 1.0;

    const valor_hora_base = Math.max(custo_hora_minimo * 1.5 /* Margem de lucro básica sobre custo */, hora_mercado) * regional_factor * client_size_mult;
    
    detalhamento.push({
      label: 'Valor da Hora Técnica',
      valor: fmt(valor_hora_base),
      desc: `Ajustado pelo seu custo mínimo (${fmt(custo_hora_minimo)}/h), nível ${creator_level.toUpperCase()} e porte do cliente.`
    });

    // 5. Horas do Projeto
    const q = Number(service_details.video_quantity) || 1;
    const h_captacao = service_details.external_capture ? (Number(service_details.capture_hours) || 4) : 0;
    
    let t_roteiro_pv = 0.5, t_edicao_pv = 1.0, t_revisao_pv = 0.5;
    const complexity = service_details.edit_complexity || 'media';
    if (complexity === 'facil') { t_edicao_pv = 0.5; t_roteiro_pv = 0.2; }
    if (complexity === 'dificil') { t_edicao_pv = 2.5; t_roteiro_pv = 1.0; }

    // Fator de volume (desconto no tempo por eficiência em escala)
    let vol_factor = 1.0;
    if (q >= 3 && q <= 5) vol_factor = 0.90;
    if (q >= 6 && q <= 10) vol_factor = 0.80;
    if (q >= 11) vol_factor = 0.70;

    const repetible_time_per_video = (t_roteiro_pv + t_edicao_pv + t_revisao_pv);
    const total_repetible = (repetible_time_per_video * vol_factor) * q;
    
    const horas_estimadas = total_repetible + h_captacao + 2.0; // +2h de admin/briefing
    
    detalhamento.push({
      label: 'Tempo Estimado do Projeto',
      valor: `${horas_estimadas.toFixed(1)}h`,
      desc: `${h_captacao}h captação + ${(total_repetible).toFixed(1)}h produção (com fator de escala para ${q} vídeos).`
    });

    // 6. Custo Técnico Bruto
    const custo_tecnico = horas_estimadas * valor_hora_base;
    detalhamento.push({
      label: 'Custo Técnico Fixo',
      valor: fmt(custo_tecnico),
      desc: 'Tempo Estimado x Valor da Hora Técnica.'
    });

    // 7. Custos Extras (Terceirizados, Stock, etc)
    let total_extras = 0;
    if (extra_costs) {
      total_extras += Number(extra_costs.freelancers) || 0;
      total_extras += Number(extra_costs.stock_footage) || 0;
      total_extras += Number(extra_costs.soundtrack) || 0;
      total_extras += Number(extra_costs.vectors) || 0;
      total_extras += Number(extra_costs.others) || 0;
    }
    if (total_extras > 0) {
      detalhamento.push({
        label: 'Custos Adicionais da Produção',
        valor: fmt(total_extras),
        desc: 'Soma de freelancers, banco de imagens, trilhas e outros.'
      });
    }

    // 8. Direitos e Licenças
    const usage = service_details.usage_rights || 'organico';
    const direitos_pct = CONFIG.usage_rights[usage as keyof typeof CONFIG.usage_rights] || 0;
    const valor_direitos = custo_tecnico * direitos_pct;
    if (valor_direitos > 0) {
      detalhamento.push({
        label: 'Licenciamento de Imagem',
        valor: fmt(valor_direitos),
        desc: `Adicional de ${(direitos_pct * 100).toFixed(0)}% pelo escopo de direitos autorais e veiculação.`
      });
    }

    // 9. Fechamento e Prazos (Gross-up)
    const deadline = service_details.deadline_type || 'normal';
    const deadline_mult = CONFIG.deadline_multipliers[deadline as keyof typeof CONFIG.deadline_multipliers] || 1.0;
    
    const subtotal = (custo_tecnico + total_extras + valor_direitos) * deadline_mult;
    
    if (deadline_mult > 1.0) {
      detalhamento.push({
        label: 'Taxa de Urgência',
        valor: fmt(subtotal - (custo_tecnico + total_extras + valor_direitos)),
        desc: `Acréscimo de ${((deadline_mult - 1) * 100).toFixed(0)}% por conta do prazo de entrega.`
      });
    }

    // Reserva comercial (negociação) + Taxas
    const reserva_comercial = 0.15; // 15% para dar margem a descontos e lucro da agência
    const taxa_pagamento = 0.025; // 2.5% cartao/link

    // Formula gross-up: Preco Final = Subtotal / (1 - Impostos - Taxas - Reserva)
    const divisor = (1 - imposto_rate - taxa_pagamento - reserva_comercial);
    const precoFinal = subtotal / divisor;
    
    const imposto_valor = precoFinal * imposto_rate;
    const reserva_valor = precoFinal * reserva_comercial;

    detalhamento.push({
      label: 'Impostos Fiscais e Taxas',
      valor: fmt(imposto_valor + (precoFinal * taxa_pagamento)),
      desc: `Imposto declarado (${(imposto_rate * 100).toFixed(1)}%) + Gateway (${(taxa_pagamento * 100).toFixed(1)}%).`
    });

    detalhamento.push({
      label: 'Reserva Comercial e Lucro',
      valor: fmt(reserva_valor),
      desc: `Margem estratégica de ${(reserva_comercial * 100).toFixed(0)}% para absorver negociações ou converter em lucro líquido.`
    });

    // 10. Valores Finais (Arredondados)
    const roundedFinal = Math.ceil(precoFinal / 10) * 10;
    const roundedMin = Math.ceil((subtotal / (1 - imposto_rate - taxa_pagamento)) / 10) * 10;

    // Raciocínio (Mock explicativo)
    const clientName = client_info.company_name || 'o cliente';
    const subType = service_details.sub_type ? service_details.sub_type.replace('_', ' ') : 'vídeo mobile';
    const argumentoVenda = `Orçamento dimensionado para produção de ${q} vídeos de ${subType} para ${clientName}. O cálculo considerou o nível ${creator_level.toUpperCase()}, tempo estimado técnico de ${horas_estimadas.toFixed(1)}h e o custo operacional de manutenção dos seus equipamentos declarados.`;

    const resultData = {
      precoMinimo: fmt(roundedMin),
      precoRecomendado: fmt(roundedFinal),
      precoPremium: fmt(roundedFinal * 1.4), // Premium = +40% margin
      precoPorVideo: fmt(roundedFinal / q),
      raciocinio: `Base técnica de R$ ${custo_tecnico.toFixed(2)} + Extras/Direitos. Gross-up aplicado para proteger ${imposto_rate*100}% de impostos e 15% de margem.`,
      argumentoVenda,
      detalhamento
    };

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
