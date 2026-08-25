import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface LoyaltyCard {
  id: string;
  store_name: string;
  barcode_value: string;
  color: string;
  created_at: string;
}

interface LoyaltyState {
  cards: LoyaltyCard[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  addCard: (store_name: string, barcode_value: string, color: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  cards: [],
  loading: false,
  error: null,

  fetchCards: async () => {
    const { session } = useAuthStore.getState();
    if (!session) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      set({ cards: data as LoyaltyCard[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addCard: async (store_name, barcode_value, color) => {
    const { session } = useAuthStore.getState();
    if (!session) return;
    set({ loading: true, error: null });
    try {
      const familyId = session.user.user_metadata?.family_id || session.user.id;
      
      const { data, error } = await supabase
        .from('loyalty_cards')
        .insert([{ 
          user_id: session.user.id, 
          family_id: familyId, 
          store_name, 
          barcode_value, 
          color 
        }])
        .select()
        .single();
        
      if (error) throw error;
      set({ cards: [data as LoyaltyCard, ...get().cards] });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteCard: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('loyalty_cards').delete().eq('id', id);
      if (error) throw error;
      set({ cards: get().cards.filter(c => c.id !== id) });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  }
}));
