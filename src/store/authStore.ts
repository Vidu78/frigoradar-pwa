import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isPro: boolean;
  loading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isPro: false,
  loading: true,
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isPro: session?.user?.user_metadata?.is_pro === true, loading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isPro: session?.user?.user_metadata?.is_pro === true, loading: false });
    });
  },
  signOut: async () => {
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
  }
}));
