"use client";

import "@/styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

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
  };
  unitSnapshot?: {
    propertyId?: string | null;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
    unitId?: string | null;
    unitNumber?: string | null;
    residentStatus?: string | null;
  } | null;
  currentInvoice?: {
    id: string;
    period?: string | null;
    dueDate?: string | null;
    status?: string | null;
    totalAmount?: number;
    paidAmount?: number;
    outstandingAmount?: number;
    propertyTitle?: string | null;
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
  } | null;
  recentTransactions?: {
    id: string;
    type?: string;
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

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatRoleLabel(value?: string | null) {
  return String(value || "Service Provider")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPriority(value?: string | null) {
  const normalized = String(value || "").toUpperCase();

  if (!normalized) return "Standard";
  if (normalized === "EMERGENCY") return "Emergency";
  if (normalized === "HIGH") return "High";
  if (normalized === "MEDIUM") return "Medium";
  if (normalized === "LOW") return "Low";

  return normalized
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

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

function getStatusTone(status?: string | null) {
  const value = String(status || "").toUpperCase();

  if (
    value === "PAID" ||
    value === "ACTIVE" ||
    value === "COMPLETED" ||
    value === "SUCCESS" ||
    value === "VERIFIED"
  ) {
    return "green";
  }

  if (
    value === "PARTIALLY_PAID" ||
    value === "PENDING" ||
    value === "ASSIGNED" ||
    value === "IN_PROGRESS" ||
    value === "INSPECTION_REQUIRED" ||
    value === "QUOTED" ||
    value === "APPROVED" ||
    value === "PROCESSING" ||
    value === "SENT" ||
    value === "VIEWED"
  ) {
    return "blue";
  }

  if (value === "OVERDUE" || value === "FAILED" || value === "DECLINED") {
    return "red";
  }

  return "gray";
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
    const providerData = (data as ServiceProviderDashboardResponse) || {};
    const provider = providerData.provider || {};
    const summary = providerData.summary || {};
    const dispatches = providerData.dispatches || [];
    const activeAssignments = providerData.activeAssignments || [];
    const recentPayouts = providerData.recentPayouts || [];
    const recentReviews = providerData.recentReviews || [];

    const pendingDispatches = Number(summary.pendingDispatches ?? 0);
    const activeJobs = Number(summary.activeJobs ?? 0);
    const completedJobs = Number(summary.completedJobs ?? 0);
    const totalPayouts = Number(summary.totalPayouts ?? 0);
    const pendingPayouts = Number(summary.pendingPayouts ?? 0);
    const averageRating = Number(summary.averageRating ?? provider.rating ?? 0);
    const responseRate = Number(summary.responseRate ?? 0);
    const completionRate = Number(summary.completionRate ?? 0);
    const reviewCount = Number(provider.reviewCount ?? recentReviews.length ?? 0);

    const latestDispatch = dispatches[0];
    const latestActiveJob = activeAssignments[0];
    const latestPayout = recentPayouts[0];
    const latestReview = recentReviews[0];

    return (
      <div className="dashboard-page-shell provider-dashboard-shell">
        <section className="provider-dashboard-top-stack">
          <section className="provider-dashboard-hero">
            <div className="provider-dashboard-hero-copy">
              <p className="provider-dashboard-eyebrow">Service provider hub</p>
              <h1 className="provider-dashboard-title">
                {provider.companyName || displayName}
              </h1>
              <p className="provider-dashboard-text">
                Stay on top of incoming job requests, active work, payouts,
                ratings, and service performance in one premium workspace built
                for fast operations.
              </p>

              <div className="provider-dashboard-hero-tags">
                <span className="provider-hero-tag">
                  {formatRoleLabel(provider.type)}
                </span>
                <span
                  className={`provider-hero-tag tone-${getStatusTone(
                    provider.verificationStatus,
                  )}`}
                >
                  {provider.verificationStatus || "Pending"}
                </span>
                <span className="provider-hero-tag">
                  {provider.city || "Kampala"}
                </span>
                <span className="provider-hero-tag">
                  Radius {provider.serviceRadiusKm ?? 0} km
                </span>
              </div>
            </div>

            <div className="provider-dashboard-hero-side">
              <div className="provider-rating-orb">
                <span className="provider-rating-orb-label">Rating</span>
                <strong className="provider-rating-orb-value">
                  {averageRating > 0 ? averageRating.toFixed(1) : "—"}
                </strong>
                <span className="provider-rating-orb-meta">
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </section>

          <section className="provider-command-board">
            <div className="provider-command-top">
              <div className="provider-command-copy">
                <p className="provider-command-label">Total payouts</p>
                <h2 className="provider-command-value">
                  {formatCurrency(totalPayouts)}
                </h2>
                <p className="provider-command-text">
                  Pending payout queue: {formatCurrency(pendingPayouts)}
                </p>
              </div>

              <div className="provider-command-actions">
                <button
                  className="provider-btn-primary"
                  onClick={() => (window.location.href = "/job-requests")}
                >
                  Open job requests
                </button>
                <button className="provider-btn-secondary">View payouts</button>
              </div>
            </div>

            <div className="provider-command-stats">
              <div className="provider-command-stat glass">
                <span>Pending dispatches</span>
                <strong>{pendingDispatches}</strong>
              </div>
              <div className="provider-command-stat glass">
                <span>Active jobs</span>
                <strong>{activeJobs}</strong>
              </div>
              <div className="provider-command-stat glass">
                <span>Completed jobs</span>
                <strong>{completedJobs}</strong>
              </div>
              <div className="provider-command-stat glass">
                <span>Completion rate</span>
                <strong>{formatPercent(completionRate)}</strong>
              </div>
            </div>
          </section>
        </section>

        <section className="provider-kpi-grid">
          <div className="provider-kpi-card">
            <p className="provider-kpi-label">Response rate</p>
            <p className="provider-kpi-value">{formatPercent(responseRate)}</p>
            <p className="provider-kpi-subtext">
              How quickly you handle incoming dispatches
            </p>
          </div>

          <div className="provider-kpi-card">
            <p className="provider-kpi-label">Average rating</p>
            <p className="provider-kpi-value">
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </p>
            <p className="provider-kpi-subtext">
              Based on resident reviews and completed work
            </p>
          </div>

          <div className="provider-kpi-card">
            <p className="provider-kpi-label">Pending payouts</p>
            <p className="provider-kpi-value">
              {formatCurrency(pendingPayouts)}
            </p>
            <p className="provider-kpi-subtext">
              Amount awaiting processing or release
            </p>
          </div>

          <div className="provider-kpi-card">
            <p className="provider-kpi-label">Verification</p>
            <p className="provider-kpi-value">
              {provider.verificationStatus || "Pending"}
            </p>
            <p className="provider-kpi-subtext">
              Keep your profile active and trusted on the platform
            </p>
          </div>
        </section>

        <section className="provider-dashboard-bottom">
          <div className="provider-bottom-row provider-bottom-row-top">
            <section className="provider-panel provider-bottom-card">
              <div className="provider-panel-head">
                <div>
                  <h3 className="provider-panel-title">Incoming dispatches</h3>
                  <p className="provider-panel-subtitle">
                    New work requests waiting for your response
                  </p>
                </div>
                <span
                  className={`provider-status-pill ${getStatusTone(
                    latestDispatch?.status,
                  )}`}
                >
                  {latestDispatch?.status || "No dispatches"}
                </span>
              </div>

              {latestDispatch ? (
                <div className="provider-dispatch-card">
                  <div className="provider-dispatch-main">
                    <h4>{latestDispatch.title}</h4>
                    <p>
                      {latestDispatch.propertyTitle || "Property"}
                      {latestDispatch.unitNumber
                        ? ` · Unit ${latestDispatch.unitNumber}`
                        : ""}
                    </p>
                  </div>

                  <div className="provider-dispatch-meta">
                    <div>
                      <span>Category</span>
                      <strong>{latestDispatch.category || "General"}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{formatPriority(latestDispatch.priority)}</strong>
                    </div>
                    <div>
                      <span>Location</span>
                      <strong>{latestDispatch.location || "Not set"}</strong>
                    </div>
                    <div>
                      <span>Sent</span>
                      <strong>
                        {latestDispatch.sentAt
                          ? formatDate(latestDispatch.sentAt)
                          : "Today"}
                      </strong>
                    </div>
                  </div>

                  <div className="provider-inline-actions">
                    <button className="provider-btn-primary">Respond now</button>
                    <button className="provider-btn-secondary">Open quotes</button>
                  </div>
                </div>
              ) : (
                <div className="provider-empty-state">
                  No incoming job requests right now.
                </div>
              )}
            </section>

            <section className="provider-panel provider-bottom-card">
              <div className="provider-panel-head">
                <div>
                  <h3 className="provider-panel-title">Active work</h3>
                  <p className="provider-panel-subtitle">
                    Job currently in progress and requiring attention
                  </p>
                </div>
                <span
                  className={`provider-status-pill ${getStatusTone(
                    latestActiveJob?.status,
                  )}`}
                >
                  {latestActiveJob?.status || "No active jobs"}
                </span>
              </div>

              {latestActiveJob ? (
                <div className="provider-active-card">
                  <h4>{latestActiveJob.title}</h4>
                  <p>
                    {latestActiveJob.propertyTitle || "Property"}
                    {latestActiveJob.unitNumber
                      ? ` · Unit ${latestActiveJob.unitNumber}`
                      : ""}
                  </p>

                  <div className="provider-active-meta">
                    <div>
                      <span>Category</span>
                      <strong>{latestActiveJob.category || "General"}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{formatPriority(latestActiveJob.priority)}</strong>
                    </div>
                    <div>
                      <span>Updated</span>
                      <strong>
                        {latestActiveJob.updatedAt
                          ? formatDate(latestActiveJob.updatedAt)
                          : "Today"}
                      </strong>
                    </div>
                    <div>
                      <span>Scheduled</span>
                      <strong>
                        {latestActiveJob.workScheduledAt
                          ? formatDate(latestActiveJob.workScheduledAt)
                          : "Not set"}
                      </strong>
                    </div>
                  </div>

                  <div className="provider-inline-actions">
                    <button className="provider-btn-primary">
                      Update progress
                    </button>
                    <button className="provider-btn-secondary">
                      View completed jobs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="provider-empty-state">
                  No jobs are currently in progress.
                </div>
              )}
            </section>

            <section className="provider-panel provider-bottom-card">
              <div className="provider-panel-head">
                <div>
                  <h3 className="provider-panel-title">Latest payout</h3>
                  <p className="provider-panel-subtitle">
                    Most recent payout released to your account
                  </p>
                </div>
              </div>

              {latestPayout ? (
                <div className="provider-payout-card">
                  <p className="provider-payout-amount">
                    {formatCurrency(
                      Number(
                        latestPayout.providerEarning ??
                          latestPayout.totalAmount ??
                          0,
                      ),
                    )}
                  </p>
                  <p className="provider-payout-title">
                    {latestPayout.requestTitle || "Maintenance payout"}
                  </p>
                  <p className="provider-payout-subtitle">
                    Fee: {formatCurrency(Number(latestPayout.platformFee ?? 0))}
                  </p>
                  <div className="provider-payout-row">
                    <span>Status</span>
                    <strong>{latestPayout.status || "Processing"}</strong>
                  </div>
                  <div className="provider-payout-row">
                    <span>Date</span>
                    <strong>{formatDate(latestPayout.createdAt)}</strong>
                  </div>
                </div>
              ) : (
                <div className="provider-empty-state">
                  No payout records yet.
                </div>
              )}
            </section>
          </div>

          <div className="provider-bottom-row provider-bottom-row-bottom">
            <section className="provider-panel provider-bottom-card provider-review-wide">
              <div className="provider-panel-head">
                <div>
                  <h3 className="provider-panel-title">Latest review</h3>
                  <p className="provider-panel-subtitle">
                    Recent feedback from completed work
                  </p>
                </div>
              </div>

              {latestReview ? (
                <div className="provider-review-card">
                  <div className="provider-review-top">
                    <p className="provider-review-rating">
                      {latestReview.rating}/5
                    </p>
                    <span className="provider-status-pill green">Verified</span>
                  </div>
                  <p className="provider-review-title">
                    {latestReview.requestTitle || "Completed request"}
                  </p>
                  <p className="provider-review-text">
                    {latestReview.comment || "No written review was added."}
                  </p>
                  <p className="provider-review-time">
                    {formatDate(latestReview.createdAt)}
                  </p>
                </div>
              ) : (
                <div className="provider-empty-state">
                  No reviews yet.
                </div>
              )}
            </section>

            <section className="provider-panel provider-bottom-card provider-quick-card">
              <div className="provider-panel-head">
                <div>
                  <h3 className="provider-panel-title">Quick metrics</h3>
                  <p className="provider-panel-subtitle">
                    Snapshot of your provider account
                  </p>
                </div>
              </div>

              <div className="provider-quick-list">
                <div className="provider-quick-row">
                  <span>Pending dispatches</span>
                  <strong>{pendingDispatches}</strong>
                </div>
                <div className="provider-quick-row">
                  <span>Active jobs</span>
                  <strong>{activeJobs}</strong>
                </div>
                <div className="provider-quick-row">
                  <span>Completed jobs</span>
                  <strong>{completedJobs}</strong>
                </div>
                <div className="provider-quick-row">
                  <span>Total payouts</span>
                  <strong>{formatCurrency(totalPayouts)}</strong>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    );
  }

  if (role === "MANAGER") {
    const managerData = (data as ManagerDashboardResponse) || {};
    const properties = managerData.properties ?? [];
    const totalUnits = Number(managerData.totalUnits ?? 0);
    const totalResidents = Number(managerData.totalResidents ?? 0);
    const totalProviders = Number(managerData.totalProviders ?? 0);
    const revenue = Number(managerData.revenue ?? 0);

    const occupiedUnits = properties.reduce((sum, property) => {
      const count =
        property.units?.filter((unit) => unit.status === "OCCUPIED").length ?? 0;
      return sum + count;
    }, 0);

    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const avgUnitsPerProperty =
      properties.length > 0 ? totalUnits / properties.length : 0;

    const topProperties = properties.slice(0, 2);
    const managedProperties = properties.slice(0, 4);

    return (
      <div className="dashboard-page-shell">
        <section className="dashboard-hero-premium">
          <div className="dashboard-hero-copy">
            <p className="dashboard-hero-eyebrow">Manager control center</p>
            <h1 className="dashboard-hero-name">Operational oversight</h1>
            <p className="dashboard-hero-text">
              Monitor properties, occupancy, residents, provider activity, and
              financial operations across managed assets.
            </p>
          </div>

          <div className="dashboard-hero-chip">
            {loading ? "Loading dashboard..." : "Manager overview"}
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel-overview">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Portfolio Operations</h2>
              <p className="panel-subtitle">
                Property performance and asset activity at a glance
              </p>
            </div>
            <button className="panel-chip">Live</button>
          </div>

          <div className="dashboard-overview-grid">
            <div className="dashboard-balance-card">
              <p className="dashboard-balance-label">Collected Revenue</p>
              <h3 className="dashboard-balance-value">
                {formatCurrency(revenue)}
              </h3>

              <div className="dashboard-balance-bottom">
                <div>
                  <p className="dashboard-balance-meta-label">Occupancy</p>
                  <p className="dashboard-balance-meta-value">
                    {formatPercent(occupancyRate)}
                  </p>
                </div>
                <div>
                  <p className="dashboard-balance-meta-label">Residents</p>
                  <p className="dashboard-balance-meta-value">
                    {totalResidents}
                  </p>
                </div>
                <div>
                  <p className="dashboard-balance-meta-label">Providers</p>
                  <p className="dashboard-balance-meta-value">
                    {totalProviders}
                  </p>
                </div>
              </div>
            </div>

            <div className="dashboard-summary-side">
              <div className="dashboard-summary-card">
                <p className="dashboard-summary-label">Properties</p>
                <p className="dashboard-summary-value">
                  {String(properties.length).padStart(2, "0")}
                </p>
              </div>
              <div className="dashboard-summary-card">
                <p className="dashboard-summary-label">Units</p>
                <p className="dashboard-summary-value">
                  {String(totalUnits).padStart(2, "0")}
                </p>
              </div>
              <div className="dashboard-summary-card">
                <p className="dashboard-summary-label">Residents</p>
                <p className="dashboard-summary-value">
                  {String(totalResidents).padStart(2, "0")}
                </p>
              </div>
              <div className="dashboard-summary-card">
                <p className="dashboard-summary-label">Providers</p>
                <p className="dashboard-summary-value">
                  {String(totalProviders).padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-performance-strip">
            <div className="dashboard-performance-item">
              <p className="dashboard-performance-label">Occupancy Rate</p>
              <p className="dashboard-performance-value">
                {formatPercent(occupancyRate)}
              </p>
            </div>
            <div className="dashboard-performance-item">
              <p className="dashboard-performance-label">Occupied Units</p>
              <p className="dashboard-performance-value">{occupiedUnits}</p>
            </div>
            <div className="dashboard-performance-item">
              <p className="dashboard-performance-label">Vacant Units</p>
              <p className="dashboard-performance-value">{vacantUnits}</p>
            </div>
            <div className="dashboard-performance-item">
              <p className="dashboard-performance-label">Avg Units / Property</p>
              <p className="dashboard-performance-value">
                {avgUnitsPerProperty.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="dashboard-actions-row">
            <button className="btn-primary-small">Add Property</button>
            <button className="btn-secondary-small">Open Units</button>
            <button className="btn-secondary-small">View Residents</button>
          </div>
        </section>

        <section className="dashboard-bottom-grid dashboard-bottom-grid-upgraded">
          <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-activity">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Top Properties</h2>
                <p className="panel-subtitle">Quick operational summary</p>
              </div>
              <div className="tiny-action-row">
                <button className="tiny-btn sky">Export</button>
                <button className="tiny-btn blue">Review</button>
              </div>
            </div>

            <div className="dashboard-activity-list dashboard-balanced-stack">
              {topProperties.length === 0 ? (
                <div className="dashboard-activity-row dashboard-empty-row">
                  <p className="dashboard-activity-title">
                    No managed properties yet
                  </p>
                </div>
              ) : (
                topProperties.map((property) => {
                  const propertyUnits = property.units ?? [];
                  const occupied = propertyUnits.filter(
                    (unit) => unit.status === "OCCUPIED",
                  ).length;
                  const total = propertyUnits.length;
                  const propertyOccupancy =
                    total > 0 ? (occupied / total) * 100 : 0;
                  const rentRoll = propertyUnits.reduce(
                    (sum, unit) => sum + Number(unit.rentAmount ?? 0),
                    0,
                  );

                  return (
                    <div key={property.id} className="dashboard-activity-row">
                      <div className="dashboard-activity-copy">
                        <p className="dashboard-activity-title">
                          {property.title}
                        </p>
                        <p className="dashboard-activity-subtitle">
                          {property.location || "No location"}
                        </p>
                        <p className="dashboard-activity-time">
                          {occupied}/{total} occupied ·{" "}
                          {formatPercent(propertyOccupancy)}
                        </p>
                      </div>
                      <p className="amount-positive">{formatCurrency(rentRoll)}</p>
                    </div>
                  );
                })
              )}
            </div>

            <button className="show-all-button">Show all properties</button>
          </div>

          <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-signals">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Manager Signals</h2>
                <p className="panel-subtitle">Operational intelligence snapshot</p>
              </div>
              <button className="panel-chip">Live</button>
            </div>

            <div className="dashboard-signals-grid">
              <div className="dashboard-signal-card">
                <p className="dashboard-signal-label">Revenue</p>
                <p className="dashboard-signal-value">{formatCurrency(revenue)}</p>
              </div>
              <div className="dashboard-signal-card">
                <p className="dashboard-signal-label">Total Properties</p>
                <p className="dashboard-signal-value">{properties.length}</p>
              </div>
              <div className="dashboard-signal-card">
                <p className="dashboard-signal-label">Residents</p>
                <p className="dashboard-signal-value">{totalResidents}</p>
              </div>
              <div className="dashboard-signal-card">
                <p className="dashboard-signal-label">Providers</p>
                <p className="dashboard-signal-value">{totalProviders}</p>
              </div>
            </div>

            <div className="dashboard-insights-strip">
              <div className="dashboard-insight-card positive">
                <p className="dashboard-insight-label">Occupancy</p>
                <p className="dashboard-insight-value">
                  {formatPercent(occupancyRate)}
                </p>
              </div>
              <div className="dashboard-insight-card">
                <p className="dashboard-insight-label">Vacant Units</p>
                <p className="dashboard-insight-value">{vacantUnits}</p>
              </div>
              <div className="dashboard-insight-card">
                <p className="dashboard-insight-label">Asset Spread</p>
                <p className="dashboard-insight-value">{properties.length} Assets</p>
              </div>
            </div>

            <div className="dashboard-alert-stack dashboard-balanced-stack">
              <div className="dashboard-alert-row">
                <div>
                  <p className="dashboard-alert-title">Operations summary</p>
                  <p className="dashboard-alert-text">
                    Monitor occupancy, provider coverage, property count, and
                    revenue flow.
                  </p>
                </div>
                <span className="status-badge badge-blue">Live</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-properties">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Managed Properties</h2>
                <p className="panel-subtitle">
                  Current property spread and occupancy
                </p>
              </div>
              <button className="panel-chip">View all</button>
            </div>

            <div className="dashboard-property-table">
              <div className="dashboard-property-head">
                <span>Property</span>
                <span>Units</span>
                <span>Occupied</span>
                <span>Occupancy</span>
                <span>Rent Roll</span>
              </div>

              <div className="dashboard-property-body dashboard-balanced-stack">
                {managedProperties.length === 0 ? (
                  <div className="dashboard-property-row dashboard-empty-row">
                    <span>No properties found yet</span>
                  </div>
                ) : (
                  managedProperties.map((property) => {
                    const propertyUnits = property.units ?? [];
                    const occupied = propertyUnits.filter(
                      (unit) => unit.status === "OCCUPIED",
                    ).length;
                    const total = propertyUnits.length;
                    const propertyOccupancy =
                      total > 0 ? (occupied / total) * 100 : 0;
                    const rentRoll = propertyUnits.reduce(
                      (sum, unit) => sum + Number(unit.rentAmount ?? 0),
                      0,
                    );

                    return (
                      <div key={property.id} className="dashboard-property-row">
                        <div>
                          <p className="dashboard-property-title">
                            {property.title}
                          </p>
                          <p className="dashboard-property-subtitle">
                            {property.location || "No location"}
                          </p>
                        </div>

                        <span>{total}</span>
                        <span>{occupied}</span>
                        <span>{formatPercent(propertyOccupancy)}</span>
                        <span>{formatCurrency(rentRoll)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="dashboard-actions-row dashboard-actions-row-bottom">
              <button className="btn-secondary-small">Open Properties</button>
              <button className="btn-secondary-small">Open Units</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

    if (role === "ADMIN") {
  const adminData = (data as AdminDashboardResponse) || {};
  const stats = adminData.stats || {
    properties: 0,
    investors: 0,
    residents: 0,
    managers: 0,
    providers: 0,
  };

  const totalUsers =
    Number(stats.investors ?? 0) +
    Number(stats.residents ?? 0) +
    Number(stats.managers ?? 0) +
    Number(stats.providers ?? 0);

  const zeroSafe = (value?: number | null) => Number(value ?? 0);

  const formatMetricValue = (value?: number | null) => {
    const amount = zeroSafe(value);
    return amount === 0 ? "0" : amount.toLocaleString();
  };

  const formatMoneyMetric = (value?: number | null) => {
    const amount = zeroSafe(value);
    return `UGX ${amount.toLocaleString()}`;
  };

  const getMetricTone = (value?: number | null) => {
    const amount = zeroSafe(value);
    return amount > 0 ? "live" : "muted";
  };

  const roleMix = [
    {
      label: "Investors",
      value: zeroSafe(stats.investors),
      tone: "blue",
    },
    {
      label: "Residents",
      value: zeroSafe(stats.residents),
      tone: "green",
    },
    {
      label: "Managers",
      value: zeroSafe(stats.managers),
      tone: "violet",
    },
    {
      label: "Providers",
      value: zeroSafe(stats.providers),
      tone: "amber",
    },
  ];

  const quickActions = [
    { label: "Open users", href: "/users" },
    { label: "Open properties", href: "/properties" },
    { label: "Open approvals", href: "/approvals" },
    { label: "Open reports", href: "/reports" },
  ];

  const platformControls = [
    {
      title: "Users & access",
      subtitle: "Manage platform users, roles, onboarding, and account state.",
      href: "/users",
      status: `${formatMetricValue(totalUsers)} users`,
    },
    {
      title: "Property operations",
      subtitle:
        "Oversee properties, units, residents, and live operational flow.",
      href: "/properties",
      status: `${formatMetricValue(stats.properties)} assets`,
    },
    {
      title: "Financial oversight",
      subtitle:
        "Track invoices, payments, expenses, and transaction visibility.",
      href: "/transactions",
      status: "Finance live",
    },
    {
      title: "Compliance & trust",
      subtitle:
        "Review KYC, provider verification, and approval-driven actions.",
      href: "/kyc-verification",
      status: "Action queue",
    },
  ];

  const adminSignals = [
    {
      label: "Platform users",
      value: totalUsers,
      helper: "All active non-admin platform users",
    },
    {
      label: "Properties",
      value: zeroSafe(stats.properties),
      helper: "Assets currently inside the system",
    },
    {
      label: "Service providers",
      value: zeroSafe(stats.providers),
      helper: "Operational vendor coverage on platform",
    },
    {
      label: "Managers",
      value: zeroSafe(stats.managers),
      helper: "Portfolio operators supervising assets",
    },
  ];

  const adminWorkflow = [
    {
      title: "Approvals queue",
      text: "Review expense approvals, verification flows, and operational decision points.",
      href: "/approvals",
      badge: "Priority",
    },
    {
      title: "Reports center",
      text: "Open platform reporting, export summaries, and scheduled reporting runs.",
      href: "/reports",
      badge: "Insights",
    },
    {
      title: "Billing control",
      text: "Monitor subscriptions, usage snapshots, and platform billing visibility.",
      href: "/subscriptions-billing",
      badge: "Revenue",
    },
  ];

  const adminAttentionItems = [
    {
      title: "Pending approvals",
      value: 0,
      text: "Expenses and decision items waiting for review",
      tone: "red",
      href: "/approvals",
    },
    {
      title: "Unverified providers",
      value: 0,
      text: "Vendors still waiting for verification",
      tone: "amber",
      href: "/kyc-verification",
    },
    {
      title: "Active maintenance",
      value: 0,
      text: "Operational jobs currently in motion",
      tone: "blue",
      href: "/maintenance",
    },
    {
      title: "Unread notifications",
      value: 0,
      text: "System alerts and platform messages",
      tone: "gray",
      href: "/notifications",
    },
  ];

  const financialSnapshot = [
    {
      label: "Invoices",
      value: 0,
      helper: "Platform invoice visibility",
    },
    {
      label: "Payments",
      value: 0,
      helper: "Incoming collections and receipts",
    },
    {
      label: "Expenses",
      value: 0,
      helper: "Approved and submitted spend",
    },
    {
      label: "Transactions",
      value: 0,
      helper: "Ledger-wide money movement",
    },
  ];

  const platformActivity = [
    {
      title: "New resident registered",
      subtitle: "User joined platform",
      badge: "New",
      badgeClass: "badge-blue",
    },
    {
      title: "Maintenance request created",
      subtitle: "Requires provider assignment",
      badge: "Pending",
      badgeClass: "badge-gray",
    },
    {
      title: "Provider verification queued",
      subtitle: "Compliance review required",
      badge: "Review",
      badgeClass: "badge-blue",
    },
  ];

  return (
    <div className="dashboard-page-shell admin-dashboard-shell">
      <section className="admin-hero-panel">
        <div className="admin-hero-copy">
          <p className="admin-hero-eyebrow">Platform command center</p>
          <h1 className="admin-hero-title">Admin overview</h1>
          <p className="admin-hero-text">
            Control the full Zyrent system across users, asset operations,
            financial oversight, compliance, and platform growth.
          </p>

          <div className="admin-hero-tags">
            <span className="admin-hero-tag">Platform control</span>
            <span className="admin-hero-tag">Operations live</span>
            <span className="admin-hero-tag">
              {loading ? "Refreshing..." : "System synced"}
            </span>
          </div>
        </div>

        <div className="admin-hero-side">
          <div className="admin-hero-orb">
            <span className="admin-hero-orb-label">Users</span>
            <strong className="admin-hero-orb-value">
              {formatMetricValue(totalUsers)}
            </strong>
            <span className="admin-hero-orb-meta">Active platform base</span>
          </div>
        </div>
      </section>

      <section className="dashboard-panel admin-command-board">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Executive command</h2>
            <p className="panel-subtitle">
              High-level admin shortcuts for daily platform control
            </p>
          </div>
          <button className="panel-chip">
            {loading ? "Loading..." : "Live"}
          </button>
        </div>

        <div className="admin-command-top">
          <div className="admin-command-balance">
            <p className="admin-command-label">Platform footprint</p>
            <h3 className="admin-command-value">
              {formatMetricValue(stats.properties)} properties
            </h3>
            <p className="admin-command-text">
              {formatMetricValue(totalUsers)} platform users across investors,
              residents, managers, and providers.
            </p>
          </div>

          <div className="admin-command-actions">
            {quickActions.map((item) => (
              <button
                key={item.href}
                className="btn-secondary-small"
                onClick={() => {
                  window.location.href = item.href;
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-command-stats">
          <div className="admin-command-stat">
            <span>Properties</span>
            <strong>{formatMetricValue(stats.properties)}</strong>
          </div>
          <div className="admin-command-stat">
            <span>Investors</span>
            <strong>{formatMetricValue(stats.investors)}</strong>
          </div>
          <div className="admin-command-stat">
            <span>Residents</span>
            <strong>{formatMetricValue(stats.residents)}</strong>
          </div>
          <div className="admin-command-stat">
            <span>Providers</span>
            <strong>{formatMetricValue(stats.providers)}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-panel admin-alerts-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Attention center</h2>
            <p className="panel-subtitle">
              Items requiring immediate admin action
            </p>
          </div>
          <button className="panel-chip">Priority</button>
        </div>

        <div className="admin-alerts-grid">
          {adminAttentionItems.map((item) => {
            const hasRisk = zeroSafe(item.value) > 0;

            return (
              <button
                key={item.title}
                className={`admin-alert-card ${item.tone} ${hasRisk ? "active" : ""}`}
                onClick={() => {
                  window.location.href = item.href;
                }}
              >
                <p className="admin-alert-title">{item.title}</p>
                <p
                  className={`admin-alert-value ${getMetricTone(item.value)}`}
                >
                  {formatMetricValue(item.value)}
                </p>
                <p className="admin-alert-text">{item.text}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-panel admin-financial-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Financial snapshot</h2>
            <p className="panel-subtitle">
              Platform-wide financial visibility
            </p>
          </div>
          <button className="panel-chip">Finance</button>
        </div>

        <div className="admin-financial-grid">
          {financialSnapshot.map((item) => (
            <div key={item.label} className="admin-financial-card">
              <p className="admin-financial-label">{item.label}</p>
              <p
                className={`admin-financial-value ${getMetricTone(item.value)}`}
              >
                {formatMoneyMetric(item.value)}
              </p>
              <p className="admin-financial-text">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-kpi-grid">
        {adminSignals.map((item) => (
          <div key={item.label} className="admin-kpi-card">
            <p className="admin-kpi-label">{item.label}</p>
            <p className="admin-kpi-value">{formatMetricValue(item.value)}</p>
            <p className="admin-kpi-subtext">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="admin-main-grid">
        <section className="dashboard-panel admin-main-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Role distribution</h2>
              <p className="panel-subtitle">
                Current user spread across the platform
              </p>
            </div>
            <button className="panel-chip">Roles</button>
          </div>

          <div className="admin-role-mix">
            {roleMix.map((item) => {
              const share =
                totalUsers > 0 ? (item.value / totalUsers) * 100 : 0;

              return (
                <div key={item.label} className="admin-role-card">
                  <div className="admin-role-top">
                    <p className="admin-role-label">{item.label}</p>
                    <span className={`admin-role-pill ${item.tone}`}>
                      {formatPercent(share)}
                    </span>
                  </div>

                  <p className="admin-role-value">
                    {formatMetricValue(item.value)}
                  </p>

                  <div className="admin-role-track">
                    <div
                      className={`admin-role-fill ${item.tone}`}
                      style={{ width: `${Math.min(share, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel admin-main-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Platform control surfaces</h2>
              <p className="panel-subtitle">
                Core admin areas that drive the entire system
              </p>
            </div>
            <button className="panel-chip">Admin</button>
          </div>

          <div className="admin-control-list">
            {platformControls.map((item) => (
              <button
                key={item.href}
                className="admin-control-card"
                onClick={() => {
                  window.location.href = item.href;
                }}
              >
                <div className="admin-control-copy">
                  <p className="admin-control-title">{item.title}</p>
                  <p className="admin-control-text">{item.subtitle}</p>
                </div>
                <div className="admin-control-meta">
                  <span className="admin-control-status">{item.status}</span>
                  <span className="admin-control-arrow">↗</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="admin-bottom-grid">
        <section className="dashboard-panel admin-bottom-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Platform activity</h2>
              <p className="panel-subtitle">
                Recent system events across the platform
              </p>
            </div>
            <button className="panel-chip">Live</button>
          </div>

          <div className="dashboard-activity-list">
            {platformActivity.map((item) => (
              <div key={item.title} className="dashboard-activity-row">
                <div className="dashboard-activity-copy">
                  <p className="dashboard-activity-title">{item.title}</p>
                  <p className="dashboard-activity-subtitle">
                    {item.subtitle}
                  </p>
                </div>
                <span className={`status-badge ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel admin-bottom-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Admin workflow</h2>
              <p className="panel-subtitle">
                Operational paths that need regular oversight
              </p>
            </div>
            <button className="panel-chip">Daily</button>
          </div>

          <div className="admin-workflow-list">
            {adminWorkflow.map((item) => (
              <div key={item.href} className="admin-workflow-row">
                <div className="admin-workflow-copy">
                  <p className="admin-workflow-title">{item.title}</p>
                  <p className="admin-workflow-text">{item.text}</p>
                </div>

                <div className="admin-workflow-actions">
                  <span className="status-badge badge-blue">{item.badge}</span>
                  <button
                    className="tiny-btn blue"
                    onClick={() => {
                      window.location.href = item.href;
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="admin-bottom-grid">
        <section className="dashboard-panel admin-bottom-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">System posture</h2>
              <p className="panel-subtitle">
                Platform-level readiness and operating stance
              </p>
            </div>
            <button className="panel-chip">Status</button>
          </div>

          <div className="admin-posture-grid">
            <div className="admin-posture-card">
              <p className="admin-posture-label">Coverage</p>
              <p className="admin-posture-value">
                {formatMetricValue(stats.providers)} Providers
              </p>
            </div>
            <div className="admin-posture-card">
              <p className="admin-posture-label">Oversight</p>
              <p className="admin-posture-value">
                {formatMetricValue(stats.managers)} Managers
              </p>
            </div>
            <div className="admin-posture-card">
              <p className="admin-posture-label">Resident base</p>
              <p className="admin-posture-value">
                {formatMetricValue(stats.residents)} Residents
              </p>
            </div>
            <div className="admin-posture-card">
              <p className="admin-posture-label">Investor base</p>
              <p className="admin-posture-value">
                {formatMetricValue(stats.investors)} Investors
              </p>
            </div>
          </div>

          <div className="admin-posture-note">
            <p className="admin-posture-note-title">
              Admin dashboard direction
            </p>
            <p className="admin-posture-note-text">
              This command center is now structured for real platform control.
              As you expose richer backend admin payloads later, we can plug in
              approvals, KYC queues, billing health, maintenance alerts,
              reports, and investment governance without redesigning the page.
            </p>
          </div>
        </section>

        <section className="dashboard-panel admin-bottom-card">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Control summary</h2>
              <p className="panel-subtitle">
                Executive overview of the current admin surface
              </p>
            </div>
            <button className="panel-chip">Summary</button>
          </div>

          <div className="admin-summary-stack">
            <div className="admin-summary-card">
              <p className="admin-summary-label">Users</p>
              <p className="admin-summary-value">
                {formatMetricValue(totalUsers)}
              </p>
            </div>
            <div className="admin-summary-card">
              <p className="admin-summary-label">Properties</p>
              <p className="admin-summary-value">
                {formatMetricValue(stats.properties)}
              </p>
            </div>
            <div className="admin-summary-card">
              <p className="admin-summary-label">Providers</p>
              <p className="admin-summary-value">
                {formatMetricValue(stats.providers)}
              </p>
            </div>
            <div className="admin-summary-card">
              <p className="admin-summary-label">Managers</p>
              <p className="admin-summary-value">
                {formatMetricValue(stats.managers)}
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

  if (role === "RESIDENT") {
    const residentData = (data as ResidentDashboardResponse) || {};
    const summary = residentData.summary || {};
    const unitSnapshot = residentData.unitSnapshot || {};
    const currentInvoice = residentData.currentInvoice;
    const maintenanceRequests = residentData.maintenanceRequests || [];
    const notifications = residentData.notifications || [];
    const recentTransactions = residentData.recentTransactions || [];

    const walletBalance = Number(summary.walletBalance ?? 0);
    const currentDue = Number(summary.currentDue ?? 0);
    const paidAmount = Number(summary.paidAmount ?? 0);
    const outstandingAmount = Number(summary.outstandingAmount ?? 0);
    const openMaintenanceCount = Number(summary.openMaintenanceCount ?? 0);
    const unreadNotifications = Number(summary.unreadNotifications ?? 0);

    const latestMaintenance = maintenanceRequests[0];
    const latestTransaction = recentTransactions[0];
    const latestNotification = notifications[0];

    return (
      <div className="dashboard-page-shell compact-dashboard-shell">
        <section className="resident-dashboard-hero">
          <div className="resident-dashboard-hero-copy">
            <p className="resident-dashboard-eyebrow">Resident home</p>
            <h1 className="resident-dashboard-title">
              Welcome home, {residentData.profile?.name || displayName}
            </h1>
            <p className="resident-dashboard-text">
              Track your rent, unit details, maintenance requests, and important
              updates in one calm, personal space.
            </p>
          </div>

          <div className="resident-dashboard-badge">
            {loading ? "Loading your account..." : "Resident overview"}
          </div>
        </section>

        <section className="resident-dashboard-grid">
          <div className="resident-dashboard-main">
            <section className="resident-panel resident-billboard">
              <div className="resident-billboard-copy">
                <p className="resident-billboard-label">Current outstanding</p>
                <h2 className="resident-billboard-value">
                  {formatCurrency(outstandingAmount)}
                </h2>
                <p className="resident-billboard-text">
                  {currentInvoice?.dueDate
                    ? `Due on ${formatDate(currentInvoice.dueDate)}`
                    : "No active invoice due right now"}
                </p>
              </div>

              <div className="resident-billboard-meta">
                <div className="resident-mini-stat glass">
                  <span className="resident-mini-stat-label">Wallet</span>
                  <strong>{formatCurrency(walletBalance)}</strong>
                </div>
                <div className="resident-mini-stat glass">
                  <span className="resident-mini-stat-label">This invoice</span>
                  <strong>{formatCurrency(currentDue)}</strong>
                </div>
                <div className="resident-mini-stat glass">
                  <span className="resident-mini-stat-label">Paid</span>
                  <strong>{formatCurrency(paidAmount)}</strong>
                </div>
              </div>
            </section>

            <section className="resident-kpi-grid">
              <div className="resident-kpi-card">
                <p className="resident-kpi-label">Property</p>
                <p className="resident-kpi-value">
                  {unitSnapshot.propertyTitle || "Not assigned"}
                </p>
                <p className="resident-kpi-subtext">
                  {unitSnapshot.propertyLocation || "No location yet"}
                </p>
              </div>

              <div className="resident-kpi-card">
                <p className="resident-kpi-label">Unit</p>
                <p className="resident-kpi-value">
                  {unitSnapshot.unitNumber || "—"}
                </p>
                <p className="resident-kpi-subtext">
                  Status: {unitSnapshot.residentStatus || "Unknown"}
                </p>
              </div>

              <div className="resident-kpi-card">
                <p className="resident-kpi-label">Open maintenance</p>
                <p className="resident-kpi-value">{openMaintenanceCount}</p>
                <p className="resident-kpi-subtext">
                  Requests currently being handled
                </p>
              </div>

              <div className="resident-kpi-card">
                <p className="resident-kpi-label">Unread alerts</p>
                <p className="resident-kpi-value">{unreadNotifications}</p>
                <p className="resident-kpi-subtext">
                  Notifications waiting for you
                </p>
              </div>
            </section>

            <section className="resident-content-grid">
              <div className="resident-panel resident-equal-card">
                <div className="resident-panel-head">
                  <div>
                    <h3 className="resident-panel-title">Current invoice</h3>
                    <p className="resident-panel-subtitle">
                      Your latest billing snapshot
                    </p>
                  </div>
                  <span
                    className={`resident-status-pill ${getStatusTone(
                      currentInvoice?.status,
                    )}`}
                  >
                    {currentInvoice?.status || "No invoice"}
                  </span>
                </div>

                {currentInvoice ? (
                  <div className="resident-invoice-card">
                    <div className="resident-invoice-row">
                      <span>Period</span>
                      <strong>{currentInvoice.period || "—"}</strong>
                    </div>
                    <div className="resident-invoice-row">
                      <span>Total amount</span>
                      <strong>{formatCurrency(currentDue)}</strong>
                    </div>
                    <div className="resident-invoice-row">
                      <span>Paid so far</span>
                      <strong>{formatCurrency(paidAmount)}</strong>
                    </div>
                    <div className="resident-invoice-row highlight">
                      <span>Outstanding</span>
                      <strong>{formatCurrency(outstandingAmount)}</strong>
                    </div>
                    <div className="resident-invoice-row">
                      <span>Due date</span>
                      <strong>
                        {currentInvoice.dueDate
                          ? formatDate(currentInvoice.dueDate)
                          : "—"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="resident-empty-state">
                    No current invoice at the moment.
                  </div>
                )}
              </div>

              <div className="resident-panel resident-equal-card">
                <div className="resident-panel-head">
                  <div>
                    <h3 className="resident-panel-title">Maintenance</h3>
                    <p className="resident-panel-subtitle">
                      Latest repair activity in your unit
                    </p>
                  </div>
                  <span
                    className={`resident-status-pill ${getStatusTone(
                      latestMaintenance?.status,
                    )}`}
                  >
                    {latestMaintenance?.status || "No active request"}
                  </span>
                </div>

                {latestMaintenance ? (
                  <div className="resident-maintenance-card">
                    <h4>{latestMaintenance.title}</h4>
                    <p>{latestMaintenance.description || "No description"}</p>

                    <div className="resident-maintenance-meta">
                      <div>
                        <span>Category</span>
                        <strong>{latestMaintenance.category || "—"}</strong>
                      </div>
                      <div>
                        <span>Priority</span>
                        <strong>{latestMaintenance.priority || "—"}</strong>
                      </div>
                      <div>
                        <span>Created</span>
                        <strong>{formatDate(latestMaintenance.createdAt)}</strong>
                      </div>
                      <div>
                        <span>Assigned</span>
                        <strong>
                          {latestMaintenance.assignedProvider || "Pending"}
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="resident-empty-state">
                    No maintenance requests yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="resident-dashboard-side">
            <section className="resident-panel resident-side-panel">
              <div className="resident-panel-head">
                <div>
                  <h3 className="resident-panel-title">Latest payment</h3>
                  <p className="resident-panel-subtitle">
                    Your most recent transaction
                  </p>
                </div>
              </div>

              {latestTransaction ? (
                <div className="resident-side-highlight">
                  <p className="resident-side-amount">
                    {formatCurrency(latestTransaction.amount)}
                  </p>
                  <p className="resident-side-title">{latestTransaction.title}</p>
                  <p className="resident-side-subtitle">
                    {latestTransaction.subtitle}
                  </p>
                  <p className="resident-side-time">
                    {formatDate(latestTransaction.createdAt)}
                  </p>
                </div>
              ) : (
                <div className="resident-empty-state">No recent payment yet.</div>
              )}
            </section>

            <section className="resident-panel resident-side-panel">
              <div className="resident-panel-head">
                <div>
                  <h3 className="resident-panel-title">Notifications</h3>
                  <p className="resident-panel-subtitle">
                    Latest message from your account
                  </p>
                </div>
              </div>

              {latestNotification ? (
                <div className="resident-notice-card">
                  <div className="resident-notice-top">
                    <p className="resident-notice-title">
                      {latestNotification.title}
                    </p>
                    <span
                      className={`resident-status-pill ${
                        latestNotification.isRead ? "gray" : "blue"
                      }`}
                    >
                      {latestNotification.isRead ? "Read" : "New"}
                    </span>
                  </div>
                  <p className="resident-notice-text">
                    {latestNotification.message}
                  </p>
                  <p className="resident-side-time">
                    {formatDate(latestNotification.createdAt)}
                  </p>
                </div>
              ) : (
                <div className="resident-empty-state">
                  No notifications yet.
                </div>
              )}
            </section>

            <section className="resident-panel resident-side-panel resident-quick-panel">
              <div className="resident-panel-head">
                <div>
                  <h3 className="resident-panel-title">Quick account view</h3>
                  <p className="resident-panel-subtitle">
                    Snapshot of your current standing
                  </p>
                </div>
              </div>

              <div className="resident-quick-list">
                <div className="resident-quick-row">
                  <span>Wallet balance</span>
                  <strong>{formatCurrency(walletBalance)}</strong>
                </div>
                <div className="resident-quick-row">
                  <span>Open maintenance</span>
                  <strong>{openMaintenanceCount}</strong>
                </div>
                <div className="resident-quick-row">
                  <span>Unread alerts</span>
                  <strong>{unreadNotifications}</strong>
                </div>
                <div className="resident-quick-row">
                  <span>Resident status</span>
                  <strong>{unitSnapshot.residentStatus || "Unknown"}</strong>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    );
  }

  const investorData = (data as InvestorDashboardResponse) || {};
  const summary = investorData.summary;
  const properties = investorData.propertySnapshots || [];
  const recentActivity = investorData.recentActivity || [];
  const notifications = investorData.notifications || [];

  const walletBalance = Number(summary?.walletBalance ?? 0);
  const totalInvested = Number(summary?.totalInvested ?? 0);
  const totalProfit = Number(summary?.totalProfit ?? 0);
  const propertyCount = Number(summary?.propertyCount ?? 0);

  const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const avgOccupancy =
    properties.length > 0
      ? properties.reduce(
          (sum, item) => sum + Number(item.occupancyRate || 0),
          0,
        ) / properties.length
      : 0;

  const totalShares = properties.reduce(
    (sum, item) => sum + Number(item.sharesOwned || 0),
    0,
  );

  const activeMaintenance = properties.reduce(
    (sum, item) => sum + Number(item.activeMaintenanceCount || 0),
    0,
  );

  const unreadAlerts = notifications.filter((item) => !item.isRead).length;

  const bestOccupancy =
    properties.length > 0
      ? Math.max(...properties.map((item) => Number(item.occupancyRate || 0)))
      : 0;

  const healthLabel =
    roi >= 15 ? "Strong" : roi >= 8 ? "Healthy" : roi > 0 ? "Stable" : "Early";

  const summaryCards = [
    { label: "Wallet", value: formatCurrency(walletBalance) },
    { label: "Invested", value: formatCurrency(totalInvested) },
    { label: "Profit", value: formatCurrency(totalProfit) },
    { label: "Properties", value: String(propertyCount).padStart(2, "0") },
  ];

  const performanceCards = [
    { label: "Total Shares", value: totalShares.toLocaleString() },
    { label: "Maintenance Flags", value: activeMaintenance.toLocaleString() },
    { label: "Occupancy Trend", value: formatPercent(avgOccupancy) },
    { label: "Capital Efficiency", value: healthLabel },
  ];

  const signalCards = [
    { label: "Active Listings", value: summary?.activeListings ?? 0 },
    { label: "Pending Withdrawals", value: summary?.pendingWithdrawals ?? 0 },
    { label: "Unread Alerts", value: unreadAlerts },
    { label: "Properties Held", value: propertyCount },
  ];

  const insightCards = [
    {
      label: "ROI",
      value: formatPercent(roi),
      tone: roi >= 15 ? "positive" : "neutral",
    },
    {
      label: "Avg Occupancy",
      value: formatPercent(avgOccupancy),
      tone: avgOccupancy >= 75 ? "positive" : "neutral",
    },
    {
      label: "Best Asset",
      value: formatPercent(bestOccupancy),
      tone: bestOccupancy >= 85 ? "positive" : "positive",
    },
  ];

  return (
    <div className="dashboard-page-shell">
      <section className="dashboard-hero-premium">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow">Welcome back</p>
          <h1 className="dashboard-hero-name">{displayName}</h1>
          <p className="dashboard-hero-text">
            Wallet, capital, returns, and portfolio performance at a glance.
          </p>
        </div>

        <div className="dashboard-hero-chip">
          {loading ? "Loading dashboard..." : "Investor overview"}
        </div>
      </section>

      <section className="dashboard-panel dashboard-panel-overview">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Portfolio Overview</h2>
            <p className="panel-subtitle">
              Executive summary of your investment position
            </p>
          </div>
          <button className="panel-chip">Live</button>
        </div>

        <div className="dashboard-overview-grid">
          <div className="dashboard-balance-card">
            <p className="dashboard-balance-label">Available Balance</p>
            <h3 className="dashboard-balance-value">
              {formatCurrency(walletBalance)}
            </h3>

            <div className="dashboard-balance-bottom">
              <div>
                <p className="dashboard-balance-meta-label">Total Invested</p>
                <p className="dashboard-balance-meta-value">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <div>
                <p className="dashboard-balance-meta-label">Total Profit</p>
                <p className="dashboard-balance-meta-value">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div>
                <p className="dashboard-balance-meta-label">ROI</p>
                <p className="dashboard-balance-meta-value">
                  {formatPercent(roi)}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-summary-side">
            {summaryCards.map((item) => (
              <div key={item.label} className="dashboard-summary-card">
                <p className="dashboard-summary-label">{item.label}</p>
                <p className="dashboard-summary-value">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-performance-strip">
          {performanceCards.map((item) => (
            <div key={item.label} className="dashboard-performance-item">
              <p className="dashboard-performance-label">{item.label}</p>
              <p className="dashboard-performance-value">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-actions-row">
          <button className="btn-primary-small">Top Up</button>
          <button className="btn-secondary-small">View Portfolio</button>
          <button className="btn-secondary-small">Go to Profit Center</button>
        </div>
      </section>

      <section className="dashboard-bottom-grid dashboard-bottom-grid-upgraded">
        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-activity">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Recent Activity</h2>
              <p className="panel-subtitle">Latest capital movement</p>
            </div>
            <div className="tiny-action-row">
              <button className="tiny-btn sky">Print</button>
              <button className="tiny-btn blue">Share</button>
            </div>
          </div>

          <div className="dashboard-activity-list dashboard-balanced-stack">
            {recentActivity.length === 0 ? (
              <div className="dashboard-activity-row dashboard-empty-row">
                <p className="dashboard-activity-title">No recent activity yet</p>
              </div>
            ) : (
              recentActivity.slice(0, 3).map((item) => (
                <div key={item.id} className="dashboard-activity-row">
                  <div className="dashboard-activity-copy">
                    <p className="dashboard-activity-title">{item.title}</p>
                    <p className="dashboard-activity-subtitle">{item.subtitle}</p>
                    <p className="dashboard-activity-time">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <p className="amount-positive">{formatCurrency(item.amount)}</p>
                </div>
              ))
            )}
          </div>

          <button className="show-all-button">Show all transactions</button>
        </div>

        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-signals">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Investor Signals</h2>
              <p className="panel-subtitle">Portfolio intelligence snapshot</p>
            </div>
            <button className="panel-chip">Live</button>
          </div>

          <div className="dashboard-signals-grid">
            {signalCards.map((item) => (
              <div key={item.label} className="dashboard-signal-card">
                <p className="dashboard-signal-label">{item.label}</p>
                <p className="dashboard-signal-value">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-insights-strip">
            {insightCards.map((item) => (
              <div key={item.label} className={`dashboard-insight-card ${item.tone}`}>
                <p className="dashboard-insight-label">{item.label}</p>
                <p className="dashboard-insight-value">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-alert-stack dashboard-balanced-stack">
            {notifications.length === 0 ? (
              <div className="dashboard-alert-row dashboard-empty-row">
                <p className="dashboard-alert-title">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 1).map((item) => (
                <div key={item.id} className="dashboard-alert-row">
                  <div>
                    <p className="dashboard-alert-title">{item.title}</p>
                    <p className="dashboard-alert-text">{item.message}</p>
                  </div>
                  <span
                    className={`status-badge ${
                      item.isRead ? "badge-gray" : "badge-blue"
                    }`}
                  >
                    {item.isRead ? "Read" : "New"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-properties">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Properties & Activity</h2>
              <p className="panel-subtitle">
                Your invested properties at a glance
              </p>
            </div>
            <button className="panel-chip">View all</button>
          </div>

          <div className="dashboard-property-table">
            <div className="dashboard-property-head">
              <span>Property</span>
              <span>Shares</span>
              <span>Invested</span>
              <span>Occupancy</span>
              <span>Maintenance</span>
            </div>

            <div className="dashboard-property-body dashboard-balanced-stack">
              {properties.length === 0 ? (
                <div className="dashboard-property-row dashboard-empty-row">
                  <span>No properties found yet</span>
                </div>
              ) : (
                properties.slice(0, 3).map((property) => (
                  <div key={property.propertyId} className="dashboard-property-row">
                    <div>
                      <p className="dashboard-property-title">{property.title}</p>
                      <p className="dashboard-property-subtitle">
                        {property.location || "No location"}
                      </p>
                    </div>

                    <span>{property.sharesOwned}</span>
                    <span>{formatCurrency(property.amountPaid)}</span>
                    <span>{formatPercent(property.occupancyRate)}</span>
                    <span>
                      <span
                        className={`status-badge ${
                          property.activeMaintenanceCount > 0
                            ? "badge-blue"
                            : "badge-green"
                        }`}
                      >
                        {property.activeMaintenanceCount > 0
                          ? `${property.activeMaintenanceCount} Active`
                          : "Stable"}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-actions-row dashboard-actions-row-bottom">
            <button className="btn-secondary-small">View Portfolio</button>
            <button className="btn-secondary-small">Go to Profit Center</button>
          </div>
        </div>
      </section>
    </div>
  );
}