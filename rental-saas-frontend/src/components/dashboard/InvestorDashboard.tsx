"use client";

import "@/styles/dashboard.css";

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
    totalProfitEarned?: number;
    totalAllocatedExpenses?: number;
    netProfit?: number;
    roi?: number;
    propertyCount: number;
    activeListings: number;
    pendingWithdrawals: number;
    totalShares?: number;
    avgOccupancy?: number;
    activeMaintenance?: number;
  };
  propertySnapshots?: {
    propertyId: string;
    title: string;
    location?: string | null;
    sharesOwned: number;
    amountPaid: number;
    totalInvested?: number;
    profitEarned?: number;
    allocatedExpenses?: number;
    netProfit?: number;
    roi?: number;
    pricePerShare: number;
    activeMaintenanceCount: number;
    units: number;
    occupiedUnits: number;
    occupancyRate: number;
  }[];
  recentActivity?: {
    id: string;
    type: string;
    direction?: "IN" | "OUT";
    title: string;
    subtitle: string;
    amount: number;
    reference?: string | null;
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

function getActivityAmountClass(direction?: string) {
  if (direction === "OUT") return "amount-negative";
  return "amount-positive";
}

function getActivityPrefix(direction?: string) {
  if (direction === "OUT") return "-";
  if (direction === "IN") return "+";
  return "";
}

export default function InvestorDashboard({
  data,
  loading,
  displayName,
}: {
  data: InvestorDashboardResponse | null;
  loading: boolean;
  displayName: string;
}) {
  const investorData = data || {};
  const summary = investorData.summary;
  const properties = investorData.propertySnapshots || [];
  const recentActivity = investorData.recentActivity || [];
  const notifications = investorData.notifications || [];

  const walletBalance = Number(summary?.walletBalance ?? 0);
  const totalInvested = Number(summary?.totalInvested ?? 0);
  const totalProfit = Number(summary?.totalProfit ?? summary?.netProfit ?? 0);
  const totalProfitEarned = Number(summary?.totalProfitEarned ?? 0);
  const totalAllocatedExpenses = Number(summary?.totalAllocatedExpenses ?? 0);
  const roi = Number(summary?.roi ?? 0);
  const propertyCount = Number(summary?.propertyCount ?? 0);

  const avgOccupancy = Number(
    summary?.avgOccupancy ??
      (properties.length > 0
        ? properties.reduce(
            (sum, item) => sum + Number(item.occupancyRate || 0),
            0,
          ) / properties.length
        : 0),
  );

  const totalShares = Number(
    summary?.totalShares ??
      properties.reduce((sum, item) => sum + Number(item.sharesOwned || 0), 0),
  );

  const activeMaintenance = Number(
    summary?.activeMaintenance ??
      properties.reduce(
        (sum, item) => sum + Number(item.activeMaintenanceCount || 0),
        0,
      ),
  );

  const unreadAlerts = notifications.filter((item) => !item.isRead).length;

  const portfolioHealth =
    roi >= 15 ? "Strong" : roi >= 8 ? "Healthy" : roi > 0 ? "Stable" : "Early";

  return (
    <div className="dashboard-page-shell">
      <section className="dashboard-hero-premium">
        <div className="dashboard-hero-copy">
          <p className="dashboard-hero-eyebrow">Investor dashboard</p>
          <h1 className="dashboard-hero-name">{displayName}</h1>
          <p className="dashboard-hero-text">
            Your capital, realized returns, expenses, and portfolio performance
            in one view.
          </p>
        </div>

        <div className="dashboard-hero-chip">
          {loading ? "Loading..." : "Live portfolio"}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Portfolio overview</h2>
            <p className="panel-subtitle">
              Backend-tracked investment position and net return
            </p>
          </div>
          <button className="panel-chip">Live</button>
        </div>

        <div className="dashboard-overview-grid">
          <div className="dashboard-balance-card">
            <p className="dashboard-balance-label">Wallet balance</p>
            <h3 className="dashboard-balance-value">
              {formatCurrency(walletBalance)}
            </h3>

            <div className="dashboard-balance-bottom">
              <div>
                <p className="dashboard-balance-meta-label">Invested</p>
                <p className="dashboard-balance-meta-value">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <div>
                <p className="dashboard-balance-meta-label">Net Profit</p>
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
            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Properties</p>
              <p className="dashboard-summary-value">{propertyCount}</p>
            </div>
            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Active listings</p>
              <p className="dashboard-summary-value">
                {summary?.activeListings ?? 0}
              </p>
            </div>
            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Withdrawals</p>
              <p className="dashboard-summary-value">
                {summary?.pendingWithdrawals ?? 0}
              </p>
            </div>
            <div className="dashboard-summary-card">
              <p className="dashboard-summary-label">Alerts</p>
              <p className="dashboard-summary-value">{unreadAlerts}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Return breakdown</h2>
            <p className="panel-subtitle">
              Gross distributions minus allocated expenses
            </p>
          </div>
          <button className="panel-chip">Finance</button>
        </div>

        <div className="dashboard-signals-grid">
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Gross Profit Earned</p>
            <p className="dashboard-signal-value">
              {formatCurrency(totalProfitEarned)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Allocated Expenses</p>
            <p className="dashboard-signal-value">
              {formatCurrency(totalAllocatedExpenses)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Net Profit</p>
            <p className="dashboard-signal-value">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Net ROI</p>
            <p className="dashboard-signal-value">{formatPercent(roi)}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Portfolio health</h2>
            <p className="panel-subtitle">
              Health, occupancy, and operational risk across your portfolio
            </p>
          </div>
          <button className="panel-chip">Health</button>
        </div>

        <div className="dashboard-signals-grid">
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Health</p>
            <p className="dashboard-signal-value">{portfolioHealth}</p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Avg occupancy</p>
            <p className="dashboard-signal-value">
              {formatPercent(avgOccupancy)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Maintenance load</p>
            <p className="dashboard-signal-value">{activeMaintenance}</p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Total shares</p>
            <p className="dashboard-signal-value">{totalShares}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Capital actions</h2>
            <p className="panel-subtitle">
              Quick actions for your investor account
            </p>
          </div>
          <button className="panel-chip">Actions</button>
        </div>

        <div className="dashboard-actions-row">
          <button
            className="btn-primary-small"
            type="button"
            onClick={() => {
              window.location.href = "/wallet";
            }}
          >
            Top up wallet
          </button>
          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/wallet";
            }}
          >
            Withdraw funds
          </button>
          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/portfolio";
            }}
          >
            View portfolio
          </button>
          <button
            className="btn-secondary-small"
            type="button"
            onClick={() => {
              window.location.href = "/profit-center";
            }}
          >
            Profit center
          </button>
        </div>
      </section>

      <section className="dashboard-bottom-grid dashboard-bottom-grid-upgraded">
        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-activity">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Recent activity</h2>
              <p className="panel-subtitle">Latest capital movement</p>
            </div>
            <div className="tiny-action-row">
              <button className="tiny-btn sky" type="button">
                Print
              </button>
              <button className="tiny-btn blue" type="button">
                Share
              </button>
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
                    {item.reference ? (
                      <p className="dashboard-activity-subtitle">
                        Ref: {item.reference}
                      </p>
                    ) : null}
                    <p className="dashboard-activity-time">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <p className={getActivityAmountClass(item.direction)}>
                    {getActivityPrefix(item.direction)}{" "}
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))
            )}
          </div>

          <button
            className="show-all-button"
            type="button"
            onClick={() => {
              window.location.href = "/transactions";
            }}
          >
            Show all transactions
          </button>
        </div>

        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-signals">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Investor signals</h2>
              <p className="panel-subtitle">Portfolio intelligence snapshot</p>
            </div>
            <button className="panel-chip">Live</button>
          </div>

          <div className="dashboard-alert-stack dashboard-balanced-stack">
            {notifications.length === 0 ? (
              <div className="dashboard-alert-row dashboard-empty-row">
                <p className="dashboard-alert-title">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 2).map((item) => (
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

          <div className="dashboard-insights-strip">
            <div className="dashboard-insight-card positive">
              <p className="dashboard-insight-label">ROI</p>
              <p className="dashboard-insight-value">{formatPercent(roi)}</p>
            </div>
            <div className="dashboard-insight-card">
              <p className="dashboard-insight-label">Active listings</p>
              <p className="dashboard-insight-value">
                {summary?.activeListings ?? 0}
              </p>
            </div>
            <div className="dashboard-insight-card">
              <p className="dashboard-insight-label">Withdrawals</p>
              <p className="dashboard-insight-value">
                {summary?.pendingWithdrawals ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-panel dashboard-bottom-card dashboard-bottom-card-properties">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Properties & activity</h2>
              <p className="panel-subtitle">
                Your invested properties at a glance
              </p>
            </div>
            <button
              className="panel-chip"
              type="button"
              onClick={() => {
                window.location.href = "/portfolio";
              }}
            >
              View all
            </button>
          </div>

          <div className="dashboard-property-table">
            <div className="dashboard-property-head">
              <span>Property</span>
              <span>Shares</span>
              <span>Invested</span>
              <span>Occupancy</span>
              <span>Net ROI</span>
            </div>

            <div className="dashboard-property-body dashboard-balanced-stack">
              {properties.length === 0 ? (
                <div className="dashboard-property-row dashboard-empty-row">
                  <span>No properties found yet</span>
                </div>
              ) : (
                properties.slice(0, 3).map((property) => (
                  <div
                    key={property.propertyId}
                    className="dashboard-property-row"
                  >
                    <div>
                      <p className="dashboard-property-title">{property.title}</p>
                      <p className="dashboard-property-subtitle">
                        {property.location || "No location"}
                      </p>
                    </div>

                    <span>{property.sharesOwned}</span>
                    <span>{formatCurrency(property.amountPaid)}</span>
                    <span>{formatPercent(property.occupancyRate)}</span>
                    <span>{formatPercent(Number(property.roi ?? 0))}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-actions-row dashboard-actions-row-bottom">
            <button
              className="btn-secondary-small"
              type="button"
              onClick={() => {
                window.location.href = "/portfolio";
              }}
            >
              View portfolio
            </button>
            <button
              className="btn-secondary-small"
              type="button"
              onClick={() => {
                window.location.href = "/profit-center";
              }}
            >
              Go to profit center
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}