"use client";

import "@/styles/invoices.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type InvoiceStatus = "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
type InvoiceFilter = "all" | "overdue" | "issued" | "partial" | "paid";

type InvoiceItem = {
  id: string;
  rentContractId: string;
  residentId: string;
  unitId: string;
  period: string;
  dueDate: string;
  totalAmount: string | number;
  paidAmount: string | number;
  status: InvoiceStatus;
  createdAt: string;
  resident?: {
    id: string;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  unit?: {
    id: string;
    number: string;
    property?: {
      id: string;
      title: string;
      location: string | null;
      managerId?: string | null;
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
  };
  rentContract?: {
    id: string;
    startDate: string;
    nextBillingDate: string;
    billingAnchorDay: number;
    initialTermMonths: number;
    isActive: boolean;
    rentAmount: string | number;
    depositAmount: string | number;
    serviceCharge: string | number;
    garbageFee: string | number;
  };
  payments?: {
    id: string;
    amount: string | number;
    channel: string;
    provider: string;
    providerRef: string;
    status: string;
    createdAt: string;
  }[];
};

type InvoiceResponse = {
  items: InvoiceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    paid: number;
    partial: number;
    overdue: number;
    issued: number;
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    latestPeriod: string;
  };
};

function toNumber(value: string | number | null | undefined) {
  return Number(value || 0);
}

function formatCurrency(value: string | number) {
  return `UGX ${toNumber(value).toLocaleString()}`;
}

function formatCompactCurrency(value: number) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;

  return `UGX ${num.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: InvoiceStatus) {
  switch (status) {
    case "ISSUED":
      return "Issued";
    case "PARTIALLY_PAID":
      return "Partially paid";
    case "PAID":
      return "Paid";
    case "OVERDUE":
      return "Overdue";
    default:
      return status;
  }
}

function getStatusTone(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return "paid";
    case "PARTIALLY_PAID":
      return "partial";
    case "OVERDUE":
      return "overdue";
    default:
      return "issued";
  }
}

function getStatusNote(status: InvoiceStatus, balance: number) {
  if (status === "PAID") return "This invoice has been fully cleared.";
  if (status === "OVERDUE")
    return `Outstanding balance is ${formatCurrency(balance)}.`;
  if (status === "PARTIALLY_PAID")
    return `Part payment received. Balance left is ${formatCurrency(balance)}.`;
  return `Invoice is awaiting payment of ${formatCurrency(balance)}.`;
}

function getInvoicesEndpoint(role: AppRole | undefined) {
  if (role === "ADMIN") return "/invoices";
  if (role === "MANAGER") return "/invoices/manager/me";
  return null;
}

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const [response, setResponse] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyAction, setBusyAction] = useState<
    "settle" | "remind" | "download" | null
  >(null);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => getInvoicesEndpoint(role), [role]);

  useEffect(() => {
    let mounted = true;

    async function loadInvoices() {
      try {
        setLoading(true);
        setError("");

        if (!endpoint) {
          if (!mounted) return;
          setResponse(null);
          setError("This invoices view is not available for your account.");
          return;
        }

        const status =
          activeFilter === "all"
            ? "ALL"
            : activeFilter === "overdue"
              ? "OVERDUE"
              : activeFilter === "issued"
                ? "ISSUED"
                : activeFilter === "partial"
                  ? "PARTIALLY_PAID"
                  : "PAID";

        const res = await api.get<InvoiceResponse>(endpoint, {
          params: {
            page,
            limit: 12,
            status,
            search: search.trim() || undefined,
          },
        });

        if (!mounted) return;

        const data = res.data;
        setResponse(data);

        if (data.items.length > 0) {
          setSelectedInvoiceId((current) => {
            const stillExists = data.items.some((item) => item.id === current);
            return stillExists ? current : data.items[0].id;
          });
        } else {
          setSelectedInvoiceId(null);
        }
      } catch (loadError) {
        console.error("Failed to load invoices", loadError);
        if (!mounted) return;
        setError("Failed to load invoices.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, [endpoint, activeFilter, search, page]);

  const invoices = response?.items ?? [];
  const summary = response?.summary ?? {
    total: 0,
    paid: 0,
    partial: 0,
    overdue: 0,
    issued: 0,
    totalBilled: 0,
    totalCollected: 0,
    outstanding: 0,
    latestPeriod: "",
  };
  const pagination = response?.pagination ?? {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  };

  const selectedInvoice =
    invoices.find((item) => item.id === selectedInvoiceId) || invoices[0] || null;

  const selectedBalance = selectedInvoice
    ? Math.max(
        0,
        toNumber(selectedInvoice.totalAmount) - toNumber(selectedInvoice.paidAmount),
      )
    : 0;

  const latestPeriod = summary.latestPeriod || "No invoices yet";

  async function refreshCurrentPage() {
    if (!endpoint) return;

    const status =
      activeFilter === "all"
        ? "ALL"
        : activeFilter === "overdue"
          ? "OVERDUE"
          : activeFilter === "issued"
            ? "ISSUED"
            : activeFilter === "partial"
              ? "PARTIALLY_PAID"
              : "PAID";

    const res = await api.get<InvoiceResponse>(endpoint, {
      params: {
        page,
        limit: 12,
        status,
        search: search.trim() || undefined,
      },
    });

    setResponse(res.data);
  }

  async function handleSendReminder() {
    if (!selectedInvoice) return;

    try {
      setBusyAction("remind");
      await api.post(`/invoices/${selectedInvoice.id}/remind`);
      await refreshCurrentPage();
    } catch (actionError) {
      console.error("Failed to send reminder", actionError);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadInvoice() {
    if (!selectedInvoice) return;

    try {
      setBusyAction("download");
      const res = await api.get(`/invoices/${selectedInvoice.id}/download`);
      const data = res.data;

      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) return;

      win.document.write(`
        <html>
          <head>
            <title>Invoice ${data.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
              h1 { margin-bottom: 8px; }
              h2 { margin-top: 28px; margin-bottom: 10px; }
              .row { margin: 6px 0; }
              .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-top: 16px; }
            </style>
          </head>
          <body>
            <h1>Invoice</h1>
            <div class="row"><strong>Invoice ID:</strong> ${data.invoiceNumber}</div>
            <div class="row"><strong>Period:</strong> ${data.period}</div>
            <div class="row"><strong>Status:</strong> ${data.status}</div>
            <div class="row"><strong>Due Date:</strong> ${formatDate(data.dueDate)}</div>

            <div class="box">
              <h2>Resident</h2>
              <div class="row"><strong>Name:</strong> ${data.resident?.name ?? "—"}</div>
              <div class="row"><strong>Email:</strong> ${data.resident?.email ?? "—"}</div>
              <div class="row"><strong>Phone:</strong> ${data.resident?.phone ?? "—"}</div>
            </div>

            <div class="box">
              <h2>Property</h2>
              <div class="row"><strong>Property:</strong> ${data.property?.title ?? "—"}</div>
              <div class="row"><strong>Location:</strong> ${data.property?.location ?? "—"}</div>
              <div class="row"><strong>Unit:</strong> ${data.property?.unitNumber ?? "—"}</div>
            </div>

            <div class="box">
              <h2>Totals</h2>
              <div class="row"><strong>Total:</strong> ${formatCurrency(data.totals.totalAmount)}</div>
              <div class="row"><strong>Paid:</strong> ${formatCurrency(data.totals.paidAmount)}</div>
              <div class="row"><strong>Outstanding:</strong> ${formatCurrency(data.totals.outstanding)}</div>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    } catch (actionError) {
      console.error("Failed to download invoice", actionError);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleMarkPaid() {
    if (!selectedInvoice) return;

    const providerRef = window.prompt("Enter payment reference");
    if (!providerRef) return;

    try {
      setBusyAction("settle");
      await api.post(`/invoices/${selectedInvoice.id}/settle`, {
        amount: selectedBalance,
        channel: "BANK",
        provider: "FLUTTERWAVE",
        providerRef,
      });
      await refreshCurrentPage();
    } catch (actionError) {
      console.error("Failed to settle invoice", actionError);
    } finally {
      setBusyAction(null);
    }
  }

  const propertyOwnerName = selectedInvoice?.unit?.property?.owner?.name || "No owner";
  const propertyManagerName =
    selectedInvoice?.unit?.property?.manager?.name || "No manager";

  return (
    <div className="invoices-shell">
      <section className="invoices-hero">
        <div className="invoices-hero-copy">
          <p className="invoices-eyebrow">
            {isAdmin ? "Admin Invoices" : "Manager Invoices"}
          </p>
          <h1 className="invoices-title">
            {isAdmin
              ? "Platform billing command center for issued, paid, partial, and overdue rent invoices"
              : "Billing command center for issued, paid, partial, and overdue rent invoices"}
          </h1>
          <p className="invoices-text">
            {isAdmin
              ? "Review invoice periods, due dates, balances, payment progress, and account standing across the full platform from one finance-focused admin workspace."
              : "Review invoice periods, due dates, balances, payment progress, and account standing from one finance-focused workspace built for manager operations."}
          </p>

          <div className="invoices-tags">
            <span className="invoices-tag">
              {isAdmin ? "Platform billing visibility" : "Billing visibility"}
            </span>
            <span className="invoices-tag">Overdue tracking</span>
            <span className="invoices-tag">Outstanding balances</span>
            <span className="invoices-tag">
              {isAdmin ? "Admin control" : "Payment history reference"}
            </span>
          </div>
        </div>

        <div className="invoices-hero-grid">
          <div className="invoices-stat-card dark">
            <span>Total Billed</span>
            <strong>{formatCompactCurrency(summary.totalBilled)}</strong>
          </div>

          <div className="invoices-stat-card">
            <span>Collected</span>
            <strong>{formatCompactCurrency(summary.totalCollected)}</strong>
          </div>

          <div className="invoices-stat-card">
            <span>Outstanding</span>
            <strong>{formatCompactCurrency(summary.outstanding)}</strong>
          </div>

          <div className="invoices-stat-card">
            <span>Latest Period</span>
            <strong>{latestPeriod}</strong>
          </div>
        </div>
      </section>

      <section className="invoices-summary-strip">
        <div className="invoices-summary-box">
          <span>Invoices</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="invoices-summary-box">
          <span>Paid</span>
          <strong>{summary.paid}</strong>
        </div>
        <div className="invoices-summary-box">
          <span>Partial</span>
          <strong>{summary.partial}</strong>
        </div>
        <div className="invoices-summary-box danger">
          <span>Overdue</span>
          <strong>{summary.overdue}</strong>
        </div>
      </section>

      <section className="invoices-toolbar">
        <div className="invoices-filter-row">
          <button
            type="button"
            className={`invoices-filter-pill ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setPage(1);
              setActiveFilter("all");
            }}
          >
            All
          </button>
          <button
            type="button"
            className={`invoices-filter-pill ${activeFilter === "overdue" ? "active" : ""}`}
            onClick={() => {
              setPage(1);
              setActiveFilter("overdue");
            }}
          >
            Overdue
          </button>
          <button
            type="button"
            className={`invoices-filter-pill ${activeFilter === "issued" ? "active" : ""}`}
            onClick={() => {
              setPage(1);
              setActiveFilter("issued");
            }}
          >
            Issued
          </button>
          <button
            type="button"
            className={`invoices-filter-pill ${activeFilter === "partial" ? "active" : ""}`}
            onClick={() => {
              setPage(1);
              setActiveFilter("partial");
            }}
          >
            Partial
          </button>
          <button
            type="button"
            className={`invoices-filter-pill ${activeFilter === "paid" ? "active" : ""}`}
            onClick={() => {
              setPage(1);
              setActiveFilter("paid");
            }}
          >
            Paid
          </button>
        </div>

        <div className="invoices-toolbar-search">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder={
              isAdmin
                ? "Search by invoice, period, contract, resident, unit, property..."
                : "Search by invoice, period, contract, resident, unit..."
            }
            className="invoices-search-input"
          />
        </div>
      </section>

      {error ? (
        <div className="invoices-empty detail">{error}</div>
      ) : (
        <section className="invoices-workspace">
          <div className="invoices-registry-panel">
            <div className="invoices-panel-head">
              <div>
                <h2 className="invoices-panel-title">Invoice Registry</h2>
                <p className="invoices-panel-subtitle">
                  Select an invoice to inspect billing position
                </p>
              </div>
              <span className="invoices-chip">
                {loading ? "Loading..." : `${pagination.total} total`}
              </span>
            </div>

            {loading ? (
              <div className="invoices-empty">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="invoices-empty">
                No invoices found.
                <br />
                <span>Your generated invoices will appear here once available.</span>
              </div>
            ) : (
              <>
                <div className="invoices-registry-list">
                  {invoices.map((item) => {
                    const balance = Math.max(
                      0,
                      toNumber(item.totalAmount) - toNumber(item.paidAmount),
                    );

                    const selected = selectedInvoice?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`invoices-registry-row ${selected ? "selected" : ""}`}
                        onClick={() => setSelectedInvoiceId(item.id)}
                      >
                        <div className="invoices-registry-row-top">
                          <div>
                            <h3>{item.resident?.user?.name || item.period}</h3>
                            <p>
                              {item.unit?.property?.title || "Property"} • Unit{" "}
                              {item.unit?.number || "—"}
                            </p>
                          </div>

                          <span
                            className={`invoices-status-pill ${getStatusTone(item.status)}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="invoices-registry-row-bottom">
                          <span>{formatCurrency(item.totalAmount)}</span>
                          <span className={balance > 0 ? "danger" : "success"}>
                            {balance > 0 ? formatCurrency(balance) : "Cleared"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="invoices-detail-actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="invoices-secondary-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <button type="button" className="invoices-secondary-btn" disabled>
                    Page {pagination.page} of {pagination.totalPages}
                  </button>
                  <button
                    type="button"
                    className="invoices-secondary-btn"
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(pagination.totalPages, prev + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="invoices-detail-panel">
            {!selectedInvoice ? (
              <div className="invoices-empty detail">
                Select an invoice to view its billing record.
              </div>
            ) : (
              <>
                <div className="invoices-detail-hero">
                  <div>
                    <div className="invoices-detail-topline">
                      <span className="invoices-detail-tag">{selectedInvoice.period}</span>
                      <span
                        className={`invoices-detail-tag ${getStatusTone(selectedInvoice.status)}`}
                      >
                        {getStatusLabel(selectedInvoice.status)}
                      </span>
                    </div>

                    <h2 className="invoices-detail-title">
                      {selectedInvoice.resident?.user?.name || "Invoice Billing Record"}
                    </h2>
                    <p className="invoices-detail-subtitle">
                      {selectedInvoice.unit?.property?.title || "Property"} • Unit{" "}
                      {selectedInvoice.unit?.number || "—"} • Due{" "}
                      {formatDate(selectedInvoice.dueDate)}
                    </p>
                  </div>

                  <div className="invoices-detail-value-box">
                    <span>Balance Due</span>
                    <strong>{formatCurrency(selectedBalance)}</strong>
                  </div>
                </div>

                <section className="invoices-detail-section">
                  <div className="invoices-section-head">
                    <h3>Invoice Identity</h3>
                    <span>Core references</span>
                  </div>

                  <div className="invoices-detail-grid two">
                    <div className="invoices-info-card">
                      <span>Invoice ID</span>
                      <strong>{selectedInvoice.id}</strong>
                    </div>
                    <div className="invoices-info-card">
                      <span>Contract ID</span>
                      <strong>{selectedInvoice.rentContractId}</strong>
                    </div>
                    <div className="invoices-info-card">
                      <span>Resident</span>
                      <strong>
                        {selectedInvoice.resident?.user?.name ||
                          selectedInvoice.resident?.user?.email ||
                          selectedInvoice.residentId}
                      </strong>
                    </div>
                    <div className="invoices-info-card">
                      <span>Property / Unit</span>
                      <strong>
                        {selectedInvoice.unit?.property?.title || "—"} • Unit{" "}
                        {selectedInvoice.unit?.number || "—"}
                      </strong>
                    </div>
                  </div>
                </section>

                {isAdmin && (
                  <section className="invoices-detail-section">
                    <div className="invoices-section-head">
                      <h3>Platform Oversight</h3>
                      <span>Ownership and management context</span>
                    </div>

                    <div className="invoices-detail-grid two">
                      <div className="invoices-info-card">
                        <span>Property Owner</span>
                        <strong>{propertyOwnerName}</strong>
                      </div>
                      <div className="invoices-info-card">
                        <span>Property Manager</span>
                        <strong>{propertyManagerName}</strong>
                      </div>
                    </div>
                  </section>
                )}

                <section className="invoices-detail-section">
                  <div className="invoices-section-head">
                    <h3>Billing Terms</h3>
                    <span>Financial breakdown</span>
                  </div>

                  <div className="invoices-detail-grid three">
                    <div className="invoices-info-card">
                      <span>Total Amount</span>
                      <strong>{formatCurrency(selectedInvoice.totalAmount)}</strong>
                    </div>
                    <div className="invoices-info-card">
                      <span>Paid Amount</span>
                      <strong>{formatCurrency(selectedInvoice.paidAmount)}</strong>
                    </div>
                    <div className="invoices-info-card">
                      <span>Outstanding</span>
                      <strong>{formatCurrency(selectedBalance)}</strong>
                    </div>
                  </div>
                </section>

                <section className="invoices-detail-section">
                  <div className="invoices-section-head">
                    <h3>Payment Standing</h3>
                    <span>Collection position</span>
                  </div>

                  <div className="invoices-standing-panel">
                    <div
                      className={`invoices-standing-note ${getStatusTone(selectedInvoice.status)}`}
                    >
                      <span className="badge">
                        {selectedInvoice.status === "PAID"
                          ? "Up to date"
                          : selectedInvoice.status === "OVERDUE"
                            ? "Behind on payment"
                            : selectedInvoice.status === "PARTIALLY_PAID"
                              ? "Partial payment"
                              : "Awaiting payment"}
                      </span>
                      <p>{getStatusNote(selectedInvoice.status, selectedBalance)}</p>
                    </div>

                    <div className="invoices-standing-table">
                      <div className="row">
                        <span>Status</span>
                        <strong>{getStatusLabel(selectedInvoice.status)}</strong>
                      </div>
                      <div className="row">
                        <span>Period</span>
                        <strong>{selectedInvoice.period}</strong>
                      </div>
                      <div className="row">
                        <span>Due Date</span>
                        <strong>{formatDate(selectedInvoice.dueDate)}</strong>
                      </div>
                      <div className="row">
                        <span>Created</span>
                        <strong>{formatDate(selectedInvoice.createdAt)}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="invoices-detail-actions">
                  <button
                    type="button"
                    className="invoices-secondary-btn"
                    onClick={handleDownloadInvoice}
                    disabled={busyAction !== null}
                  >
                    {busyAction === "download" ? "Preparing..." : "Download Invoice"}
                  </button>

                  <button
                    type="button"
                    className="invoices-secondary-btn"
                    onClick={handleSendReminder}
                    disabled={busyAction !== null}
                  >
                    {busyAction === "remind" ? "Sending..." : "Send Reminder"}
                  </button>

                  <button
                    type="button"
                    className="invoices-primary-btn"
                    onClick={handleMarkPaid}
                    disabled={busyAction !== null || selectedBalance <= 0}
                  >
                    {busyAction === "settle" ? "Recording..." : "Mark Paid"}
                  </button>
                </div>

                <p className="invoices-action-note">
                  {isAdmin
                    ? "This invoice workspace is now admin-ready, platform-wide, paginated, and action-ready."
                    : "This invoice workspace is now manager-scoped, paginated, and action-ready."}
                </p>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}