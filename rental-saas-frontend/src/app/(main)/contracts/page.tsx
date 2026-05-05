"use client";

import "@/styles/contracts.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type SummaryResponse = {
  totalContracts: number;
  activeContracts: number;
  inactiveContracts: number;
  totalRentRoll: number;
  totalDepositsHeld?: number;
  totalInvoiceExposure: number;
  contractsWithOverdueInvoices?: number;
  contractsNearRenewal: number;
};

type ContractListItem = {
  id: string;
  rentAmount: string | number;
  depositAmount: string | number;
  serviceCharge: string | number;
  garbageFee: string | number;
  initialTermMonths: number;
  startDate: string;
  billingAnchorDay: number;
  nextBillingDate: string;
  isActive: boolean;
  invoiceExposure?: number;
  monthsRunning?: number;
  estimatedEndDate?: string;
  isNearRenewal?: boolean;
  createdAt: string;
  updatedAt?: string;
  resident: {
    id: string;
    status?: string;
    moveOutDate?: string | null;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  } | null;
  unit: {
    id: string;
    number: string;
    rentAmount?: string | number;
    status?: string;
    property: {
      id: string;
      title: string;
      location: string | null;
      managerId?: string | null;
      owner?: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
      } | null;
      manager?: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
      } | null;
    } | null;
  } | null;
  latestInvoice?: {
    id: string;
    status: string;
    totalAmount: string | number;
    paidAmount?: string | number;
    period: string;
    dueDate: string;
    createdAt?: string;
  } | null;
  invoices?: {
    id: string;
    status: string;
    totalAmount: string | number;
    paidAmount?: string | number;
    period: string;
    dueDate: string;
    createdAt: string;
  }[];
};

type ContractDetailItem = ContractListItem;

type ContractsResponse = {
  summary: SummaryResponse;
  contracts: ContractListItem[];
};

type FilterType = "all" | "active" | "inactive";

function toNumber(value: string | number | null | undefined) {
  return Number(value || 0);
}

function formatCurrency(value: string | number | null | undefined) {
  const amount = toNumber(value);

  if (!Number.isFinite(amount)) {
    return "UGX 0";
  }

  return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getResidentName(item: ContractListItem | ContractDetailItem) {
  return item.resident?.user?.name || item.resident?.user?.email || "Resident";
}

function getLatestInvoice(item: ContractListItem | ContractDetailItem) {
  if (item.latestInvoice) return item.latestInvoice;

  if (!item.invoices?.length) return null;

  return [...item.invoices].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  )[0];
}

function getPaymentStanding(item: ContractListItem | ContractDetailItem) {
  const latestInvoice = getLatestInvoice(item);

  if (!latestInvoice) {
    return {
      label: "No invoice history",
      tone: "neutral",
      detail: "No invoice has been generated yet.",
    };
  }

  const status = String(latestInvoice.status || "").toUpperCase();

  if (status === "PAID") {
    return {
      label: "Up to date",
      tone: "positive",
      detail: `Latest invoice ${latestInvoice.period} is paid.`,
    };
  }

  if (status === "PARTIALLY_PAID") {
    return {
      label: "Partially paid",
      tone: "warning",
      detail: `Latest invoice ${latestInvoice.period} is partially paid.`,
    };
  }

  if (status === "OVERDUE") {
    return {
      label: "Behind on payment",
      tone: "danger",
      detail: `Latest invoice ${latestInvoice.period} is overdue.`,
    };
  }

  return {
    label: "Invoice issued",
    tone: "neutral",
    detail: `Latest invoice ${latestInvoice.period} is issued.`,
  };
}

function getContractStatusTag(isActive: boolean) {
  return isActive ? "Active" : "Closed";
}

function getContractsEndpoint(role: AppRole | undefined) {
  if (role === "ADMIN") return "/rent-contracts";
  if (role === "MANAGER") return "/rent-contracts/manager/me";
  return null;
}

export default function ContractsPage() {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;
  const isAdmin = role === "ADMIN";

  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [summary, setSummary] = useState<SummaryResponse>({
    totalContracts: 0,
    activeContracts: 0,
    inactiveContracts: 0,
    totalRentRoll: 0,
    totalDepositsHeld: 0,
    totalInvoiceExposure: 0,
    contractsWithOverdueInvoices: 0,
    contractsNearRenewal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] =
    useState<ContractDetailItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadContracts() {
      try {
        setLoading(true);
        setError("");

        const endpoint = getContractsEndpoint(role);

        if (!endpoint) {
          if (!mounted) return;
          setError("This contracts view is not available for your account.");
          setLoading(false);
          return;
        }

        const res = await api.get<ContractsResponse>(endpoint);

        if (!mounted) return;

        const payload = res.data;
        const items = payload?.contracts ?? [];

        setContracts(items);
        setSummary(
          payload?.summary ?? {
            totalContracts: 0,
            activeContracts: 0,
            inactiveContracts: 0,
            totalRentRoll: 0,
            totalDepositsHeld: 0,
            totalInvoiceExposure: 0,
            contractsWithOverdueInvoices: 0,
            contractsNearRenewal: 0,
          },
        );

        if (items.length > 0) {
          setSelectedId((prev) => prev ?? items[0].id);
        } else {
          setSelectedId(null);
          setSelectedContract(null);
        }
      } catch (loadError) {
        console.error("Failed to load contracts", loadError);
        if (!mounted) return;
        setError("We couldn’t load contracts right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadContracts();

    return () => {
      mounted = false;
    };
  }, [role]);

  const derivedSummary = useMemo(() => {
    const active = contracts.filter((item) => item.isActive).length;
    const inactive = contracts.filter((item) => !item.isActive).length;
    const monthlyRent = contracts
      .filter((item) => item.isActive)
      .reduce((sum, item) => sum + toNumber(item.rentAmount), 0);

    const overdue = contracts.filter((item) => {
      const latest = getLatestInvoice(item);
      return latest?.status?.toUpperCase() === "OVERDUE";
    }).length;

    const endingSoon = contracts.filter((item) => {
      if (!item.isActive) return false;

      const endDate = item.estimatedEndDate
        ? new Date(item.estimatedEndDate)
        : null;

      if (!endDate || Number.isNaN(endDate.getTime())) return false;

      const diff = endDate.getTime() - Date.now();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 45;
    }).length;

    const depositsHeld = contracts
      .filter((item) => item.isActive)
      .reduce((sum, item) => sum + toNumber(item.depositAmount), 0);

    const invoiceExposure = contracts.reduce(
      (sum, item) => sum + toNumber(item.invoiceExposure),
      0,
    );

    return {
      totalContracts: contracts.length,
      activeContracts: active,
      inactiveContracts: inactive,
      totalRentRoll: monthlyRent,
      totalDepositsHeld: depositsHeld,
      totalInvoiceExposure: invoiceExposure,
      contractsWithOverdueInvoices: overdue,
      contractsNearRenewal: endingSoon,
    };
  }, [contracts]);

  const activeSummary = summary.totalContracts ? summary : derivedSummary;

  const nextBillingDue = useMemo(() => {
    const activeContracts = contracts
      .filter((item) => item.isActive && item.nextBillingDate)
      .sort(
        (a, b) =>
          new Date(a.nextBillingDate).getTime() -
          new Date(b.nextBillingDate).getTime(),
      );

    return activeContracts[0]?.nextBillingDate ?? null;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return contracts.filter((item) => {
      const filterPass =
        filter === "all"
          ? true
          : filter === "active"
            ? item.isActive
            : !item.isActive;

      if (!filterPass) return false;
      if (!q) return true;

      const resident = getResidentName(item).toLowerCase();
      const property = item.unit?.property?.title?.toLowerCase() || "";
      const unit = item.unit?.number?.toLowerCase() || "";
      const location = (item.unit?.property?.location || "").toLowerCase();
      const owner = item.unit?.property?.owner?.name?.toLowerCase() || "";
      const manager = item.unit?.property?.manager?.name?.toLowerCase() || "";

      return (
        resident.includes(q) ||
        property.includes(q) ||
        unit.includes(q) ||
        location.includes(q) ||
        owner.includes(q) ||
        manager.includes(q)
      );
    });
  }, [contracts, filter, query]);

  useEffect(() => {
    if (!filteredContracts.length) {
      setSelectedId(null);
      setSelectedContract(null);
      return;
    }

    const stillExists = filteredContracts.some((item) => item.id === selectedId);

    if (!stillExists) {
      setSelectedId(filteredContracts[0].id);
    }
  }, [filteredContracts, selectedId]);

  useEffect(() => {
    let mounted = true;

    async function loadSelectedContract() {
      if (!selectedId) {
        setSelectedContract(null);
        return;
      }

      try {
        setDetailLoading(true);
        setDetailError("");

        const res = await api.get<ContractDetailItem>(
          `/rent-contracts/${selectedId}`,
        );

        if (!mounted) return;
        setSelectedContract(res.data);
      } catch (loadError) {
        console.error("Failed to load selected contract", loadError);
        if (!mounted) return;
        setSelectedContract(null);
        setDetailError("We couldn’t load the selected contract details.");
      } finally {
        if (mounted) setDetailLoading(false);
      }
    }

    loadSelectedContract();

    return () => {
      mounted = false;
    };
  }, [selectedId]);

  async function handleTerminateContract(id: string) {
    try {
      setTerminatingId(id);

      const res = await api.patch<ContractDetailItem>(
        `/rent-contracts/${id}/terminate`,
      );

      const terminated = res.data;

      setContracts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...terminated,
                latestInvoice: terminated.latestInvoice ?? item.latestInvoice,
              }
            : item,
        ),
      );

      if (selectedId === id) {
        setSelectedContract(terminated);
      }
    } catch (terminateError) {
      console.error("Failed to terminate contract", terminateError);
    } finally {
      setTerminatingId(null);
    }
  }

  return (
    <div className="contracts-shell">
      <section className="contracts-hero">
        <div className="contracts-hero-copy">
          <p className="contracts-eyebrow">
            {isAdmin ? "Admin Contracts" : "Manager Contracts"}
          </p>
          <h1 className="contracts-title">
            {isAdmin
              ? "Platform lease registry and contract oversight workspace"
              : "Premium lease registry and contract management workspace"}
          </h1>
          <p className="contracts-text">
            {isAdmin
              ? "Review active and closed lease obligations across the full platform, monitor billing exposure, renewal pressure, and resident occupancy from one admin control surface."
              : "Review contract terms, payment standing, billing schedules, and resident lease obligations across your managed properties from one operational workspace."}
          </p>

          <div className="contracts-tags">
            <span className="contracts-tag">Lease registry</span>
            <span className="contracts-tag">Payment standing</span>
            <span className="contracts-tag">Billing schedule</span>
            <span className="contracts-tag">
              {isAdmin ? "Platform oversight" : "Contract actions"}
            </span>
          </div>
        </div>

        <div className="contracts-hero-grid">
          <div className="contracts-stat-card dark">
            <span>Total Contracts</span>
            <strong>{activeSummary.totalContracts}</strong>
          </div>
          <div className="contracts-stat-card">
            <span>Active</span>
            <strong>{activeSummary.activeContracts}</strong>
          </div>
          <div className="contracts-stat-card">
            <span>Overdue</span>
            <strong>{activeSummary.contractsWithOverdueInvoices || 0}</strong>
          </div>
          <div className="contracts-stat-card">
            <span>Monthly Rent</span>
            <strong>{formatCurrency(activeSummary.totalRentRoll)}</strong>
          </div>
        </div>
      </section>

      <section className="contracts-toolbar">
        <div className="contracts-filter-row">
          <button
            type="button"
            className={`contracts-filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`contracts-filter-pill ${
              filter === "active" ? "active" : ""
            }`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            type="button"
            className={`contracts-filter-pill ${
              filter === "inactive" ? "active" : ""
            }`}
            onClick={() => setFilter("inactive")}
          >
            Closed
          </button>
        </div>

        <div className="contracts-toolbar-right">
          <div className="contracts-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAdmin
                  ? "Search resident, property, unit, location, owner, manager..."
                  : "Search resident, property, unit, location..."
              }
            />
          </div>
          <span className="contracts-toolbar-note">
            {loading ? "Loading..." : `${filteredContracts.length} contract results`}
          </span>
        </div>
      </section>

      {isAdmin && (
        <section className="contracts-summary-strip">
          <div className="contracts-summary-item">
            <span>Deposits Held</span>
            <strong>{formatCurrency(activeSummary.totalDepositsHeld || 0)}</strong>
          </div>
          <div className="contracts-summary-item">
            <span>Invoice Exposure</span>
            <strong>
              {formatCurrency(activeSummary.totalInvoiceExposure || 0)}
            </strong>
          </div>
          <div className="contracts-summary-item">
            <span>Near Renewal</span>
            <strong>{activeSummary.contractsNearRenewal || 0}</strong>
          </div>
          <div className="contracts-summary-item">
            <span>Inactive Contracts</span>
            <strong>{activeSummary.inactiveContracts}</strong>
          </div>
        </section>
      )}

      {error ? (
        <div className="contracts-empty contracts-empty-large">{error}</div>
      ) : null}

      <section className="contracts-workspace">
        <aside className="contracts-registry-panel">
          <div className="contracts-panel-head compact">
            <div>
              <h2 className="contracts-panel-title">Contract Registry</h2>
              <p className="contracts-panel-subtitle">
                Browse and open a lease record
              </p>
            </div>
            <span className="contracts-chip">
              {loading ? "..." : `${filteredContracts.length} items`}
            </span>
          </div>

          {loading ? (
            <div className="contracts-empty">Loading contracts...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="contracts-empty">
              No contracts found.
              <br />
              <span>Try another filter or search term.</span>
            </div>
          ) : (
            <div className="contracts-registry-list">
              {filteredContracts.map((item) => {
                const latestInvoice = getLatestInvoice(item);
                const standing = getPaymentStanding(item);
                const selected = selectedId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`contracts-registry-item ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="contracts-registry-top">
                      <div>
                        <h3>{getResidentName(item)}</h3>
                        <p>
                          {item.unit?.property?.title || "No property"} • Unit{" "}
                          {item.unit?.number || "—"}
                        </p>
                      </div>

                      <span
                        className={`contracts-mini-status ${
                          item.isActive ? "active" : "inactive"
                        }`}
                      >
                        {getContractStatusTag(item.isActive)}
                      </span>
                    </div>

                    <div className="contracts-registry-meta">
                      <span>{formatCurrency(item.rentAmount)}/month</span>
                      <span>{item.unit?.property?.location || "No location"}</span>
                    </div>

                    <div className="contracts-registry-bottom">
                      <span className={`contracts-standing ${standing.tone}`}>
                        {standing.label}
                      </span>
                      <span>
                        {latestInvoice ? latestInvoice.period : "No invoice"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="contracts-left-summary">
            <div className="contracts-panel-head compact">
              <div>
                <h2 className="contracts-panel-title">Lease Snapshot</h2>
                <p className="contracts-panel-subtitle">
                  Quick operating view for this contract register
                </p>
              </div>
              <span className="contracts-chip">Live</span>
            </div>

            <div className="contracts-left-summary-grid">
              <div className="contracts-doc-card">
                <span>Active Contracts</span>
                <strong>{activeSummary.activeContracts}</strong>
                <small>Currently running leases</small>
              </div>

              <div className="contracts-doc-card">
                <span>Monthly Rent</span>
                <strong>{formatCurrency(activeSummary.totalRentRoll)}</strong>
                <small>Expected monthly lease obligation</small>
              </div>

              <div className="contracts-doc-card">
                <span>Overdue Contracts</span>
                <strong>{activeSummary.contractsWithOverdueInvoices || 0}</strong>
                <small>Contracts needing payment follow-up</small>
              </div>

              <div className="contracts-doc-card">
                <span>Next Billing Due</span>
                <strong>{formatDate(nextBillingDue)}</strong>
                <small>Earliest upcoming billing date</small>
              </div>
            </div>
          </div>
        </aside>

        <section className="contracts-detail-panel">
          {detailLoading ? (
            <div className="contracts-empty contracts-empty-large">
              Loading contract details...
            </div>
          ) : detailError ? (
            <div className="contracts-empty contracts-empty-large">
              {detailError}
            </div>
          ) : !selectedContract ? (
            <div className="contracts-empty contracts-empty-large">
              Select a contract to view full lease details.
            </div>
          ) : (
            <>
              <div className="contracts-detail-head">
                <div>
                  <div className="contracts-detail-tags">
                    <span className="contracts-top-tag">
                      {selectedContract.unit?.property?.title || "No property"}
                    </span>
                    <span className="contracts-top-tag subtle">
                      Unit {selectedContract.unit?.number || "—"}
                    </span>
                    <span
                      className={`contracts-top-tag ${
                        selectedContract.isActive ? "active" : "inactive"
                      }`}
                    >
                      {getContractStatusTag(selectedContract.isActive)}
                    </span>
                  </div>

                  <h2 className="contracts-detail-title">
                    {getResidentName(selectedContract)}
                  </h2>

                  <p className="contracts-detail-subtitle">
                    {selectedContract.unit?.property?.location || "No location"} •
                    Contract started {formatDate(selectedContract.startDate)}
                  </p>
                </div>

                <div className="contracts-rent-badge">
                  <span>Monthly obligation</span>
                  <strong>{formatCurrency(selectedContract.rentAmount)}</strong>
                </div>
              </div>

              <div className="contracts-document">
                <section className="contracts-doc-section">
                  <div className="contracts-doc-head">
                    <h3>Contract Parties</h3>
                    <span>Lease identity</span>
                  </div>

                  <div className="contracts-doc-grid two">
                    <div className="contracts-doc-card">
                      <span>Resident</span>
                      <strong>{getResidentName(selectedContract)}</strong>
                      <small>
                        {selectedContract.resident?.user?.email || "No email"}
                      </small>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Phone</span>
                      <strong>
                        {selectedContract.resident?.user?.phone || "—"}
                      </strong>
                      <small>Primary contact</small>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Property</span>
                      <strong>
                        {selectedContract.unit?.property?.title || "No property"}
                      </strong>
                      <small>
                        {selectedContract.unit?.property?.location ||
                          "No location"}
                      </small>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Unit</span>
                      <strong>Unit {selectedContract.unit?.number || "—"}</strong>
                      <small>Occupancy-linked lease</small>
                    </div>
                  </div>
                </section>

                {isAdmin && (
                  <section className="contracts-doc-section">
                    <div className="contracts-doc-head">
                      <h3>Platform Oversight</h3>
                      <span>Ownership and management context</span>
                    </div>

                    <div className="contracts-doc-grid two">
                      <div className="contracts-doc-card">
                        <span>Property Owner</span>
                        <strong>
                          {selectedContract.unit?.property?.owner?.name ||
                            "No owner"}
                        </strong>
                        <small>
                          {selectedContract.unit?.property?.owner?.email ||
                            "No email"}
                        </small>
                      </div>

                      <div className="contracts-doc-card">
                        <span>Property Manager</span>
                        <strong>
                          {selectedContract.unit?.property?.manager?.name ||
                            "Unassigned"}
                        </strong>
                        <small>
                          {selectedContract.unit?.property?.manager?.email ||
                            "No manager email"}
                        </small>
                      </div>
                    </div>
                  </section>
                )}

                <section className="contracts-doc-section">
                  <div className="contracts-doc-head">
                    <h3>Financial Terms</h3>
                    <span>Core pricing structure</span>
                  </div>

                  <div className="contracts-doc-grid four">
                    <div className="contracts-doc-card">
                      <span>Monthly Rent</span>
                      <strong>{formatCurrency(selectedContract.rentAmount)}</strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Deposit</span>
                      <strong>
                        {formatCurrency(selectedContract.depositAmount)}
                      </strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Service Charge</span>
                      <strong>
                        {formatCurrency(selectedContract.serviceCharge)}
                      </strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Garbage Fee</span>
                      <strong>
                        {formatCurrency(selectedContract.garbageFee)}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="contracts-doc-section">
                  <div className="contracts-doc-head">
                    <h3>Term and Billing Schedule</h3>
                    <span>Timing and payment anchors</span>
                  </div>

                  <div className="contracts-doc-grid four">
                    <div className="contracts-doc-card">
                      <span>Term Length</span>
                      <strong>{selectedContract.initialTermMonths} months</strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Start Date</span>
                      <strong>{formatDate(selectedContract.startDate)}</strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Billing Day</span>
                      <strong>Day {selectedContract.billingAnchorDay}</strong>
                    </div>

                    <div className="contracts-doc-card">
                      <span>Next Billing</span>
                      <strong>
                        {formatDate(selectedContract.nextBillingDate)}
                      </strong>
                    </div>
                  </div>
                </section>

                {isAdmin && (
                  <section className="contracts-doc-section">
                    <div className="contracts-doc-head">
                      <h3>Contract Health</h3>
                      <span>Exposure and renewal visibility</span>
                    </div>

                    <div className="contracts-doc-grid four">
                      <div className="contracts-doc-card">
                        <span>Invoice Exposure</span>
                        <strong>
                          {formatCurrency(selectedContract.invoiceExposure || 0)}
                        </strong>
                      </div>
                      <div className="contracts-doc-card">
                        <span>Months Running</span>
                        <strong>{selectedContract.monthsRunning || 0}</strong>
                      </div>
                      <div className="contracts-doc-card">
                        <span>Estimated End</span>
                        <strong>
                          {formatDate(selectedContract.estimatedEndDate)}
                        </strong>
                      </div>
                      <div className="contracts-doc-card">
                        <span>Renewal Alert</span>
                        <strong>
                          {selectedContract.isNearRenewal
                            ? "Near renewal"
                            : "Stable"}
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

                <section className="contracts-doc-section">
                  <div className="contracts-doc-head">
                    <h3>Payment Standing</h3>
                    <span>Latest invoice and billing position</span>
                  </div>

                  <div className="contracts-standing-panel">
                    <div className="contracts-standing-summary">
                      <span
                        className={`contracts-standing-badge ${
                          getPaymentStanding(selectedContract).tone
                        }`}
                      >
                        {getPaymentStanding(selectedContract).label}
                      </span>
                      <p>{getPaymentStanding(selectedContract).detail}</p>
                    </div>

                    <div className="contracts-latest-invoice">
                      {getLatestInvoice(selectedContract) ? (
                        <>
                          <div className="contracts-invoice-line">
                            <span>Invoice Period</span>
                            <strong>
                              {getLatestInvoice(selectedContract)?.period}
                            </strong>
                          </div>
                          <div className="contracts-invoice-line">
                            <span>Status</span>
                            <strong>
                              {getLatestInvoice(selectedContract)?.status}
                            </strong>
                          </div>
                          <div className="contracts-invoice-line">
                            <span>Amount</span>
                            <strong>
                              {formatCurrency(
                                getLatestInvoice(selectedContract)?.totalAmount ||
                                  0,
                              )}
                            </strong>
                          </div>
                          <div className="contracts-invoice-line">
                            <span>Due Date</span>
                            <strong>
                              {formatDate(
                                getLatestInvoice(selectedContract)?.dueDate,
                              )}
                            </strong>
                          </div>
                        </>
                      ) : (
                        <div className="contracts-no-invoice">
                          No invoice has been generated for this contract yet.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="contracts-detail-actions">
                <button
                  type="button"
                  className="contracts-secondary-btn"
                  onClick={() =>
                    window.alert("Extend contract flow can be connected next.")
                  }
                >
                  Extend Contract
                </button>

                {selectedContract.isActive ? (
                  <button
                    type="button"
                    className="contracts-danger-btn strong"
                    disabled={terminatingId === selectedContract.id}
                    onClick={() => handleTerminateContract(selectedContract.id)}
                  >
                    {terminatingId === selectedContract.id
                      ? "Terminating..."
                      : "Terminate Contract"}
                  </button>
                ) : (
                  <div className="contracts-closed-state">
                    This contract is already closed.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}