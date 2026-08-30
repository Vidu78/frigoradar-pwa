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
  updateStats: (type: 'SAVED' | 'WASTED', amount: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeOnboarding: (prefs: any) => Promise<void>;
}

// Il piano vive su households.plan, scrivibile solo dal service role.
// Prima stava in user_metadata, cioe' l'utente poteva farsi PRO da solo.
const loadPlan = async (session: Session | null): Promise<boolean> => {
  if (!session) return false;
  const householdId = session.user.user_metadata?.family_id || session.user.id;
  const { data } = await supabase
    .from('households')
    .select('plan')
    .eq('id', householdId)
    .maybeSingle();
  return data?.plan === 'pro';
};

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
        isPro: false,
        hasCompletedOnboarding: session?.user?.user_metadata?.has_completed_onboarding === true,
        preferences: session?.user?.user_metadata?.onboarding_preferences || null,
        stats: {
          saved: session?.user?.user_metadata?.stats_saved || 0,
          wasted: session?.user?.user_metadata?.stats_wasted || 0,
        },
        loading: false 
      });
      void loadPlan(session).then((isPro) => set({ isPro }));
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        isPro: false,
        hasCompletedOnboarding: session?.user?.user_metadata?.has_completed_onboarding === true,
        preferences: session?.user?.user_metadata?.onboarding_preferences || null,
        stats: {
          saved: session?.user?.user_metadata?.stats_saved || 0,
          wasted: session?.user?.user_metadata?.stats_wasted || 0,
        },
        loading: false 
      });
      void loadPlan(session).then((isPro) => set({ isPro }));
    });
  },
  signOut: async () => {
    // signOut notifica onAuthStateChange con session=null → ProtectedRoute redirige a /auth
    await supabase.auth.signOut();
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
