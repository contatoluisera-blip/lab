'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
  PlanId,
  ToolId,
  planHasToolAccess,
  planHasCourseAccess,
} from '@/lib/planConfig';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  plan: PlanId;
  credits: number;
  trialUsed: Partial<Record<ToolId, boolean>>;
  calculator_presets?: {
    customCosts: { id: string; name: string; value: number }[];
    customEquipment: { id: string; name: string; value: number }[];
  };
  createdAt: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  profileLoading: boolean;
  /** Returns true if the user's plan grants access to this tool */
  hasToolAccess: (tool: ToolId) => boolean;
  /** Returns true if the user's plan grants course access */
  hasCourseAccess: boolean;
  /**
   * Attempts to consume 1 credit for a tool use.
   * First use of each tool is free (trial). Returns { ok, reason }.
   */
  consumeCredit: (tool: ToolId) => Promise<{ ok: boolean; reason?: 'no_access' | 'no_credits' }>;
  /**
   * Refunds 1 credit to the user if a generation failed or timed out.
   */
  refundCredit: (tool: ToolId) => Promise<{ ok: boolean }>;
  /** Refresh profile from Firestore */
  refreshProfile: () => Promise<void>;
  /** Save calculator custom settings */
  saveCalculatorPresets: (presets: UserProfile['calculator_presets']) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType>({
  userProfile: null,
  profileLoading: true,
  hasToolAccess: () => false,
  hasCourseAccess: false,
  consumeCredit: async () => ({ ok: false, reason: 'no_access' }),
  refundCredit: async () => ({ ok: false }),
  refreshProfile: async () => {},
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
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        let data = snap.data();

        // Fallback otimista: se a URL tem checkout_success, força a ativação caso o webhook local falhe
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('checkout_success') === 'true') {
            const planName = (params.get('plan') || 'start').toLowerCase();
            if (!data.plan || data.plan === 'free') {
              let credits = 20;
              if (planName === 'pro') credits = 50;
              if (planName === 'elite') credits = 100;
              
              try {
                await updateDoc(userRef, { 
                  plan: planName, 
                  credits,
                  stripeSubscriptionStatus: 'active' 
                });
                data = { ...data, plan: planName, credits, stripeSubscriptionStatus: 'active' };
                // Limpa a URL
                window.history.replaceState({}, document.title, window.location.pathname);
              } catch (e) {
                console.error('Erro ao ativar plano otimista:', e);
              }
            }
          }
        }

        setUserProfile({ uid: user.uid, ...data } as UserProfile);
      }
    } catch (e) {
      console.error('[UserProfile] Failed to load profile:', e);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Load on auth change
  useEffect(() => {
    if (!authLoading) {
      setProfileLoading(true);
      fetchProfile();
    }
  }, [user, authLoading, fetchProfile]);

  // Listen to setting updates to refresh
  useEffect(() => {
    window.addEventListener('asa-settings-updated', fetchProfile);
    return () => {
      window.removeEventListener('asa-settings-updated', fetchProfile);
    };
  }, [fetchProfile]);

  const hasToolAccess = useCallback(
    (tool: ToolId) => planHasToolAccess(userProfile?.plan, tool),
    [userProfile]
  );

  const hasCourseAccess = planHasCourseAccess(userProfile?.plan);

  const consumeCredit = useCallback(
    async (tool: ToolId): Promise<{ ok: boolean; reason?: 'no_access' | 'no_credits' }> => {
      if (!user || !userProfile) return { ok: false, reason: 'no_access' };

      // 1. Check plan access
      if (!planHasToolAccess(userProfile.plan, tool)) {
        return { ok: false, reason: 'no_access' };
      }

      // 2. First use (trial) — free, mark trial as used
      const alreadyUsedTrial = userProfile.trialUsed?.[tool] === true;
      if (!alreadyUsedTrial) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { [`trialUsed.${tool}`]: true });
          setUserProfile(prev =>
            prev ? { ...prev, trialUsed: { ...prev.trialUsed, [tool]: true } } : prev
          );
          return { ok: true };
        } catch (e) {
          console.error('[UserProfile] Failed to mark trial:', e);
          return { ok: true }; // allow anyway if DB fails
        }
      }

      // 3. Deduct 1 credit
      if (userProfile.credits <= 0) {
        return { ok: false, reason: 'no_credits' };
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { credits: increment(-1) });
        setUserProfile(prev =>
          prev ? { ...prev, credits: prev.credits - 1 } : prev
        );
        return { ok: true };
      } catch (e) {
        console.error('[UserProfile] Failed to deduct credit:', e);
        return { ok: false, reason: 'no_credits' };
      }
    },
    [user, userProfile]
  );

  const refundCredit = useCallback(
    async (tool: ToolId): Promise<{ ok: boolean }> => {
      if (!user || !userProfile) return { ok: false };

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { credits: increment(1) });
        setUserProfile(prev =>
          prev ? { ...prev, credits: prev.credits + 1 } : prev
        );
        return { ok: true };
      } catch (e) {
        console.error('[UserProfile] Failed to refund credit:', e);
        return { ok: false };
      }
    },
    [user, userProfile]
  );

  const saveCalculatorPresets = useCallback(
    async (presets: UserProfile['calculator_presets']) => {
      if (!user || !userProfile) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { calculator_presets: presets });
        setUserProfile(prev => prev ? { ...prev, calculator_presets: presets } : prev);
      } catch (e) {
        console.error('[UserProfile] Failed to save calculator presets:', e);
      }
    },
    [user, userProfile]
  );

  return (
    <UserProfileContext.Provider
      value={{
        userProfile,
        profileLoading,
        hasToolAccess,
        hasCourseAccess,
        consumeCredit,
        refundCredit,
        refreshProfile: fetchProfile,
        saveCalculatorPresets,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}
