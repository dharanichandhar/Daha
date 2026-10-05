import { create } from "zustand";
import { api } from "~/lib/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  fetchMe: async () => {
    set({ loading: true });
    try {
      const data = await api.get("/auth/me");
      set({ user: data?.user || null });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  login: async (credentials) => {
    const data = await api.post("/auth/login", credentials);
    set({ user: data.user });
    return data;
  },

  register: async (payload) => {
    const data = await api.post("/auth/register", payload);
    set({ user: data.user });
    return data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clearing local auth state still leaves the UI in a safe logged-out state.
    }
    set({ user: null });
  },

  isAuthenticated: () => Boolean(get().user),
  isAdmin: () => get().user?.role === "admin",
}));
