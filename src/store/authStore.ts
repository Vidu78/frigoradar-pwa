import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isPro: boolean;
  hasCompletedOnboarding: boolean;
  preferences: any;
  stats: { saved: number; wasted: number };
  loading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  updateStats: (type: 'SAVED' | 'WASTED', amount: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeOnboarding: (prefs: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isPro: false,
  hasCompletedOnboarding: false,
  preferences: null,
  stats: { saved: 0, wasted: 0 },
  loading: true,
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ 
        session, 
        isPro: session?.user?.user_metadata?.is_pro === true,
        hasCompletedOnboarding: session?.user?.user_metadata?.has_completed_onboarding === true,
        preferences: session?.user?.user_metadata?.onboarding_preferences || null,
        stats: {
          saved: session?.user?.user_metadata?.stats_saved || 0,
          wasted: session?.user?.user_metadata?.stats_wasted || 0,
        },
        loading: false 
      });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        isPro: session?.user?.user_metadata?.is_pro === true,
        hasCompletedOnboarding: session?.user?.user_metadata?.has_completed_onboarding === true,
        preferences: session?.user?.user_metadata?.onboarding_preferences || null,
        stats: {
          saved: session?.user?.user_metadata?.stats_saved || 0,
          wasted: session?.user?.user_metadata?.stats_wasted || 0,
        },
        loading: false 
      });
    });
  },
  signOut: async () => {
    // signOut notifica onAuthStateChange con session=null → ProtectedRoute redirige a /auth
    await supabase.auth.signOut();
  },
  upgradeToPro: async () => {
    const { session } = get();
    if (!session) return;
    
    const { error } = await supabase.auth.updateUser({
      data: { is_pro: true }
    });
    
    if (error) throw error;
    
    set({ isPro: true });
  },
  updateStats: async (type, amount) => {
    const { session, stats } = get();
    if (!session) return;

    const newStats = { ...stats };
    if (type === 'SAVED') newStats.saved += amount;
    if (type === 'WASTED') newStats.wasted += amount;

    const { error } = await supabase.auth.updateUser({
      data: { 
        stats_saved: newStats.saved,
        stats_wasted: newStats.wasted 
      }
    });

    if (error) {
      console.error("Error updating stats:", error);
      return;
    }

    set({ stats: newStats });
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },
  completeOnboarding: async (prefs: any) => {
    const { session } = get();
    if (!session) return;
    
    const { error } = await supabase.auth.updateUser({
      data: { 
        has_completed_onboarding: true,
        onboarding_preferences: prefs
      }
    });
    
    if (error) throw error;
    set({ hasCompletedOnboarding: true, preferences: prefs });
  }
}));
