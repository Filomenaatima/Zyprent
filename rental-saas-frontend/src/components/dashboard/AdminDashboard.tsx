"use client";

import "@/styles/dashboard.css";

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

export default function AdminDashboard({
  data,
  loading,
}: {
  data: AdminDashboardResponse | null;
  loading: boolean;
}) {
  const adminData = data || {};

  const stats = adminData.stats || {
    properties: 0,
    investors: 0,
    residents: 0,
    managers: 0,
    providers: 0,
  };

  const system = adminData.system || {
    pendingApprovals: 0,
    activeMaintenance: 0,
    pendingInvoices: 0,
    unreadNotifications: 0,
  };

  const finance = adminData.finance || {
    totalRevenue: 0,
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

  const formatMoneyValue = (value?: number | null) => {
    const amount = zeroSafe(value);
    return `UGX ${amount.toLocaleString()}`;
  };

  const roleMix = [
    { label: "Investors", value: zeroSafe(stats.investors), tone: "blue" },
    { label: "Residents", value: zeroSafe(stats.residents), tone: "green" },
    { label: "Managers", value: zeroSafe(stats.managers), tone: "violet" },
    { label: "Providers", value: zeroSafe(stats.providers), tone: "amber" },
  ];

  const quickActions = [
    { label: "Open users", href: "/users" },
    { label: "Open properties", href: "/properties" },
    { label: "Open approvals", href: "/approvals" },
    { label: "Open reports", href: "/reports" },
  ];

  const attentionCards = [
    {
      label: "Pending approvals",
      value: zeroSafe(system.pendingApprovals),
      helper: "Providers awaiting review",
    },
    {
      label: "Active maintenance",
      value: zeroSafe(system.activeMaintenance),
      helper: "Jobs currently in motion",
    },
    {
      label: "Pending invoices",
      value: zeroSafe(system.pendingInvoices),
      helper: "Open rent invoices needing settlement",
    },
    {
      label: "Unread notifications",
      value: zeroSafe(system.unreadNotifications),
      helper: "System alerts awaiting attention",
    },
  ];

  const platformCards = [
    {
      label: "Properties",
      value: formatMetricValue(stats.properties),
    },
    {
      label: "Investors",
      value: formatMetricValue(stats.investors),
    },
    {
      label: "Residents",
      value: formatMetricValue(stats.residents),
    },
    {
      label: "Providers",
      value: formatMetricValue(stats.providers),
    },
  ];

  return (
    <div className="dashboard-page-shell admin-dashboard-shell">
      <section className="admin-hero-panel">
        <div className="admin-hero-copy">
          <p className="admin-hero-eyebrow">Platform command center</p>
          <h1 className="admin-hero-title">Admin overview</h1>
          <p className="admin-hero-text">
            Control the full Zyprent system across users, operations, finance,
            and platform health.
          </p>
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

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2 className="panel-title">Executive command</h2>
        </div>

        <div className="admin-command-stats">
          {platformCards.map((item) => (
            <div key={item.label} className="admin-command-stat">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="dashboard-actions-row">
          {quickActions.map((item) => (
            <button
              key={item.href}
              className="btn-secondary-small"
              onClick={() => (window.location.href = item.href)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2 className="panel-title">Platform health</h2>
        </div>

        <div className="admin-command-stats">
          {attentionCards.map((item) => (
            <div key={item.label} className="admin-command-stat">
              <span>{item.label}</span>
              <strong>{formatMetricValue(item.value)}</strong>
              <small>{item.helper}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <p className="admin-kpi-label">Collected revenue</p>
          <p className="admin-kpi-value">
            {formatMoneyValue(finance.totalRevenue)}
          </p>
          <p className="admin-kpi-subtext">Total recorded payments on platform</p>
        </div>

        {roleMix.map((item) => {
          const share = totalUsers > 0 ? (item.value / totalUsers) * 100 : 0;

          return (
            <div key={item.label} className="admin-kpi-card">
              <p className="admin-kpi-label">{item.label}</p>
              <p className="admin-kpi-value">
                {formatMetricValue(item.value)}
              </p>
              <p className="admin-kpi-subtext">
                {share.toFixed(1)}% of users
              </p>
            </div>
          );
        })}
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2 className="panel-title">System summary</h2>
        </div>

        <div className="dashboard-signals-grid">
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Managers</p>
            <p className="dashboard-signal-value">
              {formatMetricValue(stats.managers)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Properties</p>
            <p className="dashboard-signal-value">
              {formatMetricValue(stats.properties)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Maintenance load</p>
            <p className="dashboard-signal-value">
              {formatMetricValue(system.activeMaintenance)}
            </p>
          </div>
          <div className="dashboard-signal-card">
            <p className="dashboard-signal-label">Revenue</p>
            <p className="dashboard-signal-value">
              {formatMoneyValue(finance.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="dashboard-alert-stack dashboard-balanced-stack">
          <div className="dashboard-alert-row">
            <div>
              <p className="dashboard-alert-title">Live admin surface</p>
              <p className="dashboard-alert-text">
                This dashboard is now driven by real stats, live system counts,
                and platform revenue from backend data.
              </p>
            </div>
            <span className="status-badge badge-blue">
              {loading ? "Loading..." : "Live"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}