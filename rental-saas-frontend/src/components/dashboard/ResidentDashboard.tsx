"use client";

import "@/styles/dashboard.css";

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
    openInvoiceCount?: number;
  };
  unitSnapshot?: {
    propertyId?: string | null;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
    unitId?: string | null;
    unitNumber?: string | null;
    residentStatus?: string | null;
  } | null;
  currentInvoices?: {
    id: string;
    kind?: string | null;
    kindLabel?: string | null;
    period?: string | null;
    dueDate?: string | null;
    status?: string | null;
    totalAmount?: number;
    paidAmount?: number;
    outstandingAmount?: number;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
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
  }[];
  recentTransactions?: {
    id: string;
    type?: string;
    kind?: string | null;
    kindLabel?: string | null;
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

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
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
  return String(value || "Unknown").replaceAll("_", " ");
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
    value === "VIEWED" ||
    value === "ISSUED"
  ) {
    return "blue";
  }

  if (value === "OVERDUE" || value === "FAILED" || value === "DECLINED") {
    return "red";
  }

  return "gray";
}

function getInvoiceAccent(status?: string | null) {
  const value = String(status || "").toUpperCase();

  if (value === "OVERDUE") return "overdue";
  if (value === "ISSUED" || value === "PENDING" || value === "PARTIALLY_PAID") {
    return "active";
  }
  if (value === "PAID") return "settled";

  return "neutral";
}

export default function ResidentDashboard({
  data,
  loading,
  displayName,
}: {
  data: ResidentDashboardResponse | null;
  loading: boolean;
  displayName: string;
}) {
  const residentData = data || {};
  const summary = residentData.summary || {};
  const unitSnapshot = residentData.unitSnapshot || {};
  const currentInvoices = residentData.currentInvoices || [];
  const maintenanceRequests = residentData.maintenanceRequests || [];
  const notifications = residentData.notifications || [];
  const recentTransactions = residentData.recentTransactions || [];

  const walletBalance = Number(summary.walletBalance ?? 0);
  const currentDue = Number(summary.currentDue ?? 0);
  const outstandingAmount = Number(summary.outstandingAmount ?? 0);
  const openMaintenanceCount = Number(summary.openMaintenanceCount ?? 0);
  const unreadNotifications = Number(summary.unreadNotifications ?? 0);
  const openInvoiceCount = Number(summary.openInvoiceCount ?? 0);

  const latestMaintenance = maintenanceRequests[0];
  const latestTransaction = recentTransactions[0];
  const latestNotification = notifications[0];

  const nextDueInvoice = currentInvoices.find((invoice) => invoice.dueDate) || currentInvoices[0];

  const overdueCount = currentInvoices.filter(
    (invoice) => String(invoice.status || "").toUpperCase() === "OVERDUE",
  ).length;

  const upcomingCount = Math.max(openInvoiceCount - overdueCount, 0);

  const walletCoverage =
    outstandingAmount > 0 ? Math.min(Math.round((walletBalance / outstandingAmount) * 100), 100) : 100;

  return (
    <div className="dashboard-page-shell compact-dashboard-shell">
      <section className="resident-dashboard-hero">
        <div className="resident-dashboard-hero-copy">
          <p className="resident-dashboard-eyebrow">Resident home</p>
          <h1 className="resident-dashboard-title">
            Welcome home, {residentData.profile?.name || displayName}
          </h1>
          <p className="resident-dashboard-text">
            Track your rent, service charge, garbage bills, unit details,
            maintenance requests, and important updates in one calm, personal
            space.
          </p>
        </div>

        <div className="resident-dashboard-badge">
          {loading ? "Loading your account..." : "Resident overview"}
        </div>
      </section>

      <section className="resident-dashboard-grid">
        <div className="resident-dashboard-main">
          <section className="resident-panel resident-billboard premium">
            <div className="resident-billboard-left">
              <p className="resident-billboard-label">Current outstanding</p>

              <h2 className="resident-billboard-value large">
                {formatCurrency(outstandingAmount)}
              </h2>

              <p className="resident-billboard-text">
                {nextDueInvoice?.dueDate
                  ? `Next due on ${formatDate(nextDueInvoice.dueDate)}`
                  : "You’re fully settled — no payments due"}
              </p>

              {outstandingAmount > 0 ? (
                <p className="resident-billboard-insight">
                  {walletBalance >= outstandingAmount
                    ? "Your wallet can fully cover your outstanding balance."
                    : `Your wallet covers ${walletCoverage}% of your outstanding balance.`}
                </p>
              ) : (
                <p className="resident-billboard-insight">
                  Your account is currently clear.
                </p>
              )}

              <div className="resident-billboard-actions">
                <button className="btn-primary-small">Open payments</button>
                <button className="btn-secondary-small">View invoices</button>
              </div>
            </div>

            <div className="resident-billboard-right">
              <div className="resident-mini-stat glass">
                <span>Wallet</span>
                <strong>{formatCurrency(walletBalance)}</strong>
              </div>

              <div className="resident-mini-stat glass">
                <span>Outstanding</span>
                <strong>{formatCurrency(outstandingAmount)}</strong>
              </div>

              <div className="resident-mini-stat glass">
                <span>Open invoices</span>
                <strong>{openInvoiceCount}</strong>
              </div>

              <div className="resident-mini-stat glass">
                <span>Invoice status</span>
                <strong>
                  {overdueCount > 0
                    ? `${overdueCount} overdue`
                    : `${upcomingCount} active`}
                </strong>
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
              <p className="resident-kpi-value">{unitSnapshot.unitNumber || "—"}</p>
              <p className="resident-kpi-subtext">
                Status: {formatStatus(unitSnapshot.residentStatus)}
              </p>
            </div>

            <div className="resident-kpi-card">
              <p className="resident-kpi-label">Maintenance</p>
              <p className="resident-kpi-value">{openMaintenanceCount}</p>
              <p className="resident-kpi-subtext">
                Requests currently being handled
              </p>
            </div>

            <div className="resident-kpi-card">
              <p className="resident-kpi-label">Unread alerts</p>
              <p className="resident-kpi-value">{unreadNotifications}</p>
              <p className="resident-kpi-subtext">
                Account updates waiting for review
              </p>
            </div>
          </section>

          <section className="resident-content-grid">
            <div className="resident-panel resident-equal-card">
              <div className="resident-panel-head">
                <div>
                  <h3 className="resident-panel-title">Open invoices</h3>
                  <p className="resident-panel-subtitle">
                    Rent, garbage, and service charge are shown separately
                  </p>
                </div>
                <span className="resident-status-pill blue">
                  {openInvoiceCount} open
                </span>
              </div>

              {currentInvoices.length > 0 ? (
                <div className="resident-invoice-card">
                  {currentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`resident-invoice-row invoice-${getInvoiceAccent(invoice.status)}`}
                    >
                      <div className="resident-invoice-copy">
                        <span className="resident-invoice-title">
                          {invoice.kindLabel || "Invoice"}
                        </span>
                        <div className="resident-invoice-meta">
                          {invoice.period || "—"}
                          {invoice.dueDate
                            ? ` • Due ${formatDate(invoice.dueDate)}`
                            : ""}
                        </div>
                      </div>

                      <div className="resident-invoice-amount">
                        <strong>
                          {formatCurrency(Number(invoice.outstandingAmount ?? 0))}
                        </strong>
                        <div className="resident-invoice-status">
                          <span
                            className={`resident-status-pill ${getStatusTone(
                              invoice.status,
                            )}`}
                          >
                            {formatStatus(invoice.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="resident-invoice-row highlight">
                    <span>Total outstanding</span>
                    <strong>{formatCurrency(outstandingAmount)}</strong>
                  </div>
                </div>
              ) : (
                <div className="resident-empty-state">
                  No open invoices at the moment.
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
                  {latestMaintenance?.status
                    ? formatStatus(latestMaintenance.status)
                    : "No active request"}
                </span>
              </div>

              {latestMaintenance ? (
                <div className="resident-maintenance-card">
                  <h4>{latestMaintenance.title}</h4>
                  <p>{latestMaintenance.description || "No description"}</p>

                  <div className="resident-maintenance-meta">
                    <div>
                      <span>Category</span>
                      <strong>{formatStatus(latestMaintenance.category)}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{formatStatus(latestMaintenance.priority)}</strong>
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

                  <div className="resident-inline-actions">
                    <button className="btn-primary-small">Follow up</button>
                    <button className="btn-secondary-small">View details</button>
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
                <h3 className="resident-panel-title muted">Notifications</h3>
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
              <div className="resident-empty-state">No notifications yet.</div>
            )}
          </section>

          <section className="resident-panel resident-side-panel resident-quick-panel">
            <div className="resident-panel-head">
              <div>
                <h3 className="resident-panel-title">Quick actions</h3>
                <p className="resident-panel-subtitle">
                  Common resident tasks
                </p>
              </div>
            </div>

            <div className="resident-actions">
              <button className="btn-primary-small">Pay rent</button>
              <button className="btn-secondary-small">View receipts</button>
              <button className="btn-secondary-small">Request maintenance</button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}