"use client";

import { create } from "zustand";
import type { AppRole } from "@/lib/roles";

type DevRoleState = {
  devRole: AppRole | null;
  setDevRole: (role: AppRole | null) => void;
  clearDevRole: () => void;
};

export const useDevRoleStore = create<DevRoleState>((set) => ({
  devRole: null,
  setDevRole: (role: AppRole | null) => set({ devRole: role }),
  clearDevRole: () => set({ devRole: null }),
}));