import { create } from "zustand";

type User = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrateAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    console.log("setAuth token:", token);
    console.log("setAuth user:", user);
    localStorage.setItem("token", token);

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }

    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  hydrateAuth: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let parsedUser: User | null = null;

    if (
      storedUser &&
      storedUser !== "undefined" &&
      storedUser !== "null"
    ) {
      try {
        parsedUser = JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem("user");
        parsedUser = null;
      }
    }

    set({
      token: token || null,
      user: parsedUser,
    });
  },
}));