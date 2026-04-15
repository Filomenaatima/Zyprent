"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
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
};

function formatRole(role?: string) {
  if (!role) return "User";

  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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
  const { user } = useAuthStore();

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const prettyRole = formatRole(user?.role);
  const initials = displayName.charAt(0).toUpperCase();

  let title = pageTitles[pathname] || "Dashboard";

  if (pathname.startsWith("/properties/")) title = "Property Details";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: 0,
        }}
      >
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
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
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
          }}
        >
          <SearchIcon />
          <span>Search here</span>
        </div>

        <button
          type="button"
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
          <BellIcon />
        </button>

        <button
          type="button"
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

        <div
          style={{
            width: "1px",
            height: "28px",
            background: "#E2E8F0",
            margin: "0 2px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingLeft: "2px",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 700,
                color: "#020617",
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "#64748B",
                lineHeight: 1.1,
              }}
            >
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