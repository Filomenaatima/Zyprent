"use client";

import { useMemo } from "react";

type ManagerDashboardResponse = {
  message?: string;
  properties: {
    id: string;
    title: string;
    location: string | null;
    units: {
      id: string;
      status: "VACANT" | "OCCUPIED";
      rentAmount: number;
    }[];
  }[];
  totalUnits: number;
  totalResidents: number;
  totalProviders: number;
  revenue: number;
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function ManagerDashboard({
  data,
  loading,
}: {
  data: ManagerDashboardResponse | null;
  loading: boolean;
}) {
  const properties = data?.properties ?? [];

  const propertyCount = properties.length;

  const occupiedUnits = useMemo(() => {
    return properties.reduce(
      (sum, property) =>
        sum +
        property.units.filter((unit) => unit.status === "OCCUPIED").length,
      0,
    );
  }, [properties]);

  const vacantUnits = Math.max(0, Number(data?.totalUnits ?? 0) - occupiedUnits);

  const occupancyRate =
    Number(data?.totalUnits ?? 0) > 0
      ? (occupiedUnits / Number(data?.totalUnits ?? 0)) * 100
      : 0;

  const avgUnitsPerProperty =
    propertyCount > 0 ? Number(data?.totalUnits ?? 0) / propertyCount : 0;

  const topProperties = properties.slice(0, 4).map((property) => {
    const totalUnits = property.units.length;
    const occupied = property.units.filter((unit) => unit.status === "OCCUPIED").length;
    const occupancy = totalUnits > 0 ? (occupied / totalUnits) * 100 : 0;
    const rentRoll = property.units.reduce(
      (sum, unit) => sum + Number(unit.rentAmount || 0),
      0,
    );

    return {
      id: property.id,
      title: property.title,
      location: property.location || "No location",
      totalUnits,
      occupied,
      occupancy,
      rentRoll,
    };
  });

  const summaryCards = [
    { label: "Properties", value: String(propertyCount).padStart(2, "0") },
    { label: "Units", value: String(data?.totalUnits ?? 0).padStart(2, "0") },
    { label: "Residents", value: String(data?.totalResidents ?? 0).padStart(2, "0") },
    { label: "Providers", value: String(data?.totalProviders ?? 0).padStart(2, "0") },
  ];

  const performanceCards = [
    { label: "Occupancy Rate", value: formatPercent(occupancyRate) },
    { label: "Occupied Units", value: occupiedUnits.toLocaleString() },
    { label: "Vacant Units", value: vacantUnits.toLocaleString() },
    { label: "Avg Units / Property", value: avgUnitsPerProperty.toFixed(1) },
  ];

  const signalCards = [
    { label: "Revenue", value: formatCurrency(data?.revenue ?? 0) },
    { label: "Total Properties", value: propertyCount },
    { label: "Residents", value: data?.totalResidents ?? 0 },
    { label: "Providers", value: data?.totalProviders ?? 0 },
  ];

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
              {formatCurrency(data?.revenue ?? 0)}
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
                  {data?.totalResidents ?? 0}
                </p>
              </div>
              <div>
                <p className="dashboard-balance-meta-label">Providers</p>
                <p className="dashboard-balance-meta-value">
                  {data?.totalProviders ?? 0}
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
            {!topProperties.length ? (
              <div className="dashboard-activity-row dashboard-empty-row">
                <p className="dashboard-activity-title">No managed properties yet</p>
              </div>
            ) : (
              topProperties.map((item) => (
                <div key={item.id} className="dashboard-activity-row">
                  <div className="dashboard-activity-copy">
                    <p className="dashboard-activity-title">{item.title}</p>
                    <p className="dashboard-activity-subtitle">{item.location}</p>
                    <p className="dashboard-activity-time">
                      {item.occupied}/{item.totalUnits} occupied · {formatPercent(item.occupancy)}
                    </p>
                  </div>
                  <p className="amount-positive">{formatCurrency(item.rentRoll)}</p>
                </div>
              ))
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
            {signalCards.map((item) => (
              <div key={item.label} className="dashboard-signal-card">
                <p className="dashboard-signal-label">{item.label}</p>
                <p className="dashboard-signal-value">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-insights-strip">
            <div className="dashboard-insight-card positive">
              <p className="dashboard-insight-label">Occupancy</p>
              <p className="dashboard-insight-value">{formatPercent(occupancyRate)}</p>
            </div>
            <div className="dashboard-insight-card">
              <p className="dashboard-insight-label">Vacant Units</p>
              <p className="dashboard-insight-value">{vacantUnits}</p>
            </div>
            <div className="dashboard-insight-card">
              <p className="dashboard-insight-label">Asset Spread</p>
              <p className="dashboard-insight-value">{propertyCount} Assets</p>
            </div>
          </div>

          <div className="dashboard-alert-stack dashboard-balanced-stack">
            <div className="dashboard-alert-row">
              <div>
                <p className="dashboard-alert-title">Operations summary</p>
                <p className="dashboard-alert-text">
                  Monitor occupancy, provider coverage, property count, and revenue flow.
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
              <p className="panel-subtitle">Current property spread and occupancy</p>
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
              {!topProperties.length ? (
                <div className="dashboard-property-row dashboard-empty-row">
                  <span>No properties found yet</span>
                </div>
              ) : (
                topProperties.map((property) => (
                  <div key={property.id} className="dashboard-property-row">
                    <div>
                      <p className="dashboard-property-title">{property.title}</p>
                      <p className="dashboard-property-subtitle">
                        {property.location}
                      </p>
                    </div>

                    <span>{property.totalUnits}</span>
                    <span>{property.occupied}</span>
                    <span>{formatPercent(property.occupancy)}</span>
                    <span>{formatCurrency(property.rentRoll)}</span>
                  </div>
                ))
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