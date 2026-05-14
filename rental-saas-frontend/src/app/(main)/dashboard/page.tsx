"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardRouter from "@/components/dashboard/DashboardRouter";

const DASHBOARD_ALLOWED_WITHOUT_SUBSCRIPTION = ["ADMIN", "SERVICE_PROVIDER"];

export default function DashboardPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    let parsedUser: any = null;

    try {
      parsedUser = JSON.parse(storedUser);
    } catch {
      localStorage.clear();
      router.replace("/login");
      return;
    }

    const role = String(parsedUser?.role || "").trim().toUpperCase();

    if (!DASHBOARD_ALLOWED_WITHOUT_SUBSCRIPTION.includes(role)) {
      router.replace("/pricing");
      return;
    }

    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <DashboardRouter />;
}