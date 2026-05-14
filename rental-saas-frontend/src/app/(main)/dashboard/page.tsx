"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import { api } from "@/services/api";

const NO_SUBSCRIPTION_REQUIRED = ["ADMIN", "SERVICE_PROVIDER"];

export default function DashboardPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      let user: any;

      try {
        user = JSON.parse(storedUser);
      } catch {
        localStorage.clear();
        router.replace("/login");
        return;
      }

      const role = String(user?.role || "").toUpperCase();

      if (NO_SUBSCRIPTION_REQUIRED.includes(role)) {
        setAllowed(true);
        return;
      }

      try {
        const res = await api.get("/subscriptions/me");

        if (res.data?.hasActiveSubscription) {
          setAllowed(true);
          return;
        }

        router.replace("/pricing");
      } catch {
        router.replace("/pricing");
      }
    }

    checkAccess();
  }, [router]);

  if (!allowed) return null;

  return <DashboardRouter />;
}