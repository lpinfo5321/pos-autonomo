import { create } from "zustand";

export interface CartModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: CartModifier[];
  notes?: string;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getTax: (taxRate: number) => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) => {
    const { items } = get();
    const existingIndex = items.findIndex(
      (i) =>
        i.menuItemId === item.menuItemId &&
        JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += item.quantity;
      set({ items: newItems });
    } else {
      set({ items: [...items, { ...item, id: crypto.randomUUID() }] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    });
  },

  clearCart: () => set({ items: [] }),

  toggleCart: () => set({ isOpen: !get().isOpen }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      const modifiersTotal = item.modifiers.reduce((m, mod) => m + mod.price, 0);
      return total + (item.price + modifiersTotal) * item.quantity;
    }, 0);
  },

  getTax: (taxRate) => {
    return get().getSubtotal() * (taxRate / 100);
  },

  getTotal: () => {
    return get().getSubtotal() * 1.085;
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
