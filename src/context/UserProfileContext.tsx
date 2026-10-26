'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { PlanId, ToolId, planHasToolAccess, planHasCourseAccess } from '@/lib/planConfig';
import { AccountState, ToolCheck, checkTool, getAccountState } from '@/lib/accountState';
import { callTool } from '@/lib/client/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  plan: PlanId | 'free';
  credits: number;
  trialUsed: Partial<Record<ToolId, boolean>>;
  calculator_presets?: {
    customCosts: { id: string; name: string; value: number }[];
    customEquipment: { id: string; name: string; value: number }[];
  };
  createdAt: string;
  stripeSubscriptionStatus?: string;
  currentPeriodEnd?: string | null;
  manualGrant?: { by?: string; at?: string } | null;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  profileLoading: boolean;
  /** Estado da conta (plano, situação, saldo, renovação) — mesma função que o servidor usa. */
  account: AccountState;
  /** Plano dá acesso à ferramenta? (só para a interface; o servidor valida de novo) */
  hasToolAccess: (tool: ToolId) => boolean;
  hasCourseAccess: boolean;
  /**
   * Checagem prévia, só para mostrar a mensagem certa antes de chamar a API.
   * A cobrança de verdade acontece no servidor, dentro da rota da ferramenta.
   */
  canUseTool: (tool: ToolId, cost?: number) => ToolCheck;
  /** Custo em créditos e se o próximo uso é o teste grátis. */
  toolCost: (tool: ToolId, cost?: number) => { cost: number; trial: boolean };
  /** Recarrega o perfil do Firestore (chame após usar uma ferramenta). */
  refreshProfile: () => Promise<void>;
  /** Atualiza o saldo local a partir da resposta de uma ferramenta, sem ida ao banco. */
  applyCredits: (credits?: { remaining: number; trial: boolean }, tool?: ToolId) => void;
  saveCalculatorPresets: (presets: UserProfile['calculator_presets']) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType>({
  userProfile: null,
  profileLoading: true,
  account: getAccountState(null),
  hasToolAccess: () => false,
  hasCourseAccess: false,
  canUseTool: () => ({ ok: false, reason: 'no_subscription', cost: 1, trial: false }),
  toolCost: () => ({ cost: 1, trial: false }),
  refreshProfile: async () => {},
  applyCredits: () => {},
  saveCalculatorPresets: async () => {},
});

export const useUserProfile = () => useContext(UserProfileContext);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserProfile({ uid: user.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) });
    } catch (e) {
      console.error('[UserProfile] Falha ao carregar perfil:', e);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Volta do checkout da Stripe: confirma a sessão no servidor (que valida na própria Stripe).
  const confirmCheckoutIfPresent = useCallback(async () => {
    if (typeof window === 'undefined' || !user) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;
    try {
      await callTool('/api/stripe/confirm', { sessionId });
    } catch (e) {
      console.error('[UserProfile] Falha ao confirmar checkout:', e);
    } finally {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    setProfileLoading(true);
    confirmCheckoutIfPresent().then(fetchProfile);
  }, [user, authLoading, fetchProfile, confirmCheckoutIfPresent]);

  useEffect(() => {
    window.addEventListener('asa-settings-updated', fetchProfile);
    return () => window.removeEventListener('asa-settings-updated', fetchProfile);
  }, [fetchProfile]);

  const hasToolAccess = useCallback((tool: ToolId) => planHasToolAccess(userProfile?.plan, tool), [userProfile]);
  const hasCourseAccess = planHasCourseAccess(userProfile?.plan);

  const account = useMemo(() => getAccountState(userProfile), [userProfile]);

  const canUseTool = useCallback(
    (tool: ToolId, cost?: number): ToolCheck => checkTool(account, userProfile?.trialUsed, tool, cost),
    [account, userProfile]
  );

  const toolCost = useCallback((tool: ToolId, override?: number) => {
    const { cost, trial } = canUseTool(tool, override);
    return { cost, trial };
  }, [canUseTool]);

  const applyCredits = useCallback((credits?: { remaining: number; trial: boolean }, tool?: ToolId) => {
    if (!credits) return;
    setUserProfile(prev => prev ? {
      ...prev,
      credits: credits.remaining,
      trialUsed: tool && credits.trial ? { ...prev.trialUsed, [tool]: true } : prev.trialUsed,
    } : prev);
  }, []);

  const saveCalculatorPresets = useCallback(async (presets: UserProfile['calculator_presets']) => {
    if (!user || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { calculator_presets: presets });
      setUserProfile(prev => prev ? { ...prev, calculator_presets: presets } : prev);
    } catch (e) {
      console.error('[UserProfile] Falha ao salvar presets:', e);
    }
  }, [user, userProfile]);

  return (
    <UserProfileContext.Provider
      value={{ userProfile, profileLoading, account, hasToolAccess, hasCourseAccess, canUseTool, toolCost, refreshProfile: fetchProfile, applyCredits, saveCalculatorPresets }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}
