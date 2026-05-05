"use client";

import "@/styles/dashboard.css";

type ServiceProviderDashboardResponse = {
  message?: string;
  provider?: {
    id?: string;
    name?: string | null;
    companyName?: string | null;
    type?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    verificationStatus?: string | null;
    city?: string | null;
    serviceRadiusKm?: number | null;
  } | null;
  summary?: {
    pendingDispatches?: number;
    activeJobs?: number;
    completedJobs?: number;
    totalPayouts?: number;
    pendingPayouts?: number;
    averageRating?: number;
    responseRate?: number;
    completionRate?: number;
  };
  dispatches?: {
    id: string;
    requestId?: string | null;
    title: string;
    category?: string | null;
    priority?: string | null;
    propertyTitle?: string | null;
    unitNumber?: string | null;
    location?: string | null;
    status?: string | null;
    sentAt?: string | null;
  }[];
  activeAssignments?: {
    id: string;
    title: string;
    category?: string | null;
    priority?: string | null;
    status?: string | null;
    propertyTitle?: string | null;
    unitNumber?: string | null;
    workScheduledAt?: string | null;
    updatedAt?: string | null;
  }[];
  recentPayouts?: {
    id: string;
    totalAmount?: number;
    providerEarning?: number;
    platformFee?: number;
    status?: string | null;
    createdAt: string;
    requestTitle?: string | null;
  }[];
  recentReviews?: {
    id: string;
    rating: number;
    comment?: string | null;
    requestTitle?: string | null;
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

function formatRoleLabel(value?: string | null) {
  return String(value || "Service Provider")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPriority(value?: string | null) {
  const normalized = String(value || "").toUpperCase();

  if (!normalized) return "Standard";
  if (normalized === "EMERGENCY") return "Emergency";
  if (normalized === "HIGH") return "High";
  if (normalized === "MEDIUM") return "Medium";
  if (normalized === "LOW") return "Low";

  return normalized
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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
    value === "VIEWED"
  ) {
    return "blue";
  }

  if (value === "OVERDUE" || value === "FAILED" || value === "DECLINED") {
    return "red";
  }

  return "gray";
}

export default function ProviderDashboard({
  data,
  loading,
  displayName,
}: {
  data: ServiceProviderDashboardResponse | null;
  loading: boolean;
  displayName: string;
}) {
  const providerData = data || {};
  const provider = providerData.provider || {};
  const summary = providerData.summary || {};
  const dispatches = providerData.dispatches || [];
  const activeAssignments = providerData.activeAssignments || [];
  const recentPayouts = providerData.recentPayouts || [];
  const recentReviews = providerData.recentReviews || [];

  const pendingDispatches = Number(summary.pendingDispatches ?? 0);
  const activeJobs = Number(summary.activeJobs ?? 0);
  const completedJobs = Number(summary.completedJobs ?? 0);
  const totalPayouts = Number(summary.totalPayouts ?? 0);
  const pendingPayouts = Number(summary.pendingPayouts ?? 0);
  const averageRating = Number(summary.averageRating ?? provider.rating ?? 0);
  const responseRate = Number(summary.responseRate ?? 0);
  const completionRate = Number(summary.completionRate ?? 0);
  const reviewCount = Number(provider.reviewCount ?? recentReviews.length ?? 0);

  const latestDispatch = dispatches[0];
  const latestActiveJob = activeAssignments[0];
  const latestPayout = recentPayouts[0];
  const latestReview = recentReviews[0];

  return (
    <div className="dashboard-page-shell provider-dashboard-shell">
      <section className="provider-dashboard-top-stack">
        <section className="provider-dashboard-hero">
          <div className="provider-dashboard-hero-copy">
            <p className="provider-dashboard-eyebrow">Service provider hub</p>
            <h1 className="provider-dashboard-title">
              {provider.companyName || displayName}
            </h1>
            <p className="provider-dashboard-text">
              Stay on top of incoming job requests, active work, payouts,
              ratings, and service performance in one premium workspace built
              for fast operations.
            </p>

            <div className="provider-dashboard-hero-tags">
              <span className="provider-hero-tag">
                {formatRoleLabel(provider.type)}
              </span>
              <span
                className={`provider-hero-tag tone-${getStatusTone(
                  provider.verificationStatus,
                )}`}
              >
                {provider.verificationStatus || "Pending"}
              </span>
              <span className="provider-hero-tag">
                {provider.city || "Kampala"}
              </span>
              <span className="provider-hero-tag">
                Radius {provider.serviceRadiusKm ?? 0} km
              </span>
            </div>
          </div>

          <div className="provider-dashboard-hero-side">
            <div className="provider-rating-orb">
              <span className="provider-rating-orb-label">Rating</span>
              <strong className="provider-rating-orb-value">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </strong>
              <span className="provider-rating-orb-meta">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </section>

        <section className="provider-command-board">
          <div className="provider-command-top">
            <div className="provider-command-copy">
              <p className="provider-command-label">Total payouts</p>
              <h2 className="provider-command-value">
                {formatCurrency(totalPayouts)}
              </h2>
              <p className="provider-command-text">
                Pending payout queue: {formatCurrency(pendingPayouts)}
              </p>
            </div>

            <div className="provider-command-actions">
              <button
                className="provider-btn-primary"
                onClick={() => (window.location.href = "/job-requests")}
              >
                Open job requests
              </button>
              <button className="provider-btn-secondary">View payouts</button>
            </div>
          </div>

          <div className="provider-command-stats">
            <div className="provider-command-stat glass">
              <span>Pending dispatches</span>
              <strong>{pendingDispatches}</strong>
            </div>
            <div className="provider-command-stat glass">
              <span>Active jobs</span>
              <strong>{activeJobs}</strong>
            </div>
            <div className="provider-command-stat glass">
              <span>Completed jobs</span>
              <strong>{completedJobs}</strong>
            </div>
            <div className="provider-command-stat glass">
              <span>Completion rate</span>
              <strong>{formatPercent(completionRate)}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="provider-kpi-grid">
        <div className="provider-kpi-card">
          <p className="provider-kpi-label">Response rate</p>
          <p className="provider-kpi-value">{formatPercent(responseRate)}</p>
          <p className="provider-kpi-subtext">
            How quickly you handle incoming dispatches
          </p>
        </div>

        <div className="provider-kpi-card">
          <p className="provider-kpi-label">Average rating</p>
          <p className="provider-kpi-value">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </p>
          <p className="provider-kpi-subtext">
            Based on resident reviews and completed work
          </p>
        </div>

        <div className="provider-kpi-card">
          <p className="provider-kpi-label">Pending payouts</p>
          <p className="provider-kpi-value">
            {formatCurrency(pendingPayouts)}
          </p>
          <p className="provider-kpi-subtext">
            Amount awaiting processing or release
          </p>
        </div>

        <div className="provider-kpi-card">
          <p className="provider-kpi-label">Verification</p>
          <p className="provider-kpi-value">
            {provider.verificationStatus || "Pending"}
          </p>
          <p className="provider-kpi-subtext">
            Keep your profile active and trusted on the platform
          </p>
        </div>
      </section>

      <section className="provider-dashboard-bottom">
        <div className="provider-bottom-row provider-bottom-row-top">
          <section className="provider-panel provider-bottom-card">
            <div className="provider-panel-head">
              <div>
                <h3 className="provider-panel-title">Incoming dispatches</h3>
                <p className="provider-panel-subtitle">
                  New work requests waiting for your response
                </p>
              </div>
              <span
                className={`provider-status-pill ${getStatusTone(
                  latestDispatch?.status,
                )}`}
              >
                {latestDispatch?.status || "No dispatches"}
              </span>
            </div>

            {latestDispatch ? (
              <div className="provider-dispatch-card">
                <div className="provider-dispatch-main">
                  <h4>{latestDispatch.title}</h4>
                  <p>
                    {latestDispatch.propertyTitle || "Property"}
                    {latestDispatch.unitNumber
                      ? ` · Unit ${latestDispatch.unitNumber}`
                      : ""}
                  </p>
                </div>

                <div className="provider-dispatch-meta">
                  <div>
                    <span>Category</span>
                    <strong>{latestDispatch.category || "General"}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{formatPriority(latestDispatch.priority)}</strong>
                  </div>
                  <div>
                    <span>Location</span>
                    <strong>{latestDispatch.location || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Sent</span>
                    <strong>
                      {latestDispatch.sentAt
                        ? formatDate(latestDispatch.sentAt)
                        : "Today"}
                    </strong>
                  </div>
                </div>

                <div className="provider-inline-actions">
                  <button className="provider-btn-primary">Respond now</button>
                  <button className="provider-btn-secondary">Open quotes</button>
                </div>
              </div>
            ) : (
              <div className="provider-empty-state">
                No incoming job requests right now.
              </div>
            )}
          </section>

          <section className="provider-panel provider-bottom-card">
            <div className="provider-panel-head">
              <div>
                <h3 className="provider-panel-title">Active work</h3>
                <p className="provider-panel-subtitle">
                  Job currently in progress and requiring attention
                </p>
              </div>
              <span
                className={`provider-status-pill ${getStatusTone(
                  latestActiveJob?.status,
                )}`}
              >
                {latestActiveJob?.status || "No active jobs"}
              </span>
            </div>

            {latestActiveJob ? (
              <div className="provider-active-card">
                <h4>{latestActiveJob.title}</h4>
                <p>
                  {latestActiveJob.propertyTitle || "Property"}
                  {latestActiveJob.unitNumber
                    ? ` · Unit ${latestActiveJob.unitNumber}`
                    : ""}
                </p>

                <div className="provider-active-meta">
                  <div>
                    <span>Category</span>
                    <strong>{latestActiveJob.category || "General"}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{formatPriority(latestActiveJob.priority)}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>
                      {latestActiveJob.updatedAt
                        ? formatDate(latestActiveJob.updatedAt)
                        : "Today"}
                    </strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>
                      {latestActiveJob.workScheduledAt
                        ? formatDate(latestActiveJob.workScheduledAt)
                        : "Not set"}
                    </strong>
                  </div>
                </div>

                <div className="provider-inline-actions">
                  <button className="provider-btn-primary">
                    Update progress
                  </button>
                  <button className="provider-btn-secondary">
                    View completed jobs
                  </button>
                </div>
              </div>
            ) : (
              <div className="provider-empty-state">
                No jobs are currently in progress.
              </div>
            )}
          </section>

          <section className="provider-panel provider-bottom-card">
            <div className="provider-panel-head">
              <div>
                <h3 className="provider-panel-title">Latest payout</h3>
                <p className="provider-panel-subtitle">
                  Most recent payout released to your account
                </p>
              </div>
            </div>

            {latestPayout ? (
              <div className="provider-payout-card">
                <p className="provider-payout-amount">
                  {formatCurrency(
                    Number(
                      latestPayout.providerEarning ??
                        latestPayout.totalAmount ??
                        0,
                    ),
                  )}
                </p>
                <p className="provider-payout-title">
                  {latestPayout.requestTitle || "Maintenance payout"}
                </p>
                <p className="provider-payout-subtitle">
                  Fee: {formatCurrency(Number(latestPayout.platformFee ?? 0))}
                </p>
                <div className="provider-payout-row">
                  <span>Status</span>
                  <strong>{latestPayout.status || "Processing"}</strong>
                </div>
                <div className="provider-payout-row">
                  <span>Date</span>
                  <strong>{formatDate(latestPayout.createdAt)}</strong>
                </div>
              </div>
            ) : (
              <div className="provider-empty-state">No payout records yet.</div>
            )}
          </section>
        </div>

        <div className="provider-bottom-row provider-bottom-row-bottom">
          <section className="provider-panel provider-bottom-card provider-review-wide">
            <div className="provider-panel-head">
              <div>
                <h3 className="provider-panel-title">Latest review</h3>
                <p className="provider-panel-subtitle">
                  Recent feedback from completed work
                </p>
              </div>
            </div>

            {latestReview ? (
              <div className="provider-review-card">
                <div className="provider-review-top">
                  <p className="provider-review-rating">
                    {latestReview.rating}/5
                  </p>
                  <span className="provider-status-pill green">Verified</span>
                </div>
                <p className="provider-review-title">
                  {latestReview.requestTitle || "Completed request"}
                </p>
                <p className="provider-review-text">
                  {latestReview.comment || "No written review was added."}
                </p>
                <p className="provider-review-time">
                  {formatDate(latestReview.createdAt)}
                </p>
              </div>
            ) : (
              <div className="provider-empty-state">No reviews yet.</div>
            )}
          </section>

          <section className="provider-panel provider-bottom-card provider-quick-card">
            <div className="provider-panel-head">
              <div>
                <h3 className="provider-panel-title">Quick metrics</h3>
                <p className="provider-panel-subtitle">
                  Snapshot of your provider account
                </p>
              </div>
            </div>

            <div className="provider-quick-list">
              <div className="provider-quick-row">
                <span>Pending dispatches</span>
                <strong>{pendingDispatches}</strong>
              </div>
              <div className="provider-quick-row">
                <span>Active jobs</span>
                <strong>{activeJobs}</strong>
              </div>
              <div className="provider-quick-row">
                <span>Completed jobs</span>
                <strong>{completedJobs}</strong>
              </div>
              <div className="provider-quick-row">
                <span>Total payouts</span>
                <strong>{formatCurrency(totalPayouts)}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}