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

type NotificationGroup = {
  label: string;
  items: NotificationItem[];
};

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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getGroupLabel(dateValue: string) {
  const itemDate = new Date(dateValue);
  const now = new Date();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(itemDate, now)) return "Today";
  if (isSameDay(itemDate, yesterday)) return "Yesterday";
  return "Earlier";
}

function formatTypeLabel(type: NotificationItem["type"]) {
  switch (type) {
    case "PROFIT_DISTRIBUTION":
      return "Profit";
    case "WITHDRAWAL_REQUEST":
      return "Withdrawal Request";
    case "WITHDRAWAL_APPROVED":
      return "Withdrawal Approved";
    case "RENT_PAYMENT":
      return "Rent";
    case "MAINTENANCE":
      return "Maintenance";
    default:
      return "System";
  }
}

function getTypeTone(type: NotificationItem["type"]) {
  switch (type) {
    case "PROFIT_DISTRIBUTION":
      return "green";
    case "WITHDRAWAL_REQUEST":
    case "WITHDRAWAL_APPROVED":
      return "blue";
    case "MAINTENANCE":
      return "orange";
    case "RENT_PAYMENT":
      return "purple";
    default:
      return "slate";
  }
}

function getNotificationTarget(type: NotificationItem["type"]) {
  switch (type) {
    case "PROFIT_DISTRIBUTION":
      return "/profit-center";
    case "WITHDRAWAL_REQUEST":
    case "WITHDRAWAL_APPROVED":
      return "/wallet";
    case "MAINTENANCE":
      return "/maintenance";
    case "RENT_PAYMENT":
      return "/transactions";
    case "SYSTEM":
    default:
      return "/dashboard";
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

  async function loadNotifications(silent = false) {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params: Record<string, string> = {};
      if (activeFilter === "unread") {
        params.status = "unread";
      } else if (activeFilter !== "all") {
        params.type = activeFilter;
      }

      const [feedRes, summaryRes] = await Promise.all([
        api.get<NotificationItem[]>("/notifications/me", { params }),
        api.get<NotificationSummary>("/notifications/me/summary"),
      ]);

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

  const latestDate = useMemo(() => {
    if (!notifications.length) return "No activity";
    return formatDateTime(notifications[0].createdAt);
  }, [notifications]);

  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const groups: Record<string, NotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifications.forEach((item) => {
      const label = getGroupLabel(item.createdAt);
      groups[label].push(item);
    });

    return [
      { label: "Today", items: groups.Today },
      { label: "Yesterday", items: groups.Yesterday },
      { label: "Earlier", items: groups.Earlier },
    ].filter((group) => group.items.length > 0);
  }, [notifications]);

  async function handleMarkOneAsRead(id: string) {
    try {
      setBusyId(id);
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );

      setSummary((prev) =>
        prev
          ? {
              ...prev,
              unread: Math.max(0, prev.unread - 1),
              read: prev.read + 1,
            }
          : prev,
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      await api.patch("/notifications/me/read-all");

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );

      setSummary((prev) =>
        prev
          ? {
              ...prev,
              unread: 0,
              read: prev.total,
            }
          : prev,
      );

      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleOpenNotification(item: NotificationItem) {
    try {
      if (!item.isRead) {
        await handleMarkOneAsRead(item.id);
      }
    } finally {
      router.push(getNotificationTarget(item.type));
    }
  }

  return (
    <div className="notifications-shell">
      <section className="notifications-hero">
        <div className="notifications-hero-copy">
          <p className="notifications-eyebrow">Investor Notifications</p>
          <h1 className="notifications-title">
            Stay updated on portfolio events, payouts, requests, and platform alerts
          </h1>
          <p className="notifications-text">
            Review every important account signal in one secure activity center.
            Track unread updates, portfolio alerts, withdrawal progress, and system
            communication without leaving your workspace.
          </p>

          <div className="notifications-tags">
            <span className="notifications-tag">Unread tracking</span>
            <span className="notifications-tag">Portfolio events</span>
            <span className="notifications-tag">Withdrawal visibility</span>
            <span className="notifications-tag">Stored audit trail</span>
          </div>
        </div>

        <div className="notifications-hero-grid">
          <div className="notifications-stat-card dark">
            <p className="notifications-stat-label">Total Notifications</p>
            <h3 className="notifications-stat-value">
              {summary?.total ?? notifications.length}
            </h3>
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
            <h3 className="notifications-stat-value small">{latestDate}</h3>
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
          <span className="notifications-refresh-text">
            {refreshing
              ? "Refreshing..."
              : lastUpdatedAt
              ? `Updated ${formatDateTime(lastUpdatedAt)}`
              : "Waiting for first sync"}
          </span>

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
              Newest updates first across your investor account
            </p>
          </div>
          <span className="notifications-chip">
            {loading ? "Loading..." : `${notifications.length} items`}
          </span>
        </div>

        {loading ? (
          <div className="notifications-empty">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            No notifications found.
            <br />
            <span>
              New alerts about profits, withdrawals, messages, maintenance, and
              system events will appear here.
            </span>
          </div>
        ) : (
          <div className="notifications-list">
            {groupedNotifications.map((group) => (
              <div key={group.label} className="notifications-group">
                <div className="notifications-group-header">
                  <span>{group.label}</span>
                </div>

                <div className="notifications-group-list">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className={`notifications-row ${
                        item.isRead ? "read" : "unread"
                      }`}
                    >
                      <div className="notifications-row-left">
                        <div
                          className={`notifications-type-dot ${getTypeTone(item.type)}`}
                        />

                        <div className="notifications-copy">
                          <div className="notifications-meta-top">
                            <span
                              className={`notifications-type-pill ${getTypeTone(
                                item.type,
                              )}`}
                            >
                              {formatTypeLabel(item.type)}
                            </span>
                            <span
                              className={`notifications-read-pill ${
                                item.isRead ? "read" : "unread"
                              }`}
                            >
                              {item.isRead ? "Read" : "Unread"}
                            </span>
                          </div>

                          <h3 className="notifications-row-title">{item.title}</h3>
                          <p className="notifications-row-message">{item.message}</p>
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
                            onClick={() => handleMarkOneAsRead(item.id)}
                            disabled={busyId === item.id}
                          >
                            {busyId === item.id ? "Updating..." : "Mark read"}
                          </button>
                        ) : (
                          <span className="notifications-read-text">Opened</span>
                        )}

                        <button
                          type="button"
                          className="notifications-open-btn"
                          onClick={() => handleOpenNotification(item)}
                        >
                          Open
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}