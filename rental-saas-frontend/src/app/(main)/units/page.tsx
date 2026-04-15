"use client";

import "@/styles/units.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole = "ADMIN" | "MANAGER" | "INVESTOR" | "RESIDENT" | "SERVICE_PROVIDER";

type UnitResponseItem = {
  id: string;
  number: string;
  rentAmount: number;
  status: "VACANT" | "OCCUPIED";
  property?: {
    id: string;
    title: string;
    location: string | null;
  } | null;
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
  activeResident?: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  } | null;
  residents?: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  }[];
  pendingInvoices?: number;
  invoiceExposure?: number;
  createdAt?: string;
  updatedAt?: string;
};

type AdminUnitsResponse = {
  summary: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    assignedResidents: number;
    unassignedUnits: number;
    totalRentPotential: number;
    totalInvoiceExposure: number;
    unitsWithPendingInvoices: number;
  };
  units: UnitResponseItem[];
};

type PropertyOption = {
  id: string;
  title: string;
  location: string | null;
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getHealthTone(unit: UnitResponseItem) {
  if ((unit.pendingInvoices || 0) > 0) return "warn";
  if (unit.status === "OCCUPIED") return "occupied";
  return "vacant";
}

function getHealthLabel(unit: UnitResponseItem) {
  if ((unit.pendingInvoices || 0) > 0) {
    return `${unit.pendingInvoices} pending invoice${unit.pendingInvoices === 1 ? "" : "s"}`;
  }
  if (unit.status === "OCCUPIED") return "Occupied";
  return "Vacant";
}

export default function UnitsPage() {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;

  const [units, setUnits] = useState<UnitResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [summary, setSummary] = useState({
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    assignedResidents: 0,
    unassignedUnits: 0,
    totalRentPotential: 0,
    totalInvoiceExposure: 0,
    unitsWithPendingInvoices: 0,
  });

  const [form, setForm] = useState({
    propertyId: "",
    number: "",
    rentAmount: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadUnits() {
      try {
        setLoading(true);
        setError("");

        if (role === "ADMIN") {
          const res = await api.get<AdminUnitsResponse>("/units");
          if (!mounted) return;
          setUnits(res.data.units ?? []);
          setSummary(
            res.data.summary ?? {
              totalUnits: 0,
              occupiedUnits: 0,
              vacantUnits: 0,
              assignedResidents: 0,
              unassignedUnits: 0,
              totalRentPotential: 0,
              totalInvoiceExposure: 0,
              unitsWithPendingInvoices: 0,
            },
          );
          return;
        }

        if (role === "MANAGER") {
          const res = await api.get<UnitResponseItem[]>("/units/manager/me");
          if (!mounted) return;

          const items = res.data ?? [];
          setUnits(items);

          const totalUnits = items.length;
          const occupiedUnits = items.filter((unit) => unit.status === "OCCUPIED").length;
          const vacantUnits = items.filter((unit) => unit.status === "VACANT").length;
          const assignedResidents = items.filter(
            (unit) => (unit.residents?.length || 0) > 0,
          ).length;
          const unassignedUnits = totalUnits - assignedResidents;
          const totalRentPotential = items.reduce(
            (sum, unit) => sum + Number(unit.rentAmount || 0),
            0,
          );

          setSummary({
            totalUnits,
            occupiedUnits,
            vacantUnits,
            assignedResidents,
            unassignedUnits,
            totalRentPotential,
            totalInvoiceExposure: 0,
            unitsWithPendingInvoices: 0,
          });
          return;
        }

        if (!mounted) return;
        setError("This units view is not available for your account.");
      } catch (err: any) {
        console.error("Failed to load units", err);
        if (!mounted) return;
        setError("Failed to load units.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUnits();

    return () => {
      mounted = false;
    };
  }, [role]);

  const properties = useMemo<PropertyOption[]>(() => {
    const map = new Map<string, PropertyOption>();

    units.forEach((unit) => {
      if (unit.property?.id && !map.has(unit.property.id)) {
        map.set(unit.property.id, {
          id: unit.property.id,
          title: unit.property.title,
          location: unit.property.location,
        });
      }
    });

    return Array.from(map.values());
  }, [units]);

  useEffect(() => {
    if (!form.propertyId && properties.length > 0) {
      setForm((prev) => ({
        ...prev,
        propertyId: properties[0].id,
      }));
    }
  }, [properties, form.propertyId]);

  const filteredUnits = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return units;

    return units.filter((unit) => {
      const activeResident =
        unit.activeResident?.user || unit.residents?.[0]?.user || null;

      const searchable = [
        unit.number,
        unit.property?.title || "",
        unit.property?.location || "",
        unit.manager?.name || "",
        unit.owner?.name || "",
        activeResident?.name || "",
        activeResident?.email || "",
        unit.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [units, search]);

  const totalUnits = summary.totalUnits;
  const occupiedUnits = summary.occupiedUnits;
  const vacantUnits = summary.vacantUnits;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const monthlyPotential = summary.totalRentPotential;

  const groupedUnits = useMemo(() => {
    const byProperty = new Map<
      string,
      {
        property: PropertyOption;
        units: UnitResponseItem[];
      }
    >();

    filteredUnits.forEach((unit) => {
      const propertyId = unit.property?.id || "unassigned-property";
      const propertyTitle = unit.property?.title || "Unknown Property";
      const propertyLocation = unit.property?.location || null;

      const existing = byProperty.get(propertyId);

      if (existing) {
        existing.units.push(unit);
      } else {
        byProperty.set(propertyId, {
          property: {
            id: propertyId,
            title: propertyTitle,
            location: propertyLocation,
          },
          units: [unit],
        });
      }
    });

    return Array.from(byProperty.values());
  }, [filteredUnits]);

  async function reloadUnits() {
    if (role === "ADMIN") {
      const res = await api.get<AdminUnitsResponse>("/units");
      setUnits(res.data.units ?? []);
      setSummary(res.data.summary);
      return;
    }

    if (role === "MANAGER") {
      const res = await api.get<UnitResponseItem[]>("/units/manager/me");
      const items = res.data ?? [];
      setUnits(items);

      const totalUnits = items.length;
      const occupiedUnits = items.filter((unit) => unit.status === "OCCUPIED").length;
      const vacantUnits = items.filter((unit) => unit.status === "VACANT").length;
      const assignedResidents = items.filter(
        (unit) => (unit.residents?.length || 0) > 0,
      ).length;
      const unassignedUnits = totalUnits - assignedResidents;
      const totalRentPotential = items.reduce(
        (sum, unit) => sum + Number(unit.rentAmount || 0),
        0,
      );

      setSummary({
        totalUnits,
        occupiedUnits,
        vacantUnits,
        assignedResidents,
        unassignedUnits,
        totalRentPotential,
        totalInvoiceExposure: 0,
        unitsWithPendingInvoices: 0,
      });
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.post("/units", {
        propertyId: form.propertyId,
        number: form.number,
        rentAmount: Number(form.rentAmount),
      });

      await reloadUnits();

      setForm((prev) => ({
        ...prev,
        number: "",
        rentAmount: "",
      }));

      setMessage("Unit created successfully.");
    } catch (err: any) {
      console.error("Failed to create unit", err);
      setError(err?.response?.data?.message || "Failed to create unit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUnit(id: string) {
    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      await api.delete(`/units/${id}`);
      await reloadUnits();

      setMessage("Unit deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete unit", err);
      setError(err?.response?.data?.message || "Failed to delete unit.");
    } finally {
      setDeletingId(null);
    }
  }

  const canCreate = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="units-shell">
      <section className="units-hero">
        <div className="units-hero-copy">
          <p className="units-eyebrow">
            {role === "ADMIN" ? "Admin Units Control" : "Manager Units"}
          </p>
          <h1 className="units-title">
            {role === "ADMIN"
              ? "Oversee unit inventory, occupancy, residents, and rent exposure across the platform"
              : "Monitor occupancy, create units, and manage rentable inventory"}
          </h1>
          <p className="units-text">
            {role === "ADMIN"
              ? "Track all units in one control center, review resident assignment, monitor invoice pressure, and maintain visibility across properties, managers, and owners."
              : "Track your unit mix across managed properties, review occupancy in real time, monitor monthly rent potential, and maintain a clean view of vacant versus occupied inventory."}
          </p>

          <div className="units-tags">
            <span className="units-tag">Occupancy control</span>
            <span className="units-tag">Rent visibility</span>
            <span className="units-tag">Resident-linked status</span>
            <span className="units-tag">
              {role === "ADMIN" ? "Platform-wide access" : "Manager-only access"}
            </span>
          </div>
        </div>

        <div className="units-hero-grid">
          <div className="units-stat-card dark">
            <span>Total Units</span>
            <strong>{loading ? "—" : totalUnits}</strong>
          </div>
          <div className="units-stat-card">
            <span>Occupied</span>
            <strong>{loading ? "—" : occupiedUnits}</strong>
          </div>
          <div className="units-stat-card">
            <span>Vacant</span>
            <strong>{loading ? "—" : vacantUnits}</strong>
          </div>
          <div className="units-stat-card">
            <span>Occupancy Rate</span>
            <strong>{loading ? "—" : formatPercent(occupancyRate)}</strong>
          </div>
        </div>
      </section>

      <section className="units-overview-bar">
        <div className="units-overview-item">
          <span>Monthly Rent Potential</span>
          <strong>{formatCurrency(monthlyPotential)}</strong>
        </div>
        <div className="units-overview-item">
          <span>Visible Properties</span>
          <strong>{properties.length}</strong>
        </div>
        <div className="units-overview-item">
          <span>Vacancy Pressure</span>
          <strong>{vacantUnits > 0 ? `${vacantUnits} open` : "Fully occupied"}</strong>
        </div>
        <div className="units-overview-item">
          <span>Inventory Health</span>
          <strong>
            {occupancyRate >= 80
              ? "Strong"
              : occupancyRate >= 50
              ? "Stable"
              : "Needs attention"}
          </strong>
        </div>
      </section>

      <section className="units-grid-two">
        <div className="units-section">
          <div className="units-section-head">
            <div>
              <h2 className="units-section-title">
                {canCreate ? "Create Unit" : "Units Directory"}
              </h2>
              <p className="units-section-subtitle">
                {canCreate
                  ? "Add a new unit to one of the visible properties"
                  : "Browse unit inventory visible to this account"}
              </p>
            </div>
            <span className="units-chip">
              {role === "ADMIN" ? "Admin Action" : "Manager Action"}
            </span>
          </div>

          {!canCreate ? (
            <div className="units-empty">
              Unit creation is not available for this account.
            </div>
          ) : properties.length === 0 ? (
            <div className="units-empty">
              No visible properties found.
              <br />
              <span>Add or assign a property first before creating units.</span>
            </div>
          ) : (
            <form className="units-form" onSubmit={handleCreateUnit}>
              <div className="units-form-grid">
                <label className="units-field">
                  <span>Property</span>
                  <select
                    value={form.propertyId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, propertyId: e.target.value }))
                    }
                  >
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                        {property.location ? ` • ${property.location}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="units-field">
                  <span>Unit Number</span>
                  <input
                    value={form.number}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, number: e.target.value }))
                    }
                    placeholder="e.g. A-01"
                  />
                </label>

                <label className="units-field">
                  <span>Rent Amount</span>
                  <input
                    type="number"
                    min="0"
                    value={form.rentAmount}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, rentAmount: e.target.value }))
                    }
                    placeholder="e.g. 1200000"
                  />
                </label>
              </div>

              {message ? <div className="units-message success">{message}</div> : null}
              {error ? <div className="units-message error">{error}</div> : null}

              <div className="units-actions">
                <button type="submit" className="units-primary-btn" disabled={saving}>
                  {saving ? "Creating..." : "Create Unit"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="units-section">
          <div className="units-section-head">
            <div>
              <h2 className="units-section-title">Occupancy Snapshot</h2>
              <p className="units-section-subtitle">
                Operational summary of current rentable stock
              </p>
            </div>
            <span className="units-chip">Live</span>
          </div>

          <div className="units-metric-stack">
            <div className="units-metric-card">
              <span>Occupied Inventory</span>
              <strong>{occupiedUnits}</strong>
              <small>Units currently carrying active occupancy</small>
            </div>

            <div className="units-metric-card">
              <span>Vacant Inventory</span>
              <strong>{vacantUnits}</strong>
              <small>Units available for assignment or leasing</small>
            </div>

            <div className="units-metric-card">
              <span>Rent Potential</span>
              <strong>{formatCurrency(monthlyPotential)}</strong>
              <small>Total gross monthly rent across visible units</small>
            </div>

            <div className="units-metric-card">
              <span>Invoice Exposure</span>
              <strong>{formatCurrency(summary.totalInvoiceExposure)}</strong>
              <small>Outstanding receivable pressure across unit invoices</small>
            </div>
          </div>
        </div>
      </section>

      <section className="units-section">
        <div className="units-section-head">
          <div>
            <h2 className="units-section-title">Search Units</h2>
            <p className="units-section-subtitle">
              Filter by unit, property, location, owner, manager, or resident
            </p>
          </div>
          <span className="units-chip">
            {loading ? "Loading..." : `${filteredUnits.length} visible`}
          </span>
        </div>

        <div className="units-search-wrap">
          <input
            className="units-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit number, property, location, owner, manager, or resident..."
          />
        </div>
      </section>

      <section className="units-section">
        <div className="units-section-head">
          <div>
            <h2 className="units-section-title">
              {role === "ADMIN" ? "Platform Units" : "Managed Units"}
            </h2>
            <p className="units-section-subtitle">
              Property-by-property view of all visible units
            </p>
          </div>
          <span className="units-chip">
            {loading ? "Loading..." : `${filteredUnits.length} Units`}
          </span>
        </div>

        {message ? <div className="units-message success">{message}</div> : null}
        {error ? <div className="units-message error">{error}</div> : null}

        {loading ? (
          <div className="units-empty">Loading units...</div>
        ) : groupedUnits.length === 0 ? (
          <div className="units-empty">
            No units found.
            <br />
            <span>Visible units will appear here once available.</span>
          </div>
        ) : (
          <div className="units-property-stack">
            {groupedUnits.map((group) => (
              <div key={group.property.id} className="units-property-card">
                <div className="units-property-head">
                  <div>
                    <h3>{group.property.title}</h3>
                    <p>{group.property.location || "No location"}</p>
                  </div>
                  <span className="units-property-badge">
                    {group.units.length} units
                  </span>
                </div>

                <div className="units-table">
                  <div className="units-table-head">
                    <span>Unit</span>
                    <span>Status</span>
                    <span>Resident</span>
                    <span>Rent</span>
                    <span>Health</span>
                    <span>Action</span>
                  </div>

                  <div className="units-table-body">
                    {group.units.map((unit) => {
                      const activeResident =
                        unit.activeResident?.user || unit.residents?.[0]?.user || null;

                      return (
                        <div key={unit.id} className="units-table-row">
                          <div>
                            <strong>{unit.number}</strong>
                            <p>{group.property.title}</p>
                          </div>

                          <span
                            className={`units-status-pill ${
                              unit.status === "OCCUPIED" ? "occupied" : "vacant"
                            }`}
                          >
                            {unit.status}
                          </span>

                          <div>
                            <strong>{activeResident?.name || "No active resident"}</strong>
                            <p>{activeResident?.email || "Available"}</p>
                          </div>

                          <span className="units-rent-value">
                            {formatCurrency(unit.rentAmount)}
                          </span>

                          <span
                            className={`units-status-pill ${getHealthTone(unit)}`}
                          >
                            {getHealthLabel(unit)}
                          </span>

                          {(role === "ADMIN" || role === "MANAGER") ? (
                            <button
                              type="button"
                              className="units-delete-btn"
                              onClick={() => handleDeleteUnit(unit.id)}
                              disabled={deletingId === unit.id}
                            >
                              {deletingId === unit.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : (
                            <span className="units-table-muted">View only</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}