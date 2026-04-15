"use client";

import "@/styles/payments.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type ResidentPaymentItem = {
  id: string;
  createdAt: string;
  amount: number;
  channel: string;
  provider: string;
  providerRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  invoiceId: string;
  invoice: {
    id: string;
    period: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    unitNumber: string | null;
    propertyTitle: string | null;
    propertyLocation: string | null;
  } | null;
};

type ResidentPaymentsResponse = {
  items: ResidentPaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  audience: "resident";
};

type ResidentPaymentSummaryResponse = {
  totalPaid: number;
  successfulPaymentsCount: number;
  currentInvoice: {
    id: string;
    period: string;
    dueDate: string;
    status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    unitNumber: string | null;
    propertyTitle: string | null;
    propertyLocation: string | null;
  } | null;
  latestPayment: {
    id: string;
    createdAt: string;
    amount: number;
    channel: string;
    provider: string;
    providerRef: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    invoiceId: string;
    propertyTitle: string | null;
    unitNumber: string | null;
    period: string | null;
  } | null;
  audience: "resident";
};

type CurrentResidentInvoiceResponse = {
  id: string;
  rentContractId: string;
  residentId: string;
  unitId: string;
  period: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  unit: {
    number: string;
    property: {
      title: string;
      location: string | null;
    };
  };
  rentContract: {
    rentAmount: number | string;
    depositAmount: number | string;
    serviceCharge: number | string;
    garbageFee: number | string;
  };
  outstandingAmount: number;
};

type PlatformPaymentItem = {
  id: string;
  createdAt: string;
  amount: number;
  channel: string;
  provider: string;
  providerRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  invoiceId: string;
  invoice: {
    id: string;
    period: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    resident?: {
      id: string;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
        phone?: string | null;
      };
    } | null;
    unit?: {
      id: string;
      number: string;
      property?: {
        id: string;
        title: string;
        location: string | null;
        manager?: {
          id: string;
          name: string | null;
          email: string | null;
          phone?: string | null;
        } | null;
        owner?: {
          id: string;
          name: string | null;
          email: string | null;
          phone?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
};

type PlatformPaymentsResponse = {
  items: PlatformPaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalPayments: number;
    totalSuccessfulAmount: number;
  };
  audience: "admin" | "manager";
};

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0);
}

function formatMoney(value: number | string | null | undefined) {
  return `UGX ${toNumber(value).toLocaleString()}`;
}

function formatCompactMoney(value: number | string | null | undefined) {
  const num = toNumber(value);
  if (Math.abs(num) >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(num) >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;
  return `UGX ${num.toLocaleString()}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getPaymentBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "success") return "payment-success";
  if (normalized === "pending") return "payment-pending";
  if (normalized === "failed") return "payment-failed";
  return "payment-pending";
}

function getInvoiceBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "invoice-paid";
  if (normalized === "partially_paid") return "invoice-partially_paid";
  if (normalized === "issued") return "invoice-issued";
  if (normalized === "overdue") return "invoice-overdue";
  return "invoice-issued";
}

function getPlatformEndpoint(role: AppRole | undefined) {
  if (role === "ADMIN") return "/payments";
  if (role === "MANAGER") return "/payments/manager/me";
  return null;
}

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const role = user?.role as AppRole | undefined;
  const isResident = role === "RESIDENT";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const [loading, setLoading] = useState(true);

  const [payments, setPayments] = useState<ResidentPaymentItem[]>([]);
  const [summary, setSummary] = useState<ResidentPaymentSummaryResponse | null>(null);
  const [currentInvoiceDetails, setCurrentInvoiceDetails] =
    useState<CurrentResidentInvoiceResponse | null>(null);

  const [platformResponse, setPlatformResponse] =
    useState<PlatformPaymentsResponse | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPayments() {
      try {
        setLoading(true);
        setError("");

        if (isResident) {
          const [paymentsRes, summaryRes, invoiceRes] = await Promise.all([
            api.get<ResidentPaymentsResponse>("/payments/resident/me"),
            api.get<ResidentPaymentSummaryResponse>("/payments/resident/summary"),
            api.get<CurrentResidentInvoiceResponse>("/invoices/resident/me/current"),
          ]);

          if (!mounted) return;

          setPayments(paymentsRes.data?.items || []);
          setSummary(summaryRes.data || null);
          setCurrentInvoiceDetails(invoiceRes.data || null);
          setPlatformResponse(null);
          setSelectedPaymentId(null);
          return;
        }

        const endpoint = getPlatformEndpoint(role);
        if (!endpoint) {
          if (!mounted) return;
          setError("This payments view is not available for your account.");
          setPayments([]);
          setSummary(null);
          setCurrentInvoiceDetails(null);
          setPlatformResponse(null);
          return;
        }

        const res = await api.get<PlatformPaymentsResponse>(endpoint, {
          params: {
            page,
            limit: 12,
            search: search.trim() || undefined,
          },
        });

        if (!mounted) return;

        setPlatformResponse(res.data);
        setPayments([]);
        setSummary(null);
        setCurrentInvoiceDetails(null);

        const items = res.data?.items || [];
        if (items.length > 0) {
          setSelectedPaymentId((current) => {
            const exists = items.some((item) => item.id === current);
            return exists ? current : items[0].id;
          });
        } else {
          setSelectedPaymentId(null);
        }
      } catch (err) {
        console.error("Failed to load payments", err);
        if (!mounted) return;
        setError("Failed to load payments.");
        setPayments([]);
        setSummary(null);
        setCurrentInvoiceDetails(null);
        setPlatformResponse(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPayments();

    return () => {
      mounted = false;
    };
  }, [isResident, role, page, search]);

  const metrics = useMemo(() => {
    const totalPaid = Number(summary?.totalPaid ?? 0);
    const currentInvoice = summary?.currentInvoice;
    const outstanding = Number(currentInvoice?.outstandingAmount ?? 0);
    const totalCurrentInvoice = Number(currentInvoice?.totalAmount ?? 0);
    const paymentCount = Number(summary?.successfulPaymentsCount ?? 0);

    return {
      totalPaid,
      outstanding,
      totalCurrentInvoice,
      paymentCount,
    };
  }, [summary]);

  const feeBreakdown = useMemo(() => {
    if (!currentInvoiceDetails) {
      return {
        rentAmount: 0,
        serviceCharge: 0,
        garbageFee: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
      };
    }

    return {
      rentAmount: toNumber(currentInvoiceDetails.rentContract?.rentAmount),
      serviceCharge: toNumber(currentInvoiceDetails.rentContract?.serviceCharge),
      garbageFee: toNumber(currentInvoiceDetails.rentContract?.garbageFee),
      totalAmount: toNumber(currentInvoiceDetails.totalAmount),
      paidAmount: toNumber(currentInvoiceDetails.paidAmount),
      outstandingAmount: toNumber(currentInvoiceDetails.outstandingAmount),
    };
  }, [currentInvoiceDetails]);

  const platformItems = platformResponse?.items || [];
  const platformSummary = platformResponse?.summary || {
    totalPayments: 0,
    totalSuccessfulAmount: 0,
  };

  const selectedPlatformPayment =
    platformItems.find((item) => item.id === selectedPaymentId) || platformItems[0] || null;

  const platformSuccessCount = useMemo(
    () => platformItems.filter((item) => item.status === "SUCCESS").length,
    [platformItems],
  );

  const platformPendingCount = useMemo(
    () => platformItems.filter((item) => item.status === "PENDING").length,
    [platformItems],
  );

  const platformFailedCount = useMemo(
    () => platformItems.filter((item) => item.status === "FAILED").length,
    [platformItems],
  );

  if (isResident) {
    return (
      <div className="payments-shell resident-payments-shell">
        <section className="payments-hero resident-payments-hero">
          <div className="payments-hero-copy">
            <p className="payments-eyebrow">Resident Payments</p>
            <h1 className="payments-title">
              Keep track of your rent payments and current invoice
            </h1>
            <p className="payments-text">
              See what you have paid, what is still outstanding, and exactly how
              your current invoice is made up.
            </p>

            <div className="payments-tags">
              <span className="payments-tag">Current invoice</span>
              <span className="payments-tag">Outstanding balance</span>
              <span className="payments-tag">Fee breakdown</span>
              <span className="payments-tag">Payment history</span>
            </div>
          </div>

          <div className="payments-summary-grid resident-payments-summary-grid">
            <div className="payments-summary-card dark">
              <span>Total Paid</span>
              <strong>{formatMoney(metrics.totalPaid)}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Outstanding</span>
              <strong>{formatMoney(metrics.outstanding)}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Current Invoice</span>
              <strong>{formatMoney(metrics.totalCurrentInvoice)}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Successful Payments</span>
              <strong>{metrics.paymentCount}</strong>
            </div>
          </div>
        </section>

        <section className="payments-card resident-payments-current-card">
          <div className="payments-card-head">
            <div>
              <h2 className="payments-card-title">Current Invoice Snapshot</h2>
              <p className="payments-card-subtitle">
                Your latest rent invoice and payment standing
              </p>
            </div>

            <span className="payments-chip">
              {loading
                ? "Loading..."
                : summary?.currentInvoice
                  ? formatStatusLabel(summary.currentInvoice.status)
                  : "No active invoice"}
            </span>
          </div>

          {!summary?.currentInvoice ? (
            <div className="payments-empty">
              No active invoice right now.
              <br />
              <span>Your next billing update will appear here.</span>
            </div>
          ) : (
            <div className="resident-payments-current-grid">
              <div className="resident-payments-current-panel">
                <p className="resident-payments-current-label">Property</p>
                <h3 className="resident-payments-current-title">
                  {summary.currentInvoice.propertyTitle || "—"}
                </h3>
                <p className="resident-payments-current-text">
                  {summary.currentInvoice.propertyLocation || "No location"} · Unit{" "}
                  {summary.currentInvoice.unitNumber || "—"}
                </p>

                <div className="resident-payments-current-meta">
                  <div className="resident-payments-current-stat">
                    <span>Period</span>
                    <strong>{summary.currentInvoice.period}</strong>
                  </div>
                  <div className="resident-payments-current-stat">
                    <span>Due Date</span>
                    <strong>{formatDate(summary.currentInvoice.dueDate)}</strong>
                  </div>
                </div>

                <div className="resident-payments-breakdown-light">
                  <div className="resident-payments-breakdown-light-row">
                    <span>Rent</span>
                    <strong>{formatMoney(feeBreakdown.rentAmount)}</strong>
                  </div>
                  <div className="resident-payments-breakdown-light-row">
                    <span>Service charge</span>
                    <strong>{formatMoney(feeBreakdown.serviceCharge)}</strong>
                  </div>
                  <div className="resident-payments-breakdown-light-row">
                    <span>Garbage fee</span>
                    <strong>{formatMoney(feeBreakdown.garbageFee)}</strong>
                  </div>
                </div>
              </div>

              <div className="resident-payments-breakdown-card">
                <div className="resident-payments-breakdown-row">
                  <span>Total invoice</span>
                  <strong>{formatMoney(feeBreakdown.totalAmount)}</strong>
                </div>
                <div className="resident-payments-breakdown-row">
                  <span>Paid so far</span>
                  <strong>{formatMoney(feeBreakdown.paidAmount)}</strong>
                </div>
                <div className="resident-payments-breakdown-row highlight">
                  <span>Outstanding</span>
                  <strong>{formatMoney(feeBreakdown.outstandingAmount)}</strong>
                </div>
                <div className="resident-payments-breakdown-note">
                  Payments are settled from your wallet balance.
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="payments-card">
          <div className="payments-card-head">
            <div>
              <h2 className="payments-card-title">Payment History</h2>
              <p className="payments-card-subtitle">
                Your recent resident payment activity
              </p>
            </div>
            <span className="payments-chip">
              {loading ? "Loading..." : `${payments.length} records`}
            </span>
          </div>

          {loading ? (
            <div className="payments-empty">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="payments-empty">
              No payments yet.
              <br />
              <span>Your completed and pending payments will appear here.</span>
            </div>
          ) : (
            <div className="payments-table resident-payments-table">
              <div className="payments-head resident-payments-head">
                <span>Property</span>
                <span>Unit / Period</span>
                <span>Amount</span>
                <span>Payment</span>
                <span>Invoice</span>
                <span>Date</span>
              </div>

              <div className="payments-body">
                {payments.map((payment) => (
                  <div key={payment.id} className="payments-row resident-payments-row">
                    <div className="payments-cell-main">
                      <strong>{payment.invoice?.propertyTitle || "Property"}</strong>
                      <p>{payment.invoice?.propertyLocation || "No location"}</p>
                    </div>

                    <div className="payments-cell-main">
                      <strong>Unit {payment.invoice?.unitNumber || "—"}</strong>
                      <p>{payment.invoice?.period || "—"}</p>
                    </div>

                    <div className="payments-cell-main">
                      <strong>{formatMoney(payment.amount)}</strong>
                      <p>{payment.provider || payment.channel}</p>
                    </div>

                    <div className="payments-cell-main payments-cell-stack">
                      <span
                        className={`status ${getPaymentBadgeClass(payment.status)}`}
                      >
                        {formatStatusLabel(payment.status)}
                      </span>
                      <p className="payments-ref-text">
                        {payment.providerRef || "No reference"}
                      </p>
                    </div>

                    <div className="payments-cell-main payments-cell-stack">
                      <span
                        className={`status ${getInvoiceBadgeClass(
                          payment.invoice?.status || "ISSUED",
                        )}`}
                      >
                        Invoice {formatStatusLabel(payment.invoice?.status || "ISSUED")}
                      </span>
                      <p className="payments-stack-text">
                        Due {formatDate(payment.invoice?.dueDate)}
                      </p>
                    </div>

                    <div className="payments-cell-main payments-cell-stack">
                      <strong>{formatDate(payment.createdAt)}</strong>
                      <p className="payments-stack-text">{payment.channel}</p>
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

  return (
    <div className="payments-shell platform-payments-shell">
      <section className="payments-hero platform-payments-hero">
        <div className="payments-hero-copy">
          <p className="payments-eyebrow">
            {isAdmin ? "Admin Payments" : "Manager Payments"}
          </p>
          <h1 className="payments-title">
            {isAdmin
              ? "Oversee rent collections, payment flow, and platform-wide payment visibility"
              : "Track rent collections, payment flow, and property-level collection activity"}
          </h1>
          <p className="payments-text">
            {isAdmin
              ? "Monitor successful, pending, and failed payments across the platform, inspect payment references, and review ownership context around every collection event."
              : "Review recent collections across your managed properties, inspect payment references, and stay on top of payment performance from one workspace."}
          </p>

          <div className="payments-tags">
            <span className="payments-tag">
              {isAdmin ? "Platform collections" : "Managed collections"}
            </span>
            <span className="payments-tag">Payment references</span>
            <span className="payments-tag">Collection visibility</span>
            <span className="payments-tag">
              {isAdmin ? "Admin control" : "Manager operations"}
            </span>
          </div>
        </div>

        <div className="payments-summary-grid platform-payments-summary-grid">
          <div className="payments-summary-card dark">
            <span>Total Collected</span>
            <strong>{formatCompactMoney(platformSummary.totalSuccessfulAmount)}</strong>
          </div>
          <div className="payments-summary-card">
            <span>Total Payments</span>
            <strong>{platformSummary.totalPayments}</strong>
          </div>
          <div className="payments-summary-card">
            <span>Successful</span>
            <strong>{platformSuccessCount}</strong>
          </div>
          <div className="payments-summary-card">
            <span>Pending / Failed</span>
            <strong>{platformPendingCount + platformFailedCount}</strong>
          </div>
        </div>
      </section>

      <section className="payments-toolbar">
        <div className="payments-toolbar-note">
          {loading
            ? "Loading payments..."
            : `${platformResponse?.pagination.total ?? 0} total payment records`}
        </div>

        <div className="payments-toolbar-search">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder={
              isAdmin
                ? "Search by payment, resident, invoice, unit, property, reference..."
                : "Search by payment, resident, invoice, unit, property..."
            }
            className="payments-search-input"
          />
        </div>
      </section>

      {error ? (
        <div className="payments-empty">{error}</div>
      ) : (
        <section className="payments-workspace">
          <div className="payments-registry-panel">
            <div className="payments-card-head">
              <div>
                <h2 className="payments-card-title">Payment Registry</h2>
                <p className="payments-card-subtitle">
                  Select a payment to inspect collection details
                </p>
              </div>
              <span className="payments-chip">
                {loading ? "Loading..." : `${platformItems.length} visible`}
              </span>
            </div>

            {loading ? (
              <div className="payments-empty">Loading payments...</div>
            ) : platformItems.length === 0 ? (
              <div className="payments-empty">
                No payments found.
                <br />
                <span>Payment records will appear here once available.</span>
              </div>
            ) : (
              <>
                <div className="payments-registry-list">
                  {platformItems.map((payment) => (
                    <button
                      key={payment.id}
                      type="button"
                      className={`payments-registry-row ${
                        selectedPlatformPayment?.id === payment.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedPaymentId(payment.id)}
                    >
                      <div className="payments-registry-top">
                        <div>
                          <h3>
                            {payment.invoice?.resident?.user?.name ||
                              payment.invoice?.resident?.user?.email ||
                              "Payment record"}
                          </h3>
                          <p>
                            {payment.invoice?.unit?.property?.title || "Property"} • Unit{" "}
                            {payment.invoice?.unit?.number || "—"}
                          </p>
                        </div>

                        <span className={`status ${getPaymentBadgeClass(payment.status)}`}>
                          {formatStatusLabel(payment.status)}
                        </span>
                      </div>

                      <div className="payments-registry-bottom">
                        <span>{formatMoney(payment.amount)}</span>
                        <span>{payment.providerRef || "No reference"}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="payments-pagination">
                  <button
                    type="button"
                    className="payments-secondary-btn"
                    disabled={!platformResponse?.pagination.hasPrevPage}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                  <button type="button" className="payments-secondary-btn" disabled>
                    Page {platformResponse?.pagination.page || 1} of{" "}
                    {platformResponse?.pagination.totalPages || 1}
                  </button>
                  <button
                    type="button"
                    className="payments-secondary-btn"
                    disabled={!platformResponse?.pagination.hasNextPage}
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(platformResponse?.pagination.totalPages || prev, prev + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="payments-detail-panel">
            {!selectedPlatformPayment ? (
              <div className="payments-empty">
                Select a payment to inspect its collection record.
              </div>
            ) : (
              <>
                <div className="payments-detail-hero">
                  <div>
                    <div className="payments-detail-tags">
                      <span className={`status ${getPaymentBadgeClass(selectedPlatformPayment.status)}`}>
                        {formatStatusLabel(selectedPlatformPayment.status)}
                      </span>
                      <span className={`status ${getInvoiceBadgeClass(selectedPlatformPayment.invoice?.status || "ISSUED")}`}>
                        Invoice {formatStatusLabel(selectedPlatformPayment.invoice?.status || "ISSUED")}
                      </span>
                    </div>

                    <h2 className="payments-detail-title">
                      {selectedPlatformPayment.invoice?.resident?.user?.name ||
                        selectedPlatformPayment.invoice?.resident?.user?.email ||
                        "Payment Detail"}
                    </h2>
                    <p className="payments-detail-subtitle">
                      {selectedPlatformPayment.invoice?.unit?.property?.title || "Property"} •
                      Unit {selectedPlatformPayment.invoice?.unit?.number || "—"} •
                      {formatDate(selectedPlatformPayment.createdAt)}
                    </p>
                  </div>

                  <div className="payments-detail-amount-card">
                    <span>Payment Amount</span>
                    <strong>{formatMoney(selectedPlatformPayment.amount)}</strong>
                  </div>
                </div>

                <section className="payments-card">
                  <div className="payments-card-head">
                    <div>
                      <h2 className="payments-card-title">Payment Identity</h2>
                      <p className="payments-card-subtitle">
                        Core collection references
                      </p>
                    </div>
                  </div>

                  <div className="payments-detail-grid two">
                    <div className="payments-info-box">
                      <span>Payment ID</span>
                      <strong>{selectedPlatformPayment.id}</strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Provider Reference</span>
                      <strong>{selectedPlatformPayment.providerRef || "—"}</strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Channel / Provider</span>
                      <strong>
                        {selectedPlatformPayment.channel} • {selectedPlatformPayment.provider}
                      </strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Invoice Period</span>
                      <strong>{selectedPlatformPayment.invoice?.period || "—"}</strong>
                    </div>
                  </div>
                </section>

                <section className="payments-card">
                  <div className="payments-card-head">
                    <div>
                      <h2 className="payments-card-title">Property Context</h2>
                      <p className="payments-card-subtitle">
                        Property and resident linkage
                      </p>
                    </div>
                  </div>

                  <div className="payments-detail-grid two">
                    <div className="payments-info-box">
                      <span>Resident</span>
                      <strong>
                        {selectedPlatformPayment.invoice?.resident?.user?.name ||
                          selectedPlatformPayment.invoice?.resident?.user?.email ||
                          "—"}
                      </strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Property / Unit</span>
                      <strong>
                        {selectedPlatformPayment.invoice?.unit?.property?.title || "—"} • Unit{" "}
                        {selectedPlatformPayment.invoice?.unit?.number || "—"}
                      </strong>
                    </div>

                    {isAdmin && (
                      <>
                        <div className="payments-info-box">
                          <span>Property Owner</span>
                          <strong>
                            {selectedPlatformPayment.invoice?.unit?.property?.owner?.name || "No owner"}
                          </strong>
                        </div>
                        <div className="payments-info-box">
                          <span>Property Manager</span>
                          <strong>
                            {selectedPlatformPayment.invoice?.unit?.property?.manager?.name || "No manager"}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="payments-card">
                  <div className="payments-card-head">
                    <div>
                      <h2 className="payments-card-title">Invoice Standing</h2>
                      <p className="payments-card-subtitle">
                        Invoice payment position after this collection
                      </p>
                    </div>
                  </div>

                  <div className="payments-detail-grid three">
                    <div className="payments-info-box">
                      <span>Invoice Total</span>
                      <strong>{formatMoney(selectedPlatformPayment.invoice?.totalAmount || 0)}</strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Invoice Paid</span>
                      <strong>{formatMoney(selectedPlatformPayment.invoice?.paidAmount || 0)}</strong>
                    </div>
                    <div className="payments-info-box">
                      <span>Outstanding</span>
                      <strong>
                        {formatMoney(
                          Math.max(
                            0,
                            toNumber(selectedPlatformPayment.invoice?.totalAmount) -
                              toNumber(selectedPlatformPayment.invoice?.paidAmount),
                          ),
                        )}
                      </strong>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}