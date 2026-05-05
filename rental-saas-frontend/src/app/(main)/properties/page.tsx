"use client";

import "@/styles/properties.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type PropertySummary = {
  totalProperties: number;
  withManagers: number;
  withoutManagers: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  averageOccupancyRate: number;
  totalAccountBalance: number;
  totalMonthlyRentPotential: number;
  totalInvoiceExposure: number;
  activeMaintenanceCount: number;
  totalMarketValue: number;
};

type PropertyItem = {
  id: string;
  title: string;
  location: string | null;
  owner?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  manager?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  serviceChargeAmount?: number;
  garbageFeeAmount?: number;
  accountBalance?: number;
  marketValue?: number;
  marketPricePerShare?: number;
  valuationCapRate?: number;
  valuationUpdatedAt?: string | null;
  valuationUpdatedBy?: string | null;
  investmentOffer?: {
    id: string;
    totalShares: number;
    pricePerShare: number;
    sharesSold: number;
    isActive: boolean;
  } | null;
  metrics?: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    monthlyRentPotential: number;
    pendingInvoices: number;
    invoiceExposure: number;
    activeMaintenanceCount: number;
    totalExpenses: number;
    totalInvestments: number;
    totalDistributedProfit: number;
    sharesIssued: number;
    sharesSold: number;
    offerUtilization: number;
  };
  totalUnits?: number;
  occupiedUnits?: number;
  vacantUnits?: number;
  occupancyRate?: number;
  monthlyRentPotential?: number;
  pendingInvoices?: number;
  activeMaintenanceCount?: number;
  createdAt: string;
  updatedAt?: string;
};

type AdminPropertiesResponse = {
  summary: PropertySummary;
  properties: PropertyItem[];
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatUnitCount(value: number) {
  return `${value} ${value === 1 ? "unit" : "units"}`;
}

function buildMetrics(property: PropertyItem) {
  return {
    totalUnits: Number(property.metrics?.totalUnits ?? property.totalUnits ?? 0),
    occupiedUnits: Number(
      property.metrics?.occupiedUnits ?? property.occupiedUnits ?? 0,
    ),
    vacantUnits: Number(property.metrics?.vacantUnits ?? property.vacantUnits ?? 0),
    occupancyRate: Number(
      property.metrics?.occupancyRate ?? property.occupancyRate ?? 0,
    ),
    monthlyRentPotential: Number(
      property.metrics?.monthlyRentPotential ??
        property.monthlyRentPotential ??
        0,
    ),
    pendingInvoices: Number(
      property.metrics?.pendingInvoices ?? property.pendingInvoices ?? 0,
    ),
    invoiceExposure: Number(property.metrics?.invoiceExposure ?? 0),
    activeMaintenanceCount: Number(
      property.metrics?.activeMaintenanceCount ??
        property.activeMaintenanceCount ??
        0,
    ),
    totalExpenses: Number(property.metrics?.totalExpenses ?? 0),
    totalInvestments: Number(property.metrics?.totalInvestments ?? 0),
    totalDistributedProfit: Number(property.metrics?.totalDistributedProfit ?? 0),
    sharesIssued: Number(property.metrics?.sharesIssued ?? 0),
    sharesSold: Number(property.metrics?.sharesSold ?? 0),
    offerUtilization: Number(property.metrics?.offerUtilization ?? 0),
  };
}

function getPropertyStatusTone(property: PropertyItem, isManager: boolean) {
  const metrics = buildMetrics(property);

  if (metrics.totalUnits === 0) return "warn";
  if (!isManager && !property.manager) return "warn";
  if (metrics.activeMaintenanceCount > 0) return "issue";
  if (metrics.pendingInvoices > 0) return "warn";
  if (metrics.vacantUnits > 0) return "warn";

  return "clear";
}

function getPropertyStatusLabel(property: PropertyItem, isManager: boolean) {
  const metrics = buildMetrics(property);

  if (metrics.totalUnits === 0) return "No units added";
  if (!isManager && !property.manager) return "Needs manager";

  if (metrics.activeMaintenanceCount > 0) {
    return `${metrics.activeMaintenanceCount} active issues`;
  }

  if (metrics.pendingInvoices > 0) {
    return `${metrics.pendingInvoices} pending invoices`;
  }

  if (metrics.vacantUnits > 0) {
    return `${metrics.vacantUnits} vacant`;
  }

  return "Stable";
}

function emptySummary(): PropertySummary {
  return {
    totalProperties: 0,
    withManagers: 0,
    withoutManagers: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    averageOccupancyRate: 0,
    totalAccountBalance: 0,
    totalMonthlyRentPotential: 0,
    totalInvoiceExposure: 0,
    activeMaintenanceCount: 0,
    totalMarketValue: 0,
  };
}

function buildManagerSummary(properties: PropertyItem[]): PropertySummary {
  const normalized = properties.map((property) => ({
    ...property,
    metrics: buildMetrics(property),
  }));

  const totalProperties = normalized.length;
  const totalUnits = normalized.reduce(
    (sum, property) => sum + property.metrics.totalUnits,
    0,
  );
  const occupiedUnits = normalized.reduce(
    (sum, property) => sum + property.metrics.occupiedUnits,
    0,
  );
  const vacantUnits = normalized.reduce(
    (sum, property) => sum + property.metrics.vacantUnits,
    0,
  );
  const totalMonthlyRentPotential = normalized.reduce(
    (sum, property) => sum + property.metrics.monthlyRentPotential,
    0,
  );
  const totalInvoiceExposure = normalized.reduce(
    (sum, property) => sum + property.metrics.invoiceExposure,
    0,
  );
  const activeMaintenanceCount = normalized.reduce(
    (sum, property) => sum + property.metrics.activeMaintenanceCount,
    0,
  );
  const totalAccountBalance = normalized.reduce(
    (sum, property) => sum + Number(property.accountBalance ?? 0),
    0,
  );
  const totalMarketValue = normalized.reduce(
    (sum, property) => sum + Number(property.marketValue ?? 0),
    0,
  );

  return {
    totalProperties,
    withManagers: totalProperties,
    withoutManagers: 0,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    averageOccupancyRate:
      totalUnits > 0
        ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1))
        : 0,
    totalAccountBalance,
    totalMonthlyRentPotential,
    totalInvoiceExposure,
    activeMaintenanceCount,
    totalMarketValue,
  };
}

export default function PropertiesPage() {
  const { user, hydrateAuth } = useAuthStore();

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [summary, setSummary] = useState<PropertySummary>(emptySummary());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const isManager = user?.role === "MANAGER";

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    let mounted = true;

    async function loadProperties() {
      if (!user?.role) return;

      try {
        setLoading(true);
        setError("");

        if (user.role === "MANAGER") {
          const res = await api.get<PropertyItem[]>("/properties/manager/me");

          if (!mounted) return;

          const managerProperties = (res.data ?? []).map((property) => ({
            ...property,
            manager: {
              id: user.id,
              name: user.name ?? "Assigned manager",
              email: user.email ?? null,
              phone: null,
            },
            metrics: buildMetrics(property),
          }));

          setProperties(managerProperties);
          setSummary(buildManagerSummary(managerProperties));
          return;
        }

        if (user.role === "ADMIN") {
          const res = await api.get<AdminPropertiesResponse>("/properties");

          if (!mounted) return;

          setProperties(
            (res.data?.properties ?? []).map((property) => ({
              ...property,
              metrics: buildMetrics(property),
            })),
          );
          setSummary(res.data?.summary ?? emptySummary());
          return;
        }

        setProperties([]);
        setSummary(emptySummary());
        setError("This properties page is only available to admins and managers.");
      } catch (error) {
        console.error("Failed to load properties", error);
        if (!mounted) return;
        setProperties([]);
        setSummary(emptySummary());
        setError("We couldn’t load properties right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProperties();

    return () => {
      mounted = false;
    };
  }, [user?.role, user?.id, user?.name, user?.email]);

  const filteredProperties = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return properties;

    return properties.filter((property) => {
      const metrics = buildMetrics(property);

      const searchable = [
        property.title,
        property.location || "",
        property.owner?.name || "",
        property.owner?.email || "",
        property.manager?.name || "",
        property.manager?.email || "",
        String(metrics.totalUnits),
        `${metrics.totalUnits} units`,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [properties, query]);

  const topAttention = useMemo(() => {
    return [...filteredProperties]
      .sort((a, b) => {
        const aMetrics = buildMetrics(a);
        const bMetrics = buildMetrics(b);

        const aScore =
          (aMetrics.totalUnits === 0 ? 4 : 0) +
          (!isManager && !a.manager ? 3 : 0) +
          (aMetrics.activeMaintenanceCount > 0 ? 2 : 0) +
          (aMetrics.pendingInvoices > 0 ? 1 : 0) +
          (aMetrics.vacantUnits > 0 ? 1 : 0);

        const bScore =
          (bMetrics.totalUnits === 0 ? 4 : 0) +
          (!isManager && !b.manager ? 3 : 0) +
          (bMetrics.activeMaintenanceCount > 0 ? 2 : 0) +
          (bMetrics.pendingInvoices > 0 ? 1 : 0) +
          (bMetrics.vacantUnits > 0 ? 1 : 0);

        return bScore - aScore;
      })
      .slice(0, 4);
  }, [filteredProperties, isManager]);

  const pageEyebrow = isManager
    ? "Manager properties"
    : "Admin properties control";

  const pageTitle = isManager
    ? "Monitor assigned properties, unit count, occupancy, rent potential, and operational pressure"
    : "Oversee property performance, unit count, ownership, management coverage, valuation, and operational pressure";

  const pageText = isManager
    ? "Every onboarded property must show its total number of units so vacant and occupied spaces can be tracked accurately."
    : "Every property must show its building unit count, occupied units, vacant units, occupancy exposure, and manager coverage from one command center.";

  return (
    <div className="properties-overview-shell">
      <section className="properties-hero">
        <div className="properties-hero-copy">
          <p className="properties-eyebrow">{pageEyebrow}</p>
          <h1 className="properties-title">{pageTitle}</h1>
          <p className="properties-text">{pageText}</p>

          <div className="properties-tags">
            <span className="properties-tag">
              {isManager ? "Assigned portfolio" : "Platform-wide visibility"}
            </span>
            <span className="properties-tag">Building unit count</span>
            <span className="properties-tag">Vacant vs occupied</span>
            <span className="properties-tag">Operations oversight</span>
          </div>
        </div>

        <div className="properties-hero-grid">
          <div className="properties-stat-card dark">
            <p className="properties-stat-label">Properties</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : summary.totalProperties}
            </h3>
          </div>

          <div className="properties-stat-card">
            <p className="properties-stat-label">Total Building Units</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : summary.totalUnits}
            </h3>
          </div>

          <div className="properties-stat-card">
            <p className="properties-stat-label">Vacant Spaces</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : summary.vacantUnits}
            </h3>
          </div>

          <div className="properties-stat-card">
            <p className="properties-stat-label">Occupied Spaces</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : summary.occupiedUnits}
            </h3>
          </div>
        </div>
      </section>

      {error ? <div className="properties-error-state">{error}</div> : null}

      <section className="properties-middle-grid">
        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">
                {isManager ? "Assigned snapshot" : "Platform snapshot"}
              </h3>
              <p className="properties-panel-subtitle">
                Unit count, occupied spaces, vacant spaces, and maintenance
                pressure
              </p>
            </div>
            <span className="properties-panel-chip">
              {isManager ? "Manager" : "Admin"}
            </span>
          </div>

          <div className="income-mini-stats properties-ops-grid">
            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Properties</p>
              <p className="income-mini-stat-value">{summary.totalProperties}</p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Total Units</p>
              <p className="income-mini-stat-value">{summary.totalUnits}</p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Occupied</p>
              <p className="income-mini-stat-value">{summary.occupiedUnits}</p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Vacant</p>
              <p className="income-mini-stat-value">{summary.vacantUnits}</p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Occupancy</p>
              <p className="income-mini-stat-value">
                {formatPercent(summary.averageOccupancyRate)}
              </p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Maintenance</p>
              <p className="income-mini-stat-value">
                {summary.activeMaintenanceCount}
              </p>
            </div>
          </div>
        </div>

        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">
                {isManager ? "Operating exposure" : "Financial exposure"}
              </h3>
              <p className="properties-panel-subtitle">
                {isManager
                  ? "Simple operational view of rent potential, invoices, and occupancy"
                  : "Admin view of value and receivables across properties"}
              </p>
            </div>
            <span className="properties-panel-chip">
              {isManager ? "Operations" : "Finance"}
            </span>
          </div>

          <div className="income-mini-stats properties-ops-grid">
            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Monthly Potential</p>
              <p className="income-mini-stat-value">
                {formatCurrency(summary.totalMonthlyRentPotential)}
              </p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">Invoice Exposure</p>
              <p className="income-mini-stat-value">
                {formatCurrency(summary.totalInvoiceExposure)}
              </p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">
                {isManager ? "Occupied Units" : "Market Value"}
              </p>
              <p className="income-mini-stat-value">
                {isManager
                  ? summary.occupiedUnits
                  : formatCurrency(summary.totalMarketValue)}
              </p>
            </div>

            <div className="income-mini-stat-box">
              <p className="income-mini-stat-label">
                {isManager ? "Rentable Units" : "Account Balances"}
              </p>
              <p className="income-mini-stat-value">
                {isManager
                  ? summary.totalUnits
                  : formatCurrency(summary.totalAccountBalance)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="properties-panel">
        <div className="properties-panel-head">
          <div>
            <h3 className="properties-panel-title">Search properties</h3>
            <p className="properties-panel-subtitle">
              Filter by property, location, owner, manager, or unit count
            </p>
          </div>
          <span className="properties-panel-chip">
            {loading ? "Loading..." : `${filteredProperties.length} visible`}
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, location, owner, manager, or unit count..."
            className="properties-search-input"
          />
        </div>
      </section>

      <section className="properties-middle-grid">
        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">Occupancy by property</h3>
              <p className="properties-panel-subtitle">
                Unit count is used to calculate occupied and vacant spaces
              </p>
            </div>
            <span className="properties-panel-chip">Live</span>
          </div>

          {loading ? (
            <div className="properties-empty-state compact">Loading...</div>
          ) : !filteredProperties.length ? (
            <div className="properties-empty-state compact">
              No properties matched your search.
              <br />
              <span>Try a different property, owner, manager, or location.</span>
            </div>
          ) : (
            <div className="occupancy-bars-list">
              {filteredProperties.map((item) => {
                const metrics = buildMetrics(item);

                return (
                  <div key={item.id} className="occupancy-bar-row">
                    <div className="occupancy-bar-top">
                      <span>
                        {item.title} • {formatUnitCount(metrics.totalUnits)}
                      </span>
                      <strong>{formatPercent(metrics.occupancyRate)}</strong>
                    </div>

                    <div className="occupancy-bar-top" style={{ marginTop: 4 }}>
                      <small>
                        Occupied: {metrics.occupiedUnits} • Vacant:{" "}
                        {metrics.vacantUnits}
                      </small>
                    </div>

                    <div className="occupancy-bar-track">
                      <div
                        className="occupancy-bar-fill"
                        style={{ width: `${metrics.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">Attention queue</h3>
              <p className="properties-panel-subtitle">
                Properties missing units or needing operational action
              </p>
            </div>
            <span className="properties-panel-chip">Priority</span>
          </div>

          {loading ? (
            <div className="properties-empty-state compact">Loading...</div>
          ) : !topAttention.length ? (
            <div className="properties-empty-state compact">
              No property alerts right now.
              <br />
              <span>Everything currently looks stable.</span>
            </div>
          ) : (
            <div className="property-expense-list">
              {topAttention.map((item) => {
                const metrics = buildMetrics(item);

                return (
                  <div key={item.id} className="property-expense-row">
                    <div>
                      <p className="property-expense-title">{item.title}</p>
                      <p className="property-expense-meta">
                        {isManager
                          ? item.owner?.name || "Owner not set"
                          : item.manager?.name || "No manager"}{" "}
                        • {item.location || "No location"} •{" "}
                        {formatUnitCount(metrics.totalUnits)}
                      </p>
                      <p className="property-expense-meta">
                        Occupied {metrics.occupiedUnits} • Vacant{" "}
                        {metrics.vacantUnits}
                      </p>
                    </div>

                    <strong
                      className={
                        getPropertyStatusTone(item, isManager) === "issue"
                          ? "table-badge-issue"
                          : getPropertyStatusTone(item, isManager) === "warn"
                            ? "table-badge-warn"
                            : "table-badge-clear"
                      }
                    >
                      {getPropertyStatusLabel(item, isManager)}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="properties-panel properties-table-panel">
        <div className="properties-panel-head">
          <div>
            <h3 className="properties-panel-title">Properties overview</h3>
            <p className="properties-panel-subtitle">
              Every property shows total building units, occupied units, vacant
              units, and occupancy
            </p>
          </div>
          <span className="properties-panel-chip">
            {loading ? "Loading..." : `${filteredProperties.length} Properties`}
          </span>
        </div>

        <div className="properties-table">
          <div
            className={
              isManager
                ? "properties-table-head-manager"
                : "properties-table-head-admin"
            }
          >
            <span>Property</span>
            <span>Owner</span>
            {!isManager ? <span>Manager</span> : null}
            <span>Total Units</span>
            <span>Occupied</span>
            <span>Vacant</span>
            <span>Occupancy</span>
            <span>Status</span>
          </div>

          <div className="properties-table-body">
            {loading ? (
              <div className="properties-empty-state">Loading properties...</div>
            ) : error ? (
              <div className="properties-error-state">
                We couldn’t load the properties table.
              </div>
            ) : !filteredProperties.length ? (
              <div className="properties-empty-state">
                No properties found.
                <br />
                <span>
                  {isManager
                    ? "Assigned properties will appear here once available."
                    : "Platform properties will appear here once available."}
                </span>
              </div>
            ) : (
              filteredProperties.map((property) => {
                const metrics = buildMetrics(property);

                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className={
                      isManager
                        ? "properties-table-row-manager"
                        : "properties-table-row-admin"
                    }
                  >
                    <div className="table-property-name">
                      <strong>{property.title}</strong>
                      <small>
                        {property.location || "No location"} •{" "}
                        {formatUnitCount(metrics.totalUnits)}
                      </small>
                    </div>

                    <div className="table-person-cell">
                      <strong>{property.owner?.name || "Not set"}</strong>
                      <small>{property.owner?.email || "No email"}</small>
                    </div>

                    {!isManager ? (
                      <div className="table-person-cell">
                        <strong>
                          {property.manager?.name || "Not assigned"}
                        </strong>
                        <small>{property.manager?.email || "No email"}</small>
                      </div>
                    ) : null}

                    <span>{metrics.totalUnits}</span>
                    <span>{metrics.occupiedUnits}</span>
                    <span>{metrics.vacantUnits}</span>
                    <span>{formatPercent(metrics.occupancyRate)}</span>

                    <span
                      className={
                        getPropertyStatusTone(property, isManager) === "issue"
                          ? "table-badge-issue"
                          : getPropertyStatusTone(property, isManager) === "warn"
                            ? "table-badge-warn"
                            : "table-badge-clear"
                      }
                    >
                      {getPropertyStatusLabel(property, isManager)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}