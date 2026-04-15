"use client";

import "@/styles/transactions.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";

type Audience = "investor" | "manager" | "resident" | "admin";

type TransactionItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: number;
  direction: "positive" | "negative";
  status: string;
  type:
    | "deposit"
    | "withdrawal"
    | "profit"
    | "investment"
    | "refund"
    | "expense"
    | "payment"
    | "rent"
    | "maintenance"
    | "other";
  family?:
    | "wallet"
    | "investment"
    | "maintenance"
    | "operational"
    | "rent"
    | "other";
  propertyId?: string | null;
  propertyTitle?: string | null;
  category?: string | null;
  reference?: string | null;
};

type PropertyBreakdownItem = {
  propertyId: string | null;
  propertyTitle: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  payments: number;
  operationalExpenses: number;
  maintenanceExpenses: number;
};

type TransactionResponse = {
  items: TransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  audience?: Audience;
  propertyBreakdown?: PropertyBreakdownItem[];
};

type InvestorSummary = {
  inflow: number;
  outflow: number;
  netCashFlow: number;
  pendingCount: number;
  completedCount: number;
  expenseTotal?: number;
  typeBreakdown?: {
    deposits?: number;
    withdrawals?: number;
    profits?: number;
    investments?: number;
    expenses?: number;
    maintenanceExpenses?: number;
    operationalExpenses?: number;
  };
  audience?: "investor";
};

type ManagerSummary = {
  inflow: number;
  outflow: number;
  netCashFlow: number;
  pendingCount: number;
  completedCount: number;
  expenseTotal?: number;
  paymentTotal?: number;
  maintenanceExpenseTotal?: number;
  operationalExpenseTotal?: number;
  typeCounts?: {
    payments?: number;
    expenses?: number;
    maintenanceExpenses?: number;
    operationalExpenses?: number;
  };
  propertyBreakdown?: PropertyBreakdownItem[];
  audience?: "manager";
};

type ResidentSummary = {
  inflow: number;
  outflow: number;
  netCashFlow: number;
  pendingCount: number;
  completedCount: number;
  typeBreakdown?: {
    deposits?: number;
    rentPayments?: number;
    maintenanceCharges?: number;
    refunds?: number;
  };
  audience?: "resident";
};

type AdminSummary = {
  inflow: number;
  outflow: number;
  netCashFlow: number;
  pendingCount: number;
  completedCount: number;
  expenseTotal?: number;
  paymentTotal?: number;
  maintenanceExpenseTotal?: number;
  operationalExpenseTotal?: number;
  typeCounts?: {
    payments?: number;
    expenses?: number;
    maintenanceExpenses?: number;
    operationalExpenses?: number;
  };
  propertyBreakdown?: PropertyBreakdownItem[];
  audience?: "admin";
};

type TransactionSummary =
  | InvestorSummary
  | ManagerSummary
  | ResidentSummary
  | AdminSummary;

type FilterType =
  | "all"
  | "deposit"
  | "withdrawal"
  | "profit"
  | "investment"
  | "refund"
  | "expense"
  | "payment"
  | "rent"
  | "maintenance"
  | "other";

type FilterStatus =
  | "all"
  | "COMPLETED"
  | "PENDING"
  | "FAILED"
  | "PAID"
  | "SUCCESS";

type ResidentInsightSlice = {
  label: string;
  value: number;
  className: string;
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatCompactCurrency(value: number) {
  const num = Number(value || 0);
  if (num >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;
  return `UGX ${num.toLocaleString()}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type: TransactionItem["type"], audience: Audience) {
  if (audience === "resident") {
    switch (type) {
      case "deposit":
        return "Top Up";
      case "rent":
        return "Rent Payment";
      case "maintenance":
        return "Maintenance";
      case "refund":
        return "Refund";
      default:
        return "Activity";
    }
  }

  if (audience === "admin") {
    switch (type) {
      case "payment":
        return "Platform Payment";
      case "expense":
        return "Platform Expense";
      case "maintenance":
        return "Maintenance";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    case "profit":
      return "Profit";
    case "investment":
      return "Investment";
    case "refund":
      return "Refund";
    case "expense":
      return "Expense";
    case "payment":
      return "Payment";
    case "rent":
      return "Rent";
    case "maintenance":
      return "Maintenance";
    default:
      return "Other";
  }
}

function getTypeTone(type: TransactionItem["type"]) {
  switch (type) {
    case "deposit":
      return "deposit";
    case "withdrawal":
      return "withdrawal";
    case "profit":
      return "profit";
    case "investment":
      return "investment";
    case "refund":
      return "refund";
    case "expense":
      return "expense";
    case "payment":
    case "rent":
      return "payment";
    case "maintenance":
      return "maintenance";
    default:
      return "other";
  }
}

function getStatusTone(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "COMPLETED" ||
    normalized === "APPROVED" ||
    normalized === "PAID" ||
    normalized === "SUCCESS"
  ) {
    return "completed";
  }

  if (normalized === "PENDING") return "pending";
  if (normalized === "FAILED" || normalized === "REJECTED") return "failed";
  return "neutral";
}

function groupByDay(items: TransactionItem[]) {
  const groups = new Map<string, TransactionItem[]>();

  for (const item of items) {
    const key = new Date(item.time).toDateString();
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, groupItems]) => ({
    key,
    label: formatDate(groupItems[0].time),
    items: groupItems,
  }));
}

function buildResidentDonut(slices: ResidentInsightSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return "conic-gradient(#dbe7f5 0deg 360deg)";
  }

  let current = 0;
  const colors: Record<string, string> = {
    rent: "#2456db",
    maintenance: "#7c3aed",
    topups: "#16a34a",
    refunds: "#f59e0b",
  };

  const parts = slices.map((slice) => {
    const start = current;
    const angle = (slice.value / total) * 360;
    current += angle;
    const end = current;
    return `${colors[slice.className]} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

export default function TransactionsPage() {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<Audience>("investor");
  const [refreshKey, setRefreshKey] = useState(0);
  const [propertyBreakdown, setPropertyBreakdown] = useState<PropertyBreakdownItem[]>([]);

  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<TransactionResponse["pagination"]>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const pageTopRef = useRef<HTMLDivElement | null>(null);

  const isResident = audience === "resident";
  const isManager = audience === "manager";
  const isAdmin = audience === "admin";

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const [summaryRes, txRes] = await Promise.all([
          api.get<TransactionSummary>("/transactions/summary"),
          api.get<TransactionResponse>("/transactions/me", {
            params: {
              page,
              limit: 10,
              ...(typeFilter !== "all" ? { type: typeFilter } : {}),
              ...(statusFilter !== "all" ? { status: statusFilter } : {}),
              ...(search.trim() ? { search: search.trim() } : {}),
            },
          }),
        ]);

        if (!mounted) return;

        const resolvedAudience = (txRes.data.audience ||
          summaryRes.data.audience ||
          "investor") as Audience;

        setSummary(summaryRes.data);
        setTransactions(txRes.data.items ?? []);
        setPagination(txRes.data.pagination);
        setAudience(resolvedAudience);

        if (resolvedAudience === "manager" || resolvedAudience === "admin") {
          const txBreakdown = txRes.data.propertyBreakdown ?? [];
          const summaryBreakdown =
            "propertyBreakdown" in summaryRes.data
              ? (summaryRes.data.propertyBreakdown ?? [])
              : [];
          setPropertyBreakdown(txBreakdown.length > 0 ? txBreakdown : summaryBreakdown);
        } else {
          setPropertyBreakdown([]);
        }
      } catch (error) {
        console.error("Failed to load transactions page", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [page, typeFilter, statusFilter, search, refreshKey]);

  const residentGroups = useMemo(() => groupByDay(transactions), [transactions]);

  const stats = useMemo(() => {
    const positiveCount = transactions.filter((item) => item.direction === "positive").length;
    const negativeCount = transactions.filter((item) => item.direction === "negative").length;
    const topUps = transactions.filter((item) => item.type === "deposit").length;
    const chargeRows = transactions.filter(
      (item) => item.type === "rent" || item.type === "maintenance",
    ).length;

    return {
      positiveCount,
      negativeCount,
      topUps,
      chargeRows,
    };
  }, [transactions]);

  const residentInsight = useMemo(() => {
    const residentSummary =
      summary?.audience === "resident" ? (summary as ResidentSummary) : null;

    const slices: ResidentInsightSlice[] = [
      {
        label: "Rent",
        value: residentSummary?.typeBreakdown?.rentPayments ?? 0,
        className: "rent",
      },
      {
        label: "Maintenance",
        value: residentSummary?.typeBreakdown?.maintenanceCharges ?? 0,
        className: "maintenance",
      },
      {
        label: "Top Ups",
        value: residentSummary?.typeBreakdown?.deposits ?? 0,
        className: "topups",
      },
      {
        label: "Refunds",
        value: residentSummary?.typeBreakdown?.refunds ?? 0,
        className: "refunds",
      },
    ];

    const totalOutflow =
      (residentSummary?.typeBreakdown?.rentPayments ?? 0) +
      (residentSummary?.typeBreakdown?.maintenanceCharges ?? 0);

    const largestOutflow = transactions
      .filter((item) => item.direction === "negative")
      .reduce<number>((max, item) => Math.max(max, item.amount), 0);

    const latestTopUp = transactions.find((item) => item.type === "deposit");
    const rentShare = totalOutflow
      ? Math.round(((residentSummary?.typeBreakdown?.rentPayments ?? 0) / totalOutflow) * 100)
      : 0;

    return {
      slices,
      donut: buildResidentDonut(slices),
      totalOutflow,
      largestOutflow,
      latestTopUp: latestTopUp?.amount ?? 0,
      rentShare,
    };
  }, [summary, transactions]);

  const residentTrend = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        inflow: number;
        outflow: number;
      }
    >();

    const recentItems = [...transactions]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-6);

    for (const item of recentItems) {
      const date = new Date(item.time);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString("en-UG", { month: "short" });

      const existing = map.get(key) ?? { label, inflow: 0, outflow: 0 };

      if (item.direction === "positive") {
        existing.inflow += item.amount;
      } else {
        existing.outflow += item.amount;
      }

      map.set(key, existing);
    }

    const values = Array.from(map.values());
    const maxValue = Math.max(
      1,
      ...values.flatMap((item) => [item.inflow, item.outflow]),
    );

    return values.map((item) => ({
      ...item,
      inflowHeight: `${Math.max(10, (item.inflow / maxValue) * 100)}%`,
      outflowHeight: `${Math.max(10, (item.outflow / maxValue) * 100)}%`,
    }));
  }, [transactions]);

  const topProperty = useMemo(() => {
    if (propertyBreakdown.length === 0) return null;
    return [...propertyBreakdown].sort((a, b) => b.netCashFlow - a.netCashFlow)[0];
  }, [propertyBreakdown]);

  const weakestProperty = useMemo(() => {
    if (propertyBreakdown.length === 0) return null;
    return [...propertyBreakdown].sort((a, b) => a.netCashFlow - b.netCashFlow)[0];
  }, [propertyBreakdown]);

  const quickFilters = isResident
    ? [
        { key: "all" as FilterType, label: "All" },
        { key: "deposit" as FilterType, label: "Top Ups" },
        { key: "rent" as FilterType, label: "Rent" },
        { key: "maintenance" as FilterType, label: "Maintenance" },
        { key: "refund" as FilterType, label: "Refunds" },
      ]
    : isManager || isAdmin
      ? [
          { key: "all" as FilterType, label: "All" },
          { key: "payment" as FilterType, label: "Payments" },
          { key: "expense" as FilterType, label: "Expenses" },
          { key: "maintenance" as FilterType, label: "Maintenance" },
        ]
      : [
          { key: "all" as FilterType, label: "All" },
          { key: "investment" as FilterType, label: "Investments" },
          { key: "profit" as FilterType, label: "Profits" },
          { key: "withdrawal" as FilterType, label: "Withdrawals" },
          { key: "expense" as FilterType, label: "Expenses" },
        ];

  const handlePrev = () => {
    if (!pagination.hasPrevPage) return;
    setPage((prev) => Math.max(1, prev - 1));
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNext = () => {
    if (!pagination.hasNextPage) return;
    setPage((prev) => prev + 1);
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  return (
    <div
      className={`transactions-shell ${isResident ? "transactions-shell-resident" : ""}`}
      ref={pageTopRef}
    >
      <section className={`transactions-hero ${isResident ? "transactions-hero-resident" : ""}`}>
        <div className="transactions-hero-copy">
          <p className="transactions-eyebrow">
            {isResident
              ? "Resident Transactions"
              : isManager
                ? "Manager Transactions"
                : isAdmin
                  ? "Admin Transactions"
                  : "Investor Transactions"}
          </p>

          <h1 className="transactions-title">
            {isResident
              ? "Your money timeline"
              : isManager
                ? "Track operational inflows, expenses, and payouts"
                : isAdmin
                  ? "Monitor platform-wide financial movement"
                  : "Track every movement across your investment wallet"}
          </h1>

          <p className="transactions-text">
            {isResident
              ? "See wallet top-ups, rent payments, refunds, and service-related charges in a clean chronological journal."
              : isManager
                ? "Review rent collections, operating expenses, maintenance spend, and property-related cash movement."
                : isAdmin
                  ? "Review platform-wide payments, operating spend, maintenance outflows, and property-level cash movement in one command center."
                  : "Review inflows, outflows, profits, withdrawals, investment activity, and allocated expenses in one premium transaction center."}
          </p>

          <div className="transactions-hero-tags">
            {(isResident
              ? ["Money timeline", "Wallet activity", "Rent history", "Simple records"]
              : isManager
                ? ["Property cash flow", "Expense visibility", "Status tracking", "Operations view"]
                : isAdmin
                  ? ["Platform oversight", "Property cash flow", "Expense visibility", "Admin finance view"]
                  : ["Unified timeline", "Expense visibility", "Status tracking", "Investor-grade reporting"]
            ).map((tag) => (
              <span key={tag} className="transactions-hero-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="transactions-hero-side">
          <div
            className={`transactions-summary-card dark ${
              isResident ? "transactions-summary-card-resident" : ""
            }`}
          >
            <p className="transactions-summary-label">
              {isResident
                ? "Resident Net Flow"
                : isAdmin
                  ? "Platform Net Flow"
                  : "Net Cash Flow"}
            </p>
            <h3 className="transactions-summary-value">
              {summary ? formatCompactCurrency(summary.netCashFlow) : "—"}
            </h3>
          </div>
        </div>
      </section>

      <section
        className={`transactions-overview-bar ${
          isResident ? "transactions-overview-bar-resident" : ""
        }`}
      >
        {isResident ? (
          <>
            <div className="transactions-overview-item">
              <span>Wallet Inflow</span>
              <strong className="positive">
                {summary ? formatCompactCurrency(summary.inflow) : "—"}
              </strong>
            </div>
            <div className="transactions-overview-item">
              <span>Resident Outflow</span>
              <strong>{summary ? formatCompactCurrency(summary.outflow) : "—"}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Pending</span>
              <strong>{summary ? String(summary.pendingCount) : "—"}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Rent Payments</span>
              <strong>
                {"typeBreakdown" in (summary || {})
                  ? formatCompactCurrency(
                      (summary as ResidentSummary).typeBreakdown?.rentPayments ?? 0,
                    )
                  : "UGX 0"}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="transactions-overview-item">
              <span>Total Inflow</span>
              <strong className="positive">
                {summary ? formatCompactCurrency(summary.inflow) : "—"}
              </strong>
            </div>
            <div className="transactions-overview-item">
              <span>Total Outflow</span>
              <strong>{summary ? formatCompactCurrency(summary.outflow) : "—"}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Pending</span>
              <strong>{summary ? String(summary.pendingCount) : "—"}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>{isManager || isAdmin ? "Expense Total" : "Expenses"}</span>
              <strong>
                {"expenseTotal" in (summary || {})
                  ? formatCompactCurrency(
                      (summary as InvestorSummary | ManagerSummary | AdminSummary)
                        .expenseTotal ?? 0,
                    )
                  : "UGX 0"}
              </strong>
            </div>
          </>
        )}
      </section>

      <section
        className={`transactions-overview-bar secondary ${
          isResident ? "transactions-overview-bar-resident" : ""
        }`}
      >
        {isResident ? (
          <>
            <div className="transactions-overview-item">
              <span>Positive Entries</span>
              <strong>{stats.positiveCount}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Negative Entries</span>
              <strong>{stats.negativeCount}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Wallet Top-ups</span>
              <strong>{stats.topUps}</strong>
            </div>
            <div className="transactions-overview-item">
              <span>Charge Rows</span>
              <strong>{stats.chargeRows}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="transactions-overview-item">
              <span>Positive Entries</span>
              <strong>
                {transactions.filter((item) => item.direction === "positive").length}
              </strong>
            </div>
            <div className="transactions-overview-item">
              <span>Negative Entries</span>
              <strong>
                {transactions.filter((item) => item.direction === "negative").length}
              </strong>
            </div>
            <div className="transactions-overview-item">
              <span>{isManager || isAdmin ? "Payment Rows" : "Profit Rows"}</span>
              <strong>
                {isManager || isAdmin
                  ? transactions.filter((item) => item.type === "payment").length
                  : transactions.filter((item) => item.type === "profit").length}
              </strong>
            </div>
            <div className="transactions-overview-item">
              <span>Expense Rows</span>
              <strong>
                {
                  transactions.filter(
                    (item) => item.type === "expense" || item.type === "maintenance",
                  ).length
                }
              </strong>
            </div>
          </>
        )}
      </section>

      {isResident ? (
        <section className="transactions-insights">
          <div className="transactions-insights-main">
            <div className="transactions-insights-card transactions-insights-card-donut">
              <div>
                <p className="transactions-insights-eyebrow">Spend mix</p>
                <h3 className="transactions-insights-title">Where your money is going</h3>
                <p className="transactions-insights-text">
                  Recent movement split across rent, maintenance, top-ups, and refunds.
                </p>
              </div>

              <div className="transactions-donut-wrap">
                <div
                  className="transactions-donut"
                  style={{ background: residentInsight.donut }}
                >
                  <div className="transactions-donut-center">
                    <span>Outflow</span>
                    <strong>{formatCompactCurrency(residentInsight.totalOutflow)}</strong>
                  </div>
                </div>

                <div className="transactions-donut-legend">
                  {residentInsight.slices.map((slice) => (
                    <div key={slice.label} className="transactions-donut-legend-row">
                      <span className={`transactions-donut-dot ${slice.className}`} />
                      <span>{slice.label}</span>
                      <strong>{formatCompactCurrency(slice.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="transactions-insights-card transactions-insights-card-trend">
              <div>
                <p className="transactions-insights-eyebrow">Recent movement</p>
                <h3 className="transactions-insights-title">Inflow vs outflow</h3>
                <p className="transactions-insights-text">
                  A quick view of the most recent money movement pattern.
                </p>
              </div>

              <div className="transactions-mini-bars">
                {residentTrend.length === 0 ? (
                  <div className="transactions-mini-bars-empty">No trend data yet.</div>
                ) : (
                  residentTrend.map((item) => (
                    <div
                      key={`${item.label}-${item.inflow}-${item.outflow}`}
                      className="transactions-mini-bar-group"
                    >
                      <div className="transactions-mini-bar-stack">
                        <div
                          className="transactions-mini-bar inflow"
                          style={{ height: item.inflowHeight }}
                          title={`Inflow ${formatCurrency(item.inflow)}`}
                        />
                        <div
                          className="transactions-mini-bar outflow"
                          style={{ height: item.outflowHeight }}
                          title={`Outflow ${formatCurrency(item.outflow)}`}
                        />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="transactions-insights-side">
            <div className="transactions-insight-mini">
              <span>Largest recent payment</span>
              <strong>{formatCompactCurrency(residentInsight.largestOutflow)}</strong>
            </div>
            <div className="transactions-insight-mini">
              <span>Latest top-up</span>
              <strong>{formatCompactCurrency(residentInsight.latestTopUp)}</strong>
            </div>
            <div className="transactions-insight-mini">
              <span>Rent share of spend</span>
              <strong>{residentInsight.rentShare}%</strong>
            </div>
          </div>
        </section>
      ) : null}

      {(isManager || isAdmin) && propertyBreakdown.length > 0 ? (
        <section className="transactions-overview-bar secondary">
          <div className="transactions-overview-item">
            <span>Best Performing Property</span>
            <strong>{topProperty?.propertyTitle || "—"}</strong>
          </div>
          <div className="transactions-overview-item">
            <span>Top Net Flow</span>
            <strong className="positive">
              {topProperty ? formatCompactCurrency(topProperty.netCashFlow) : "—"}
            </strong>
          </div>
          <div className="transactions-overview-item">
            <span>Weakest Property</span>
            <strong>{weakestProperty?.propertyTitle || "—"}</strong>
          </div>
          <div className="transactions-overview-item">
            <span>Lowest Net Flow</span>
            <strong>
              {weakestProperty ? formatCompactCurrency(weakestProperty.netCashFlow) : "—"}
            </strong>
          </div>
        </section>
      ) : null}

      <section
        className={`transactions-section ${
          isResident ? "transactions-section-resident" : ""
        }`}
      >
        <div className="transactions-section-head">
          <div>
            <h2 className="transactions-section-title">
              {isResident
                ? "Transaction Journal"
                : isAdmin
                  ? "Platform Transaction Center"
                  : "Transaction Center"}
            </h2>
            <p className="transactions-section-subtitle">
              {isResident
                ? "A day-by-day money journal showing how funds moved through your account."
                : isManager
                  ? "Filter, search, and review operational money movement across managed properties."
                  : isAdmin
                    ? "Filter, search, and review platform-wide payments, expenses, and maintenance flows."
                    : "Filter, search, and review the full investor money timeline."}
            </p>
          </div>

          <div className="transactions-head-actions">
            <button
              type="button"
              className="transactions-ghost-button"
              onClick={handleRefresh}
            >
              Refresh
            </button>
            <button
              type="button"
              className="transactions-ghost-button"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="transactions-toolbar">
          <div className="transactions-toolbar-left">
            {quickFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`transactions-filter-pill ${
                  typeFilter === filter.key ? "active" : ""
                }`}
                onClick={() => {
                  setTypeFilter(filter.key);
                  setPage(1);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="transactions-toolbar-right">
            <select
              className="transactions-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FilterStatus);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="PAID">Paid</option>
              <option value="SUCCESS">Success</option>
            </select>

            <input
              className="transactions-search-input"
              placeholder="Search by title, property, or reference"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="transactions-empty">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="transactions-empty">
            No transactions match your current filters.
            <br />
            <span>Try changing the type, status, or search term.</span>
          </div>
        ) : isResident ? (
          <div className="transactions-journal">
            {residentGroups.map((group) => (
              <div key={group.key} className="transactions-journal-group">
                <div className="transactions-journal-date">{group.label}</div>

                <div className="transactions-journal-list">
                  {group.items.map((item) => (
                    <div key={item.id} className="transactions-journal-card">
                      <div className="transactions-journal-marker" />

                      <div className="transactions-journal-main">
                        <div className="transactions-card-topline">
                          <span className={`transactions-type-pill ${getTypeTone(item.type)}`}>
                            {getTypeLabel(item.type, audience)}
                          </span>
                          <span
                            className={`transactions-status-pill ${getStatusTone(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <h4 className="transactions-card-title">{item.title}</h4>
                        <p className="transactions-card-subtitle">{item.subtitle}</p>

                        <div className="transactions-card-meta">
                          <span>{formatDateTime(item.time)}</span>
                          {item.propertyTitle ? <span>{item.propertyTitle}</span> : null}
                          {item.reference ? <span>{item.reference}</span> : null}
                          {item.category ? <span>{item.category}</span> : null}
                        </div>
                      </div>

                      <div className="transactions-journal-side">
                        <strong
                          className={`transactions-amount ${
                            item.direction === "positive" ? "positive" : "negative"
                          }`}
                        >
                          {item.direction === "positive" ? "+" : "-"}
                          {formatCurrency(item.amount)}
                        </strong>
                        <span className="transactions-date">{formatDate(item.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {(isManager || isAdmin) && propertyBreakdown.length > 0 ? (
              <div className="transactions-property-board">
                {propertyBreakdown.slice(0, 6).map((row) => (
                  <div key={`${row.propertyId || row.propertyTitle}`} className="transactions-property-card">
                    <div className="transactions-property-top">
                      <h4>{row.propertyTitle}</h4>
                      <span
                        className={`transactions-status-pill ${
                          row.netCashFlow >= 0 ? "completed" : "failed"
                        }`}
                      >
                        {row.netCashFlow >= 0 ? "Positive Net" : "Negative Net"}
                      </span>
                    </div>

                    <div className="transactions-property-grid">
                      <div>
                        <span>Inflow</span>
                        <strong className="positive">
                          {formatCompactCurrency(row.inflow)}
                        </strong>
                      </div>
                      <div>
                        <span>Outflow</span>
                        <strong>{formatCompactCurrency(row.outflow)}</strong>
                      </div>
                      <div>
                        <span>Net</span>
                        <strong
                          className={row.netCashFlow >= 0 ? "positive" : "negative"}
                        >
                          {formatCompactCurrency(row.netCashFlow)}
                        </strong>
                      </div>
                      <div>
                        <span>Maintenance</span>
                        <strong>{formatCompactCurrency(row.maintenanceExpenses)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="transactions-list">
              {transactions.map((item) => (
                <div key={item.id} className="transactions-card">
                  <div className="transactions-card-left">
                    <div className="transactions-card-topline">
                      <span className={`transactions-type-pill ${getTypeTone(item.type)}`}>
                        {getTypeLabel(item.type, audience)}
                      </span>
                      <span
                        className={`transactions-status-pill ${getStatusTone(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 className="transactions-card-title">{item.title}</h4>
                    <p className="transactions-card-subtitle">{item.subtitle}</p>

                    <div className="transactions-card-meta">
                      <span>{formatDateTime(item.time)}</span>
                      {item.propertyTitle ? <span>{item.propertyTitle}</span> : null}
                      {item.category ? <span>{item.category}</span> : null}
                      {item.reference ? <span>{item.reference}</span> : null}
                    </div>
                  </div>

                  <div className="transactions-card-right">
                    <strong
                      className={`transactions-amount ${
                        item.direction === "positive" ? "positive" : "negative"
                      }`}
                    >
                      {item.direction === "positive" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </strong>
                    <span className="transactions-date">{formatDate(item.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="transactions-pagination">
          <div className="transactions-pagination-info">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
          </div>

          <div className="transactions-pagination-actions">
            <button
              type="button"
              className="transactions-ghost-button"
              disabled={!pagination.hasPrevPage}
              onClick={handlePrev}
            >
              Previous
            </button>
            <button
              type="button"
              className="transactions-primary-button"
              disabled={!pagination.hasNextPage}
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}