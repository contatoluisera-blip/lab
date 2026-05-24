'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Calculator, Sparkles, PieChart, ShieldCheck, Laptop, MonitorPlay } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';

const creatorLegends: Record<string, string> = {
  iniciante: 'Até 1 ano de atuação. Construindo portfólio.',
  junior: '1 a 3 anos. Domina ferramentas básicas.',
  pleno: '3 a 5 anos. Consistência e fluxo de trabalho sólido.',
  senior: '5 a 8 anos. Visão estratégica e alta complexidade.',
  especialista: '+8 anos. Autoridade reconhecida no nicho.'
};

export default function CalculatorPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit, userProfile } = useUserProfile();
  
  React.useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setLoading(true);
      const docRef = doc(db, 'calculations', id);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setResult(docSnap.data().resultado_json);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);
  
  // --- 1. Visíveis: Escopo e Entregáveis ---
  const [creator_level, setCreatorLevel] = useState('pleno');
  
  // Região usando API do IBGE
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('SP');
  const [selectedCity, setSelectedCity] = useState('São Paulo');

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data));
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => setCities(data));
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const [service_type, setServiceType] = useState('pacote_8_reels_mobile_lean');
  const [offer_mode, setOfferMode] = useState('mercado_lean');
  const [client_type, setClientType] = useState('pequeno_negocio');
  
  const [video_quantity, setVideoQuantity] = useState<number | string>(8);
  const [capture_included, setCaptureIncluded] = useState(true);
  const [capture_hours, setCaptureHours] = useState<number | string>(4);
  const [edit_complexity, setEditComplexity] = useState('simples_intermediaria');
  
  const [revision_rounds, setRevisionRounds] = useState(1);
  const [usage_rights, setUsageRights] = useState('organico_trafego_local_3m');
  const [deadline_type, setDeadlineType] = useState('normal');

  // --- 2. Semi-Ocultos: Equipamento e Custos ---
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected_smartphone, setSelectedSmartphone] = useState('iphone_16_128gb');
  const [selected_computer, setSelectedComputer] = useState('notebook_edicao_intermediario');
  const [selected_audio_kit, setSelectedAudioKit] = useState('kit_audio_wireless');
  const [selected_light_kit, setSelectedLightKit] = useState('kit_luz_basico');
  const [selected_software, setSelectedSoftware] = useState<string[]>(['capcut_pro', 'canva_pro', 'google_one_100gb']);
  const [tax_profile, setTaxProfile] = useState('simples_inicial');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSoftwareChange = (val: string) => {
    setSelectedSoftware(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const getRegionType = (uf: string, city: string) => {
    if (uf === 'SP' && city === 'São Paulo') return 'sao_paulo_capital';
    const capitals = ['Rio Branco', 'Maceió', 'Macapá', 'Manaus', 'Salvador', 'Fortaleza', 'Brasília', 'Vitória', 'Goiânia', 'São Luís', 'Cuiabá', 'Campo Grande', 'Belo Horizonte', 'Belém', 'João Pessoa', 'Curitiba', 'Recife', 'Teresina', 'Rio de Janeiro', 'Natal', 'Porto Alegre', 'Porto Velho', 'Boa Vista', 'Florianópolis', 'São Paulo', 'Aracaju', 'Palmas'];
    if (capitals.includes(city)) {
      if (['Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba'].includes(city)) return 'capital_premium';
      return 'capital_comum';
    }
    return 'interior_medio'; 
  };

  const handleGenerate = async () => {
    // Check access and consume 1 credit
    const creditResult = await consumeCredit('calculator');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits'
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.'
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const region_type = getRegionType(selectedState, selectedCity);
      
      const payload = {
        creator_level, region_type, service_type, offer_mode, client_type,
        video_quantity: Number(video_quantity) || 1, 
        capture_included, 
        capture_hours: Number(capture_hours) || 0, 
        edit_complexity,
        revision_rounds, usage_rights, deadline_type,
        selected_smartphone, selected_computer, selected_audio_kit,
        selected_light_kit, selected_software, tax_profile
      };

      const response = await fetch('/api/tools/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao processar orçamento');
      }
      
      setResult(resData.data);

      if (user && resData.data) {
        addNotification(
          user.uid,
          'Cálculo Concluído',
          `O orçamento para o serviço foi dimensionado com sucesso!`,
          'success'
        );
        try {
          await addDoc(collection(db, 'calculations'), {
            userId: user.uid,
            service_type,
            offer_mode,
            video_quantity: Number(video_quantity) || 1,
            precoRecomendado: resData.data.precoRecomendado,
            resultado_json: resData.data,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Falha ao salvar orçamento no Firestore:", dbErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-[#065f46] bg-brand-jade/20 text-sm font-medium w-fit mb-2">
          <Calculator className="w-4 h-4 text-brand-jade" />
          <span className="text-white">Motor de Precificação</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Calculadora de Orçamento</h1>
        <p className="text-gray-400">Dimensione pacotes de forma realista baseando-se em custos fixos, horas técnicas e proteção de imagem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Section 1: Perfil e Oferta */}
          <GlassCard className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <MonitorPlay className="w-5 h-5 text-brand-jade" />
              1. Perfil e Contexto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nível do Criador</label>
                <select value={creator_level} onChange={e => setCreatorLevel(e.target.value)} className="w-full glass-input text-sm py-2 px-3">
                  <option value="iniciante">Iniciante</option>
                  <option value="junior">Júnior</option>
                  <option value="pleno">Pleno</option>
                  <option value="senior">Sênior</option>
                  <option value="especialista">Especialista</option>
                </select>
                <p className="text-xs text-brand-jade/80 mt-1.5 min-h-[16px]">{creatorLegends[creator_level]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Localização (Região)</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={selectedState} 
                    onChange={e => setSelectedState(e.target.value)} 
                    className="col-span-1 glass-input text-sm py-2 px-2"
                  >
                    <option value="">UF</option>
                    {states.map(st => (
                      <option key={st.sigla} value={st.sigla}>{st.sigla}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)} 
                    className="col-span-2 glass-input text-sm py-2 px-2"
                    disabled={!selectedState}
                  >
                    <option value="">Selecione a cidade...</option>
                    {cities.map(ct => (
                      <option key={ct.id} value={ct.nome}>{ct.nome}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Usado para aplicar o fator regional do custo de vida.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Modo de Oferta</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${offer_mode === 'mercado_lean' ? 'bg-brand-jade/20 border-brand-jade shadow-[inset_0_0_15px_rgba(6,95,70,0.3)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="offer" value="mercado_lean" checked={offer_mode==='mercado_lean'} onChange={()=>setOfferMode('mercado_lean')} className="hidden" />
                      <div className={`w-3 h-3 rounded-full border border-white/30 flex items-center justify-center ${offer_mode === 'mercado_lean' ? 'border-brand-jade' : ''}`}>
                        {offer_mode === 'mercado_lean' && <div className="w-1.5 h-1.5 rounded-full bg-brand-jade"></div>}
                      </div>
                      <span className="text-sm font-bold text-white">Mercado / Lean</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 leading-relaxed">Foco em volume e viabilidade. 1 revisão, edição objetiva e roteiro padronizado.</span>
                  </label>
                  
                  <label className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${offer_mode === 'profissional_padrao' ? 'bg-brand-jade/20 border-brand-jade shadow-[inset_0_0_15px_rgba(6,95,70,0.3)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="offer" value="profissional_padrao" checked={offer_mode==='profissional_padrao'} onChange={()=>setOfferMode('profissional_padrao')} className="hidden" />
                      <div className={`w-3 h-3 rounded-full border border-white/30 flex items-center justify-center ${offer_mode === 'profissional_padrao' ? 'border-brand-jade' : ''}`}>
                        {offer_mode === 'profissional_padrao' && <div className="w-1.5 h-1.5 rounded-full bg-brand-jade"></div>}
                      </div>
                      <span className="text-sm font-bold text-white">Profissional / Padrão</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 leading-relaxed">Equilíbrio ideal. 2 revisões, edição personalizada e roteiro aprimorado.</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${offer_mode === 'premium' ? 'bg-brand-jade/20 border-brand-jade shadow-[inset_0_0_15px_rgba(6,95,70,0.3)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="offer" value="premium" checked={offer_mode==='premium'} onChange={()=>setOfferMode('premium')} className="hidden" />
                      <div className={`w-3 h-3 rounded-full border border-white/30 flex items-center justify-center ${offer_mode === 'premium' ? 'border-brand-jade' : ''}`}>
                        {offer_mode === 'premium' && <div className="w-1.5 h-1.5 rounded-full bg-brand-jade"></div>}
                      </div>
                      <span className="text-sm font-bold text-white">Premium</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 leading-relaxed">Marcas maiores. Múltiplas revisões, edição estratégica e garantia estendida.</span>
                  </label>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Section 2: Escopo Técnico */}
          <GlassCard className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <PieChart className="w-5 h-5 text-brand-jade" />
              2. Escopo Técnico
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade de Vídeos</label>
                <input 
                  type="number" 
                  min="1"
                  value={video_quantity} 
                  onChange={e => setVideoQuantity(e.target.value)} 
                  className="w-full glass-input text-sm py-2 px-3"
                  placeholder="Ex: 8"
                />
                <p className="text-xs text-gray-500 mt-1.5">O Fator de Volume será aplicado automaticamente.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Complexidade de Edição</label>
                <select value={edit_complexity} onChange={e => setEditComplexity(e.target.value)} className="w-full glass-input text-sm py-2 px-3">
                  <option value="simples">Simples (Templates e Cortes)</option>
                  <option value="simples_intermediaria">Intermediária (Dinâmica, B-rolls)</option>
                  <option value="avancada">Avançada (Motion, VFX, Animações)</option>
                </select>
              </div>

              <div className="md:col-span-2 p-5 bg-black/20 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">Inclui Captação de Imagem?</label>
                    <p className="text-xs text-gray-500 mt-0.5">Define se haverá deslocamento e gravação física.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCaptureIncluded(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${capture_included ? 'bg-brand-jade text-white shadow-[0_0_10px_rgba(6,95,70,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Sim</button>
                    <button onClick={() => setCaptureIncluded(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${!capture_included ? 'bg-brand-jade text-white shadow-[0_0_10px_rgba(6,95,70,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Não</button>
                  </div>
                </div>
                
                {capture_included && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-white/5">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Horas de Captação Estimadas</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0"
                        step="0.5"
                        value={capture_hours} 
                        onChange={e => setCaptureHours(e.target.value)} 
                        className="w-32 glass-input text-sm py-2 px-3 text-center"
                      />
                      <span className="text-sm text-gray-400">Horas no local (inclui montagem e desmontagem)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Section 3: Direitos e Prazos */}
          <GlassCard className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-brand-jade" />
              3. Direitos e Entrega
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Uso de Imagem e Direitos</label>
                <select value={usage_rights} onChange={e => setUsageRights(e.target.value)} className="w-full glass-input text-sm py-2 px-3">
                  <option value="organico">Apenas Orgânico (Sem Tráfego Pago)</option>
                  <option value="organico_trafego_local_3m">Orgânico + Tráfego Local (Até 3 meses) [+8%]</option>
                  <option value="trafego_local_forte">Tráfego Local Forte / Extenso (Até 6 meses) [+12%]</option>
                  <option value="trafego_nacional">Tráfego Nacional [+25%]</option>
                  <option value="site_ads_12m">Site + Landing Pages + Ads (12 meses) [+35%]</option>
                  <option value="uso_amplo">Uso Amplo / Perpétuo / Exclusivo [+50%]</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Acresce percentual sobre o valor técnico.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Prazo</label>
                <select value={deadline_type} onChange={e => setDeadlineType(e.target.value)} className="w-full glass-input text-sm py-2 px-3">
                  <option value="normal">Prazo Padrão (Ex: 7 a 15 dias úteis)</option>
                  <option value="rapido">Rápido / Fura-fila (Ex: 3 a 5 dias úteis) [+15%]</option>
                  <option value="urgente">Urgente / Largar tudo (Ex: 24h a 48h) [+35%]</option>
                  <option value="fim_de_semana">Fim de Semana / Madrugada [+50%]</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">Aplica multiplicador de urgência.</p>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Sidebar Direita: Equipamentos e CTA */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-brand-jade" />
                Seu Custo Operacional
              </h3>
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-brand-jade hover:text-emerald-300 transition-colors"
              >
                {showAdvanced ? 'Ocultar Detalhes' : 'Ajustar Custos'}
              </button>
            </div>

            {showAdvanced ? (
              <div className="space-y-4 animate-in fade-in text-sm">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Smartphone</label>
                  <select value={selected_smartphone} onChange={e => setSelectedSmartphone(e.target.value)} className="w-full glass-input py-1.5 px-3">
                    <optgroup label="Apple / iOS">
                      <option value="iphone_11_usado">iPhone 11 (Usado)</option>
                      <option value="iphone_12">iPhone 12</option>
                      <option value="iphone_13">iPhone 13</option>
                      <option value="iphone_14">iPhone 14</option>
                      <option value="iphone_15">iPhone 15</option>
                      <option value="iphone_15_pro">iPhone 15 Pro</option>
                      <option value="iphone_15_pro_max">iPhone 15 Pro Max</option>
                      <option value="iphone_16_128gb">iPhone 16</option>
                      <option value="iphone_16_pro">iPhone 16 Pro</option>
                      <option value="iphone_16_pro_max">iPhone 16 Pro Max</option>
                    </optgroup>
                    <optgroup label="Samsung Galaxy">
                      <option value="galaxy_a54_a55">Galaxy A54 / A55</option>
                      <option value="galaxy_s23_fe">Galaxy S23 FE</option>
                      <option value="galaxy_s23">Galaxy S23</option>
                      <option value="galaxy_s23_ultra">Galaxy S23 Ultra</option>
                      <option value="galaxy_s24">Galaxy S24</option>
                      <option value="galaxy_s24_ultra">Galaxy S24 Ultra</option>
                    </optgroup>
                    <optgroup label="Outros Androids">
                      <option value="xiaomi_redmi_note">Xiaomi Redmi Note</option>
                      <option value="xiaomi_poco">Xiaomi Poco X/F</option>
                      <option value="motorola_edge_50_fusion">Motorola Edge 50</option>
                      <option value="android_intermediario_generico">Outro Android Intermediário</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Computador</label>
                  <select value={selected_computer} onChange={e => setSelectedComputer(e.target.value)} className="w-full glass-input py-1.5 px-3">
                    <option value="notebook_edicao_intermediario">Intermediário (PC/Note)</option>
                    <option value="notebook_edicao_profissional">Profissional (MacBook Pro / PC High-end)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Perfil Fiscal</label>
                  <select value={tax_profile} onChange={e => setTaxProfile(e.target.value)} className="w-full glass-input py-1.5 px-3">
                    <option value="mei">MEI (~3%)</option>
                    <option value="simples_inicial">Simples Nacional Inicial (~6%)</option>
                    <option value="pf_autonomo">Pessoa Física / Autônomo (~15%)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <label className="block text-xs text-gray-400 mb-2">Softwares Pagos Ativos</label>
                  <div className="space-y-2">
                    {[
                      { id: 'capcut_pro', label: 'CapCut Pro' },
                      { id: 'canva_pro', label: 'Canva Pro' },
                      { id: 'adobe_premiere', label: 'Adobe Premiere' },
                      { id: 'google_one_100gb', label: 'Armazenamento (Google/iCloud)' },
                    ].map(sw => (
                      <label key={sw.id} className="flex items-center gap-2 text-xs text-gray-300">
                        <input 
                          type="checkbox" 
                          checked={selected_software.includes(sw.id)}
                          onChange={() => handleSoftwareChange(sw.id)}
                          className="rounded border-white/10 bg-black/20 text-brand-jade focus:ring-brand-jade focus:ring-offset-gray-900"
                        />
                        {sw.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 leading-relaxed">
                A calculadora amortiza os custos do seu equipamento e assinaturas de software no valor da sua hora. Para ajustar os fatores (Smartphone, PC, Impostos), clique em Ajustar Custos.
              </p>
            )}
          </GlassCard>

          {hasToolAccess('calculator') ? (
            <Button 
              className="w-full h-16 text-sm uppercase tracking-wider font-bold relative overflow-hidden group bg-gradient-to-r from-brand-jade to-emerald-600 hover:from-brand-jade hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(6,95,70,0.5)]"
              onClick={handleGenerate}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]" />
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-5 h-5 animate-spin" /> PROCESSANDO...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Calculator className="w-5 h-5" /> DIMENSIONAR PREÇO FINAL
                </span>
              )}
            </Button>
          ) : (
            <UpgradeGate locked={true} requiredPlan="Pro" mode="button" />
          )}
          {!loading && <CreditNotice toolId="calculator" />}

        </div>
      </div>

      {/* RESULTADOS */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 mt-12 space-y-6 border-t border-white/10 pt-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Orçamento Dimensionado</h2>
            <p className="text-gray-400 mt-3 text-sm max-w-3xl mx-auto leading-relaxed">{result.argumentoVenda}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-8 border-white/5 opacity-80 hover:opacity-100 transition-opacity flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Mínimo Saudável</p>
              <p className="text-4xl font-bold text-gray-200">{result.precoMinimo}</p>
              <p className="text-xs text-gray-500 mt-2">Sem margem comercial/negociação. Valor piso da operação.</p>
            </GlassCard>

            <GlassCard glow className="p-8 border-brand-jade/40 transform md:-translate-y-4 bg-brand-jade/5 shadow-[0_0_30px_rgba(6,95,70,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-jade/10 rounded-bl-[100px] -z-10 blur-xl"></div>
              <div className="flex items-center gap-2 text-brand-jade mb-3">
                <Sparkles className="w-4 h-4" />
                <p className="text-xs uppercase tracking-wider font-bold">Preço Recomendado</p>
              </div>
              <p className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-3 tracking-tighter">{result.precoRecomendado}</p>
              <p className="text-sm font-medium text-emerald-400 bg-emerald-400/10 inline-block px-4 py-1.5 rounded-full border border-emerald-400/20">
                {result.precoPorVideo} <span className="text-emerald-400/70 font-normal">por vídeo</span>
              </p>
            </GlassCard>

            <GlassCard className="p-8 border-white/5 opacity-80 hover:opacity-100 transition-opacity flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Modo Premium</p>
              <p className="text-4xl font-bold text-gray-200">{result.precoPremium}</p>
              <p className="text-xs text-gray-500 mt-2">Margem de lucro maximizada para clientes exigentes.</p>
            </GlassCard>
          </div>

          <div className="flex justify-center mt-8">
             <div className="bg-black/30 border border-white/5 px-8 py-5 rounded-2xl max-w-3xl text-center">
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  {result.raciocinio}
                </p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
