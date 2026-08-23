import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface InventoryItem {
  id: string;
  user_id: string;
  product_id: string | null;
  custom_name: string | null;
  quantity: number;
  unit: string | null;
  location: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'OTHER';
  expiration_date: string | null;
  is_frozen: boolean;
  health_score?: string | null;
  image_url?: string | null;
  created_at: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Partial<InventoryItem>) => Promise<void>;
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
        .from('inventory_items')
        .select('*')
        .order('expiration_date', { ascending: true });
        
      if (error) throw error;
      
      set({ items: data as InventoryItem[] });
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
        .from('inventory_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      set({ items: [...get().items, data as InventoryItem] });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateItemQuantity: async (id, quantity) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
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
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ items: get().items.filter((i) => i.id !== id) });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
