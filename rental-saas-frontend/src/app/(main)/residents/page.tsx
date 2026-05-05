"use client";

import "@/styles/residents.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type ResidentItem = {
  id: string;
  userId?: string;
  unitId: string | null;
  status: "ACTIVE" | "INACTIVE" | "MOVED_OUT" | "TRANSFERRED";
  moveOutDate: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  unit: {
    id: string;
    number: string;
    rentAmount: number;
    rentCycle?: string;
    status: string;
    propertyId?: string;
    createdAt?: string;
    updatedAt?: string;
    property: {
      id: string;
      title: string;
      location: string | null;
      manager?: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
      } | null;
      owner?: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
      } | null;
    };
  } | null;
};

type AdminResidentsResponse = {
  summary: {
    totalResidents: number;
    activeResidents: number;
    inactiveResidents: number;
    movedOutResidents: number;
    transferredResidents: number;
    assignedResidents: number;
    unassignedResidents: number;
  };
  residents: ResidentItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: ResidentItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "MOVED_OUT":
      return "Moved Out";
    case "TRANSFERRED":
      return "Transferred";
    case "INACTIVE":
      return "Inactive";
    default:
      return status;
  }
}

function getAssignmentLabel(resident: ResidentItem) {
  if (resident.status === "MOVED_OUT") return "Moved out";
  if (!resident.unitId || !resident.unit) return "Not assigned";
  return `${resident.unit.property.title} • Unit ${resident.unit.number}`;
}

export default function ResidentsPage() {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [adminSummary, setAdminSummary] =
    useState<AdminResidentsResponse["summary"] | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadResidents() {
      try {
        setLoading(true);
        setError("");

        if (isAdmin) {
          const res = await api.get<AdminResidentsResponse>("/residents");
          if (!mounted) return;
          setResidents(res.data?.residents ?? []);
          setAdminSummary(res.data?.summary ?? null);
          return;
        }

        if (isManager) {
          const res = await api.get<ResidentItem[]>("/residents/manager/me");
          if (!mounted) return;
          setResidents(res.data ?? []);
          setAdminSummary(null);
          return;
        }

        if (!mounted) return;
        setResidents([]);
        setAdminSummary(null);
        setError("This residents view is not available for your account.");
      } catch (err) {
        console.error("Failed to load residents", err);
        if (!mounted) return;
        setError("Failed to load residents.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadResidents();

    return () => {
      mounted = false;
    };
  }, [isAdmin, isManager]);

  async function reloadResidents() {
    if (isAdmin) {
      const res = await api.get<AdminResidentsResponse>("/residents");
      setResidents(res.data?.residents ?? []);
      setAdminSummary(res.data?.summary ?? null);
      return;
    }

    if (isManager) {
      const res = await api.get<ResidentItem[]>("/residents/manager/me");
      setResidents(res.data ?? []);
      setAdminSummary(null);
    }
  }

  async function handleCreateResident(e: React.FormEvent) {
    e.preventDefault();

    if (!isManager) return;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      await api.post("/users/resident", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      await reloadResidents();
      setMessage("Resident created successfully.");
    } catch (err: any) {
      console.error("Failed to create resident", err);
      const apiMessage = err?.response?.data?.message;

      setError(
        Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : apiMessage || "Failed to create resident.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMoveOut(residentId: string) {
    if (!isManager) return;

    try {
      setMovingId(residentId);
      setError("");
      setMessage("");

      await api.post(`/residents/${residentId}/move-out`);
      await reloadResidents();

      setMessage("Resident moved out successfully.");
    } catch (err: any) {
      console.error("Failed to move out resident", err);
      const apiMessage = err?.response?.data?.message;

      setError(
        Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : apiMessage || "Failed to move out resident.",
      );
    } finally {
      setMovingId(null);
    }
  }

  const stats = useMemo(() => {
    if (isAdmin && adminSummary) {
      return {
        total: adminSummary.totalResidents,
        active: adminSummary.activeResidents,
        unassigned: adminSummary.unassignedResidents,
        movedOut: adminSummary.movedOutResidents,
        assigned: adminSummary.assignedResidents,
        inactive: adminSummary.inactiveResidents,
        transferred: adminSummary.transferredResidents,
      };
    }

    const total = residents.length;
    const active = residents.filter((r) => r.status === "ACTIVE").length;
    const unassigned = residents.filter((r) => !r.unitId).length;
    const movedOut = residents.filter((r) => r.status === "MOVED_OUT").length;
    const assigned = residents.filter((r) => !!r.unitId).length;
    const inactive = residents.filter((r) => r.status === "INACTIVE").length;
    const transferred = residents.filter(
      (r) => r.status === "TRANSFERRED",
    ).length;

    return {
      total,
      active,
      unassigned,
      movedOut,
      assigned,
      inactive,
      transferred,
    };
  }, [residents, adminSummary, isAdmin]);

  return (
    <div className="residents-shell">
      <section className="residents-hero">
        <div className="residents-hero-copy">
          <p className="residents-eyebrow">
            {isAdmin ? "Admin Residents" : "Manager Residents"}
          </p>

          <h1 className="residents-title">
            {isAdmin
              ? "Oversee residents, occupancy allocation, and movement across the platform"
              : "Create residents, monitor occupancy assignments, and manage resident movement"}
          </h1>

          <p className="residents-text">
            {isAdmin
              ? "Maintain a platform-wide view of resident records, unit linkage, and status changes across properties, while keeping visibility into assigned and unassigned occupancy."
              : "Keep a structured view of all residents under your management, track assigned units, identify unassigned records, and process move-outs cleanly from one workspace."}
          </p>

          <div className="residents-tags">
            <span className="residents-tag">
              {isAdmin ? "Platform visibility" : "Resident creation"}
            </span>
            <span className="residents-tag">Unit assignment visibility</span>
            <span className="residents-tag">Move-out tracking</span>
            <span className="residents-tag">
              {isAdmin ? "Admin control" : "Manager-only access"}
            </span>
          </div>
        </div>

        <div className="residents-hero-grid">
          <div className="residents-stat-card dark">
            <span>Total Residents</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="residents-stat-card">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>

          <div className="residents-stat-card">
            <span>Unassigned</span>
            <strong>{stats.unassigned}</strong>
          </div>

          <div className="residents-stat-card">
            <span>Moved Out</span>
            <strong>{stats.movedOut}</strong>
          </div>
        </div>
      </section>

      <section className="residents-grid-two">
        <div className="residents-section">
          <div className="residents-section-head">
            <div>
              <h2 className="residents-section-title">
                {isAdmin ? "Residents Overview" : "Create Resident"}
              </h2>
              <p className="residents-section-subtitle">
                {isAdmin
                  ? "Platform-level visibility into resident account distribution"
                  : "Add a new resident profile under your management"}
              </p>
            </div>

            <span className="residents-chip">
              {isAdmin ? "Admin View" : "Manager Action"}
            </span>
          </div>

          {isAdmin ? (
            <div className="residents-metric-stack">
              <div className="residents-metric-card">
                <span>Assigned Residents</span>
                <strong>{stats.assigned}</strong>
                <small>Residents currently linked to a unit</small>
              </div>

              <div className="residents-metric-card">
                <span>Unassigned Residents</span>
                <strong>{stats.unassigned}</strong>
                <small>Profiles awaiting occupancy assignment</small>
              </div>

              <div className="residents-metric-card">
                <span>Transferred / Inactive</span>
                <strong>{stats.transferred + stats.inactive}</strong>
                <small>
                  Residents no longer in the standard active occupancy flow
                </small>
              </div>
            </div>
          ) : (
            <form className="residents-form" onSubmit={handleCreateResident}>
              <div className="residents-form-grid">
                <label className="residents-field">
                  <span>Full Name</span>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter resident name"
                  />
                </label>

                <label className="residents-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                  />
                </label>

                <label className="residents-field">
                  <span>Phone</span>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </label>

                <label className="residents-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Set temporary password"
                  />
                </label>
              </div>

              {message ? (
                <div className="residents-message success">{message}</div>
              ) : null}

              {error ? (
                <div className="residents-message error">{error}</div>
              ) : null}

              <div className="residents-actions">
                <button
                  type="submit"
                  className="residents-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Resident"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="residents-section">
          <div className="residents-section-head">
            <div>
              <h2 className="residents-section-title">
                {isAdmin ? "Residency Snapshot" : "Occupancy Summary"}
              </h2>
              <p className="residents-section-subtitle">
                {isAdmin
                  ? "High-level occupancy and resident movement across the platform"
                  : "High-level resident movement and assignment snapshot"}
              </p>
            </div>

            <span className="residents-chip">Live</span>
          </div>

          <div className="residents-metric-stack">
            <div className="residents-metric-card">
              <span>Assigned Residents</span>
              <strong>{stats.assigned}</strong>
              <small>Residents currently linked to a unit</small>
            </div>

            <div className="residents-metric-card">
              <span>Unassigned Residents</span>
              <strong>{stats.unassigned}</strong>
              <small>Profiles awaiting unit assignment</small>
            </div>

            <div className="residents-metric-card">
              <span>Moved Out</span>
              <strong>{stats.movedOut}</strong>
              <small>Residents who have completed move-out</small>
            </div>
          </div>
        </div>
      </section>

      <section className="residents-section">
        <div className="residents-section-head">
          <div>
            <h2 className="residents-section-title">Residents Directory</h2>
            <p className="residents-section-subtitle">
              {isAdmin
                ? "All residents across the platform"
                : "All residents created or managed within your properties"}
            </p>
          </div>

          <span className="residents-chip">
            {loading ? "Loading..." : `${residents.length} Residents`}
          </span>
        </div>

        {!isAdmin && message ? (
          <div className="residents-message success">{message}</div>
        ) : null}

        {!isAdmin && error ? (
          <div className="residents-message error">{error}</div>
        ) : null}

        {loading ? (
          <div className="residents-empty">Loading residents...</div>
        ) : residents.length === 0 ? (
          <div className="residents-empty">
            No residents found.
            <br />
            <span>
              {isAdmin
                ? "Residents will appear here once available on the platform."
                : "Your residents will appear here once created."}
            </span>
          </div>
        ) : (
          <div className="residents-table">
            <div className="residents-table-head">
              <span>Resident</span>
              <span>Status</span>
              <span>Assignment</span>
              <span>Unit</span>
              <span>Created</span>
              <span>Action</span>
            </div>

            <div className="residents-table-body">
              {residents.map((resident) => (
                <div key={resident.id} className="residents-table-row">
                  <div>
                    <strong>{resident.user?.name || "Unnamed Resident"}</strong>
                    <p>{resident.user?.email || resident.user?.phone || "-"}</p>
                  </div>

                  <span
                    className={`residents-status-pill ${resident.status
                      .toLowerCase()
                      .replace("_", "-")}`}
                  >
                    {formatStatus(resident.status)}
                  </span>

                  <div>
                    <strong>{getAssignmentLabel(resident)}</strong>
                    <p>{resident.unit?.property?.location || "-"}</p>
                  </div>

                  <span>{resident.unit?.number || "-"}</span>
                  <span>{formatDate(resident.createdAt)}</span>

                  <div className="residents-row-actions">
                    {isManager ? (
                      resident.unitId ? (
                        <button
                          type="button"
                          className="residents-secondary-btn"
                          onClick={() => handleMoveOut(resident.id)}
                          disabled={movingId === resident.id}
                        >
                          {movingId === resident.id
                            ? "Processing..."
                            : "Move Out"}
                        </button>
                      ) : (
                        <span className="residents-muted-text">
                          Not assigned
                        </span>
                      )
                    ) : (
                      <span className="residents-muted-text">
                        {resident.unitId ? "Assigned" : "Not assigned"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}