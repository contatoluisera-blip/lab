'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, UserPlus, Activity, Database, RefreshCcw, Camera, MessageCircle, Clock, Trash2, Plus, Lock } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Lead Management States
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', whatsapp: '', instagram: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
      if (res.status === 403) {
        setIsAdmin(false);
      } else {
        const data = await res.json();
        if (data.success) {
          setIsAdmin(true);
          setStats(data);
        } else {
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error fetching admin stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchStats();
    }
  }, [user]);

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/leads?id=${id}&adminEmail=${user?.email}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchStats();
      } else {
        alert('Erro ao excluir lead');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLead, adminEmail: user?.email })
      });
      if (res.ok) {
        setNewLead({ name: '', email: '', whatsapp: '', instagram: '' });
        setShowAddLead(false);
        await fetchStats();
      } else {
        alert('Erro ao adicionar lead');
      }
    } catch (err) {
      alert('Erro de conexão ao adicionar lead');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError('');
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError('Credenciais inválidas ou e-mail incorreto.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="neo-glass-panel rounded-2xl p-8 max-w-md w-full border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-brand-emerald" />
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Acesso Restrito</h1>
            <p className="text-sm text-gray-400 mt-1">Área exclusiva para administradores</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="E-mail Admin" 
              value={loginEmail} 
              onChange={e => setLoginEmail(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-emerald/50 transition-colors"
              required
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)}
              className="px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-emerald/50 transition-colors"
              required
            />
            {loginError && <p className="text-red-400 text-xs text-center font-bold">{loginError}</p>}
            <button 
              type="submit"
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors mt-2"
            >
              Fazer Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="neo-glass-panel rounded-2xl p-10 text-center border border-red-500/20 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Acesso Negado</h2>
          <p className="text-gray-400 text-sm mb-8">Esta conta ({user.email}) não possui privilégios de administrador da plataforma.</p>
          <button onClick={() => auth.signOut()} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm font-bold text-white transition-colors">
            Entrar com outra conta
          </button>
        </div>
      </div>
    );
  }

  if (loading || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 opacity-50">
        <RefreshCcw className="w-8 h-8 animate-spin text-brand-emerald mb-4" />
        <p className="text-xs tracking-widest uppercase font-bold text-gray-500">Carregando Dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold mb-1 text-white">Painel de Gestão</h1>
        <p className="text-xs text-gray-400">Visão geral da plataforma Creator Lab.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Leads Pré-lista" 
          value={stats?.stats?.totalLeads || 0} 
          icon={<UserPlus className="w-5 h-5 text-blue-400" />}
          gradient="from-blue-500/10 to-transparent"
          border="border-blue-500/20"
        />
        <StatCard 
          title="Usuários Ativos" 
          value={stats?.stats?.totalUsers || 0} 
          icon={<Users className="w-5 h-5 text-brand-emerald" />}
          gradient="from-brand-emerald/10 to-transparent"
          border="border-brand-emerald/20"
        >
          {stats?.stats?.plansBreakdown && (
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-400">
                Free: <strong className="text-white">{stats.stats.plansBreakdown.free}</strong>
              </span>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-400">
                Start: <strong className="text-white">{stats.stats.plansBreakdown.start}</strong>
              </span>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-brand-emerald">
                Pro: <strong className="text-brand-emerald">{stats.stats.plansBreakdown.pro}</strong>
              </span>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-purple-400">
                Elite: <strong className="text-purple-400">{stats.stats.plansBreakdown.elite}</strong>
              </span>
            </div>
          )}
        </StatCard>
        <StatCard 
          title="Gerações de IA" 
          value={stats?.stats?.totalActions || 0} 
          icon={<Activity className="w-5 h-5 text-purple-400" />}
          gradient="from-purple-500/10 to-transparent"
          border="border-purple-500/20"
        />
      </div>

      {/* Tabela Leads e Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Leads Table */}
        <div className="neo-glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Todos os Leads (Pré-lista)
            </h2>
            <button onClick={() => setShowAddLead(!showAddLead)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-xs font-bold text-white flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Adicionar Lead
            </button>
          </div>

          {showAddLead && (
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <form onSubmit={handleAddLead} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Nome" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="px-3 py-2 bg-black/50 border border-white/10 rounded text-xs text-white" required />
                  <input type="email" placeholder="E-mail" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="px-3 py-2 bg-black/50 border border-white/10 rounded text-xs text-white" required />
                  <input type="text" placeholder="WhatsApp (ex: 11999999999)" value={newLead.whatsapp} onChange={e => setNewLead({...newLead, whatsapp: e.target.value})} className="px-3 py-2 bg-black/50 border border-white/10 rounded text-xs text-white" />
                  <input type="text" placeholder="Instagram (ex: @usuario)" value={newLead.instagram} onChange={e => setNewLead({...newLead, instagram: e.target.value})} className="px-3 py-2 bg-black/50 border border-white/10 rounded text-xs text-white" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddLead(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded disabled:opacity-50">Salvar Lead</button>
                </div>
              </form>
            </div>
          )}

          <div className="p-0 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050505] text-gray-500 sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Nome / Contato</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentLeads?.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-200">{lead.name}</div>
                      <div className="text-[10px] text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.instagram && (
                          <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-pink-500/10 text-pink-500 rounded hover:bg-pink-500/20 transition-colors">
                            <Camera className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.whatsapp && (
                          <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => handleDeleteLead(lead.id)} disabled={actionLoading} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Excluir Lead">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentLeads || stats.recentLeads.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-gray-500">Nenhum lead encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="neo-glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 bg-[#0a0a0a]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-emerald" /> Todos os Usuários
            </h2>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050505] text-gray-500 sticky top-0">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">E-mail</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Plano</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentUsers?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-200">{u.email}</td>
                    <td className="px-5 py-4 text-gray-400 capitalize">{u.plan || 'Free'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div className="neo-glass-panel rounded-2xl border border-white/5 overflow-hidden mt-8">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> Log de Gerações (Tempo Real)
          </h2>
          <button onClick={fetchStats} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <RefreshCcw className="w-3 h-3" /> Atualizar
          </button>
        </div>
        <div className="p-0 overflow-y-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050505] text-gray-500 sticky top-0">
              <tr>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Usuário</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Ferramenta</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Ação / Descrição</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recentActions?.map((action: any) => (
                <tr key={action.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-300">{action.userEmail}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold capitalize">
                      {action.tool.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{action.description}</td>
                  <td className="px-5 py-4 text-gray-500 text-right flex justify-end items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {action.createdAt ? new Date(action.createdAt).toLocaleString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
              {(!stats?.recentActions || stats.recentActions.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">Nenhuma ação registrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, border, children }: { title: string, value: number | string, icon: React.ReactNode, gradient: string, border: string, children?: React.ReactNode }) {
  return (
    <div className={`neo-glass-panel relative overflow-hidden rounded-2xl p-6 border ${border} flex items-center justify-between`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative z-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-4xl font-extrabold text-white">{value}</h3>
        {children}
      </div>
      <div className="relative z-10 w-12 h-12 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-lg shrink-0">
        {icon}
      </div>
    </div>
  );
}
