"use client";

import { ALL_ROLES, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { useDevRoleStore } from "@/store/dev-role";

export default function DevRoleSwitcher() {
  const { devRole, setDevRole, clearDevRole } = useDevRoleStore();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "14px",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#475569",
          whiteSpace: "nowrap",
        }}
      >
        Dev Role
      </span>

      <select
        value={devRole ?? ""}
        onChange={(e) => {
          const value = e.target.value as AppRole | "";
          if (!value) {
            clearDevRole();
            return;
          }
          setDevRole(value);
        }}
        style={{
          height: "34px",
          borderRadius: "10px",
          border: "1px solid #CBD5E1",
          padding: "0 10px",
          fontSize: "12px",
          color: "#020617",
          background: "#F8FAFC",
          outline: "none",
        }}
      >
        <option value="">Use real role</option>
        {ALL_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </div>
  );
}