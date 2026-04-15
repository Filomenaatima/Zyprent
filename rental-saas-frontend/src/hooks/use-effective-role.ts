"use client";

import { useAuthStore } from "@/store/auth";
import { isAppRole, type AppRole } from "@/lib/roles";
import { useDevRoleStore } from "@/store/dev-role";

export function useEffectiveRole(): AppRole {
  const user = useAuthStore((state) => state.user);
  const devRole = useDevRoleStore((state) => state.devRole);

  if (process.env.NODE_ENV === "development" && devRole) {
    return devRole;
  }

  const rawRole = user?.role;

  if (isAppRole(rawRole)) {
    return rawRole;
  }

  return "INVESTOR";
}