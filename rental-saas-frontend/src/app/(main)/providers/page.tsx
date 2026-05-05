"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import "@/styles/providers.css";

type ProviderVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | string;

type Provider = {
  id: string;
  type: string;
  city?: string | null;
  companyName?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
  verificationStatus: ProviderVerificationStatus;
  rating?: number | null;
  reviewCount?: number;
  assignmentCount?: number;
  dispatchCount?: number;
  quoteCount?: number;
  payoutCount?: number;
  createdAt?: string;
  user: {
    id?: string;
    name: string;
    email?: string | null;
    phone: string;
  };
};

type ProviderSummary = {
  totalProviders: number;
  activeProviders: number;
  verifiedProviders: number;
  pendingVerificationProviders: number;
  inactiveProviders: number;
  avgRating: number;
  totalReviews: number;
  totalAssignments: number;
  totalQuotes: number;
  totalPayouts: number;
  providersByType: Record<string, number>;
};

const typeOptions = [
  "ALL",
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "SECURITY",
  "PAINTING",
  "HVAC",
  "CARPENTRY",
  "GENERAL",
];

function formatVerification(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getVerificationTone(status: string) {
  if (status === "VERIFIED") return "verified";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function formatTypeLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [summary, setSummary] = useState<ProviderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {
        includeInactive: "true",
      };

      if (typeFilter !== "ALL") params.type = typeFilter;
      if (verificationFilter !== "ALL") {
        params.verificationStatus = verificationFilter;
      }

      const [providersRes, summaryRes] = await Promise.all([
        api.get("/service-providers", { params }),
        api.get("/service-providers/summary"),
      ]);

      const rows: Provider[] = providersRes.data ?? [];
      setProviders(rows);
      setSummary(summaryRes.data ?? null);

      setSelected((current) => {
        if (!rows.length) return null;
        if (!current) return rows[0];
        return rows.find((p) => p.id === current.id) ?? rows[0];
      });
    } catch (err) {
      console.error("Failed to fetch providers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [typeFilter, verificationFilter]);

  const filteredProviders = useMemo(() => {
    let rows = [...providers];

    if (activityFilter === "ACTIVE") {
      rows = rows.filter((p) => p.isActive);
    } else if (activityFilter === "INACTIVE") {
      rows = rows.filter((p) => !p.isActive);
    }

    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((p) =>
      [
        p.user.name,
        p.user.email,
        p.user.phone,
        p.companyName,
        p.type,
        p.city,
        p.licenseNumber,
        p.verificationStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [providers, activityFilter, search]);

  const selectedProvider =
    filteredProviders.find((p) => p.id === selected?.id) ||
    providers.find((p) => p.id === selected?.id) ||
    filteredProviders[0] ||
    null;

  const enterpriseStats = useMemo(() => {
    const total = providers.length;
    const active = providers.filter((p) => p.isActive).length;
    const inactive = total - active;
    const verified = providers.filter(
      (p) => p.verificationStatus === "VERIFIED",
    ).length;
    const pending = providers.filter(
      (p) => p.verificationStatus === "PENDING",
    ).length;

    const avgRating =
      total > 0
        ? providers.reduce((sum, p) => sum + Number(p.rating || 0), 0) / total
        : 0;

    const totalJobs = providers.reduce(
      (sum, p) => sum + Number(p.assignmentCount || 0),
      0,
    );

    const topRated = [...providers].sort(
      (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
    )[0];

    return {
      total,
      active,
      inactive,
      verified,
      pending,
      avgRating,
      totalJobs,
      topRated,
    };
  }, [providers]);

  const sortedLeaderboard = useMemo(() => {
    return [...providers]
      .sort((a, b) => {
        const jobsDiff =
          Number(b.assignmentCount || 0) - Number(a.assignmentCount || 0);
        if (jobsDiff !== 0) return jobsDiff;
        return Number(b.rating || 0) - Number(a.rating || 0);
      })
      .slice(0, 5);
  }, [providers]);

  const verifyProvider = async (id: string) => {
  try {
    setBusyId(id);
    await api.patch(`/service-providers/${id}/verify`);
    await fetchProviders();
  } catch (err) {
    console.error("Failed to verify provider", err);
  } finally {
    setBusyId(null);
  }
};

const toggleActive = async (provider: Provider) => {
  try {
    setBusyId(provider.id);
    if (provider.isActive) {
      await api.patch(`/service-providers/${provider.id}/deactivate`);
    } else {
      await api.patch(`/service-providers/${provider.id}/reactivate`);
    }
    await fetchProviders();
  } catch (err) {
    console.error("Failed to update provider status", err);
  } finally {
    setBusyId(null);
  }
};
  return (
    <div className="providers-page-shell">
      <section className="providers-hero">
        <div className="providers-hero-copy">
          <p className="providers-label">ADMIN PROVIDERS CONTROL</p>
          <h1>
            Manage service providers, quality standards, verification, and
            platform-wide coverage
          </h1>
          <p className="providers-sub">
            Oversee technicians, vendors, and specialist partners from one
            premium operations workspace built for control, quality, and growth.
          </p>

          <div className="providers-hero-tags">
            <span>Verification oversight</span>
            <span>Coverage management</span>
            <span>Performance visibility</span>
            <span>Provider quality control</span>
          </div>
        </div>

        <div className="providers-hero-metrics">
          <div className="providers-metric-card main">
            <span>Total Providers</span>
            <h2>{enterpriseStats.total}</h2>
          </div>
          <div className="providers-metric-card">
            <span>Verified</span>
            <h3>{enterpriseStats.verified}</h3>
          </div>
          <div className="providers-metric-card">
            <span>Active</span>
            <h3>{enterpriseStats.active}</h3>
          </div>
          <div className="providers-metric-card">
            <span>Avg Rating</span>
            <h3>{enterpriseStats.avgRating.toFixed(1)}</h3>
          </div>
        </div>
      </section>

      <section className="providers-summary-strip">
        <div className="providers-summary-card">
          <span>Pending Verification</span>
          <strong>{summary?.pendingVerificationProviders ?? enterpriseStats.pending}</strong>
        </div>
        <div className="providers-summary-card">
          <span>Inactive Providers</span>
          <strong>{summary?.inactiveProviders ?? enterpriseStats.inactive}</strong>
        </div>
        <div className="providers-summary-card">
          <span>Total Reviews</span>
          <strong>{summary?.totalReviews ?? 0}</strong>
        </div>
        <div className="providers-summary-card">
          <span>Total Assignments</span>
          <strong>{summary?.totalAssignments ?? enterpriseStats.totalJobs}</strong>
        </div>
      </section>

      <section className="providers-enterprise-grid">
        <div className="providers-enterprise-left">
          <div className="providers-panel">
            <div className="providers-panel-head">
              <div>
                <h2>Provider Registry</h2>
                <p>Browse, filter, and manage service providers</p>
              </div>
              <span className="providers-count-chip">
                {loading ? "Loading..." : `${filteredProviders.length} visible`}
              </span>
            </div>

            <div className="providers-toolbar">
              <div className="providers-toolbar-row">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="providers-filter"
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === "ALL" ? "All types" : formatTypeLabel(type)}
                    </option>
                  ))}
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="providers-filter"
                >
                  <option value="ALL">All verification</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="providers-filter"
                >
                  <option value="ALL">All status</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="INACTIVE">Inactive only</option>
                </select>
              </div>

              <input
                className="providers-search"
                placeholder="Search name, city, type, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="providers-list premium">
              {loading ? (
                <div className="providers-empty">Loading providers...</div>
              ) : filteredProviders.length === 0 ? (
                <div className="providers-empty">No providers match your filters.</div>
              ) : (
                filteredProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={`provider-card enterprise ${
                      selectedProvider?.id === provider.id ? "active" : ""
                    }`}
                    onClick={() => setSelected(provider)}
                  >
                    <div className="provider-top">
                      <div>
                        <h4>{provider.user.name}</h4>
                        <p>{provider.companyName || "Independent Provider"}</p>
                      </div>
                      <span className="provider-type-pill">
                        {formatTypeLabel(provider.type)}
                      </span>
                    </div>

                    <div className="provider-mid">
                      <span>{provider.city || "No city"}</span>
                      <span>⭐ {Number(provider.rating || 0).toFixed(1)}</span>
                    </div>

                    <div className="provider-stats-row">
                      <span>{provider.assignmentCount ?? 0} jobs</span>
                      <span>{provider.reviewCount ?? 0} reviews</span>
                      <span>{provider.quoteCount ?? 0} quotes</span>
                    </div>

                    <div className="provider-bottom">
                      <span className={`badge ${provider.isActive ? "active" : "inactive"}`}>
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`badge ${getVerificationTone(
                          provider.verificationStatus,
                        )}`}
                      >
                        {formatVerification(provider.verificationStatus)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="providers-panel compact">
            <div className="providers-panel-head">
              <div>
                <h2>Top Providers</h2>
                <p>Best performers by jobs handled and rating</p>
              </div>
            </div>

            <div className="providers-leaderboard">
              {sortedLeaderboard.length === 0 ? (
                <div className="providers-empty small">No provider data yet.</div>
              ) : (
                sortedLeaderboard.map((provider, index) => (
                  <div key={provider.id} className="leaderboard-card">
                    <div className="leaderboard-rank">{index + 1}</div>
                    <div className="leaderboard-copy">
                      <h4>{provider.companyName || provider.user.name}</h4>
                      <p>
                        {formatTypeLabel(provider.type)} • {provider.city || "No city"}
                      </p>
                    </div>
                    <div className="leaderboard-stats">
                      <strong>{provider.assignmentCount ?? 0}</strong>
                      <span>{Number(provider.rating || 0).toFixed(1)}★</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="providers-enterprise-right">
          <div className="providers-panel detail">
            {!selectedProvider ? (
              <div className="providers-empty detail">
                Select a provider to inspect profile and performance.
              </div>
            ) : (
              <>
                <div className="detail-hero enterprise">
                  <div>
                    <div className="detail-badges">
                      <span className="provider-type-pill">
                        {formatTypeLabel(selectedProvider.type)}
                      </span>
                      <span
                        className={`badge ${getVerificationTone(
                          selectedProvider.verificationStatus,
                        )}`}
                      >
                        {formatVerification(selectedProvider.verificationStatus)}
                      </span>
                      <span
                        className={`badge ${
                          selectedProvider.isActive ? "active" : "inactive"
                        }`}
                      >
                        {selectedProvider.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h2>{selectedProvider.user.name}</h2>
                    <p>{selectedProvider.companyName || "Independent Provider"}</p>
                  </div>

                  <div className="amount-box enterprise">
                    <span>Rating</span>
                    <strong>{Number(selectedProvider.rating || 0).toFixed(1)}★</strong>
                  </div>
                </div>

                <div className="detail-grid enterprise">
                  <div className="detail-card">
                    <span>Phone</span>
                    <p>{selectedProvider.user.phone}</p>
                  </div>
                  <div className="detail-card">
                    <span>Email</span>
                    <p>{selectedProvider.user.email || "—"}</p>
                  </div>
                  <div className="detail-card">
                    <span>City</span>
                    <p>{selectedProvider.city || "—"}</p>
                  </div>
                  <div className="detail-card">
                    <span>License</span>
                    <p>{selectedProvider.licenseNumber || "—"}</p>
                  </div>
                  <div className="detail-card">
                    <span>Assignments</span>
                    <p>{selectedProvider.assignmentCount ?? 0}</p>
                  </div>
                  <div className="detail-card">
                    <span>Reviews</span>
                    <p>{selectedProvider.reviewCount ?? 0}</p>
                  </div>
                  <div className="detail-card">
                    <span>Dispatches</span>
                    <p>{selectedProvider.dispatchCount ?? 0}</p>
                  </div>
                  <div className="detail-card">
                    <span>Payout Records</span>
                    <p>{selectedProvider.payoutCount ?? 0}</p>
                  </div>
                </div>

                <div className="providers-actions">
                  <button
                    className="btn primary"
                    disabled={
                      busyId === selectedProvider.id ||
                      selectedProvider.verificationStatus === "VERIFIED"
                    }
                    onClick={() => verifyProvider(selectedProvider.id)}
                  >
                    {busyId === selectedProvider.id &&
                    selectedProvider.verificationStatus !== "VERIFIED"
                      ? "Processing..."
                      : selectedProvider.verificationStatus === "VERIFIED"
                        ? "Already Verified"
                        : "Verify Provider"}
                  </button>

                  <button
                    className="btn secondary"
                    disabled={busyId === selectedProvider.id}
                    onClick={() => toggleActive(selectedProvider)}
                  >
                    {busyId === selectedProvider.id
                      ? "Updating..."
                      : selectedProvider.isActive
                        ? "Deactivate Provider"
                        : "Activate Provider"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="providers-panel compact">
            <div className="providers-panel-head">
              <div>
                <h2>Coverage Mix</h2>
                <p>Platform provider composition by service type</p>
              </div>
            </div>

            <div className="coverage-list">
              {summary?.providersByType &&
              Object.keys(summary.providersByType).length > 0 ? (
                Object.entries(summary.providersByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const percent =
                      summary.totalProviders > 0
                        ? (count / summary.totalProviders) * 100
                        : 0;

                    return (
                      <div key={type} className="coverage-row">
                        <div className="coverage-top">
                          <span>{formatTypeLabel(type)}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="coverage-bar">
                          <div
                            className="coverage-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="providers-empty small">No coverage data yet.</div>
              )}
            </div>
          </div>

          <div className="providers-panel compact">
            <div className="providers-panel-head">
              <div>
                <h2>Enterprise Snapshot</h2>
                <p>High-level provider network health</p>
              </div>
            </div>

            <div className="snapshot-grid">
              <div className="snapshot-card">
                <span>Top Rated</span>
                <strong>
                  {enterpriseStats.topRated
                    ? enterpriseStats.topRated.companyName ||
                      enterpriseStats.topRated.user.name
                    : "—"}
                </strong>
              </div>
              <div className="snapshot-card">
                <span>Average Rating</span>
                <strong>{enterpriseStats.avgRating.toFixed(1)}★</strong>
              </div>
              <div className="snapshot-card">
                <span>Total Jobs</span>
                <strong>{enterpriseStats.totalJobs}</strong>
              </div>
              <div className="snapshot-card">
                <span>Verified Coverage</span>
                <strong>
                  {enterpriseStats.total > 0
                    ? `${Math.round(
                        (enterpriseStats.verified / enterpriseStats.total) * 100,
                      )}%`
                    : "0%"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}