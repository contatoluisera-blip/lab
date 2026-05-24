'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Briefcase, Plus, TrendingUp, Users, DollarSign, Edit2, Trash2, X, Loader2, Link as LinkIcon, CheckCircle2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

type ClientStage = 'aguardando_resposta' | 'ativo' | 'recusado' | 'finalizado';

export interface Delivery {
  id: string;
  description: string;
  completed: boolean;
  link?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  stage: ClientStage;
  value: number;
  deliveries: Delivery[];
  createdAt: string;
}

const STAGE_LABELS: Record<ClientStage, string> = {
  aguardando_resposta: 'Aguardando Resposta',
  ativo: 'Contrato Ativo',
  recusado: 'Recusado',
  finalizado: 'Finalizado'
};

const STAGE_COLORS: Record<ClientStage, string> = {
  aguardando_resposta: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ativo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  recusado: 'bg-red-500/10 text-red-400 border-red-500/20',
  finalizado: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
};

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      STAGE_LABELS[c.stage].toLowerCase().includes(query) ||
      c.deliveries.some(d => d.description.toLowerCase().includes(query))
    );
  });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    stage: 'aguardando_resposta' as ClientStage,
    value: '',
    deliveries: [] as Delivery[]
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'clients'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedClients: Client[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Mapear compatibilidade com clientes antigos (onde deliveries era numero e stage era prospeccao/expirado)
        let deliveriesData = data.deliveries || [];
        if (typeof deliveriesData === 'number') {
          deliveriesData = Array.from({ length: deliveriesData }).map((_, i) => ({
            id: Math.random().toString(36).substring(7),
            description: `Entrega ${i + 1}`,
            completed: false,
            link: ''
          }));
        }

        let stageData = data.stage;
        if (stageData === 'prospeccao') stageData = 'aguardando_resposta';
        if (stageData === 'expirado') stageData = 'finalizado';

        fetchedClients.push({ 
          id: docSnap.id, 
          ...data,
          stage: stageData,
          deliveries: deliveriesData
        } as Client);
      });
      
      // Ordenar localmente por data de criacao (mais recentes primeiro)
      fetchedClients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setClients(fetchedClients);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name,
        stage: client.stage,
        value: client.value.toString(),
        deliveries: client.deliveries || []
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        stage: 'aguardando_resposta',
        value: '',
        deliveries: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddDelivery = () => {
    setFormData({
      ...formData,
      deliveries: [
        ...formData.deliveries, 
        { id: Math.random().toString(36).substring(7), description: '', completed: false, link: '' }
      ]
    });
  };

  const handleUpdateDelivery = (id: string, field: keyof Delivery, value: any) => {
    setFormData({
      ...formData,
      deliveries: formData.deliveries.map(d => d.id === id ? { ...d, [field]: value } : d)
    });
  };

  const handleRemoveDelivery = (id: string) => {
    setFormData({
      ...formData,
      deliveries: formData.deliveries.filter(d => d.id !== id)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const clientData = {
        userId: user.uid,
        name: formData.name,
        stage: formData.stage,
        value: Number(formData.value) || 0,
        deliveries: formData.deliveries,
        createdAt: editingId ? undefined : new Date().toISOString()
      };

      if (editingId) {
        const clientRef = doc(db, 'clients', editingId);
        await updateDoc(clientRef, {
          name: clientData.name,
          stage: clientData.stage,
          value: clientData.value,
          deliveries: clientData.deliveries
        });
      } else {
        await addDoc(collection(db, 'clients'), clientData);
      }
      
      await fetchClients();
      closeModal();
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar os dados: " + (error.message || "Erro desconhecido."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
      await deleteDoc(doc(db, 'clients', id));
      setClients(clients.filter(c => c.id !== id));
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      alert("Falha ao excluir o cliente.");
    }
  };

  // Metricas
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.stage === 'ativo').length;
  const activeRevenue = clients
    .filter(c => c.stage === 'ativo' || c.stage === 'aguardando_resposta') // Pode incluir aguardando na receita se quiser, mas mantemos ativo
    .reduce((acc, curr) => acc + (curr.stage === 'ativo' ? curr.value : 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-glass text-brand-mint bg-brand-mint/10 text-sm font-medium w-fit mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-white">CRM</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Meus Clientes</h1>
          <p className="text-gray-400">Gerencie sua carteira, prospecções e acompanhe seu faturamento ativo.</p>
        </div>
        <Button 
          onClick={() => openModal()}
          className="bg-brand-emerald hover:bg-emerald-400 text-black font-bold whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total de Clientes</p>
            <p className="text-2xl font-bold text-white">{loading ? '-' : totalClients}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Contratos Ativos</p>
            <p className="text-2xl font-bold text-white">{loading ? '-' : activeClients}</p>
          </div>
        </GlassCard>

        <GlassCard glow className="p-6 border-brand-mint/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-mint/20 flex items-center justify-center border border-brand-mint/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <DollarSign className="w-6 h-6 text-brand-mint" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Receita Ativa</p>
            <p className="text-2xl font-bold text-white tracking-tight">{loading ? '-' : formatCurrency(activeRevenue)}</p>
          </div>
        </GlassCard>
      </div>

      {/* Clients Table */}
      <GlassCard className="overflow-hidden border-white/10">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Carteira de Clientes</h2>
          
          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente ou marca..."
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald/50 text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-mint" />
            <p>Carregando carteira...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Briefcase className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-400">Nenhum cliente cadastrado</p>
            <p className="text-sm mt-1">Adicione seu primeiro cliente ou gere propostas para começar a gestão.</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Search className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-400">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Tente buscar por outro termo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black/20 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-medium">Nome da Marca</th>
                  <th className="p-4 font-medium">Estágio</th>
                  <th className="p-4 font-medium">Valor Negociado</th>
                  <th className="p-4 font-medium">Progresso das Entregas</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClients.map(client => {
                  const totalDeliveries = client.deliveries.length;
                  const completedDeliveries = client.deliveries.filter(d => d.completed).length;
                  const progress = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-gray-100">{client.name}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STAGE_COLORS[client.stage]}`}>
                          {STAGE_LABELS[client.stage]}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300 font-medium">
                        {formatCurrency(client.value)}
                      </td>
                      <td className="p-4 text-gray-300">
                        {totalDeliveries === 0 ? (
                          <span className="text-xs text-gray-500">Sem entregas</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden w-24">
                              <div 
                                className="h-full bg-brand-mint transition-all" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                              {completedDeliveries} / {totalDeliveries}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openModal(client)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Gerenciar Cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[#0f0f0f]/95 backdrop-blur-2xl border border-brand-mint/30 shadow-[0_0_40px_rgba(52,211,153,0.15)] relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Gerenciar Cliente' : 'Novo Cliente'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome da Marca/Cliente *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full glass-input"
                    placeholder="Ex: Pizzaria Bella"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Estágio Atual *</label>
                  <select 
                    required
                    value={formData.stage}
                    onChange={(e) => setFormData({...formData, stage: e.target.value as ClientStage})}
                    className="w-full glass-input appearance-none bg-black/40"
                  >
                    <option value="aguardando_resposta">Aguardando Resposta</option>
                    <option value="ativo">Contrato Ativo</option>
                    <option value="recusado">Recusado</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Valor Total Negociado (R$)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="w-full glass-input max-w-xs"
                  placeholder="0.00"
                />
              </div>

              {/* Seção de Entregáveis */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-md font-bold text-white">Cronograma de Entregas</h4>
                    <p className="text-xs text-gray-400 mt-1">Marque checkboxes e anexe links de arquivos finalizados.</p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddDelivery} 
                    className="bg-brand-mint/10 text-brand-mint hover:bg-brand-mint/20 text-sm h-8 px-3"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Adicionar Entrega
                  </Button>
                </div>

                {formData.deliveries.length === 0 ? (
                  <div className="p-6 bg-black/20 border border-dashed border-white/10 rounded-xl text-center">
                    <CheckCircle2 className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-400">Nenhuma entrega cadastrada para este cliente ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.deliveries.map((delivery) => (
                      <div key={delivery.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <div className="flex gap-3 items-start">
                          <label className="flex items-center cursor-pointer mt-1">
                            <input 
                              type="checkbox" 
                              checked={delivery.completed}
                              onChange={(e) => handleUpdateDelivery(delivery.id, 'completed', e.target.checked)}
                              className="w-5 h-5 rounded border-gray-500 text-brand-mint focus:ring-brand-mint bg-black/40 cursor-pointer"
                            />
                          </label>
                          <div className="flex-1 space-y-3">
                            <input 
                              type="text"
                              required
                              value={delivery.description}
                              onChange={(e) => handleUpdateDelivery(delivery.id, 'description', e.target.value)}
                              placeholder="O que será entregue? (Ex: 1 Roteiro de Vídeo)"
                              className={`w-full bg-transparent border-b border-white/10 text-sm focus:border-brand-mint outline-none pb-1 transition-colors ${delivery.completed ? 'text-gray-400 line-through' : 'text-white'}`}
                            />
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                              <input 
                                type="url"
                                value={delivery.link || ''}
                                onChange={(e) => handleUpdateDelivery(delivery.id, 'link', e.target.value)}
                                placeholder="Link do arquivo (Google Drive, Notion, Figma...)"
                                className="w-full bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-white/20 transition-colors"
                              />
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDelivery(delivery.id)} 
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors mt-0.5"
                            title="Remover"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-white/10 bg-black/40 flex gap-3 shrink-0">
              <Button 
                type="button" 
                onClick={closeModal}
                className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={isSubmitting}
                className="flex-1 bg-brand-emerald hover:bg-emerald-400 text-black font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  editingId ? 'Salvar Alterações' : 'Adicionar Cliente'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
