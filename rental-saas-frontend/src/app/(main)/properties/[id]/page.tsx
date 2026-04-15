"use client";

import "@/styles/properties.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole = "ADMIN" | "MANAGER" | "INVESTOR" | "RESIDENT" | "SERVICE_PROVIDER";

type PropertyUnit = {
  id: string;
  number: string;
  rentAmount: number;
  status: "VACANT" | "OCCUPIED";
  invoiceExposure?: number;
  pendingInvoices?: number;
  activeResident: {
    id: string;
    name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
  latestInvoices?: {
    id: string;
    period: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
  }[];
};

type PropertyMaintenance = {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedCost: number;
  createdAt: string;
};

type PropertyExpense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate?: string;
  incurredAt?: string;
  status?: string;
};

type PersonMini = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type InvestmentOffer = {
  id: string;
  totalShares: number;
  pricePerShare: number;
  sharesSold: number;
  isActive: boolean;
};

type PropertyMetrics = {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  monthlyRentPotential: number;
  pendingInvoices?: number;
  invoiceExposure?: number;
  activeMaintenanceCount: number;
  totalExpenses?: number;
  totalInvestments?: number;
  totalDistributedProfit?: number;
  sharesIssued?: number;
  sharesSold?: number;
  offerUtilization?: number;
};

type PropertyDetailResponse = {
  id: string;
  title: string;
  location: string | null;
  owner?: PersonMini | null;
  manager?: PersonMini | null;
  serviceChargeAmount: number;
  garbageFeeAmount: number;
  accountBalance: number;
  marketValue?: number;
  marketPricePerShare?: number;
  valuationCapRate?: number;
  valuationUpdatedAt?: string | null;
  valuationUpdatedBy?: string | null;
  totalUnits?: number;
  occupiedUnits?: number;
  vacantUnits?: number;
  occupancyRate?: number;
  monthlyRentPotential?: number;
  totalExpenses?: number;
  totalInvestments?: number;
  totalDistributedProfit?: number;
  activeMaintenanceCount: number;
  investmentOffer?: InvestmentOffer | null;
  metrics?: PropertyMetrics;
  units: PropertyUnit[];
  maintenanceRequests: PropertyMaintenance[];
  expenses: PropertyExpense[];
  shares?: {
    id: string;
    investorId: string;
    sharesOwned: number;
    amountPaid: number;
    source: string;
    createdAt: string;
  }[];
  investments?: {
    id: string;
    investorId: string;
    amount: number;
    createdAt: string;
  }[];
  profitDistributions?: {
    id: string;
    investorId: string;
    amount: number;
    periodMonth: number;
    periodYear: number;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

function formatCurrency(value?: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value?: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMaintenanceBadgeClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "complete";
    case "IN_PROGRESS":
      return "progress";
    case "APPROVED":
    case "QUOTED":
    case "INSPECTION_REQUIRED":
    case "PENDING":
    case "ASSIGNED":
      return "pending";
    case "CANCELLED":
      return "vacant";
    default:
      return "pending";
  }
}

function formatMaintenanceStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getPropertyEndpoint(role: AppRole | undefined, id: string) {
  if (role === "ADMIN") return `/properties/${id}`;
  if (role === "MANAGER") return `/properties/manager/me/${id}`;
  if (role === "INVESTOR") return `/properties/investor/me/${id}`;
  return null;
}

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;

  const [property, setProperty] = useState<PropertyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const { id } = await params;
        const endpoint = getPropertyEndpoint(role, id);

        if (!endpoint) {
          if (!mounted) return;
          setError("This property view is not available for your account.");
          setLoading(false);
          return;
        }

        const res = await api.get<PropertyDetailResponse>(endpoint);

        if (!mounted) return;
        setProperty(res.data);
      } catch (error) {
        console.error("Failed to load property details", error);
        if (!mounted) return;
        setError("We couldn’t load this property right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [params, role]);

  const resolvedMetrics = useMemo(() => {
    if (!property) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        occupancyRate: 0,
        monthlyRentPotential: 0,
        activeMaintenanceCount: 0,
        totalExpenses: 0,
        totalInvestments: 0,
        totalDistributedProfit: 0,
        invoiceExposure: 0,
      };
    }

    return {
      totalUnits: property.metrics?.totalUnits ?? property.totalUnits ?? 0,
      occupiedUnits:
        property.metrics?.occupiedUnits ?? property.occupiedUnits ?? 0,
      vacantUnits: property.metrics?.vacantUnits ?? property.vacantUnits ?? 0,
      occupancyRate:
        property.metrics?.occupancyRate ?? property.occupancyRate ?? 0,
      monthlyRentPotential:
        property.metrics?.monthlyRentPotential ??
        property.monthlyRentPotential ??
        0,
      activeMaintenanceCount:
        property.metrics?.activeMaintenanceCount ??
        property.activeMaintenanceCount ??
        0,
      totalExpenses:
        property.metrics?.totalExpenses ?? property.totalExpenses ?? 0,
      totalInvestments:
        property.metrics?.totalInvestments ?? property.totalInvestments ?? 0,
      totalDistributedProfit:
        property.metrics?.totalDistributedProfit ??
        property.totalDistributedProfit ??
        0,
      invoiceExposure: property.metrics?.invoiceExposure ?? 0,
    };
  }, [property]);

  const netPotential = useMemo(() => {
    return Math.max(
      0,
      resolvedMetrics.monthlyRentPotential - resolvedMetrics.totalExpenses,
    );
  }, [resolvedMetrics]);

  if (loading) {
    return (
      <div className="property-detail-shell">
        <section className="property-detail-hero">
          <div className="property-detail-hero-copy">
            <div className="properties-skeleton-line short" />
            <div className="properties-skeleton-line hero" />
            <div className="properties-skeleton-line medium" />
          </div>

          <div className="property-detail-hero-pills">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="property-detail-pill">
                <div className="properties-skeleton-line short" />
                <div className="properties-skeleton-line medium" />
              </div>
            ))}
          </div>
        </section>

        <section className="property-detail-kpis">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="property-detail-kpi-card">
              <div className="properties-skeleton-line short" />
              <div className="properties-skeleton-line medium" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-detail-shell">
        <div className="properties-error-state">{error}</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail-shell">
        <div className="properties-empty-state">
          Property not found.
          <br />
          <span>
            This property may have been removed or may not be available for this
            account.
          </span>
        </div>
      </div>
    );
  }

  const isAdmin = role === "ADMIN";
  const isInvestor = role === "INVESTOR";

  return (
    <div className="property-detail-shell">
      <section className="property-detail-hero">
        <div className="property-detail-hero-copy">
          <p className="property-detail-eyebrow">
            {isAdmin ? "Admin Property Details" : isInvestor ? "Investor Property Details" : "Property Details"}
          </p>
          <h1 className="property-detail-title">{property.title}</h1>
          <p className="property-detail-subtitle">
            {property.location || "No location"}
          </p>

          <div className="property-detail-meta-row">
            <span className="property-detail-meta-chip">
              Created {formatDate(property.createdAt)}
            </span>
            <span className="property-detail-meta-chip">
              Updated {formatDate(property.updatedAt)}
            </span>

            {property.owner?.name ? (
              <span className="property-detail-meta-chip">
                Owner {property.owner.name}
              </span>
            ) : null}

            {property.manager?.name ? (
              <span className="property-detail-meta-chip">
                Manager {property.manager.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="property-detail-hero-pills">
          <div className="property-detail-pill">
            <span className="property-detail-pill-label">Occupancy</span>
            <strong>{formatPercent(resolvedMetrics.occupancyRate)}</strong>
          </div>
          <div className="property-detail-pill">
            <span className="property-detail-pill-label">Total Units</span>
            <strong>{resolvedMetrics.totalUnits}</strong>
          </div>
          <div className="property-detail-pill">
            <span className="property-detail-pill-label">Occupied Units</span>
            <strong>{resolvedMetrics.occupiedUnits}</strong>
          </div>
          <div className="property-detail-pill">
            <span className="property-detail-pill-label">Vacant Units</span>
            <strong>{resolvedMetrics.vacantUnits}</strong>
          </div>
        </div>
      </section>

      <section className="property-detail-kpis">
        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Monthly Potential</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(resolvedMetrics.monthlyRentPotential)}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Expenses</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(resolvedMetrics.totalExpenses)}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Net Potential</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(netPotential)}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Account Balance</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(property.accountBalance)}
          </h2>
        </div>
      </section>

      <section className="property-detail-kpis property-detail-kpis-secondary">
        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Service Charge</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(property.serviceChargeAmount)}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Garbage Fee</p>
          <h2 className="property-detail-kpi-value">
            {formatCurrency(property.garbageFeeAmount)}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Active Maintenance</p>
          <h2 className="property-detail-kpi-value">
            {resolvedMetrics.activeMaintenanceCount}
          </h2>
        </div>

        <div className="property-detail-kpi-card">
          <p className="property-detail-kpi-label">Inventory Mix</p>
          <h2 className="property-detail-kpi-value">
            {resolvedMetrics.occupiedUnits}/{resolvedMetrics.totalUnits} occupied
          </h2>
        </div>
      </section>

      {(isAdmin || isInvestor) && (
        <section className="property-detail-kpis property-detail-kpis-secondary">
          <div className="property-detail-kpi-card">
            <p className="property-detail-kpi-label">Market Value</p>
            <h2 className="property-detail-kpi-value">
              {formatCurrency(property.marketValue)}
            </h2>
          </div>

          <div className="property-detail-kpi-card">
            <p className="property-detail-kpi-label">Price Per Share</p>
            <h2 className="property-detail-kpi-value">
              {formatCurrency(property.marketPricePerShare)}
            </h2>
          </div>

          <div className="property-detail-kpi-card">
            <p className="property-detail-kpi-label">Cap Rate</p>
            <h2 className="property-detail-kpi-value">
              {formatPercent((property.valuationCapRate || 0) * 100)}
            </h2>
          </div>

          <div className="property-detail-kpi-card">
            <p className="property-detail-kpi-label">Invoice Exposure</p>
            <h2 className="property-detail-kpi-value">
              {formatCurrency(resolvedMetrics.invoiceExposure)}
            </h2>
          </div>
        </section>
      )}

      {property.investmentOffer && (
        <section className="property-detail-panel">
          <div className="property-detail-panel-head">
            <div>
              <h3 className="property-detail-panel-title">Investment Offer</h3>
              <p className="property-detail-panel-subtitle">
                Share sale visibility for this property
              </p>
            </div>
            <span className="property-detail-chip">
              {property.investmentOffer.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="property-detail-kpis property-detail-kpis-secondary">
            <div className="property-detail-kpi-card">
              <p className="property-detail-kpi-label">Total Shares</p>
              <h2 className="property-detail-kpi-value">
                {property.investmentOffer.totalShares}
              </h2>
            </div>
            <div className="property-detail-kpi-card">
              <p className="property-detail-kpi-label">Shares Sold</p>
              <h2 className="property-detail-kpi-value">
                {property.investmentOffer.sharesSold}
              </h2>
            </div>
            <div className="property-detail-kpi-card">
              <p className="property-detail-kpi-label">Price Per Share</p>
              <h2 className="property-detail-kpi-value">
                {formatCurrency(property.investmentOffer.pricePerShare)}
              </h2>
            </div>
            <div className="property-detail-kpi-card">
              <p className="property-detail-kpi-label">Offer Status</p>
              <h2 className="property-detail-kpi-value">
                {property.investmentOffer.isActive ? "Live" : "Closed"}
              </h2>
            </div>
          </div>
        </section>
      )}

      <section className="property-detail-grid">
        <div className="property-detail-panel">
          <div className="property-detail-panel-head">
            <div>
              <h3 className="property-detail-panel-title">Units Overview</h3>
              <p className="property-detail-panel-subtitle">
                Total, occupied, and vacant status by unit
              </p>
            </div>
            <span className="property-detail-chip">
              {resolvedMetrics.totalUnits} units
            </span>
          </div>

          {property.units.length === 0 ? (
            <div className="properties-empty-state compact">
              No units found for this property yet.
              <br />
              <span>Once units are created, they will appear here.</span>
            </div>
          ) : (
            <div className="property-detail-table">
              <div className="property-detail-table-head property-detail-units-head">
                <span>Unit</span>
                <span>Resident</span>
                <span>Rent</span>
                <span>Status</span>
              </div>

              <div className="property-detail-table-body">
                {property.units.map((row) => (
                  <div
                    key={row.id}
                    className="property-detail-table-row property-detail-units-row"
                  >
                    <span className="property-detail-unit-name">{row.number}</span>
                    <span>{row.activeResident?.name || "-"}</span>
                    <span>{formatCurrency(row.rentAmount)}</span>
                    <span
                      className={
                        row.status === "OCCUPIED"
                          ? "property-detail-badge occupied"
                          : "property-detail-badge vacant"
                      }
                    >
                      {row.status === "OCCUPIED" ? "Occupied" : "Vacant"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="property-detail-panel">
          <div className="property-detail-panel-head">
            <div>
              <h3 className="property-detail-panel-title">Maintenance</h3>
              <p className="property-detail-panel-subtitle">
                Open and recent requests
              </p>
            </div>
            <span className="property-detail-chip">
              {resolvedMetrics.activeMaintenanceCount} active
            </span>
          </div>

          {property.maintenanceRequests.length === 0 ? (
            <div className="properties-empty-state compact">
              No maintenance requests yet.
              <br />
              <span>
                This property currently has no recent maintenance activity.
              </span>
            </div>
          ) : (
            <div className="property-detail-maintenance-list">
              {property.maintenanceRequests.map((row) => (
                <div key={row.id} className="property-detail-maintenance-row">
                  <div>
                    <p className="property-detail-maintenance-title">
                      {row.title}
                    </p>
                    <p className="property-detail-maintenance-meta">
                      {row.priority} Priority • {formatDate(row.createdAt)}
                    </p>
                  </div>

                  <div className="property-detail-maintenance-right">
                    <span className="property-detail-maintenance-cost">
                      {row.estimatedCost > 0
                        ? formatCurrency(row.estimatedCost)
                        : "No estimate"}
                    </span>
                    <span
                      className={`property-detail-badge ${getMaintenanceBadgeClass(
                        row.status,
                      )}`}
                    >
                      {formatMaintenanceStatus(row.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="property-detail-panel">
        <div className="property-detail-panel-head">
          <div>
            <h3 className="property-detail-panel-title">Recent Expenses</h3>
            <p className="property-detail-panel-subtitle">
              Latest recorded cost items for this property
            </p>
          </div>
          <span className="property-detail-chip">
            {property.expenses.length} items
          </span>
        </div>

        {property.expenses.length === 0 ? (
          <div className="properties-empty-state compact">
            No expenses recorded yet.
            <br />
            <span>Expense entries will show here once they are added.</span>
          </div>
        ) : (
          <div className="property-expense-list">
            {property.expenses.map((item) => (
              <div key={item.id} className="property-expense-row">
                <div>
                  <p className="property-expense-title">{item.title}</p>
                  <p className="property-expense-meta">
                    {item.category} •{" "}
                    {formatDate(item.expenseDate || item.incurredAt)}
                  </p>
                </div>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}