import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

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
  category?: string | null;
  purchase_date?: string | null;
  created_at: string;
}

export interface PendingRecipe {
  title: string;
  ingredients_used: { original_id: string; name: string; quantity_deducted: number; unit?: string; health_score?: string }[];
}

interface InventoryState {
  items: InventoryItem[];
  pendingRecipe: PendingRecipe | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Partial<InventoryItem>) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  consumeRecipeIngredients: (ingredients: {original_id: string, name: string, quantity_deducted: number, health_score?: string}[]) => Promise<void>;
  setPendingRecipe: (recipe: PendingRecipe | null) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => {
  const initialPendingRecipe = localStorage.getItem('pendingRecipe') 
    ? JSON.parse(localStorage.getItem('pendingRecipe') as string) 
    : null;

  return {
    items: [],
    pendingRecipe: initialPendingRecipe,
    loading: false,
    error: null,

  fetchItems: async () => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('expiration_date', { ascending: true, nullsFirst: false });
        
      if (error) throw error;
      
      set({ items: data as InventoryItem[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  consumeRecipeIngredients: async (ingredients) => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    for (const ing of ingredients) {
      if (ing.original_id) {
        const item = get().items.find(i => i.id === ing.original_id);
        if (item) {
          const newQty = item.quantity - ing.quantity_deducted;
          if (newQty <= 0) {
            await get().deleteItem(item.id);
          } else {
            await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', item.id);
          }

          await supabase.from('consumption_logs').insert([{
            user_id: session.user.id,
            item_name: ing.name,
            quantity_consumed: ing.quantity_deducted,
            health_score: item.health_score || ing.health_score || 'Sconosciuto'
          }]);
        }
      }
    }
    await get().fetchItems();
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

  setPendingRecipe: (recipe) => {
    if (recipe) {
      localStorage.setItem('pendingRecipe', JSON.stringify(recipe));
    } else {
      localStorage.removeItem('pendingRecipe');
    }
    set({ pendingRecipe: recipe });
  }
  };
});
