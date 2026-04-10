import { useState, useCallback, useMemo } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  variant?: string;
  quantity: number;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  note: string;
}

function cartKey(id: string, variant?: string): string {
  return variant ? `${id}::${variant}` : id;
}

export function useCart() {
  const [state, setState] = useState<CartState>({ items: [], note: '' });

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setState(prev => {
      const key = cartKey(item.id, item.variant);
      const idx = prev.items.findIndex(i => cartKey(i.id, i.variant) === key);
      if (idx >= 0) {
        const updated = [...prev.items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return { ...prev, items: updated };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: 1 }] };
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    setState(prev => {
      const key = cartKey(id, variant);
      const idx = prev.items.findIndex(i => cartKey(i.id, i.variant) === key);
      if (idx < 0) return prev;
      if (prev.items[idx].quantity <= 1) {
        return { ...prev, items: prev.items.filter((_, i) => i !== idx) };
      }
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
      return { ...prev, items: updated };
    });
  }, []);

  const deleteItem = useCallback((id: string, variant?: string) => {
    setState(prev => {
      const key = cartKey(id, variant);
      return { ...prev, items: prev.items.filter(i => cartKey(i.id, i.variant) !== key) };
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, variant?: string) => {
    setState(prev => {
      const key = cartKey(id, variant);
      if (quantity <= 0) {
        return { ...prev, items: prev.items.filter(i => cartKey(i.id, i.variant) !== key) };
      }
      const idx = prev.items.findIndex(i => cartKey(i.id, i.variant) === key);
      if (idx < 0) return prev;
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], quantity };
      return { ...prev, items: updated };
    });
  }, []);

  const setNote = useCallback((note: string) => {
    setState(prev => ({ ...prev, note: note.slice(0, 200) }));
  }, []);

  const clearCart = useCallback(() => {
    setState({ items: [], note: '' });
  }, []);

  const isInCart = useCallback((id: string, variant?: string): boolean => {
    const key = cartKey(id, variant);
    return state.items.some(i => cartKey(i.id, i.variant) === key);
  }, [state.items]);

  const getItemQuantity = useCallback((id: string, variant?: string): number => {
    const key = cartKey(id, variant);
    return state.items.find(i => cartKey(i.id, i.variant) === key)?.quantity ?? 0;
  }, [state.items]);

  const totalAmount = useMemo(() =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items],
  );

  const totalItems = useMemo(() =>
    state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items],
  );

  return {
    items: state.items,
    note: state.note,
    totalAmount,
    totalItems,
    addItem,
    removeItem,
    deleteItem,
    updateQuantity,
    setNote,
    clearCart,
    isInCart,
    getItemQuantity,
  };
}
