"use client";

import "@/styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import InvestorDashboard from "@/components/dashboard/InvestorDashboard";
import ResidentDashboard from "@/components/dashboard/ResidentDashboard";
import ProviderDashboard from "@/components/dashboard/ProviderDashboard";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type InvestorDashboardResponse = {
  message?: string;
  investor?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  summary?: {
    walletBalance: number;
    totalInvested: number;
    totalProfit: number;
    propertyCount: number;
    activeListings: number;
    pendingWithdrawals: number;
  };
  propertySnapshots?: {
    propertyId: string;
    title: string;
    location?: string | null;
    sharesOwned: number;
    amountPaid: number;
    pricePerShare: number;
    activeMaintenanceCount: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number;
  }[];
  recentActivity?: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    amount: number;
    createdAt: string;
  }[];
  notifications?: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
};

type ManagerDashboardResponse = {
  message?: string;
  properties?: {
    id: string;
    title: string;
    location?: string | null;
    units?: {
      id: string;
      number: string;
      status: string;
      rentAmount: number;
    }[];
  }[];
  totalUnits?: number;
  totalResidents?: number;
  totalProviders?: number;
  revenue?: number;
};

type AdminDashboardResponse = {
  message?: string;
  stats?: {
    properties: number;
    investors: number;
    residents: number;
    managers: number;
    providers: number;
  };
  system?: {
    pendingApprovals: number;
    activeMaintenance: number;
    pendingInvoices: number;
    unreadNotifications: number;
  };
  finance?: {
    totalRevenue: number;
  };
};

type ResidentDashboardResponse = {
  message?: string;
  resident?: {
    id: string;
    status?: string | null;
  } | null;
  profile?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  summary?: {
    walletBalance?: number;
    currentDue?: number;
    paidAmount?: number;
    outstandingAmount?: number;
    openMaintenanceCount?: number;
    unreadNotifications?: number;
    openInvoiceCount?: number;
  };
  unitSnapshot?: {
    propertyId?: string | null;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
    unitId?: string | null;
    unitNumber?: string | null;
    residentStatus?: string | null;
  } | null;
  currentInvoices?: {
    id: string;
    kind?: string | null;
    kindLabel?: string | null;
    period?: string | null;
    dueDate?: string | null;
    status?: string | null;
    totalAmount?: number;
    paidAmount?: number;
    outstandingAmount?: number;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
    unitNumber?: string | null;
    payments?: {
      id: string;
      amount: number;
      channel?: string | null;
      provider?: string | null;
      providerRef?: string | null;
      status?: string | null;
      createdAt: string;
    }[];
  }[];
  recentTransactions?: {
    id: string;
    type?: string;
    kind?: string | null;
    kindLabel?: string | null;
    title: string;
    subtitle: string;
    amount: number;
    status?: string | null;
    createdAt: string;
    provider?: string | null;
    providerRef?: string | null;
  }[];
  maintenanceRequests?: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    status?: string | null;
    priority?: string | null;
    estimatedCost?: number;
    createdAt: string;
    propertyTitle?: string | null;
    unitNumber?: string | null;
    assignedProvider?: string | null;
  }[];
  notifications?: {
    id: string;
    title: string;
    message: string;
    type?: string;
    isRead: boolean;
    createdAt: string;
  }[];
};

type ServiceProviderDashboardResponse = {
  message?: string;
  provider?: {
    id?: string;
    name?: string | null;
    companyName?: string | null;
    type?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    verificationStatus?: string | null;
    city?: string | null;
    serviceRadiusKm?: number | null;
  } | null;
  summary?: {
    pendingDispatches?: number;
    activeJobs?: number;
    completedJobs?: number;
    totalPayouts?: number;
    pendingPayouts?: number;
    averageRating?: number;
    responseRate?: number;
    completionRate?: number;
  };
  dispatches?: {
    id: string;
    requestId?: string | null;
    title: string;
    category?: string | null;
    priority?: string | null;
    propertyTitle?: string | null;
    unitNumber?: string | null;
    location?: string | null;
    status?: string | null;
    sentAt?: string | null;
  }[];
  activeAssignments?: {
    id: string;
    title: string;
    category?: string | null;
    priority?: string | null;
    status?: string | null;
    propertyTitle?: string | null;
    unitNumber?: string | null;
    workScheduledAt?: string | null;
    updatedAt?: string | null;
  }[];
  recentPayouts?: {
    id: string;
    totalAmount?: number;
    providerEarning?: number;
    platformFee?: number;
    status?: string | null;
    createdAt: string;
    requestTitle?: string | null;
  }[];
  recentReviews?: {
    id: string;
    rating: number;
    comment?: string | null;
    requestTitle?: string | null;
    createdAt: string;
  }[];
};

type DashboardResponse =
  | InvestorDashboardResponse
  | ManagerDashboardResponse
  | AdminDashboardResponse
  | ResidentDashboardResponse
  | ServiceProviderDashboardResponse
  | null;

function getDashboardEndpoint(role?: string) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "MANAGER":
      return "/dashboard/manager";
    case "RESIDENT":
      return "/dashboard/resident";
    case "SERVICE_PROVIDER":
      return "/dashboard/provider";
    case "INVESTOR":
    default:
      return "/dashboard/investor";
  }
}

export default function DashboardRouter() {
  const { user } = useAuthStore();
  const role = (user?.role as UserRole | undefined) ?? "INVESTOR";

  const [data, setData] = useState<DashboardResponse>(null);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => {
    if (user?.name?.trim()) return user.name;
    const rawName = user?.email?.split("@")[0] || "User";
    return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const endpoint = getDashboardEndpoint(role);
        const res = await api.get(endpoint);

        if (!mounted) return;
        setData(res.data);
      } catch (error) {
        console.error("Failed to load dashboard", error);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [role]);

  if (role === "SERVICE_PROVIDER") {
    return (
      <ProviderDashboard
        data={data as ServiceProviderDashboardResponse}
        loading={loading}
        displayName={displayName}
      />
    );
  }

  if (role === "MANAGER") {
    return (
      <ManagerDashboard
        data={data as ManagerDashboardResponse}
        loading={loading}
      />
    );
  }

  if (role === "ADMIN") {
    return (
      <AdminDashboard
        data={data as AdminDashboardResponse}
        loading={loading}
      />
    );
  }

  if (role === "RESIDENT") {
    return (
      <ResidentDashboard
        data={data as ResidentDashboardResponse}
        loading={loading}
        displayName={displayName}
      />
    );
  }

  return (
    <InvestorDashboard
      data={data as InvestorDashboardResponse}
      loading={loading}
      displayName={displayName}
    />
  );
}