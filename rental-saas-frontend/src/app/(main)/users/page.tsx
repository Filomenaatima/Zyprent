"use client";

import "@/styles/users.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | null;
type ProviderVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | null;
type ResidentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "MOVED_OUT"
  | "TRANSFERRED"
  | null;

type UsersResponse = {
  summary: {
    totalUsers: number;
    admins: number;
    managers: number;
    investors: number;
    residents: number;
    providers: number;
    verifiedProviders: number;
    pendingKyc: number;
    activeResidents: number;
    activeSubscriptions: number;
  };
  users: UserRecord[];
};

type UserRecord = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  walletBalance: number;
  accountBalance: number;
  residentProfile: null | {
    id: string;
    status: ResidentStatus;
    moveOutDate?: string | null;
    unitId?: string | null;
    unitNumber?: string | null;
    propertyId?: string | null;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
  };
  providerProfile: null | {
    id: string;
    type?: string | null;
    isActive: boolean;
    verificationStatus: ProviderVerificationStatus;
    companyName?: string | null;
    city?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    serviceRadiusKm?: number | null;
    source?: string | null;
  };
  kycVerification: null | {
    id: string;
    fullName?: string | null;
    nationality?: string | null;
    idType?: string | null;
    status: KycStatus;
    reviewedAt?: string | null;
    createdAt: string;
  };
  investmentProfile: {
    totalHoldings: number;
    totalSharesOwned: number;
    totalAmountInvested: number;
    holdings: {
      id: string;
      sharesOwned: number;
      amountPaid: number;
      propertyId: string;
      propertyTitle: string;
      propertyLocation?: string | null;
    }[];
  };
  ownershipProfile: {
    ownedPropertiesCount: number;
    managedPropertiesCount: number;
    ownedProperties: {
      id: string;
      title: string;
      location?: string | null;
      phase: number;
      isActive: boolean;
    }[];
    managedProperties: {
      id: string;
      title: string;
      location?: string | null;
      phase: number;
      isActive: boolean;
    }[];
  };
  subscription: null | {
    id: string;
    status: string;
    currentPeriodEnd?: string | null;
    startedAt: string;
    plan?: {
      id: string;
      name: string;
      billingInterval: string;
      price: number;
    } | null;
  };
};

const roleOptions: Array<"ALL" | UserRole> = [
  "ALL",
  "ADMIN",
  "MANAGER",
  "INVESTOR",
  "RESIDENT",
  "SERVICE_PROVIDER",
];

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

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getUserDisplayName(user: UserRecord) {
  if (user.name?.trim()) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Unnamed User";
}

function getRoleTone(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "violet";
    case "MANAGER":
      return "blue";
    case "INVESTOR":
      return "green";
    case "RESIDENT":
      return "amber";
    case "SERVICE_PROVIDER":
      return "slate";
    default:
      return "gray";
  }
}

function getHealthTone(user: UserRecord) {
  if (user.providerProfile?.verificationStatus === "PENDING") return "amber";
  if (user.kycVerification?.status === "PENDING") return "amber";
  if (user.providerProfile?.verificationStatus === "REJECTED") return "red";
  if (user.kycVerification?.status === "REJECTED") return "red";
  if (user.residentProfile?.status === "MOVED_OUT") return "gray";
  return "green";
}

function getHealthLabel(user: UserRecord) {
  if (user.providerProfile?.verificationStatus === "PENDING") {
    return "Provider verification pending";
  }
  if (user.providerProfile?.verificationStatus === "REJECTED") {
    return "Provider rejected";
  }
  if (user.kycVerification?.status === "PENDING") {
    return "KYC pending";
  }
  if (user.kycVerification?.status === "REJECTED") {
    return "KYC rejected";
  }
  if (user.residentProfile?.status === "MOVED_OUT") {
    return "Moved out";
  }
  if (user.residentProfile?.status === "TRANSFERRED") {
    return "Transferred";
  }
  if (user.providerProfile?.verificationStatus === "VERIFIED") {
    return "Verified provider";
  }
  if (user.kycVerification?.status === "APPROVED") {
    return "KYC approved";
  }
  if (user.residentProfile?.status === "ACTIVE") {
    return "Active resident";
  }
  return "Stable";
}

function getUserMetaLine(user: UserRecord) {
  if (user.role === "RESIDENT" && user.residentProfile) {
    return `${user.residentProfile.propertyTitle || "No property"}${
      user.residentProfile.unitNumber
        ? ` · Unit ${user.residentProfile.unitNumber}`
        : ""
    }`;
  }

  if (user.role === "SERVICE_PROVIDER" && user.providerProfile) {
    return `${formatRole(user.providerProfile.type || "SERVICE_PROVIDER")}${
      user.providerProfile.city ? ` · ${user.providerProfile.city}` : ""
    }`;
  }

  if (user.role === "INVESTOR") {
    return `${user.investmentProfile.totalHoldings} holding${
      user.investmentProfile.totalHoldings === 1 ? "" : "s"
    }`;
  }

  if (user.role === "MANAGER") {
    return `${user.ownershipProfile.managedPropertiesCount} managed propert${
      user.ownershipProfile.managedPropertiesCount === 1 ? "y" : "ies"
    }`;
  }

  if (user.role === "ADMIN") {
    return "Platform administrator";
  }

  return "Platform user";
}

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        const res = await api.get("/users");

        if (!mounted) return;
        setData(res.data);
      } catch (error) {
        console.error("Failed to load users", error);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = data?.summary ?? {
    totalUsers: 0,
    admins: 0,
    managers: 0,
    investors: 0,
    residents: 0,
    providers: 0,
    verifiedProviders: 0,
    pendingKyc: 0,
    activeResidents: 0,
    activeSubscriptions: 0,
  };

  const users = data?.users ?? [];

  const roleMix = [
    {
      label: "Admins",
      value: summary.admins,
      tone: "violet",
    },
    {
      label: "Managers",
      value: summary.managers,
      tone: "blue",
    },
    {
      label: "Investors",
      value: summary.investors,
      tone: "green",
    },
    {
      label: "Residents",
      value: summary.residents,
      tone: "amber",
    },
    {
      label: "Providers",
      value: summary.providers,
      tone: "slate",
    },
  ];

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" ? true : user.role === roleFilter;

      const searchable = [
        getUserDisplayName(user),
        user.email || "",
        user.phone || "",
        user.role,
        user.providerProfile?.companyName || "",
        user.providerProfile?.city || "",
        user.residentProfile?.propertyTitle || "",
        user.residentProfile?.unitNumber || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalized ? searchable.includes(normalized) : true;

      return matchesRole && matchesSearch;
    });
  }, [users, query, roleFilter]);

  const topUsers = filteredUsers.slice(0, 8);

  return (
    <div className="users-page-shell">
      <section className="users-hero-panel">
        <div className="users-hero-copy">
          <p className="users-hero-eyebrow">Platform user management</p>
          <h1 className="users-hero-title">Users</h1>
          <p className="users-hero-text">
            Oversee every admin, manager, investor, resident, and service
            provider from one premium control surface built for real platform
            operations.
          </p>

          <div className="users-hero-tags">
            <span className="users-hero-tag">Admin control</span>
            <span className="users-hero-tag">Live directory</span>
            <span className="users-hero-tag">
              {loading ? "Refreshing..." : `${filteredUsers.length} visible`}
            </span>
          </div>
        </div>

        <div className="users-hero-orb">
          <span className="users-hero-orb-label">Total users</span>
          <strong className="users-hero-orb-value">
            {summary.totalUsers.toLocaleString()}
          </strong>
          <span className="users-hero-orb-meta">Full platform base</span>
        </div>
      </section>

      <section className="users-command-panel">
        <div className="users-command-top">
          <div className="users-command-copy">
            <p className="users-command-label">Directory control</p>
            <h2 className="users-command-value">
              {summary.totalUsers.toLocaleString()} users
            </h2>
            <p className="users-command-text">
              Active platform accounts across all roles. Monitor verification,
              activity health, and financial exposure in one place.
            </p>

            <div className="users-command-mini-stats">
              <span>{summary.pendingKyc} pending KYC</span>
              <span>{summary.verifiedProviders} verified providers</span>
              <span>{summary.activeResidents} active residents</span>
            </div>
          </div>

          <div className="users-command-actions">
            <button className="users-btn-primary" type="button">
              Create user later
            </button>
            <button className="users-btn-secondary" type="button">
              Export later
            </button>
          </div>
        </div>

        <div className="users-filters-grid">
          <div className="users-filter-card users-search-card">
            <label className="users-input-label" htmlFor="users-search">
              Search users
            </label>
            <input
              id="users-search"
              className="users-search-input"
              placeholder="Search name, email, phone, property, provider..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="users-filter-card">
            <label className="users-input-label" htmlFor="users-role-filter">
              Filter by role
            </label>
            <select
              id="users-role-filter"
              className="users-select-input"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "ALL" | UserRole)
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role === "ALL" ? "All roles" : formatRole(role)}
                </option>
              ))}
            </select>
          </div>

          <div className="users-filter-card users-filter-stat">
            <span className="users-filter-stat-label">Pending KYC</span>
            <strong className="users-filter-stat-value">
              {summary.pendingKyc}
            </strong>
          </div>

          <div className="users-filter-card users-filter-stat">
            <span className="users-filter-stat-label">Verified providers</span>
            <strong className="users-filter-stat-value">
              {summary.verifiedProviders}
            </strong>
          </div>
        </div>
      </section>

      <section className="users-kpi-grid">
        <div className="users-kpi-card">
          <p className="users-kpi-label">Admins</p>
          <p className="users-kpi-value">{summary.admins}</p>
          <p className="users-kpi-subtext">Platform governance users</p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Managers</p>
          <p className="users-kpi-value">{summary.managers}</p>
          <p className="users-kpi-subtext">Operational property operators</p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Investors</p>
          <p className="users-kpi-value">{summary.investors}</p>
          <p className="users-kpi-subtext">
            Capital and ownership participants
          </p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Residents</p>
          <p className="users-kpi-value">{summary.residents}</p>
          <p className="users-kpi-subtext">Tenant accounts on platform</p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Providers</p>
          <p className="users-kpi-value">{summary.providers}</p>
          <p className="users-kpi-subtext">Service network coverage</p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Active residents</p>
          <p className="users-kpi-value">{summary.activeResidents}</p>
          <p className="users-kpi-subtext">
            Current occupied resident profiles
          </p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Active subscriptions</p>
          <p className="users-kpi-value">{summary.activeSubscriptions}</p>
          <p className="users-kpi-subtext">Live billing participation</p>
        </div>

        <div className="users-kpi-card">
          <p className="users-kpi-label">Visible results</p>
          <p className="users-kpi-value">{filteredUsers.length}</p>
          <p className="users-kpi-subtext">Results after current filtering</p>
        </div>
      </section>

      <section className="users-main-grid">
        <section className="users-panel">
          <div className="users-panel-head">
            <div>
              <h2 className="users-panel-title">User directory</h2>
              <p className="users-panel-subtitle">
                Full platform user list with operational context
              </p>
            </div>
            <span className="users-panel-chip">
              {loading ? "Loading..." : `${filteredUsers.length} users`}
            </span>
          </div>

          <div className="users-table-shell">
            <div className="users-table-head">
              <span>User</span>
              <span>Role</span>
              <span>Health</span>
              <span>Financials</span>
              <span>Joined</span>
            </div>

            <div className="users-table-body">
              {loading ? (
                <div className="users-empty-state">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="users-empty-state">
                  No users matched your current search and filter.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="users-table-row">
                    <div className="users-user-cell">
                      <div className="users-avatar">
                        {getInitials(user.name, user.email)}
                      </div>

                      <div className="users-user-copy">
                        <p className="users-user-name">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="users-user-email">{user.email || "—"}</p>
                        <p className="users-user-meta">
                          {getUserMetaLine(user)}
                        </p>
                      </div>
                    </div>

                    <div className="users-role-cell">
                      <span
                        className={`users-role-pill ${getRoleTone(user.role)}`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </div>

                    <div className="users-health-cell">
                      <span
                        className={`users-health-pill ${getHealthTone(user)}`}
                      >
                        {getHealthLabel(user)}
                      </span>
                    </div>

                    <div className="users-money-cell">
                      <p className="users-money-primary">
                        {formatCurrency(user.walletBalance)}
                      </p>
                      <p className="users-money-secondary">
                        Account {formatCurrency(user.accountBalance)}
                      </p>
                    </div>

                    <div className="users-date-cell">
                      <p className="users-date-primary">
                        {formatDate(user.createdAt)}
                      </p>
                      <p className="users-date-secondary">
                        Updated {formatDate(user.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="users-side-stack">
          <section className="users-panel">
            <div className="users-panel-head">
              <div>
                <h2 className="users-panel-title">Quick highlights</h2>
                <p className="users-panel-subtitle">
                  Top visible users from your current filters
                </p>
              </div>
            </div>

            <div className="users-highlight-list">
              {loading ? (
                <div className="users-empty-state">Loading highlights...</div>
              ) : topUsers.length === 0 ? (
                <div className="users-empty-state">No user highlights found.</div>
              ) : (
                topUsers.map((user) => (
                  <div key={user.id} className="users-highlight-card">
                    <div className="users-highlight-top">
                      <div>
                        <p className="users-highlight-name">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="users-highlight-subtitle">
                          {user.email || "No email"}
                        </p>
                      </div>
                      <span
                        className={`users-role-pill ${getRoleTone(user.role)}`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </div>

                    <div className="users-highlight-metrics">
                      <div>
                        <span>Health</span>
                        <strong>{getHealthLabel(user)}</strong>
                      </div>
                      <div>
                        <span>Wallet</span>
                        <strong>{formatCurrency(user.walletBalance)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="users-panel">
            <div className="users-panel-head">
              <div>
                <h2 className="users-panel-title">Role mix</h2>
                <p className="users-panel-subtitle">
                  Platform distribution by account type
                </p>
              </div>
            </div>

            <div className="users-role-mix-list">
              {roleMix
                .filter((item) => item.value > 0 || summary.totalUsers === 0)
                .map((item) => {
                  const share =
                    summary.totalUsers > 0
                      ? (item.value / summary.totalUsers) * 100
                      : 0;

                  return (
                    <div key={item.label} className="users-role-mix-card">
                      <div className="users-role-mix-top">
                        <p className="users-role-mix-label">{item.label}</p>
                        <span className={`users-role-pill ${item.tone}`}>
                          {share.toFixed(1)}%
                        </span>
                      </div>

                      <p className="users-role-mix-value">{item.value}</p>

                      <div className="users-role-track">
                        <div
                          className={`users-role-fill ${item.tone}`}
                          style={{ width: `${Math.min(share, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}