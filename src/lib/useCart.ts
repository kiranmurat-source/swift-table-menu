import { useState, useCallback, useMemo, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  variant?: string;
  quantity: number;
  image_url?: string;
}

export interface AppliedDiscount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
}

interface CartState {
  items: CartItem[];
  note: string;
  appliedDiscount: AppliedDiscount | null;
}

function cartKey(id: string, variant?: string): string {
  return variant ? `${id}::${variant}` : id;
}

export function useCart() {
  const [state, setState] = useState<CartState>({ items: [], note: '', appliedDiscount: null });

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
    setState({ items: [], note: '', appliedDiscount: null });
  }, []);

  const isInCart = useCallback((id: string, variant?: string): boolean => {
    const key = cartKey(id, variant);
    return state.items.some(i => cartKey(i.id, i.variant) === key);
  }, [state.items]);

  const getItemQuantity = useCallback((id: string, variant?: string): number => {
    const key = cartKey(id, variant);
    return state.items.find(i => cartKey(i.id, i.variant) === key)?.quantity ?? 0;
  }, [state.items]);

  const applyDiscount = useCallback((discount: AppliedDiscount) => {
    setState(prev => ({ ...prev, appliedDiscount: discount }));
  }, []);

  const removeDiscount = useCallback(() => {
    setState(prev => ({ ...prev, appliedDiscount: null }));
  }, []);

  const subtotal = useMemo(() =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items],
  );

  const discountAmount = useMemo(() => {
    const d = state.appliedDiscount;
    if (!d || subtotal < d.minOrderAmount) return 0;
    if (d.type === 'percentage') {
      return Math.round(subtotal * d.value / 100 * 100) / 100;
    }
    return Math.min(d.value, subtotal);
  }, [state.appliedDiscount, subtotal]);

  // Auto-remove discount if subtotal drops below minimum
  useEffect(() => {
    const d = state.appliedDiscount;
    if (d && subtotal > 0 && subtotal < d.minOrderAmount) {
      setState(prev => ({ ...prev, appliedDiscount: null }));
    }
  }, [subtotal, state.appliedDiscount]);

  const totalAmount = subtotal - discountAmount;

  const totalItems = useMemo(() =>
    state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items],
  );

  return {
    items: state.items,
    note: state.note,
    totalAmount,
    totalItems,
    subtotal,
    discountAmount,
    appliedDiscount: state.appliedDiscount,
    addItem,
    removeItem,
    deleteItem,
    updateQuantity,
    setNote,
    clearCart,
    isInCart,
    getItemQuantity,
    applyDiscount,
    removeDiscount,
  };
}
