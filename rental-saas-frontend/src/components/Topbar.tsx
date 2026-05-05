"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
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

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/wallet": "Wallet",
  "/users": "Users",
  "/properties": "Properties",
  "/units": "Units",
  "/contracts": "Contracts",
  "/residents": "Residents",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/expenses": "Expenses",
  "/transactions": "Transactions",
  "/maintenance": "Maintenance",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/investments": "Investments",
  "/portfolio": "Portfolio",
  "/profit-center": "Profit Center",
};

function formatRole(role?: string) {
  if (!role) return "User";
  if (role === "SERVICE_PROVIDER") return "Service Provider";

  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTime(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="#94A3B8" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a2.5 2.5 0 0 0 2.3-1.5H9.7A2.5 2.5 0 0 0 12 21Z" fill="#0F172A" />
      <path
        d="M18 16.5H6.2c.8-.9 1.3-2.2 1.3-3.6v-2c0-2.8 1.7-5 4.5-5.6V4.8a1 1 0 1 1 2 0v.5c2.7.6 4.5 2.8 4.5 5.6v2c0 1.4.5 2.7 1.3 3.6H18Z"
        stroke="#0F172A"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h6M14 7h6M4 17h10M18 17h2"
        stroke="#0F172A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="2.2" fill="#0F172A" />
      <circle cx="16" cy="17" r="2.2" fill="#0F172A" />
    </svg>
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [latestNotifications, setLatestNotifications] = useState<NotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const prettyRole = formatRole(user?.role);
  const initials = displayName.charAt(0).toUpperCase();

  let title = pageTitles[pathname] || "Dashboard";
  if (pathname.startsWith("/properties/")) title = "Property Details";

  const unreadCount = summary?.unread ?? 0;

  const latestPreview = useMemo(() => {
    return latestNotifications.slice(0, 5);
  }, [latestNotifications]);

  async function loadNotificationPreview() {
    if (!user?.id) return;

    try {
      const summaryRes = await api.get<NotificationSummary>("/notifications/me/summary");

      const feedRes = await api.get<NotificationItem[]>("/notifications/me", {
        params: { status: "all" },
      });

      setSummary(summaryRes.data);
      setLatestNotifications(feedRes.data ?? []);
    } catch (error) {
      console.error("Failed to load topbar notifications", error);
    }
  }

  useEffect(() => {
    loadNotificationPreview();

    const interval = window.setInterval(() => {
      loadNotificationPreview();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    setOpenNotifications(false);
  }, [pathname]);

  function handleBellClick() {
    setOpenNotifications((prev) => !prev);
    loadNotificationPreview();
  }

  function openNotificationsPage() {
    setOpenNotifications(false);
    router.push("/notifications");
  }

  function openProfileSettings() {
    router.push("/profile");
  }

  return (
    <header
      style={{
        height: "68px",
        minHeight: "68px",
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "relative",
        zIndex: 30,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "#020617",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
        <div
          style={{
            minWidth: "220px",
            height: "40px",
            borderRadius: "999px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 14px",
            color: "#94A3B8",
            fontSize: "13px",
          }}
        >
          <SearchIcon />
          <span>Search here</span>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={handleBellClick}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "999px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
              position: "relative",
            }}
          >
            <BellIcon />

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "999px",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #FFFFFF",
                  padding: "0 4px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: 0,
                width: "340px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "18px",
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
                overflow: "hidden",
                zIndex: 80,
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #EEF2F7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#020617" }}>
                    Notifications
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748B" }}>
                    {unreadCount} unread
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNotificationsPage}
                  style={{
                    border: "none",
                    background: "#F1F5F9",
                    color: "#0F172A",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  View all
                </button>
              </div>

              <div style={{ maxHeight: "330px", overflowY: "auto" }}>
                {latestPreview.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                      No notifications yet
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748B" }}>
                      New messages, payments, and maintenance updates will appear here.
                    </p>
                  </div>
                ) : (
                  latestPreview.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={openNotificationsPage}
                      style={{
                        width: "100%",
                        border: "none",
                        background: item.isRead ? "#FFFFFF" : "#F8FBFF",
                        borderBottom: "1px solid #EEF2F7",
                        padding: "13px 16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "999px",
                          background: item.isRead ? "#CBD5E1" : "#2563EB",
                          marginTop: "5px",
                          flexShrink: 0,
                        }}
                      />

                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#0F172A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </span>

                        <span
                          style={{
                            marginTop: "3px",
                            fontSize: "12px",
                            color: "#64748B",
                            lineHeight: 1.35,
                            overflow: "hidden",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            display: "-webkit-box",
                          }}
                        >
                          {item.message}
                        </span>

                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            fontSize: "11px",
                            color: "#94A3B8",
                            fontWeight: 600,
                          }}
                        >
                          {formatTime(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={openProfileSettings}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "999px",
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          }}
        >
          <SettingsIcon />
        </button>

        <div style={{ width: "1px", height: "28px", background: "#E2E8F0", margin: "0 2px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "2px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#020617", lineHeight: 1.1 }}>
              {displayName}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B", lineHeight: 1.1 }}>
              {prettyRole}
            </p>
          </div>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #020617 0%, #0F172A 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "16px",
              boxShadow: "0 6px 16px rgba(2, 6, 23, 0.18)",
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}