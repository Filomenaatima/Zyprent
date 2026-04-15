"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export default function AuthHydrator() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return null;
}