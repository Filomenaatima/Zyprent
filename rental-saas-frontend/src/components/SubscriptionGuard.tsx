"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

const SUBSCRIPTION_REQUIRED_ROLES = ["MANAGER", "INVESTOR", "RESIDENT"];

export default function SubscriptionGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrateAuth } = useAuthStore();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const checkSubscription = async () => {
      const storedUser =
        typeof window !== "undefined"
          ? localStorage.getItem("user")
          : null;

      const parsedUser = user || (storedUser ? JSON.parse(storedUser) : null);

      if (!parsedUser) {
        router.replace("/login");
        return;
      }

      if (!SUBSCRIPTION_REQUIRED_ROLES.includes(parsedUser.role)) {
        setReady(true);
        return;
      }

      try {
        const res = await api.get("/subscriptions/me");

        if (!res.data?.hasActiveSubscription) {
          router.replace("/pricing");
          return;
        }

        setReady(true);
      } catch {
        router.replace("/pricing");
      }
    };

    checkSubscription();
  }, [user, pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}