import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface LoyaltyCard {
  id: string;
  store_name: string;
  barcode_value: string;
  color: string;
  points_balance: number;
  created_at: string;
}

export interface LoyaltyDiscount {
  id: string;
  loyalty_card_id: string;
  store_name: string;
  description: string;
  discount_amount: string;
  expiration_date: string;
  image_url: string | null;
  is_used: boolean;
  created_at: string;
}

interface LoyaltyState {
  cards: LoyaltyCard[];
  discounts: LoyaltyDiscount[];
  loading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  fetchDiscounts: () => Promise<void>;
  addCard: (store_name: string, barcode_value: string, color: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  updatePoints: (cardId: string, points: number) => Promise<void>;
  addDiscounts: (discounts: any[], cardId: string, storeName: string) => Promise<void>;
  addPaperDiscount: (file: File, description: string, expiration: string, cardId: string, storeName: string) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  cards: [],
  discounts: [],
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

  fetchDiscounts: async () => {
    const { session } = useAuthStore.getState();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('loyalty_discounts')
        .select('*')
        .eq('is_used', false)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        set({ discounts: data as LoyaltyDiscount[] });
      }
    } catch (err) {
      console.error(err);
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
  },

  updatePoints: async (cardId, points) => {
    try {
      const { error } = await supabase.from('loyalty_cards')
        .update({ points_balance: points })
        .eq('id', cardId);
      if (!error) {
        set({
          cards: get().cards.map(c => c.id === cardId ? { ...c, points_balance: points } : c)
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  addDiscounts: async (discountsData, cardId, storeName) => {
    const { session } = useAuthStore.getState();
    if (!session) return;
    const familyId = session.user.user_metadata?.family_id || session.user.id;
    
    try {
      const inserts = discountsData.map(d => ({
        user_id: session.user.id,
        family_id: familyId,
        loyalty_card_id: cardId,
        store_name: storeName,
        description: d.description,
        discount_amount: d.discount_amount,
        expiration_date: d.expiration_date
      }));
      
      const { data, error } = await supabase.from('loyalty_discounts').insert(inserts).select();
      if (!error && data) {
        set({ discounts: [...data as LoyaltyDiscount[], ...get().discounts] });
      }
    } catch (err) {
      console.error(err);
    }
  },

  addPaperDiscount: async (file, description, expiration, cardId, storeName) => {
    const { session } = useAuthStore.getState();
    if (!session) return;
    set({ loading: true });
    try {
      const familyId = session.user.user_metadata?.family_id || session.user.id;
      const fileName = `${session.user.id}/${Date.now()}_discount.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      
      const { data, error } = await supabase.from('loyalty_discounts').insert([{
        user_id: session.user.id,
        family_id: familyId,
        loyalty_card_id: cardId,
        store_name: storeName,
        description,
        expiration_date: expiration,
        image_url: urlData.publicUrl
      }]).select().single();
      
      if (!error && data) {
        set({ discounts: [data as LoyaltyDiscount, ...get().discounts] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  }
}));
