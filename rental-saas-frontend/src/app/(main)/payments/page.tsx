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

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
type InvoiceStatus = "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

type ResidentPaymentItem = {
  id: string;
  createdAt: string;
  amount: number;
  channel: string;
  provider: string;
  providerRef: string;
  status: PaymentStatus;
  invoiceId: string;
  invoice: {
    id: string;
    kind?: string;
    kindLabel?: string;
    period: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: InvoiceStatus;
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
  currentInvoices: {
    id: string;
    kind: string;
    kindLabel: string;
    period: string;
    dueDate: string;
    status: InvoiceStatus;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    unitNumber: string | null;
    propertyTitle: string | null;
    propertyLocation: string | null;
  }[];
  totalOutstanding: number;
  latestPayment: {
    id: string;
    createdAt: string;
    amount: number;
    channel: string;
    provider: string;
    providerRef: string;
    status: PaymentStatus;
    invoiceId: string;
    invoiceKind?: string | null;
    invoiceKindLabel?: string | null;
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
  status: InvoiceStatus;
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
  status: PaymentStatus;
  invoiceId: string;
  invoice: {
    id: string;
    kind?: string;
    kindLabel?: string;
    period: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: InvoiceStatus;
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

type StatusFilter = "ALL" | PaymentStatus;
type InvoiceKindFilter = "ALL" | "RENT" | "SERVICE_CHARGE" | "GARBAGE" | "OTHER";

function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return `UGX ${Math.round(toNumber(value)).toLocaleString("en-UG")}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatusLabel(status: string | null | undefined) {
  if (!status) return "—";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanProviderLabel(
  channel: string | null | undefined,
  provider: string | null | undefined,
) {
  const safeChannel = channel || "—";
  const safeProvider = provider || "—";

  if (safeChannel === "WALLET" || safeProvider === "INTERNAL_WALLET") {
    return "Wallet";
  }

  if (safeProvider === "FLUTTERWAVE") {
    return safeChannel === "MOBILE_MONEY"
      ? "Mobile Money • Flutterwave"
      : `${formatStatusLabel(safeChannel)} • Flutterwave`;
  }

  if (safeProvider === "ONAFRIQ") {
    return safeChannel === "MOBILE_MONEY"
      ? "Mobile Money • Onafriq"
      : `${formatStatusLabel(safeChannel)} • Onafriq`;
  }

  if (safeProvider === "STRIPE") {
    return "Card • Stripe";
  }

  return `${formatStatusLabel(safeChannel)} • ${formatStatusLabel(safeProvider)}`;
}

function getPaymentBadgeClass(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "success") return "payment-success";
  if (normalized === "pending") return "payment-pending";
  if (normalized === "failed") return "payment-failed";

  return "payment-pending";
}

function getInvoiceBadgeClass(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();

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

function getInvoiceOutstanding(
  invoice: PlatformPaymentItem["invoice"] | ResidentPaymentItem["invoice"],
) {
  if (!invoice) return 0;

  return Math.max(0, toNumber(invoice.totalAmount) - toNumber(invoice.paidAmount));
}

function getInvoiceKind(payment: PlatformPaymentItem) {
  return payment.invoice?.kind || "OTHER";
}

function getInvoiceKindLabel(payment: PlatformPaymentItem) {
  return payment.invoice?.kindLabel || formatStatusLabel(payment.invoice?.kind || "Invoice");
}

function getResidentName(payment: PlatformPaymentItem) {
  return (
    payment.invoice?.resident?.user?.name ||
    payment.invoice?.resident?.user?.email ||
    "Resident"
  );
}

function getPropertyTitle(payment: PlatformPaymentItem) {
  return payment.invoice?.unit?.property?.title || "Property";
}

function getPropertyLocation(payment: PlatformPaymentItem) {
  return payment.invoice?.unit?.property?.location || "No location";
}

function getUnitNumber(payment: PlatformPaymentItem) {
  return payment.invoice?.unit?.number || "—";
}

function sortPlatformPayments(items: PlatformPaymentItem[]) {
  return [...items].sort((a, b) => {
    const statusWeight: Record<PaymentStatus, number> = {
      PENDING: 3,
      FAILED: 2,
      SUCCESS: 1,
    };

    const statusDifference = statusWeight[b.status] - statusWeight[a.status];

    if (statusDifference !== 0) return statusDifference;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [invoiceKindFilter, setInvoiceKindFilter] =
    useState<InvoiceKindFilter>("ALL");
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
            api
              .get<CurrentResidentInvoiceResponse>("/invoices/resident/me/current")
              .catch(() => ({ data: null })),
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
          setSelectedPaymentId(null);

          return;
        }

        const res = await api.get<PlatformPaymentsResponse>(endpoint, {
          params: {
            page,
            limit: 30,
            search: search.trim() || undefined,
          },
        });

        if (!mounted) return;

        setPlatformResponse(res.data);
        setPayments([]);
        setSummary(null);
        setCurrentInvoiceDetails(null);
      } catch (err) {
        console.error("Failed to load payments", err);

        if (!mounted) return;

        setError("Failed to load payments.");
        setPayments([]);
        setSummary(null);
        setCurrentInvoiceDetails(null);
        setPlatformResponse(null);
        setSelectedPaymentId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPayments();

    return () => {
      mounted = false;
    };
  }, [isResident, role, page, search]);

  const residentInvoices = summary?.currentInvoices || [];

  const residentCurrentInvoice = useMemo(() => {
    if (!residentInvoices.length) return null;

    const overdueInvoice = residentInvoices.find(
      (invoice) => invoice.status === "OVERDUE",
    );

    return overdueInvoice || residentInvoices[0];
  }, [residentInvoices]);

  const residentMetrics = useMemo(() => {
    const totalPaid = toNumber(summary?.totalPaid);
    const outstanding = toNumber(summary?.totalOutstanding);
    const openInvoiceCount = residentInvoices.length;
    const paymentCount = toNumber(summary?.successfulPaymentsCount);

    return {
      totalPaid,
      outstanding,
      openInvoiceCount,
      paymentCount,
    };
  }, [summary, residentInvoices.length]);

  const feeBreakdown = useMemo(() => {
    if (!currentInvoiceDetails) {
      return {
        rentAmount: residentInvoices
          .filter((invoice) => invoice.kind === "RENT")
          .reduce((sum, invoice) => sum + toNumber(invoice.outstandingAmount), 0),
        serviceCharge: residentInvoices
          .filter((invoice) => invoice.kind === "SERVICE_CHARGE")
          .reduce((sum, invoice) => sum + toNumber(invoice.outstandingAmount), 0),
        garbageFee: residentInvoices
          .filter((invoice) => invoice.kind === "GARBAGE")
          .reduce((sum, invoice) => sum + toNumber(invoice.outstandingAmount), 0),
        totalAmount: toNumber(summary?.totalOutstanding),
        paidAmount: 0,
        outstandingAmount: toNumber(summary?.totalOutstanding),
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
  }, [currentInvoiceDetails, residentInvoices, summary]);

  const platformRawItems = platformResponse?.items || [];

  const filteredPlatformItems = useMemo(() => {
    const filtered = platformRawItems.filter((payment) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : payment.status === statusFilter;

      const kind = getInvoiceKind(payment);

      const matchesKind =
        invoiceKindFilter === "ALL"
          ? true
          : invoiceKindFilter === "OTHER"
            ? !["RENT", "SERVICE_CHARGE", "GARBAGE"].includes(kind)
            : kind === invoiceKindFilter;

      return matchesStatus && matchesKind;
    });

    return sortPlatformPayments(filtered);
  }, [platformRawItems, statusFilter, invoiceKindFilter]);

  useEffect(() => {
    if (isResident) return;

    if (filteredPlatformItems.length === 0) {
      setSelectedPaymentId(null);
      return;
    }

    setSelectedPaymentId((current) => {
      const exists = filteredPlatformItems.some((payment) => payment.id === current);

      return exists ? current : filteredPlatformItems[0].id;
    });
  }, [filteredPlatformItems, isResident]);

  const selectedPlatformPayment =
    filteredPlatformItems.find((payment) => payment.id === selectedPaymentId) ||
    filteredPlatformItems[0] ||
    null;

  const platformSummary = platformResponse?.summary || {
    totalPayments: 0,
    totalSuccessfulAmount: 0,
  };

  const platformSuccessCount = useMemo(
    () => platformRawItems.filter((item) => item.status === "SUCCESS").length,
    [platformRawItems],
  );

  const platformPendingCount = useMemo(
    () => platformRawItems.filter((item) => item.status === "PENDING").length,
    [platformRawItems],
  );

  const platformFailedCount = useMemo(
    () => platformRawItems.filter((item) => item.status === "FAILED").length,
    [platformRawItems],
  );

  const platformOutstanding = useMemo(
    () =>
      platformRawItems.reduce(
        (sum, payment) => sum + getInvoiceOutstanding(payment.invoice),
        0,
      ),
    [platformRawItems],
  );

  const visibleCollected = useMemo(
    () =>
      filteredPlatformItems
        .filter((payment) => payment.status === "SUCCESS")
        .reduce((sum, payment) => sum + toNumber(payment.amount), 0),
    [filteredPlatformItems],
  );

  const resetFilters = () => {
    setStatusFilter("ALL");
    setInvoiceKindFilter("ALL");
    setSearch("");
    setPage(1);
  };

  if (isResident) {
    return (
      <div className="payments-shell resident-payments-shell">
        <section className="payments-hero resident-payments-hero">
          <div className="payments-hero-copy">
            <p className="payments-eyebrow">Resident Payments</p>
            <h1 className="payments-title">
              Keep track of your rent payments and open bills
            </h1>
            <p className="payments-text">
              See what you have paid, what is still outstanding, and how your
              current rent, service charge, and garbage bills are structured.
            </p>

            <div className="payments-tags">
              <span className="payments-tag">Open bills</span>
              <span className="payments-tag">Outstanding balance</span>
              <span className="payments-tag">Fee breakdown</span>
              <span className="payments-tag">Payment history</span>
            </div>
          </div>

          <div className="payments-summary-grid resident-payments-summary-grid">
            <div className="payments-summary-card dark">
              <span>Total Paid</span>
              <strong>{formatMoney(residentMetrics.totalPaid)}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Outstanding</span>
              <strong>{formatMoney(residentMetrics.outstanding)}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Open Bills</span>
              <strong>{residentMetrics.openInvoiceCount}</strong>
            </div>

            <div className="payments-summary-card">
              <span>Successful Payments</span>
              <strong>{residentMetrics.paymentCount}</strong>
            </div>
          </div>
        </section>

        <section className="payments-card resident-payments-current-card">
          <div className="payments-card-head">
            <div>
              <h2 className="payments-card-title">Open Bills Snapshot</h2>
              <p className="payments-card-subtitle">
                Your latest active bills and payment standing
              </p>
            </div>

            <span className="payments-chip">
              {loading
                ? "Loading..."
                : residentCurrentInvoice
                  ? formatStatusLabel(residentCurrentInvoice.status)
                  : "No active bill"}
            </span>
          </div>

          {!residentCurrentInvoice ? (
            <div className="payments-empty">
              No active bill right now.
              <br />
              <span>Your next billing update will appear here.</span>
            </div>
          ) : (
            <div className="resident-payments-current-grid">
              <div className="resident-payments-current-panel">
                <p className="resident-payments-current-label">Property</p>
                <h3 className="resident-payments-current-title">
                  {residentCurrentInvoice.propertyTitle || "—"}
                </h3>
                <p className="resident-payments-current-text">
                  {residentCurrentInvoice.propertyLocation || "No location"} ·
                  Unit {residentCurrentInvoice.unitNumber || "—"}
                </p>

                <div className="resident-payments-current-meta">
                  <div className="resident-payments-current-stat">
                    <span>Next Bill</span>
                    <strong>{residentCurrentInvoice.kindLabel || "Bill"}</strong>
                  </div>
                  <div className="resident-payments-current-stat">
                    <span>Due Date</span>
                    <strong>{formatDate(residentCurrentInvoice.dueDate)}</strong>
                  </div>
                </div>

                <div className="resident-payments-breakdown-light">
                  <div className="resident-payments-breakdown-light-row">
                    <span>Rent outstanding</span>
                    <strong>{formatMoney(feeBreakdown.rentAmount)}</strong>
                  </div>
                  <div className="resident-payments-breakdown-light-row">
                    <span>Service charge outstanding</span>
                    <strong>{formatMoney(feeBreakdown.serviceCharge)}</strong>
                  </div>
                  <div className="resident-payments-breakdown-light-row">
                    <span>Garbage fee outstanding</span>
                    <strong>{formatMoney(feeBreakdown.garbageFee)}</strong>
                  </div>
                </div>
              </div>

              <div className="resident-payments-breakdown-card">
                <div className="resident-payments-breakdown-row">
                  <span>Total outstanding</span>
                  <strong>{formatMoney(residentMetrics.outstanding)}</strong>
                </div>
                <div className="resident-payments-breakdown-row">
                  <span>Total paid</span>
                  <strong>{formatMoney(residentMetrics.totalPaid)}</strong>
                </div>
                <div className="resident-payments-breakdown-row highlight">
                  <span>Open bills</span>
                  <strong>{residentMetrics.openInvoiceCount}</strong>
                </div>
                <div className="resident-payments-breakdown-note">
                  Payments can be settled from wallet, mobile money, card, or
                  bank depending on the selected payment channel.
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
                <span>Bill</span>
                <span>Date</span>
              </div>

              <div className="payments-body">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="payments-row resident-payments-row"
                  >
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
                      <p>{cleanProviderLabel(payment.channel, payment.provider)}</p>
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
                        {payment.invoice?.kindLabel || "Bill"}{" "}
                        {formatStatusLabel(payment.invoice?.status || "ISSUED")}
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
            <strong>{formatMoney(platformSummary.totalSuccessfulAmount)}</strong>
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

      <section className="payments-toolbar platform-payments-toolbar">
        <div className="payments-toolbar-note">
          {loading
            ? "Loading payments..."
            : `${platformResponse?.pagination.total ?? 0} total payment records`}
        </div>

        <div className="payments-toolbar-actions">
          <select
            className="payments-filter-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setSelectedPaymentId(null);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="SUCCESS">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            className="payments-filter-select"
            value={invoiceKindFilter}
            onChange={(event) => {
              setInvoiceKindFilter(event.target.value as InvoiceKindFilter);
              setSelectedPaymentId(null);
            }}
          >
            <option value="ALL">All invoice types</option>
            <option value="RENT">Rent</option>
            <option value="SERVICE_CHARGE">Service charge</option>
            <option value="GARBAGE">Garbage</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder={
              isAdmin
                ? "Search payment, resident, invoice, unit, property, reference..."
                : "Search payment, resident, invoice, unit, property..."
            }
            className="payments-search-input"
          />

          <button
            type="button"
            className="payments-secondary-btn"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="payments-mini-metrics">
        <div className="payments-mini-card">
          <span>Visible collected</span>
          <strong>{formatMoney(visibleCollected)}</strong>
        </div>

        <div className="payments-mini-card">
          <span>Visible records</span>
          <strong>{filteredPlatformItems.length}</strong>
        </div>

        <div className="payments-mini-card">
          <span>Outstanding exposure</span>
          <strong>{formatMoney(platformOutstanding)}</strong>
        </div>

        <div className="payments-mini-card">
          <span>View</span>
          <strong>{isManager ? "Manager scoped" : "Platform wide"}</strong>
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
                {loading ? "Loading..." : `${filteredPlatformItems.length} visible`}
              </span>
            </div>

            {loading ? (
              <div className="payments-empty">Loading payments...</div>
            ) : filteredPlatformItems.length === 0 ? (
              <div className="payments-empty">
                No payments found.
                <br />
                <span>Payment records will appear here once available.</span>
              </div>
            ) : (
              <>
                <div className="payments-registry-list">
                  {filteredPlatformItems.map((payment) => (
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
                          <h3>{getResidentName(payment)}</h3>
                          <p>
                            {getPropertyTitle(payment)} • Unit {getUnitNumber(payment)}
                          </p>
                        </div>

                        <span
                          className={`status ${getPaymentBadgeClass(payment.status)}`}
                        >
                          {formatStatusLabel(payment.status)}
                        </span>
                      </div>

                      <div className="payments-registry-meta">
                        <span>{getInvoiceKindLabel(payment)}</span>
                        <span>{formatDate(payment.createdAt)}</span>
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
                        Math.min(
                          platformResponse?.pagination.totalPages || prev,
                          prev + 1,
                        ),
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
                      <span
                        className={`status ${getPaymentBadgeClass(
                          selectedPlatformPayment.status,
                        )}`}
                      >
                        {formatStatusLabel(selectedPlatformPayment.status)}
                      </span>

                      <span
                        className={`status ${getInvoiceBadgeClass(
                          selectedPlatformPayment.invoice?.status || "ISSUED",
                        )}`}
                      >
                        Invoice{" "}
                        {formatStatusLabel(
                          selectedPlatformPayment.invoice?.status || "ISSUED",
                        )}
                      </span>

                      <span className="status invoice-issued">
                        {getInvoiceKindLabel(selectedPlatformPayment)}
                      </span>
                    </div>

                    <h2 className="payments-detail-title">
                      {getResidentName(selectedPlatformPayment)}
                    </h2>

                    <p className="payments-detail-subtitle">
                      {getPropertyTitle(selectedPlatformPayment)} • Unit{" "}
                      {getUnitNumber(selectedPlatformPayment)} •{" "}
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

                    <span className="payments-chip">
                      {formatDateTime(selectedPlatformPayment.createdAt)}
                    </span>
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
                        {cleanProviderLabel(
                          selectedPlatformPayment.channel,
                          selectedPlatformPayment.provider,
                        )}
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
                      <strong>{getResidentName(selectedPlatformPayment)}</strong>
                    </div>

                    <div className="payments-info-box">
                      <span>Property / Unit</span>
                      <strong>
                        {getPropertyTitle(selectedPlatformPayment)} • Unit{" "}
                        {getUnitNumber(selectedPlatformPayment)}
                      </strong>
                    </div>

                    <div className="payments-info-box">
                      <span>Location</span>
                      <strong>{getPropertyLocation(selectedPlatformPayment)}</strong>
                    </div>

                    <div className="payments-info-box">
                      <span>Invoice Type</span>
                      <strong>{getInvoiceKindLabel(selectedPlatformPayment)}</strong>
                    </div>

                    {isAdmin && (
                      <>
                        <div className="payments-info-box">
                          <span>Property Owner</span>
                          <strong>
                            {selectedPlatformPayment.invoice?.unit?.property?.owner
                              ?.name || "No owner"}
                          </strong>
                        </div>

                        <div className="payments-info-box">
                          <span>Property Manager</span>
                          <strong>
                            {selectedPlatformPayment.invoice?.unit?.property?.manager
                              ?.name || "No manager"}
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
                      <strong>
                        {formatMoney(selectedPlatformPayment.invoice?.totalAmount || 0)}
                      </strong>
                    </div>

                    <div className="payments-info-box">
                      <span>Invoice Paid</span>
                      <strong>
                        {formatMoney(selectedPlatformPayment.invoice?.paidAmount || 0)}
                      </strong>
                    </div>

                    <div className="payments-info-box">
                      <span>Outstanding</span>
                      <strong>
                        {formatMoney(getInvoiceOutstanding(selectedPlatformPayment.invoice))}
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