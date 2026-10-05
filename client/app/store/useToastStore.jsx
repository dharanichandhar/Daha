import { create } from "zustand";

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, type = "success", duration = 3200) => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
