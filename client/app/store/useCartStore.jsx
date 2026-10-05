import { create } from "zustand";
import { api } from "~/lib/api";

export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,

  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),

  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await api.get("/cart");
      const cart = data?.cart || data;
      set({ cart });
    } catch {
      // not authenticated / empty cart
      set({ cart: null });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, variantId, quantity, size, color) => {
    await api.post("/cart/add", { productId, variantId, size, color, quantity });
    await get().fetchCart();
  },

  updateItem: async (lineId, quantity) => {
    await api.put(`/cart/item/${lineId}`, { quantity });
    await get().fetchCart();
  },

  removeItem: async (lineId) => {
    await api.del(`/cart/item/${lineId}`);
    await get().fetchCart();
  },
}));

export const selectCartCount = (state) =>
  state.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
export const selectCartSubtotal = (state) =>
  state.cart?.summary?.subtotal ??
  state.cart?.items?.reduce(
    (sum, item) => sum + (item.sellingPrice ?? 0) * item.quantity,
    0
  ) ??
  0;