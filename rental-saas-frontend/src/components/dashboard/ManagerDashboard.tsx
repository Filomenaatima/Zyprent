"use client";

import "@/styles/dashboard.css";

type ManagerDashboardResponse = {
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
  alerts?: {
    overdueInvoices?: number;
    openMaintenance?: number;
  };
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
  const managerData = data || {};
  const properties = managerData.properties ?? [];

  const totalUnits = Number(managerData.totalUnits ?? 0);
  const totalResidents = Number(managerData.totalResidents ?? 0);
  const totalProviders = Number(managerData.totalProviders ?? 0);
  const revenue = Number(managerData.revenue ?? 0);

  const overdueInvoices = Number(managerData.alerts?.overdueInvoices ?? 0);
  const openMaintenance = Number(managerData.alerts?.openMaintenance ?? 0);

  const occupiedUnits = properties.reduce((sum, property) => {
    return (
      sum +
      Number(
        property.units?.filter((unit) => unit.status === "OCCUPIED").length ??
          0,
      )
    );
  }, 0);

  const vacantUnits = Math.max(0, totalUnits - occupiedUnits);

  const occupancyRate =
    totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const totalRentBase = properties.reduce((sum, property) => {
    return (
      sum +
      Number(
        property.units?.reduce(
          (unitSum, unit) => unitSum + Number(unit.rentAmount || 0),
          0,
        ) ?? 0,
      )
    );
  }, 0);

  const averageRent = totalUnits > 0 ? totalRentBase / totalUnits : 0;

  const operationalHealth =
    overdueInvoices > 0 || openMaintenance > 0
      ? "Needs attention"
      : vacantUnits > 0
        ? "Stable"
        : "Healthy";

  return (
    <div className="dashboard-page-shell">
      <section className="dashboard-hero-premium">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow">Manager control center</p>
          <h1 className="dashboard-hero-name">Operational oversight</h1>
          <p className="dashboard-hero-text">
            Monitor properties, occupancy, residents, provider activity, rent
            collection, and urgent operational risks from one workspace.
          </p>
        </div>

        <div className="dashboard-hero-chip">
          {loading ? "Loading..." : "Manager overview"}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Portfolio overview</h2>
            <p className="panel-subtitle">
              Live operating summary for assigned properties
            </p>
          </div>
          <button className="panel-chip" type="button">
            Live
          </button>
        </div>

        <div className="dashboard-overview-grid">
          <div className="dashboard-balance-card">
            <p className="dashboard-balance-label">Collected revenue</p>
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
              <p className="dashboard-summary-value">{properties.length}</p>
            </div>

            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Units</p>
              <p className="dashboard-summary-value">{totalUnits}</p>
            </div>

            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Occupied</p>
              <p className="dashboard-summary-value">{occupiedUnits}</p>
            </div>

            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Vacant</p>
              <p className="dashboard-summary-value">{vacantUnits}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Attention required</h2>
            <p className="panel-subtitle">
              Items that need immediate manager action
            </p>
          </div>
          <button className="panel-chip" type="button">
            Alerts
          </button>
        </div>

        <div className="dashboard-signals-grid">
          <button
            type="button"
            className="dashboard-signal-card"
            onClick={() => {
              window.location.href = "/invoices?status=overdue";
            }}
          >
            <p className="dashboard-signal-label">Overdue invoices</p>
            <p className="dashboard-signal-value">{overdueInvoices}</p>
          </button>

          <button
            type="button"
            className="dashboard-signal-card"
            onClick={() => {
              window.location.href = "/maintenance";
            }}
          >
            <p className="dashboard-signal-label">Open maintenance</p>
            <p className="dashboard-signal-value">{openMaintenance}</p>
          </button>

          <button
            type="button"
            className="dashboard-signal-card"
            onClick={() => {
              window.location.href = "/units";
            }}
          >
            <p className="dashboard-signal-label">Vacant units</p>
            <p className="dashboard-signal-value">{vacantUnits}</p>
          </button>

          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Operational health</p>
            <p className="dashboard-signal-value">{operationalHealth}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Operating signals</h2>
            <p className="panel-subtitle">
              Occupancy, rent base, and portfolio capacity
            </p>
          </div>
          <button className="panel-chip" type="button">
            Operations
          </button>
        </div>

        <div className="dashboard-signals-grid">
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Occupancy rate</p>
            <p className="dashboard-signal-value">
              {formatPercent(occupancyRate)}
            </p>
          </div>

          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Average unit rent</p>
            <p className="dashboard-signal-value">
              {formatCurrency(averageRent)}
            </p>
          </div>

          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Monthly rent base</p>
            <p className="dashboard-signal-value">
              {formatCurrency(totalRentBase)}
            </p>
          </div>

          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Provider pool</p>
            <p className="dashboard-signal-value">{totalProviders}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Quick actions</h2>
            <p className="panel-subtitle">
              Jump into daily manager workflows
            </p>
          </div>
          <button className="panel-chip" type="button">
            Actions
          </button>
        </div>

        <div className="dashboard-actions-row">
          <button
            className="btn-primary-small"
            type="button"
            onClick={() => {
              window.location.href = "/properties";
            }}
          >
            View properties
          </button>

          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/units";
            }}
          >
            Manage units
          </button>

          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/maintenance";
            }}
          >
            Maintenance
          </button>

          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/invoices";
            }}
          >
            Invoices
          </button>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Assigned properties</h2>
            <p className="panel-subtitle">
              Property-level occupancy and rent snapshot
            </p>
          </div>
          <button className="panel-chip" type="button">
            {properties.length} active
          </button>
        </div>

        <div className="dashboard-property-table">
          <div className="dashboard-property-head">
            <span>Property</span>
            <span>Units</span>
            <span>Occupied</span>
            <span>Vacant</span>
            <span>Rent base</span>
          </div>

          <div className="dashboard-property-body dashboard-balanced-stack">
            {properties.length === 0 ? (
              <div className="dashboard-property-row dashboard-empty-row">
                <span>No assigned properties found yet</span>
              </div>
            ) : (
              properties.map((property) => {
                const units = property.units ?? [];
                const occupied = units.filter(
                  (unit) => unit.status === "OCCUPIED",
                ).length;
                const vacant = Math.max(0, units.length - occupied);
                const rentBase = units.reduce(
                  (sum, unit) => sum + Number(unit.rentAmount || 0),
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

                    <span>{units.length}</span>
                    <span>{occupied}</span>
                    <span>{vacant}</span>
                    <span>{formatCurrency(rentBase)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}