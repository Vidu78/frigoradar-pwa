import { useState, useEffect } from 'react';
import { useShoppingStore } from '../store/shoppingStore';
import { useInventoryStore } from '../store/inventoryStore';
import { ShoppingCart, CheckCircle2, Circle, Plus, Trash2, ArrowRight } from 'lucide-react';
import AddItemModal from '../components/AddItemModal';

export default function ShoppingList() {
  const { items, fetchItems, addItem, toggleItemCheck, removeItem } = useShoppingStore();
  const { addItem: addToInventory } = useInventoryStore();
  const [newItemName, setNewItemName] = useState('');
  
  // State for magic flow
  const [transferItem, setTransferItem] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem(newItemName.trim());
    setNewItemName('');
  };

  const handleTransferSubmit = async (data: any) => {
    if (!transferItem) return;
    
    // 1. Add to inventory
    await addToInventory({
      custom_name: data.custom_name,
      expiration_date: data.expiration_date,
      quantity: data.quantity,
      location: data.location,
      is_frozen: data.is_frozen,
      health_score: data.health_score,
      image_url: null
    });

    // 2. Remove from shopping list
    await removeItem(transferItem.id);
    setTransferItem(null);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', minHeight: '100%', color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '14px', color: 'black' }}>
          <ShoppingCart size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Lista Spesa</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {items.filter(i => !i.checked).length} articoli da comprare
          </p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          placeholder="Cosa ti serve?" 
          style={{
            flex: 1, padding: '16px', borderRadius: '16px',
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            color: 'white', fontSize: '1rem'
          }}
        />
        <button type="submit" disabled={!newItemName.trim()} style={{
          background: 'var(--primary)', color: 'black', border: 'none',
          borderRadius: '16px', width: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: newItemName.trim() ? 1 : 0.5
        }}>
          <Plus size={24} />
        </button>
      </form>

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px',
            opacity: item.checked ? 0.6 : 1, transition: 'all 0.3s ease'
          }}>
            <button 
              onClick={() => toggleItemCheck(item.id, !item.checked)}
              style={{ background: 'none', border: 'none', color: item.checked ? 'var(--primary)' : 'var(--text-muted)', padding: 0, cursor: 'pointer' }}
            >
              {item.checked ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            
            <span style={{ flex: 1, fontSize: '1.1rem', textDecoration: item.checked ? 'line-through' : 'none' }}>
              {item.name}
            </span>

            {item.checked && (
              <button 
                onClick={() => setTransferItem({ id: item.id, name: item.name })}
                style={{
                  background: 'rgba(50, 215, 75, 0.2)', color: '#32D74B', border: 'none',
                  padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                }}
              >
                In Frigo <ArrowRight size={14} />
              </button>
            )}

            <button 
              onClick={() => removeItem(item.id)}
              style={{ background: 'none', border: 'none', color: '#FF453A', padding: '4px', cursor: 'pointer' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>La tua lista della spesa è vuota.</p>
          </div>
        )}
      </div>

      {transferItem && (
        <AddItemModal 
          initialData={{ name: transferItem.name }}
          onSave={handleTransferSubmit}
          onClose={() => setTransferItem(null)}
        />
      )}
    </div>
  );
}
