"use client";

import { useEffect, useMemo, useState } from "react";
import "@/styles/subscriptions-billing.css";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type BillingInterval = "MONTHLY" | "YEARLY" | string;
type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELED"
  | string;

type UsageMetricType = "UNITS" | "USERS" | "INVOICES" | "PROPERTIES" | string;

type Plan = {
  id: string;
  name: string;
  billingInterval: BillingInterval;
  price: number;
  trialDays: number;
  isActive: boolean;
  createdAt?: string;
};

type UsageSnapshot = {
  id: string;
  metric: UsageMetricType;
  value: number;
  recordedAt: string;
};

type PlatformInvoice = {
  id: string;
  amountDue: number;
  currency?: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  issuedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

type Investor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

type SubscriptionItem = {
  id: string;
  investorId?: string | null;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  trialEndsAt?: string | null;
  currentPeriodEnd: string;
  canceledAt?: string | null;
  createdAt?: string;
  investor?: Investor | null;
  plan: Plan;
  usageSnapshots?: UsageSnapshot[];
  platformInvoices?: PlatformInvoice[];
};

type OverviewSummary = {
  totalSubscriptions: number;
  trialCount: number;
  activeCount: number;
  pastDueCount: number;
  suspendedCount: number;
  canceledCount: number;
  totalPlans: number;
  activePlans: number;
  monthlyPlans: number;
  yearlyPlans: number;
  totalRevenueBilled: number;
  paidRevenue: number;
};

type OverviewResponse = {
  summary: OverviewSummary;
  subscriptions: SubscriptionItem[];
};

type InvestorOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

function formatCurrency(value?: number | null) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatCompactCurrency(value?: number | null) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;

  return `UGX ${num.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusTone(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === "ACTIVE") return "approved";
  if (normalized === "TRIAL") return "pending";
  if (normalized === "PAST_DUE" || normalized === "SUSPENDED") return "warning";
  if (normalized === "CANCELED") return "rejected";

  return "neutral";
}

function getInvoiceTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PAID") return "approved";
  if (normalized === "OVERDUE") return "rejected";
  if (normalized === "ISSUED") return "pending";
  return "neutral";
}

function normalizeSubscription(item: SubscriptionItem): SubscriptionItem {
  return {
    ...item,
    usageSnapshots: Array.isArray(item.usageSnapshots) ? item.usageSnapshots : [],
    platformInvoices: Array.isArray(item.platformInvoices)
      ? item.platformInvoices
      : [],
  };
}

export default function SubscriptionsBillingPage() {
  const { user, hydrateAuth } = useAuthStore();

  const [authReady, setAuthReady] = useState(false);

  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [investors, setInvestors] = useState<InvestorOption[]>([]);
  const [selected, setSelected] = useState<SubscriptionItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [planForm, setPlanForm] = useState({
    name: "",
    billingInterval: "MONTHLY" as BillingInterval,
    price: "",
    trialDays: "",
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    investorId: "",
    planId: "",
    status: "TRIAL" as SubscriptionStatus,
    currentPeriodEnd: "",
  });

  const [usageForm, setUsageForm] = useState({
    metric: "USERS" as UsageMetricType,
    value: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        await hydrateAuth();
      } finally {
        setAuthReady(true);
      }
    };

    init();
  }, [hydrateAuth]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [overviewRes, plansRes, usersRes] = await Promise.all([
        api.get<OverviewResponse>("/subscriptions/admin/overview"),
        api.get<Plan[]>("/subscriptions/plans/all"),
        api.get<any>("/users"),
      ]);

      const overviewPayload = overviewRes.data;
      const plansPayload = Array.isArray(plansRes.data) ? plansRes.data : [];

      const usersPayload = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersRes.data?.items)
          ? usersRes.data.items
          : [];

      const investorRows = usersPayload.filter(
        (item: any) => item.role === "INVESTOR",
      );

      const safeSubscriptions = Array.isArray(overviewPayload?.subscriptions)
        ? overviewPayload.subscriptions.map(normalizeSubscription)
        : [];

      setOverview(overviewPayload?.summary ?? null);
      setSubscriptions(safeSubscriptions);
      setPlans(plansPayload);
      setInvestors(investorRows);

      setSelected((current) => {
        if (!safeSubscriptions.length) return null;
        if (!current) return safeSubscriptions[0];
        return (
          safeSubscriptions.find((item) => item.id === current.id) ||
          safeSubscriptions[0]
        );
      });

      setSubscriptionForm((prev) => ({
        ...prev,
        planId: prev.planId || plansPayload[0]?.id || "",
        investorId: prev.investorId || investorRows[0]?.id || "",
      }));
    } catch (error) {
      console.error("Failed to load subscriptions billing data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!user) return;
    if (user.role !== "ADMIN") return;

    loadData();
  }, [authReady, user]);

  const filteredSubscriptions = useMemo(() => {
    let rows = [...subscriptions];

    if (statusFilter !== "ALL") {
      rows = rows.filter((item) => item.status === statusFilter);
    }

    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((item) =>
      [
        item.investor?.name,
        item.investor?.email,
        item.plan?.name,
        item.status,
        item.plan?.billingInterval,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [subscriptions, statusFilter, search]);

  const selectedSubscription = useMemo(() => {
    const found =
      filteredSubscriptions.find((item) => item.id === selected?.id) ||
      subscriptions.find((item) => item.id === selected?.id) ||
      filteredSubscriptions[0] ||
      null;

    return found ? normalizeSubscription(found) : null;
  }, [filteredSubscriptions, subscriptions, selected]);

  const usageSnapshots = selectedSubscription?.usageSnapshots ?? [];
  const platformInvoices = selectedSubscription?.platformInvoices ?? [];

  const totalUsagePoints = useMemo(() => {
    if (!selectedSubscription) return 0;
    return usageSnapshots.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [selectedSubscription, usageSnapshots]);

  const latestInvoice = platformInvoices[0] || null;

  const createPlan = async () => {
    try {
      setBusyAction("create-plan");

      await api.post("/subscriptions/plans", {
        name: planForm.name,
        billingInterval: planForm.billingInterval,
        price: Number(planForm.price || 0),
        trialDays: Number(planForm.trialDays || 0),
        isActive: true,
      });

      setPlanForm({
        name: "",
        billingInterval: "MONTHLY",
        price: "",
        trialDays: "",
      });

      await loadData();
    } catch (error) {
      console.error("Failed to create plan", error);
    } finally {
      setBusyAction(null);
    }
  };

  const createSubscription = async () => {
    try {
      setBusyAction("create-subscription");

      await api.post("/subscriptions", {
        investorId: subscriptionForm.investorId,
        planId: subscriptionForm.planId,
        status: subscriptionForm.status,
        currentPeriodEnd: subscriptionForm.currentPeriodEnd,
      });

      setSubscriptionForm((prev) => ({
        ...prev,
        currentPeriodEnd: "",
      }));

      await loadData();
    } catch (error) {
      console.error("Failed to create subscription", error);
    } finally {
      setBusyAction(null);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setBusyAction(`cancel-${subscriptionId}`);
      await api.patch(`/subscriptions/${subscriptionId}/cancel`);
      await loadData();
    } catch (error) {
      console.error("Failed to cancel subscription", error);
    } finally {
      setBusyAction(null);
    }
  };

  const recordUsage = async (subscriptionId: string) => {
    try {
      setBusyAction(`usage-${subscriptionId}`);

      await api.post(`/subscriptions/${subscriptionId}/usage`, {
        metric: usageForm.metric,
        value: Number(usageForm.value || 0),
      });

      setUsageForm({
        metric: "USERS",
        value: "",
      });

      await loadData();
    } catch (error) {
      console.error("Failed to record usage", error);
    } finally {
      setBusyAction(null);
    }
  };

  if (!authReady) {
    return (
      <div className="subscriptions-page-shell">
        <div className="subscriptions-empty detail">
          Loading subscription billing workspace...
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="subscriptions-page-shell">
        <div className="subscriptions-empty detail">
          You do not have access to Subscription / Billing.
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions-page-shell">
      <section className="subscriptions-hero">
        <div className="subscriptions-hero-copy">
          <p className="subscriptions-label">ADMIN SUBSCRIPTION / BILLING</p>
          <h1>
            Manage billing plans, investor subscriptions, usage, and platform revenue
          </h1>
          <p className="subscriptions-sub">
            A premium billing control center for plan administration, subscription
            tracking, trial oversight, revenue visibility, and usage monitoring.
          </p>

          <div className="subscriptions-tags">
            <span>Plan control</span>
            <span>Billing visibility</span>
            <span>Usage tracking</span>
            <span>Revenue oversight</span>
          </div>
        </div>

        <div className="subscriptions-hero-metrics">
          <div className="subscriptions-metric-card main">
            <span>Total Subscriptions</span>
            <h2>{overview?.totalSubscriptions ?? 0}</h2>
          </div>
          <div className="subscriptions-metric-card">
            <span>Active</span>
            <h3>{overview?.activeCount ?? 0}</h3>
          </div>
          <div className="subscriptions-metric-card">
            <span>Trial</span>
            <h3>{overview?.trialCount ?? 0}</h3>
          </div>
          <div className="subscriptions-metric-card">
            <span>Past Due</span>
            <h3>{overview?.pastDueCount ?? 0}</h3>
          </div>
        </div>
      </section>

      <section className="subscriptions-summary-strip">
        <div className="subscriptions-summary-card">
          <span>Total Plans</span>
          <strong>{overview?.totalPlans ?? 0}</strong>
        </div>
        <div className="subscriptions-summary-card">
          <span>Active Plans</span>
          <strong>{overview?.activePlans ?? 0}</strong>
        </div>
        <div className="subscriptions-summary-card">
          <span>Billed Revenue</span>
          <strong>{formatCompactCurrency(overview?.totalRevenueBilled ?? 0)}</strong>
        </div>
        <div className="subscriptions-summary-card">
          <span>Paid Revenue</span>
          <strong>{formatCompactCurrency(overview?.paidRevenue ?? 0)}</strong>
        </div>
      </section>

      <section className="subscriptions-admin-grid">
        <div className="subscriptions-admin-left">
          <div className="subscriptions-panel">
            <div className="subscriptions-panel-head">
              <div>
                <h2>Create Plan</h2>
                <p>Set up pricing and billing structure</p>
              </div>
              <span className="subscriptions-count-chip">Plans</span>
            </div>

            <div className="subscriptions-form-grid">
              <div className="subscriptions-field">
                <label>Plan Name</label>
                <input
                  className="subscriptions-input"
                  value={planForm.name}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Growth"
                />
              </div>

              <div className="subscriptions-field">
                <label>Billing Interval</label>
                <select
                  className="subscriptions-input"
                  value={planForm.billingInterval}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      billingInterval: e.target.value,
                    }))
                  }
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div className="subscriptions-field">
                <label>Price</label>
                <input
                  className="subscriptions-input"
                  type="number"
                  value={planForm.price}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="subscriptions-field">
                <label>Trial Days</label>
                <input
                  className="subscriptions-input"
                  type="number"
                  value={planForm.trialDays}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      trialDays: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <button
              className="subscriptions-btn primary"
              onClick={createPlan}
              disabled={busyAction === "create-plan"}
            >
              {busyAction === "create-plan" ? "Creating..." : "Create Plan"}
            </button>
          </div>

          <div className="subscriptions-panel">
            <div className="subscriptions-panel-head">
              <div>
                <h2>Create Subscription</h2>
                <p>Attach a plan to an investor</p>
              </div>
              <span className="subscriptions-count-chip">Registry</span>
            </div>

            <div className="subscriptions-form-grid">
              <div className="subscriptions-field">
                <label>Investor</label>
                <select
                  className="subscriptions-input"
                  value={subscriptionForm.investorId}
                  onChange={(e) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      investorId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select investor</option>
                  {investors.map((investor) => (
                    <option key={investor.id} value={investor.id}>
                      {investor.name || investor.email || investor.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="subscriptions-field">
                <label>Plan</label>
                <select
                  className="subscriptions-input"
                  value={subscriptionForm.planId}
                  onChange={(e) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      planId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} • {formatStatus(plan.billingInterval)} •{" "}
                      {formatCurrency(plan.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="subscriptions-field">
                <label>Status</label>
                <select
                  className="subscriptions-input"
                  value={subscriptionForm.status}
                  onChange={(e) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="subscriptions-field">
                <label>Current Period End</label>
                <input
                  className="subscriptions-input"
                  type="date"
                  value={subscriptionForm.currentPeriodEnd}
                  onChange={(e) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      currentPeriodEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              className="subscriptions-btn primary"
              onClick={createSubscription}
              disabled={busyAction === "create-subscription"}
            >
              {busyAction === "create-subscription"
                ? "Creating..."
                : "Create Subscription"}
            </button>
          </div>
        </div>

        <div className="subscriptions-admin-right">
          <div className="subscriptions-panel">
            <div className="subscriptions-panel-head">
              <div>
                <h2>Subscription Registry</h2>
                <p>Monitor all investor billing relationships</p>
              </div>
              <span className="subscriptions-count-chip">
                {loading ? "Loading..." : `${subscriptions.length} total`}
              </span>
            </div>

            <div className="subscriptions-toolbar">
              <div className="subscriptions-toolbar-row">
                <select
                  className="subscriptions-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All status</option>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>

              <input
                className="subscriptions-search"
                placeholder="Search investor, plan, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="subscriptions-list">
              {loading ? (
                <div className="subscriptions-empty">Loading subscriptions...</div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="subscriptions-empty">
                  No subscriptions found.
                </div>
              ) : (
                filteredSubscriptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`subscriptions-record-card ${
                      selectedSubscription?.id === item.id ? "active" : ""
                    }`}
                    onClick={() => setSelected(item)}
                  >
                    <div className="subscriptions-record-top">
                      <div>
                        <h4>{item.investor?.name || item.investor?.email || "Investor"}</h4>
                        <p>{item.plan?.name || "No plan"}</p>
                      </div>
                      <span
                        className={`subscriptions-badge ${getStatusTone(
                          item.status,
                        )}`}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </div>

                    <div className="subscriptions-record-meta">
                      <span>{formatStatus(item.plan?.billingInterval || "MONTHLY")}</span>
                      <span>{formatCurrency(item.plan?.price || 0)}</span>
                    </div>

                    <div className="subscriptions-record-bottom">
                      <span>Renews {formatDate(item.currentPeriodEnd)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="subscriptions-panel detail">
            {!selectedSubscription ? (
              <div className="subscriptions-empty detail">
                Select a subscription to inspect billing details.
              </div>
            ) : (
              <>
                <div className="subscriptions-detail-hero">
                  <div>
                    <div className="subscriptions-detail-badges">
                      <span className="subscriptions-type-pill">
                        {selectedSubscription.plan?.name || "Plan"}
                      </span>
                      <span
                        className={`subscriptions-badge ${getStatusTone(
                          selectedSubscription.status,
                        )}`}
                      >
                        {formatStatus(selectedSubscription.status)}
                      </span>
                    </div>

                    <h2>
                      {selectedSubscription.investor?.name ||
                        selectedSubscription.investor?.email ||
                        "Investor"}
                    </h2>
                    <p>{selectedSubscription.investor?.email || "No contact"}</p>
                  </div>

                  <div className="subscriptions-status-box">
                    <span>Current Price</span>
                    <strong>{formatCompactCurrency(selectedSubscription.plan?.price || 0)}</strong>
                  </div>
                </div>

                <div className="subscriptions-detail-grid">
                  <div className="subscriptions-detail-card">
                    <span>Billing Interval</span>
                    <p>{formatStatus(selectedSubscription.plan?.billingInterval)}</p>
                  </div>

                  <div className="subscriptions-detail-card">
                    <span>Started</span>
                    <p>{formatDate(selectedSubscription.startedAt)}</p>
                  </div>

                  <div className="subscriptions-detail-card">
                    <span>Trial Ends</span>
                    <p>{formatDate(selectedSubscription.trialEndsAt)}</p>
                  </div>

                  <div className="subscriptions-detail-card">
                    <span>Current Period End</span>
                    <p>{formatDate(selectedSubscription.currentPeriodEnd)}</p>
                  </div>

                  <div className="subscriptions-detail-card">
                    <span>Total Usage Points</span>
                    <p>{totalUsagePoints.toLocaleString()}</p>
                  </div>

                  <div className="subscriptions-detail-card">
                    <span>Recent Invoice Status</span>
                    <p>{latestInvoice ? formatStatus(latestInvoice.status) : "No invoice"}</p>
                  </div>
                </div>

                <div className="subscriptions-mini-section">
                  <div className="subscriptions-mini-head">
                    <h3>Record Usage</h3>
                    <p>Track plan consumption for this subscription</p>
                  </div>

                  <div className="subscriptions-form-grid inline">
                    <div className="subscriptions-field">
                      <label>Metric</label>
                      <select
                        className="subscriptions-input"
                        value={usageForm.metric}
                        onChange={(e) =>
                          setUsageForm((prev) => ({
                            ...prev,
                            metric: e.target.value,
                          }))
                        }
                      >
                        <option value="USERS">Users</option>
                        <option value="UNITS">Units</option>
                        <option value="INVOICES">Invoices</option>
                        <option value="PROPERTIES">Properties</option>
                      </select>
                    </div>

                    <div className="subscriptions-field">
                      <label>Value</label>
                      <input
                        className="subscriptions-input"
                        type="number"
                        value={usageForm.value}
                        onChange={(e) =>
                          setUsageForm((prev) => ({
                            ...prev,
                            value: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="subscriptions-actions">
                    <button
                      className="subscriptions-btn primary"
                      onClick={() => recordUsage(selectedSubscription.id)}
                      disabled={busyAction === `usage-${selectedSubscription.id}`}
                    >
                      {busyAction === `usage-${selectedSubscription.id}`
                        ? "Saving..."
                        : "Record Usage"}
                    </button>

                    <button
                      className="subscriptions-btn danger"
                      onClick={() => cancelSubscription(selectedSubscription.id)}
                      disabled={busyAction === `cancel-${selectedSubscription.id}`}
                    >
                      {busyAction === `cancel-${selectedSubscription.id}`
                        ? "Cancelling..."
                        : "Cancel Subscription"}
                    </button>
                  </div>
                </div>

                <div className="subscriptions-two-column">
                  <div className="subscriptions-subpanel">
                    <div className="subscriptions-mini-head">
                      <h3>Usage Snapshots</h3>
                      <p>Latest tracked subscription usage</p>
                    </div>

                    {usageSnapshots.length === 0 ? (
                      <div className="subscriptions-empty compact">
                        No usage snapshots yet.
                      </div>
                    ) : (
                      <div className="subscriptions-activity-list">
                        {usageSnapshots.map((item) => (
                          <div key={item.id} className="subscriptions-activity-card">
                            <div>
                              <strong>{formatStatus(item.metric)}</strong>
                              <p>{formatDate(item.recordedAt)}</p>
                            </div>
                            <span>{Number(item.value || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="subscriptions-subpanel">
                    <div className="subscriptions-mini-head">
                      <h3>Platform Invoices</h3>
                      <p>Recent billing records</p>
                    </div>

                    {platformInvoices.length === 0 ? (
                      <div className="subscriptions-empty compact">
                        No platform invoices yet.
                      </div>
                    ) : (
                      <div className="subscriptions-activity-list">
                        {platformInvoices.map((item) => (
                          <div key={item.id} className="subscriptions-activity-card">
                            <div>
                              <strong>{formatCompactCurrency(item.amountDue)}</strong>
                              <p>Due {formatDate(item.dueDate)}</p>
                            </div>
                            <span
                              className={`subscriptions-inline-badge ${getInvoiceTone(
                                item.status,
                              )}`}
                            >
                              {formatStatus(item.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}