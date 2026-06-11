'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { 
  Calculator, Sparkles, User, Briefcase, Video, CheckCircle2, 
  Plus, Trash2, ArrowRight, ArrowLeft, RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { CreditNotice } from '@/components/ui/CreditNotice';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { addNotification } from '@/lib/notifications';

export default function CalculatorPage() {
  const { user } = useAuth();
  const { hasToolAccess, consumeCredit, userProfile, saveCalculatorPresets } = useUserProfile();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // --- STEP 1: SOBRE VOCÊ ---
  const [personal_info, setPersonalInfo] = useState({
    state: '',
    city: '',
    hours_per_day: 8,
    days_per_month: 22,
  });

  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data));
  }, []);

  useEffect(() => {
    if (personal_info.state) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${personal_info.state}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => setCities(data));
    } else {
      setCities([]);
    }
  }, [personal_info.state]);

  const getRegionType = (uf: string, city: string) => {
    if (!uf || !city) return 'interior_medio';
    if (uf === 'SP' && city === 'São Paulo') return 'sao_paulo_capital';
    const capitals = ['Rio Branco', 'Maceió', 'Macapá', 'Manaus', 'Salvador', 'Fortaleza', 'Brasília', 'Vitória', 'Goiânia', 'São Luís', 'Cuiabá', 'Campo Grande', 'Belo Horizonte', 'Belém', 'João Pessoa', 'Curitiba', 'Recife', 'Teresina', 'Rio de Janeiro', 'Natal', 'Porto Alegre', 'Porto Velho', 'Boa Vista', 'Florianópolis', 'São Paulo', 'Aracaju', 'Palmas'];
    if (capitals.includes(city)) {
      if (['Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba'].includes(city)) return 'capital_premium';
      return 'capital_comum';
    }
    return 'interior_medio'; 
  };

  const [tax_percentage, setTaxPercentage] = useState(6); // default to 6%
  const [experience, setExperience] = useState({
    level: 'pleno',
    last_job_value: ''
  });
  const [recurrent_costs, setRecurrentCosts] = useState([
    { id: '1', name: 'Aluguel / Condomínio', value: 0 },
    { id: '2', name: 'Internet / Telefone', value: 0 },
    { id: '3', name: 'Softwares (Adobe, CapCut, etc)', value: 0 },
  ]);

  // --- STEP 2: SOBRE O CLIENTE ---
  const [client_info, setClientInfo] = useState({
    company_name: '',
    instagram: '',
    segment: '',
    size: 'pequeno',
    has_served_before: false,
    previous_service_desc: '',
    previous_service_price: ''
  });

  // --- STEP 3: SERVIÇO ---
  const [service_details, setServiceDetails] = useState({
    type: 'Produção de Vídeo Mobile',
    sub_type: 'institucional',
    external_capture: true,
    capture_hours: 4,
    edit_complexity: 'media',
    video_quantity: 4,
    deadline_type: 'normal',
    usage_rights: 'organico_trafego_local_3m'
  });
  const [custom_equipment, setCustomEquipment] = useState([
    { id: '1', name: 'Smartphone Principal (Ex: iPhone 15)', value: 0, life_months: 36 },
    { id: '2', name: 'Microfone (Ex: DJI Mic)', value: 0, life_months: 24 },
  ]);
  const [extra_costs, setExtraCosts] = useState({
    freelancers: 0,
    stock_footage: 0,
    soundtrack: 0,
    vectors: 0,
    others: 0
  });

  // Load presets on mount
  useEffect(() => {
    if (userProfile?.calculator_presets) {
      if (userProfile.calculator_presets.customCosts?.length > 0) {
        setRecurrentCosts(userProfile.calculator_presets.customCosts);
      }
      if (userProfile.calculator_presets.customEquipment?.length > 0) {
        setCustomEquipment(userProfile.calculator_presets.customEquipment);
      }
    }
  }, [userProfile]);

  // Load previous calculation from history if 'id' is present
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setLoading(true);
      const docRef = doc(db, 'calculations', id);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setResult(docSnap.data().resultado_json);
          setStep(5); // Pula direto para o resultado final
        }
        setLoading(false);
      }).catch((e) => {
        console.error("Falha ao carregar o orçamento salvo:", e);
        setLoading(false);
      });
    }
  }, [user]);

  const handleAddCost = () => {
    setRecurrentCosts([...recurrent_costs, { id: Date.now().toString(), name: '', value: 0 }]);
  };
  const handleRemoveCost = (id: string) => {
    setRecurrentCosts(recurrent_costs.filter(c => c.id !== id));
  };
  const handleAddEquipment = () => {
    setCustomEquipment([...custom_equipment, { id: Date.now().toString(), name: '', value: 0, life_months: 36 }]);
  };
  const handleRemoveEquipment = (id: string) => {
    setCustomEquipment(custom_equipment.filter(e => e.id !== id));
  };

  const savePresets = async () => {
    await saveCalculatorPresets({
      customCosts: recurrent_costs,
      customEquipment: custom_equipment
    });
  };

  const handleReview = () => {
    setStep(4);
  };

  const handleGenerate = async () => {
    const creditResult = await consumeCredit('calculator');
    if (!creditResult.ok) {
      setError(creditResult.reason === 'no_credits'
        ? 'Você não tem créditos suficientes. Faça upgrade do seu plano para continuar.'
        : 'Seu plano não tem acesso a esta ferramenta.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Save presets before calculating
    await savePresets();

    try {
      const region_type = getRegionType(personal_info.state, personal_info.city);

      const payload = {
        personal_info,
        recurrent_costs,
        experience,
        client_info: { ...client_info, region_type },
        service_details,
        custom_equipment,
        extra_costs,
        tax_percentage
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
      setStep(5); // Vai para o resultado final

      if (user && resData.data) {
        addNotification(user.uid, 'Cálculo Concluído', `Orçamento gerado com sucesso!`, 'success');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDraft = async () => {
    if (!user || !result) return;
    try {
      await addDoc(collection(db, 'calculations'), {
        userId: user.uid,
        status: 'draft',
        service_type: service_details.sub_type,
        video_quantity: Number(service_details.video_quantity),
        precoRecomendado: result.precoRecomendado,
        resultado_json: result,
        createdAt: new Date().toISOString()
      });
      addNotification(user.uid, 'Salvo', `Orçamento salvo como rascunho.`, 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const approveBudget = async () => {
    if (!user || !result) return;
    try {
      await addDoc(collection(db, 'calculations'), {
        userId: user.uid,
        status: 'approved',
        service_type: service_details.sub_type,
        video_quantity: Number(service_details.video_quantity),
        precoRecomendado: result.precoRecomendado,
        resultado_json: result,
        createdAt: new Date().toISOString()
      });
      addNotification(user.uid, 'Aprovado', `Orçamento aprovado e registrado.`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const discardBudget = () => {
    setResult(null);
    setStep(1);
  };

  const steps = [
    { num: 1, label: 'Sobre Você', icon: <User className="w-4 h-4" /> },
    { num: 2, label: 'O Cliente', icon: <Briefcase className="w-4 h-4" /> },
    { num: 3, label: 'O Serviço', icon: <Video className="w-4 h-4" /> },
    { num: 4, label: 'Revisão', icon: <FileText className="w-4 h-4" /> },
    { num: 5, label: 'Orçamento', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* Lista de Sugestão de Equipamentos Oculta */}
      <datalist id="smartphones">
        <option value="iPhone 15 Pro Max" />
        <option value="iPhone 15 Pro" />
        <option value="iPhone 14 Pro Max" />
        <option value="iPhone 13 Pro" />
        <option value="Samsung Galaxy S24 Ultra" />
        <option value="Samsung Galaxy S23 Ultra" />
        <option value="Xiaomi 14 Ultra" />
        <option value="Xiaomi Redmi Note 13 Pro+" />
        <option value="Motorola Edge 50 Pro" />
      </datalist>

      {/* Header & Progress */}
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-[#065f46] bg-brand-jade/20 text-sm font-medium">
          <Calculator className="w-4 h-4 text-brand-jade" />
          <span className="text-white">Motor de Precificação 2.0</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Calculadora de Orçamento</h1>
        <p className="text-gray-400 text-sm max-w-lg">Dimensione valores realistas baseados na sua estrutura, custo de vida e complexidade do projeto.</p>
        
        <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-2xl">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex flex-col items-center gap-2 ${step >= s.num ? 'text-brand-jade' : 'text-gray-600'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step === s.num ? 'border-brand-jade bg-brand-jade/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : step > s.num ? 'border-brand-jade bg-brand-jade text-white' : 'border-gray-800 bg-gray-900'}`}>
                  {s.icon}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${step > s.num ? 'bg-brand-jade' : 'bg-gray-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* STEP 1: SOBRE VOCÊ */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <GlassCard className="p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Informações Pessoais</h2>
              <p className="text-sm text-gray-400 mb-6">Sua realidade impacta diretamente no valor da sua hora de trabalho.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado e Cidade</label>
                  <div className="flex gap-2">
                    <select 
                      value={personal_info.state} 
                      onChange={e => setPersonalInfo({...personal_info, state: e.target.value, city: ''})} 
                      className="w-24 glass-input px-3 py-2 text-sm"
                    >
                      <option value="">UF</option>
                      {states.map(st => (
                        <option key={st.sigla} value={st.sigla}>{st.sigla}</option>
                      ))}
                    </select>
                    <select 
                      value={personal_info.city} 
                      onChange={e => setPersonalInfo({...personal_info, city: e.target.value})} 
                      className="flex-1 glass-input px-3 py-2 text-sm"
                      disabled={!personal_info.state}
                    >
                      <option value="">Selecione a cidade...</option>
                      {cities.map(ct => (
                        <option key={ct.id} value={ct.nome}>{ct.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Carga Horária (Aprox.)</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-0.5">Horas/dia</div>
                      <input type="number" value={personal_info.hours_per_day} onChange={e => setPersonalInfo({...personal_info, hours_per_day: Number(e.target.value)})} className="w-full glass-input px-3 py-2 text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-0.5">Dias/mês</div>
                      <input type="number" value={personal_info.days_per_month} onChange={e => setPersonalInfo({...personal_info, days_per_month: Number(e.target.value)})} className="w-full glass-input px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h2 className="text-xl font-bold text-white mb-1">Nível Profissional & Fiscal</h2>
              <p className="text-sm text-gray-400 mb-6">Como você se posiciona hoje no mercado e como recolhe impostos.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Seu Nível</label>
                  <select value={experience.level} onChange={e => setExperience({...experience, level: e.target.value})} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="iniciante">Iniciante (Até 1 ano. Construindo portfólio)</option>
                    <option value="junior">Júnior (1 a 3 anos. Domina ferramentas básicas)</option>
                    <option value="pleno">Pleno (3 a 5 anos. Consistência e fluxo sólido)</option>
                    <option value="senior">Sênior (5 a 8 anos. Visão estratégica)</option>
                    <option value="especialista">Especialista (+8 anos. Autoridade reconhecida)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Carga Tributária de Imposto (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      value={tax_percentage} 
                      onChange={e => setTaxPercentage(Number(e.target.value))} 
                      className="w-full glass-input pl-3 pr-8 py-2 text-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Ex: MEI (~3%), Simples (~6%), Autônomo (~15%).</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">Gastos Recorrentes</h2>
                <Button variant="ghost" size="sm" onClick={handleAddCost} className="text-brand-jade hover:bg-brand-jade/10 h-8 text-xs">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Cadastre seus custos fixos mensais (pessoais ou da empresa). 
                <span className="text-brand-jade"> Considere sempre a média mensal.</span>
              </p>
              
              <div className="space-y-3">
                {recurrent_costs.map((cost) => (
                  <div key={cost.id} className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Nome do custo (Ex: Energia)" 
                      value={cost.name} 
                      onChange={e => setRecurrentCosts(recurrent_costs.map(c => c.id === cost.id ? { ...c, name: e.target.value } : c))} 
                      className="flex-[2] glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" 
                    />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <input 
                        type="number" 
                        value={cost.value || ''} 
                        onChange={e => setRecurrentCosts(recurrent_costs.map(c => c.id === cost.id ? { ...c, value: Number(e.target.value) } : c))} 
                        className="w-full glass-input pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-600" 
                      />
                    </div>
                    <button onClick={() => handleRemoveCost(cost.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="bg-brand-jade text-white hover:bg-emerald-600 px-8">
                Próximo Passo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* STEP 2: SOBRE O CLIENTE */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <GlassCard className="p-6 md:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Perfil do Cliente</h2>
              <p className="text-sm text-gray-400 mb-6">O perfil da marca influencia diretamente o escopo comercial e a margem exigida.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Empresa</label>
                  <input type="text" value={client_info.company_name} onChange={e => setClientInfo({...client_info, company_name: e.target.value})} className="w-full glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" placeholder="Ex: Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@)</label>
                  <input type="text" value={client_info.instagram} onChange={e => setClientInfo({...client_info, instagram: e.target.value})} className="w-full glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" placeholder="@acmecorp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Segmento</label>
                  <input type="text" value={client_info.segment} onChange={e => setClientInfo({...client_info, segment: e.target.value})} className="w-full glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" placeholder="Ex: Clínica Odontológica" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Porte da Empresa</label>
                  <select value={client_info.size} onChange={e => setClientInfo({...client_info, size: e.target.value})} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="micro">Micro (Eu-presa, Profissional Liberal)</option>
                    <option value="pequeno">Pequeno (Comércio local, Equipe reduzida)</option>
                    <option value="medio">Médio (Rede local, Operação robusta)</option>
                    <option value="grande">Grande (Presença regional/nacional forte)</option>
                    <option value="multinacional">Multinacional / Gigante (Referências de mercado)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">Relacionamento</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={client_info.has_served_before}
                  onChange={e => setClientInfo({...client_info, has_served_before: e.target.checked})}
                  className="rounded border-white/10 bg-black/20 text-brand-jade focus:ring-brand-jade"
                />
                <span className="text-sm text-gray-300">Já atendi esse cliente antes</span>
              </label>

              {client_info.has_served_before && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-gray-400 mb-1">Descrição do último serviço</label>
                    <input type="text" value={client_info.previous_service_desc} onChange={e => setClientInfo({...client_info, previous_service_desc: e.target.value})} className="w-full glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" placeholder="Ex: Gravação de 4 Reels Institucionais" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] text-gray-400 mb-1">Valor cobrado na época</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <input type="number" value={client_info.previous_service_price} onChange={e => setClientInfo({...client_info, previous_service_price: e.target.value})} className="w-full glass-input pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-600" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="bg-brand-jade text-white hover:bg-emerald-600 px-8">
                Próximo Passo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* STEP 3: O SERVIÇO */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <GlassCard className="p-6 md:p-8 space-y-8">
            
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Escopo de Produção</h2>
              <p className="text-sm text-gray-400 mb-6">Detalhes do projeto que impactam no tempo e complexidade.</p>
              
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-wider text-brand-jade font-bold mb-1">Serviço Principal</label>
                <div className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-white font-medium cursor-not-allowed opacity-80 flex items-center justify-between">
                  {service_details.type}
                  <span className="text-[10px] text-gray-500 bg-black/50 px-2 py-1 rounded-full">Pré-definido</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sub-tipo / Formato</label>
                  <select value={service_details.sub_type} onChange={e => setServiceDetails({...service_details, sub_type: e.target.value})} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="institucional">Vídeo Institucional</option>
                    <option value="marketing_digital">Marketing Digital / Ads</option>
                    <option value="reels">Pacote de Reels / TikToks</option>
                    <option value="youtube">Vídeo Longo (YouTube)</option>
                    <option value="evento">Cobertura de Evento</option>
                    <option value="arquitetura">Arquitetura / Imóveis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade de Vídeos</label>
                  <input type="number" value={service_details.video_quantity} onChange={e => setServiceDetails({...service_details, video_quantity: Number(e.target.value)})} className="w-full glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" />
                </div>
                
                <div className="md:col-span-2 p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">Haverá captação externa?</span>
                      <p className="text-[11px] text-gray-500">Deslocamento para gravar no cliente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={service_details.external_capture} onChange={e => setServiceDetails({...service_details, external_capture: e.target.checked})} />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-jade"></div>
                    </label>
                  </div>
                  {service_details.external_capture && (
                    <div className="pt-3 border-t border-white/5 flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="block text-[11px] text-gray-400 mb-1">Horas Estimadas de Gravação no Local</label>
                        <input type="number" step="0.5" value={service_details.capture_hours} onChange={e => setServiceDetails({...service_details, capture_hours: Number(e.target.value)})} className="w-32 glass-input px-3 py-2 text-sm text-white placeholder:text-gray-600" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Complexidade da Edição</label>
                  <select value={service_details.edit_complexity} onChange={e => setServiceDetails({...service_details, edit_complexity: e.target.value})} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="facil">Simples (Cortes e legendas básicas)</option>
                    <option value="media">Intermediária (B-rolls, ritmo dinâmico)</option>
                    <option value="dificil">Avançada (Motion, 3D, Correção de cor profunda)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prazo de Entrega</label>
                  <select value={service_details.deadline_type} onChange={e => setServiceDetails({...service_details, deadline_type: e.target.value})} className="w-full glass-input px-3 py-2 text-sm">
                    <option value="flexivel">Flexível (Sem pressa) [-5%]</option>
                    <option value="normal">Normal (Adequado)</option>
                    <option value="rapido">Rápido (Semana vigente) [+10%]</option>
                    <option value="urgente">Urgente (Menos de 48h) [+20%]</option>
                    <option value="imediatissimo">Imediatíssimo (Para ontem / Madrugada) [+35%]</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">Equipamentos Utilizados</h2>
                <Button variant="ghost" size="sm" onClick={handleAddEquipment} className="text-brand-jade hover:bg-brand-jade/10 h-8 text-xs">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Liste os equipamentos que você usa (Smartphones, Microfones, Iluminação). O sistema irá <strong className="text-white">amortizar o custo de desgaste</strong>.
              </p>
              
              <div className="space-y-3">
                {custom_equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        list="smartphones"
                        placeholder="Ex: iPhone 15 Pro Max" 
                        value={eq.name} 
                        onChange={e => setCustomEquipment(custom_equipment.map(c => c.id === eq.id ? { ...c, name: e.target.value } : c))} 
                        className="w-full glass-input px-3 py-1.5 text-sm text-white placeholder:text-gray-400 focus:bg-white/10" 
                      />
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Valor (R$)</span>
                          <input 
                            type="number" 
                            value={eq.value || ''} 
                            onChange={e => setCustomEquipment(custom_equipment.map(c => c.id === eq.id ? { ...c, value: Number(e.target.value) } : c))} 
                            className="w-full glass-input pl-16 pr-3 py-1.5 text-sm text-white placeholder:text-gray-600" 
                          />
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Vida útil (meses)</span>
                          <input 
                            type="number" 
                            value={eq.life_months || ''} 
                            onChange={e => setCustomEquipment(custom_equipment.map(c => c.id === eq.id ? { ...c, life_months: Number(e.target.value) } : c))} 
                            className="w-full glass-input pl-[100px] pr-3 py-1.5 text-sm text-white placeholder:text-gray-600" 
                          />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveEquipment(eq.id)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2 self-stretch flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h2 className="text-xl font-bold text-white mb-1">Custos Extras do Job (Opcional)</h2>
              <p className="text-sm text-gray-400 mb-4">Terceirização ou aquisições exclusivas para este cliente.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'freelancers', label: 'Freelancers' },
                  { key: 'stock_footage', label: 'Banco Imagens' },
                  { key: 'soundtrack', label: 'Trilhas' },
                  { key: 'others', label: 'Outros (Deslocamento)' }
                ].map(item => (
                  <div key={item.key}>
                    <label className="block text-[11px] text-gray-400 mb-1">{item.label}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                      <input 
                        type="number" 
                        value={(extra_costs as any)[item.key] || ''} 
                        onChange={e => setExtraCosts({...extra_costs, [item.key]: Number(e.target.value)})} 
                        className="w-full glass-input pl-7 pr-2 py-1.5 text-sm text-white placeholder:text-gray-600" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <Button onClick={handleReview} className="bg-brand-jade text-white hover:bg-emerald-600 px-8">
                Ir para Revisão <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* STEP 4: REVISÃO ANTES DO CÁLCULO */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <GlassCard className="p-6 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Revise o Preenchimento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Box: Sobre Você */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-sm font-bold text-brand-jade uppercase tracking-wider mb-3">1. Sobre Você</h3>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Localização:</span> <span className="text-white font-medium">{personal_info.city || '-'} / {personal_info.state || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Carga Horária:</span> <span className="text-white font-medium">{personal_info.hours_per_day}h/dia ({personal_info.days_per_month} dias)</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Nível:</span> <span className="text-white font-medium capitalize">{experience.level}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Imposto Declarado:</span> <span className="text-white font-medium">{tax_percentage}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Soma Custos Fixos:</span> <span className="text-white font-medium">R$ {recurrent_costs.reduce((acc, curr) => acc + (curr.value || 0), 0)}/mês</span></div>
              </div>

              {/* Box: O Cliente */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-sm font-bold text-brand-jade uppercase tracking-wider mb-3">2. O Cliente</h3>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Empresa:</span> <span className="text-white font-medium">{client_info.company_name || 'Não informado'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Porte:</span> <span className="text-white font-medium capitalize">{client_info.size}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Já atendeu antes?</span> <span className="text-white font-medium">{client_info.has_served_before ? 'Sim' : 'Não'}</span></div>
              </div>

              {/* Box: Serviço */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-sm font-bold text-brand-jade uppercase tracking-wider mb-3">3. O Serviço</h3>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Formato:</span> <span className="text-white font-medium capitalize">{service_details.sub_type.replace('_', ' ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Quantidade:</span> <span className="text-white font-medium">{service_details.video_quantity} vídeos</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Edição:</span> <span className="text-white font-medium capitalize">{service_details.edit_complexity}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Captação Externa:</span> <span className="text-white font-medium">{service_details.external_capture ? `${service_details.capture_hours} horas estimadas` : 'Não'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Prazo:</span> <span className="text-white font-medium capitalize">{service_details.deadline_type}</span></div>
              </div>

              {/* Box: Extras */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-sm font-bold text-brand-jade uppercase tracking-wider mb-3">Equipamentos & Extras</h3>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Equipamentos alocados:</span> <span className="text-white font-medium">{custom_equipment.length} itens</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Soma de Extras (Terceiros):</span> <span className="text-white font-medium">R$ {Object.values(extra_costs).reduce((acc, curr) => acc + (Number(curr) || 0), 0)}</span></div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" onClick={() => setStep(3)} className="text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Edição
              </Button>
              {hasToolAccess('calculator') ? (
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="bg-brand-jade text-white hover:bg-emerald-600 px-8 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processando Matemática...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Confirmar e Gerar Orçamento</>
                  )}
                </Button>
              ) : (
                <UpgradeGate locked requiredPlan="Pro" mode="button" />
              )}
            </div>
          </GlassCard>
          {!loading && <CreditNotice toolId="calculator" />}
        </div>
      )}

      {/* STEP 5: RESULTADO FINAL */}
      {step === 5 && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Orçamento Dimensionado</h2>
            <p className="text-gray-400 mt-3 text-sm max-w-2xl mx-auto leading-relaxed">{result.argumentoVenda}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-8 border-white/5 opacity-80 hover:opacity-100 transition-opacity flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Mínimo Saudável</p>
              <p className="text-4xl font-bold text-gray-200">{result.precoMinimo}</p>
              <p className="text-[10px] text-gray-500 mt-2">Sem margem de negociação.</p>
            </GlassCard>

            <GlassCard glow className="p-8 border-brand-jade/40 transform md:-translate-y-4 bg-brand-jade/5 shadow-[0_0_30px_rgba(6,95,70,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-jade/10 rounded-bl-[100px] -z-10 blur-xl"></div>
              <div className="flex items-center gap-2 text-brand-jade mb-3">
                <Sparkles className="w-4 h-4" />
                <p className="text-xs uppercase tracking-wider font-bold">Preço Sugerido</p>
              </div>
              <p className="text-5xl font-bold text-white drop-shadow-lg mb-3 tracking-tighter">{result.precoRecomendado}</p>
              <p className="text-xs font-medium text-emerald-400 bg-emerald-400/10 inline-block px-3 py-1 rounded-full border border-emerald-400/20">
                {result.precoPorVideo} <span className="text-emerald-400/70 font-normal">por vídeo</span>
              </p>
            </GlassCard>

            <GlassCard className="p-8 border-white/5 opacity-80 hover:opacity-100 transition-opacity flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Modo Premium</p>
              <p className="text-4xl font-bold text-gray-200">{result.precoPremium}</p>
              <p className="text-[10px] text-gray-500 mt-2">Margem alta p/ grandes marcas.</p>
            </GlassCard>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-center gap-4 pt-4">
            <Button onClick={approveBudget} className="bg-brand-jade text-white hover:bg-emerald-600 px-8 py-6 rounded-xl flex-1 max-w-[250px] font-bold">
               APROVAR ORÇAMENTO
            </Button>
            <Button onClick={saveToDraft} className="bg-white/10 text-white hover:bg-white/20 border border-white/10 px-8 py-6 rounded-xl flex-1 max-w-[250px] font-bold">
               SALVAR RASCUNHO
            </Button>
            <Button onClick={discardBudget} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-8 py-6 rounded-xl flex-1 max-w-[250px] font-bold border border-red-500/20">
               DESCARTAR E REFAZER
            </Button>
          </div>

          <div className="mt-12">
            <GlassCard className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                <Calculator className="w-5 h-5 text-brand-jade" />
                Detalhamento do Cálculo
              </h3>
              
              <div className="space-y-3">
                {result.detalhamento.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col flex-1 pr-4">
                      <span className="text-sm font-medium text-gray-200">{item.label}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{item.desc}</span>
                    </div>
                    <div className="mt-2 sm:mt-0 text-right shrink-0">
                      <span className="text-sm font-bold text-brand-jade">{item.valor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

        </div>
      )}

    </div>
  );
}
