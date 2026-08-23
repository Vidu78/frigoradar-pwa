import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface FridgeItem {
  id: string;
  user_id: string;
  name: string;
  barcode: string | null;
  expiry_date: string | null;
  quantity: number;
  image_url: string | null;
  created_at: string;
}

interface InventoryState {
  items: FridgeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Partial<FridgeItem>) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .order('expiry_date', { ascending: true });
        
      if (error) throw error;
      
      set({ items: data as FridgeItem[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const newItem = {
        ...item,
        user_id: userData.user.id,
      };

      const { data, error } = await supabase
        .from('fridge_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      set({ items: [...get().items, data as FridgeItem] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  updateItemQuantity: async (id, quantity) => {
    try {
      const { error } = await supabase
        .from('fridge_items')
        .update({ quantity })
        .eq('id', id);

      if (error) throw error;

      set({
        items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteItem: async (id) => {
    try {
      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ items: get().items.filter((i) => i.id !== id) });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
