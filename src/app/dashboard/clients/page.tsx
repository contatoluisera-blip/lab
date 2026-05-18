'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Briefcase, Plus, TrendingUp, Users, DollarSign, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

type ClientStage = 'prospeccao' | 'ativo' | 'expirado';

interface Client {
  id: string;
  userId: string;
  name: string;
  stage: ClientStage;
  value: number;
  deliveries: number;
  createdAt: string;
}

const STAGE_LABELS: Record<ClientStage, string> = {
  prospeccao: 'Em Prospecção',
  ativo: 'Contrato Ativo',
  expirado: 'Expirado'
};

const STAGE_COLORS: Record<ClientStage, string> = {
  prospeccao: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ativo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expirado: 'bg-red-500/10 text-red-400 border-red-500/20'
};

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    stage: 'prospeccao' as ClientStage,
    value: '',
    deliveries: ''
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
      querySnapshot.forEach((doc) => {
        fetchedClients.push({ id: doc.id, ...doc.data() } as Client);
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
        deliveries: client.deliveries.toString()
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        stage: 'prospeccao',
        value: '',
        deliveries: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
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
        deliveries: Number(formData.deliveries) || 0,
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
      alert("Erro ao salvar os dados: " + (error.message || "Erro desconhecido. Verifique as permissões do Firebase."));
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
    .filter(c => c.stage === 'ativo')
    .reduce((acc, curr) => acc + curr.value, 0);

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
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Carteira de Clientes</h2>
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
            <p className="text-sm mt-1">Adicione seu primeiro cliente para começar a gestão.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-medium">Nome da Marca</th>
                  <th className="p-4 font-medium">Estágio</th>
                  <th className="p-4 font-medium">Valor do Contrato</th>
                  <th className="p-4 font-medium">Entregas</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(client => (
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
                      {client.deliveries} {client.deliveries === 1 ? 'item' : 'itens'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(client)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard glow className="w-full max-w-md p-0 overflow-hidden border-brand-mint/30 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Estágio *</label>
                <select 
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value as ClientStage})}
                  className="w-full glass-input appearance-none bg-black/40"
                >
                  <option value="prospeccao">Em Prospecção</option>
                  <option value="ativo">Contrato Ativo</option>
                  <option value="expirado">Expirado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full glass-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Qtd de Entregas</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.deliveries}
                    onChange={(e) => setFormData({...formData, deliveries: e.target.value})}
                    className="w-full glass-input"
                    placeholder="Ex: 4"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-emerald hover:bg-emerald-400 text-black font-bold"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    editingId ? 'Salvar Alterações' : 'Adicionar Cliente'
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
