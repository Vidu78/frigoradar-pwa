import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  checked: boolean;
  created_at: string;
}

interface ShoppingState {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (name: string, quantity?: number, unit?: string | null) => Promise<void>;
  toggleItemCheck: (id: string, checked: boolean) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export const useShoppingStore = create<ShoppingState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ items: data as ShoppingItem[], loading: false });
  },

  addItem: async (name: string, quantity = 1, unit = null) => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    const familyId = session.user.user_metadata?.family_id || session.user.id;

    const { data, error } = await supabase
      .from('shopping_items')
      .insert([{ user_id: session.user.id, family_id: familyId, name, quantity, unit }])
      .select()
      .single();

    if (error) {
      console.error("Error adding shopping item:", error);
      return;
    }

    set(state => ({ items: [data as ShoppingItem, ...state.items] }));
  },

  toggleItemCheck: async (id: string, checked: boolean) => {
    const { error } = await supabase
      .from('shopping_items')
      .update({ checked })
      .eq('id', id);

    if (error) {
      console.error("Error updating shopping item:", error);
      return;
    }

    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, checked } : i)
    }));
  },

  removeItem: async (id: string) => {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting shopping item:", error);
      return;
    }

    set(state => ({
      items: state.items.filter(i => i.id !== id)
    }));
  }
}));
