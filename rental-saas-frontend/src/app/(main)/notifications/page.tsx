"use client";

import "@/styles/notifications.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "RENT_PAYMENT"
    | "PROFIT_DISTRIBUTION"
    | "WITHDRAWAL_REQUEST"
    | "WITHDRAWAL_APPROVED"
    | "SYSTEM"
    | "MAINTENANCE";
  isRead: boolean;
  createdAt: string;
};

type NotificationSummary = {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  latestActivity?: string | null;
};

type ActiveFilter =
  | "all"
  | "unread"
  | "SYSTEM"
  | "PROFIT_DISTRIBUTION"
  | "WITHDRAWAL_REQUEST"
  | "WITHDRAWAL_APPROVED"
  | "MAINTENANCE"
  | "RENT_PAYMENT";

const filterOptions: { key: ActiveFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "SYSTEM", label: "System" },
  { key: "PROFIT_DISTRIBUTION", label: "Profits" },
  { key: "WITHDRAWAL_REQUEST", label: "Withdrawal Request" },
  { key: "WITHDRAWAL_APPROVED", label: "Withdrawal Approved" },
  { key: "MAINTENANCE", label: "Maintenance" },
  { key: "RENT_PAYMENT", label: "Rent" },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRoleFromStorage() {
  if (typeof window === "undefined") return "USER";
  return localStorage.getItem("role") || "USER";
}

function getRoleContent(role: string) {
  switch (role) {
    case "ADMIN":
      return {
        eyebrow: "Admin Notifications",
        title: "Track system activity, approvals, and platform alerts",
        subtitle:
          "Monitor operations, approvals, maintenance, payments, and system-wide activity in one place.",
      };
    case "MANAGER":
      return {
        eyebrow: "Manager Notifications",
        title: "Stay on top of properties, maintenance, and operations",
        subtitle:
          "Track maintenance updates, resident issues, payments, and portfolio performance.",
      };
    case "SERVICE_PROVIDER":
      return {
        eyebrow: "Service Notifications",
        title: "Track jobs, updates, and communication",
        subtitle:
          "Stay updated on assigned jobs, approvals, and communication with managers.",
      };
    case "RESIDENT":
      return {
        eyebrow: "Resident Notifications",
        title: "Stay updated on your unit, payments, and maintenance",
        subtitle:
          "Track rent, maintenance updates, and communication with your property team.",
      };
    default:
      return {
        eyebrow: "Investor Notifications",
        title: "Stay updated on portfolio events, payouts, requests, and alerts",
        subtitle:
          "Review profits, withdrawals, and important updates across your investments.",
      };
  }
}

function typeLabel(type: NotificationItem["type"]) {
  switch (type) {
    case "RENT_PAYMENT":
      return "Rent";
    case "PROFIT_DISTRIBUTION":
      return "Profit";
    case "WITHDRAWAL_REQUEST":
      return "Withdrawal Request";
    case "WITHDRAWAL_APPROVED":
      return "Withdrawal Approved";
    case "MAINTENANCE":
      return "Maintenance";
    default:
      return "System";
  }
}

function typeColor(type: NotificationItem["type"]) {
  switch (type) {
    case "RENT_PAYMENT":
    case "PROFIT_DISTRIBUTION":
      return "green";
    case "WITHDRAWAL_REQUEST":
      return "orange";
    case "WITHDRAWAL_APPROVED":
      return "purple";
    case "MAINTENANCE":
      return "blue";
    default:
      return "slate";
  }
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const roleContent = getRoleContent(getRoleFromStorage());

  async function loadNotifications(silent = false) {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const params: Record<string, string> = {};

      if (activeFilter === "unread") {
        params.status = "unread";
      } else if (activeFilter !== "all") {
        params.type = activeFilter;
      }

      const feedRes = await api.get<NotificationItem[]>("/notifications/me", {
        params,
      });

      const summaryRes = await api.get<NotificationSummary>(
        "/notifications/me/summary"
      );

      setNotifications(feedRes.data ?? []);
      setSummary(summaryRes.data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications(false);
  }, [activeFilter]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadNotifications(true);
    }, 20000);

    return () => window.clearInterval(interval);
  }, [activeFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifications.forEach((item) => {
      const date = new Date(item.createdAt);
      const now = new Date();
      const yesterday = new Date();

      yesterday.setDate(now.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        groups.Today.push(item);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([label, items]) => ({ label, items }));
  }, [notifications]);

  async function handleMarkOneAsRead(id: string) {
    try {
      setBusyId(id);
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      const summaryRes = await api.get<NotificationSummary>(
        "/notifications/me/summary"
      );
      setSummary(summaryRes.data);
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      await api.patch("/notifications/me/read-all");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      const summaryRes = await api.get<NotificationSummary>(
        "/notifications/me/summary"
      );
      setSummary(summaryRes.data);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="notifications-shell">
      <section className="notifications-hero">
        <div className="notifications-hero-copy">
          <p className="notifications-eyebrow">{roleContent.eyebrow}</p>
          <h1 className="notifications-title">{roleContent.title}</h1>
          <p className="notifications-text">{roleContent.subtitle}</p>
        </div>

        <div className="notifications-hero-grid">
          <div className="notifications-stat-card dark">
            <p className="notifications-stat-label">Total</p>
            <h3 className="notifications-stat-value">{summary?.total ?? 0}</h3>
          </div>

          <div className="notifications-stat-card">
            <p className="notifications-stat-label">Unread</p>
            <h3 className="notifications-stat-value">{summary?.unread ?? 0}</h3>
          </div>

          <div className="notifications-stat-card">
            <p className="notifications-stat-label">Read</p>
            <h3 className="notifications-stat-value">{summary?.read ?? 0}</h3>
          </div>

          <div className="notifications-stat-card">
            <p className="notifications-stat-label">Latest Activity</p>
            <h3 className="notifications-stat-value small">
              {summary?.latestActivity
                ? formatDateTime(summary.latestActivity)
                : "—"}
            </h3>
          </div>
        </div>
      </section>

      <section className="notifications-toolbar">
        <div className="notifications-filter-row">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`notifications-filter-pill ${
                activeFilter === option.key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="notifications-toolbar-actions">
          {lastUpdatedAt ? (
            <span className="notifications-refresh-text">
              Updated {formatDateTime(lastUpdatedAt)}
            </span>
          ) : null}

          <button
            type="button"
            className="notifications-action-btn"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || (summary?.unread ?? 0) === 0}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      </section>

      <section className="notifications-feed-panel">
        <div className="notifications-panel-head">
          <div>
            <h2 className="notifications-panel-title">Notification Feed</h2>
            <p className="notifications-panel-subtitle">
              Newest updates first across your account
            </p>
          </div>

          <span className="notifications-chip">
            {notifications.length} {notifications.length === 1 ? "item" : "items"}
          </span>
        </div>

        {loading ? (
          <div className="notifications-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">No notifications yet.</div>
        ) : (
          <div className="notifications-list">
            {groupedNotifications.map((group) => (
              <div className="notifications-group" key={group.label}>
                <div className="notifications-group-header">
                  <span>{group.label}</span>
                </div>

                <div className="notifications-group-list">
                  {group.items.map((item) => {
                    const color = typeColor(item.type);

                    return (
                      <article
                        key={item.id}
                        className={`notifications-row ${
                          item.isRead ? "read" : "unread"
                        }`}
                      >
                        <div className="notifications-row-left">
                          <span
                            className={`notifications-type-dot ${color}`}
                            aria-hidden="true"
                          />

                          <div className="notifications-copy">
                            <div className="notifications-meta-top">
                              <span className={`notifications-type-pill ${color}`}>
                                {typeLabel(item.type)}
                              </span>

                              <span
                                className={`notifications-read-pill ${
                                  item.isRead ? "read" : "unread"
                                }`}
                              >
                                {item.isRead ? "Read" : "Unread"}
                              </span>
                            </div>

                            <h3 className="notifications-row-title">
                              {item.title}
                            </h3>

                            <p className="notifications-row-message">
                              {item.message}
                            </p>

                            <p className="notifications-row-time">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="notifications-row-actions">
                          {!item.isRead ? (
                            <button
                              type="button"
                              className="notifications-mark-btn"
                              disabled={busyId === item.id}
                              onClick={() => handleMarkOneAsRead(item.id)}
                            >
                              {busyId === item.id ? "Marking..." : "Mark read"}
                            </button>
                          ) : (
                            <span className="notifications-read-text">Read</span>
                          )}

                          <button
                            type="button"
                            className="notifications-open-btn"
                            onClick={() => router.push("/dashboard")}
                          >
                            Open
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}