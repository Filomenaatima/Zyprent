"use client";

import "@/styles/properties.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";

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
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  manager: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  serviceChargeAmount: number;
  garbageFeeAmount: number;
  accountBalance: number;
  marketValue: number;
  marketPricePerShare: number;
  valuationCapRate: number;
  valuationUpdatedAt: string | null;
  valuationUpdatedBy: string | null;
  investmentOffer: {
    id: string;
    totalShares: number;
    pricePerShare: number;
    sharesSold: number;
    isActive: boolean;
  } | null;
  metrics: {
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
  createdAt: string;
  updatedAt: string;
};

type PropertiesResponse = {
  summary: PropertySummary;
  properties: PropertyItem[];
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
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

function getPropertyStatusTone(property: PropertyItem) {
  if (!property.manager) return "warn";
  if (property.metrics.activeMaintenanceCount > 0) return "issue";
  if (property.metrics.pendingInvoices > 0) return "warn";
  return "clear";
}

function getPropertyStatusLabel(property: PropertyItem) {
  if (!property.manager) return "Needs manager";
  if (property.metrics.activeMaintenanceCount > 0) {
    return `${property.metrics.activeMaintenanceCount} active issues`;
  }
  if (property.metrics.pendingInvoices > 0) {
    return `${property.metrics.pendingInvoices} pending invoices`;
  }
  return "Stable";
}

export default function PropertiesPage() {
  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get<PropertiesResponse>("/properties");

        if (!mounted) return;
        setData(res.data);
      } catch (error) {
        console.error("Failed to load admin properties", error);
        if (!mounted) return;
        setError("We couldn’t load platform properties right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProperties();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = data?.summary ?? {
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

  const properties = data?.properties ?? [];

  const filteredProperties = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return properties;

    return properties.filter((property) => {
      const searchable = [
        property.title,
        property.location || "",
        property.owner?.name || "",
        property.owner?.email || "",
        property.manager?.name || "",
        property.manager?.email || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [properties, query]);

  const topAttention = useMemo(() => {
    return [...filteredProperties]
      .sort((a, b) => {
        const aScore =
          (a.manager ? 0 : 3) +
          (a.metrics.activeMaintenanceCount > 0 ? 2 : 0) +
          (a.metrics.pendingInvoices > 0 ? 1 : 0);

        const bScore =
          (b.manager ? 0 : 3) +
          (b.metrics.activeMaintenanceCount > 0 ? 2 : 0) +
          (b.metrics.pendingInvoices > 0 ? 1 : 0);

        return bScore - aScore;
      })
      .slice(0, 4);
  }, [filteredProperties]);

  return (
    <div className="properties-overview-shell">
      <section className="properties-hero">
        <div className="properties-hero-copy">
          <p className="properties-eyebrow">Admin properties control</p>
          <h1 className="properties-title">
            Oversee property performance, ownership, management coverage, valuation,
            and operational pressure across the full platform
          </h1>
          <p className="properties-text">
            View every property in one command center, monitor occupancy and invoice
            exposure, and see where admin action is needed across managers, assets,
            and portfolio value.
          </p>

          <div className="properties-tags">
            <span className="properties-tag">Platform-wide visibility</span>
            <span className="properties-tag">Occupancy control</span>
            <span className="properties-tag">Valuation awareness</span>
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
            <p className="properties-stat-label">Occupancy</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : formatPercent(summary.averageOccupancyRate)}
            </h3>
          </div>

          <div className="properties-stat-card">
            <p className="properties-stat-label">Market Value</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : formatCurrency(summary.totalMarketValue)}
            </h3>
          </div>

          <div className="properties-stat-card">
            <p className="properties-stat-label">Monthly Potential</p>
            <h3 className="properties-stat-value">
              {loading ? "—" : formatCurrency(summary.totalMonthlyRentPotential)}
            </h3>
          </div>
        </div>
      </section>

      {error ? <div className="properties-error-state">{error}</div> : null}

      <section className="properties-middle-grid">
        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">Platform snapshot</h3>
              <p className="properties-panel-subtitle">
                High-level portfolio health across all properties
              </p>
            </div>
            <span className="properties-panel-chip">Admin</span>
          </div>

          {loading ? (
            <div className="properties-ops-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="income-mini-stat-box">
                  <div className="properties-skeleton-line short" />
                  <div className="properties-skeleton-line medium" />
                </div>
              ))}
            </div>
          ) : (
            <div className="income-mini-stats properties-ops-grid">
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">With Managers</p>
                <p className="income-mini-stat-value">{summary.withManagers}</p>
              </div>
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Without Managers</p>
                <p className="income-mini-stat-value">{summary.withoutManagers}</p>
              </div>
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Units</p>
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
                <p className="income-mini-stat-label">Maintenance</p>
                <p className="income-mini-stat-value">
                  {summary.activeMaintenanceCount}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">Financial exposure</h3>
              <p className="properties-panel-subtitle">
                Admin-wide money visibility across accounts and receivables
              </p>
            </div>
            <span className="properties-panel-chip">Finance</span>
          </div>

          {loading ? (
            <div className="properties-ops-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="income-mini-stat-box">
                  <div className="properties-skeleton-line short" />
                  <div className="properties-skeleton-line medium" />
                </div>
              ))}
            </div>
          ) : (
            <div className="income-mini-stats properties-ops-grid">
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Account Balances</p>
                <p className="income-mini-stat-value">
                  {formatCurrency(summary.totalAccountBalance)}
                </p>
              </div>
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Invoice Exposure</p>
                <p className="income-mini-stat-value">
                  {formatCurrency(summary.totalInvoiceExposure)}
                </p>
              </div>
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Monthly Potential</p>
                <p className="income-mini-stat-value">
                  {formatCurrency(summary.totalMonthlyRentPotential)}
                </p>
              </div>
              <div className="income-mini-stat-box">
                <p className="income-mini-stat-label">Market Value</p>
                <p className="income-mini-stat-value">
                  {formatCurrency(summary.totalMarketValue)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="properties-panel">
        <div className="properties-panel-head">
          <div>
            <h3 className="properties-panel-title">Search properties</h3>
            <p className="properties-panel-subtitle">
              Filter by property, location, owner, or manager
            </p>
          </div>
          <span className="properties-panel-chip">
            {loading ? "Loading..." : `${filteredProperties.length} visible`}
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, location, owner, or manager..."
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
                Quick view of property utilization across the platform
              </p>
            </div>
            <span className="properties-panel-chip">Live</span>
          </div>

          {loading ? (
            <div className="properties-skeleton-stack">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="properties-bar-skeleton">
                  <div className="properties-skeleton-line short" />
                  <div className="properties-skeleton-line full" />
                </div>
              ))}
            </div>
          ) : !filteredProperties.length ? (
            <div className="properties-empty-state compact">
              No properties matched your search.
              <br />
              <span>Try a different property, owner, manager, or location.</span>
            </div>
          ) : (
            <div className="occupancy-bars-list">
              {filteredProperties.map((item) => (
                <div key={item.id} className="occupancy-bar-row">
                  <div className="occupancy-bar-top">
                    <span>{item.title}</span>
                    <strong>{formatPercent(item.metrics.occupancyRate)}</strong>
                  </div>
                  <div className="occupancy-bar-track">
                    <div
                      className="occupancy-bar-fill"
                      style={{ width: `${item.metrics.occupancyRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="properties-panel">
          <div className="properties-panel-head">
            <div>
              <h3 className="properties-panel-title">Attention queue</h3>
              <p className="properties-panel-subtitle">
                Properties most likely to need admin action
              </p>
            </div>
            <span className="properties-panel-chip">Priority</span>
          </div>

          {loading ? (
            <div className="properties-skeleton-stack">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="properties-bar-skeleton">
                  <div className="properties-skeleton-line medium" />
                  <div className="properties-skeleton-line short" />
                </div>
              ))}
            </div>
          ) : !topAttention.length ? (
            <div className="properties-empty-state compact">
              No property alerts right now.
              <br />
              <span>Everything currently looks stable.</span>
            </div>
          ) : (
            <div className="property-expense-list">
              {topAttention.map((item) => (
                <div key={item.id} className="property-expense-row">
                  <div>
                    <p className="property-expense-title">{item.title}</p>
                    <p className="property-expense-meta">
                      {item.manager?.name || "No manager"} •{" "}
                      {item.location || "No location"}
                    </p>
                  </div>
                  <strong
                    className={
                      getPropertyStatusTone(item) === "issue"
                        ? "table-badge-issue"
                        : getPropertyStatusTone(item) === "warn"
                        ? "table-badge-warn"
                        : "table-badge-clear"
                    }
                  >
                    {getPropertyStatusLabel(item)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="properties-panel properties-table-panel">
        <div className="properties-panel-head">
          <div>
            <h3 className="properties-panel-title">Properties overview</h3>
            <p className="properties-panel-subtitle">
              Full admin view across ownership, management, occupancy, and value
            </p>
          </div>
          <span className="properties-panel-chip">
            {loading ? "Loading..." : `${filteredProperties.length} Properties`}
          </span>
        </div>

        <div className="properties-table">
          <div className="properties-table-head properties-table-head-admin">
            <span>Property</span>
            <span>Owner</span>
            <span>Manager</span>
            <span>Occupancy</span>
            <span>Units</span>
            <span>Potential</span>
            <span>Exposure</span>
            <span>Status</span>
          </div>

          <div className="properties-table-body">
            {loading ? (
              <div className="properties-table-skeleton">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="properties-table-row properties-table-row-admin properties-row-skeleton"
                  >
                    <div className="properties-skeleton-line medium" />
                    <div className="properties-skeleton-line short" />
                    <div className="properties-skeleton-line short" />
                    <div className="properties-skeleton-line short" />
                    <div className="properties-skeleton-line short" />
                    <div className="properties-skeleton-line medium" />
                    <div className="properties-skeleton-line medium" />
                    <div className="properties-skeleton-pill" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="properties-error-state">
                We couldn’t load the properties table.
              </div>
            ) : !filteredProperties.length ? (
              <div className="properties-empty-state">
                No properties found.
                <br />
                <span>Platform properties will appear here once available.</span>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="properties-table-row properties-table-row-admin"
                >
                  <span className="table-property-name">
                    <strong>{property.title}</strong>
                    <small>{property.location || "No location"}</small>
                  </span>

                  <span className="table-person-cell">
                    <strong>{property.owner?.name || "No owner"}</strong>
                    <small>{property.owner?.email || "—"}</small>
                  </span>

                  <span className="table-person-cell">
                    <strong>{property.manager?.name || "Unassigned"}</strong>
                    <small>{property.manager?.email || "No manager yet"}</small>
                  </span>

                  <span>{formatPercent(property.metrics.occupancyRate)}</span>
                  <span>{property.metrics.totalUnits}</span>
                  <span>{formatCurrency(property.metrics.monthlyRentPotential)}</span>
                  <span>{formatCurrency(property.metrics.invoiceExposure)}</span>

                  <span
                    className={
                      getPropertyStatusTone(property) === "issue"
                        ? "table-badge-issue"
                        : getPropertyStatusTone(property) === "warn"
                        ? "table-badge-warn"
                        : "table-badge-clear"
                    }
                  >
                    {getPropertyStatusLabel(property)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}