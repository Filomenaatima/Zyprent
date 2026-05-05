"use client";

import "@/styles/wallet.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type WithdrawalMethod = "MOBILE_MONEY" | "BANK" | "CARD";

type WalletTransactionItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: number;
  direction: "positive" | "negative";
  status: string;
  reference?: string | null;
};

type WalletSummaryResponse = {
  balance: number;
  walletRef: string;
  accountType: string;
  currency: string;
  monthlyGrowth: number;
  totalInflow: number;
  totalOutflow: number;
  totalProfit: number;
  walletStatus: string;
  recentTransactions: WalletTransactionItem[];
};

type WalletTransactionsResponse = {
  items: WalletTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

type ResidentInvoiceItem = {
  id: string;
  kind?: string | null;
  kindLabel?: string | null;
  period: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  unitNumber: string | null;
  propertyTitle: string | null;
  propertyLocation: string | null;
};

type ResidentPaymentSummaryResponse = {
  totalPaid: number;
  successfulPaymentsCount: number;
  currentInvoices: ResidentInvoiceItem[];
  totalOutstanding?: number;
  latestPayment: any;
  audience: "resident";
};

type PaymentMethod = "WALLET" | "MOBILE_MONEY" | "CARD" | "BANK";
type MobileProvider = "MTN" | "AIRTEL";
type CardProvider = "STRIPE";
type BankProvider = "FLUTTERWAVE";

type WalletQuickAction = {
  icon: string;
  label: string;
  hint: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusLabel(status: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "PENDING") return "Pending";
  if (status === "SUCCESS") return "Success";
  if (status === "FAILED") return "Failed";
  if (status === "APPROVED") return "Approved";

  return status.replace(/_/g, " ");
}

function formatInvoiceStatus(status?: string | null) {
  return String(status || "NO_INVOICE").replace(/_/g, " ");
}

function getCoverageLabel(balance: number, outstanding: number) {
  if (outstanding <= 0) return "Fully settled";
  if (balance >= outstanding) return "Ready to pay";
  if (balance > 0) return "Partially covered";

  return "Top up required";
}

function getResidentWalletGuidance(balance: number, outstanding: number) {
  if (outstanding <= 0) {
    return "You currently have no outstanding invoice to pay.";
  }

  if (balance >= outstanding) {
    return "Your wallet can fully cover the selected outstanding invoice. Review and confirm before paying.";
  }

  if (balance > 0) {
    return `Your wallet can cover ${formatCurrency(
      balance,
    )}. You still need ${formatCurrency(
      outstanding - balance,
    )} through mobile money, card, bank, or a top-up.`;
  }

  return "Your wallet has no available balance for this invoice. Top up or choose an external payment method.";
}

function parseAmount(input: string) {
  const cleaned = input.replace(/[^\d]/g, "");
  return Number(cleaned);
}

function getInvoiceDisplayName(invoice?: ResidentInvoiceItem | null) {
  if (!invoice) return "Invoice";
  return invoice.kindLabel || "Invoice";
}

function formatReference(reference?: string | null) {
  return reference?.trim() || "—";
}

export default function WalletPage() {
  const { user } = useAuthStore();
  const role = (user?.role as UserRole | undefined) ?? "INVESTOR";
  const isResident = role === "RESIDENT";

  const userPhone = String((user as any)?.phone || "").trim();

  const [data, setData] = useState<WalletSummaryResponse | null>(null);
  const [paymentSummary, setPaymentSummary] =
    useState<ResidentPaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("WALLET");
  const [selectedProvider, setSelectedProvider] = useState<
    MobileProvider | CardProvider | BankProvider | ""
  >("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] =
    useState<WithdrawalMethod>("MOBILE_MONEY");
  const [withdrawPhoneNumber, setWithdrawPhoneNumber] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountName, setWithdrawAccountName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawCardLast4, setWithdrawCardLast4] = useState("");

  async function loadWallet() {
    setLoading(true);
    setError(null);

    let walletFailed = false;
    let residentSummaryFailed = false;

    try {
      const walletRes = await api.get<WalletSummaryResponse>("/wallet/summary");
      setData(walletRes.data);
    } catch (error) {
      console.error("Wallet load failed", error);
      walletFailed = true;
      setData(null);
    }

    if (isResident) {
      try {
        const paymentRes =
          await api.get<ResidentPaymentSummaryResponse>(
            "/payments/resident/summary",
          );
        setPaymentSummary(paymentRes.data);
      } catch (error) {
        console.error("Resident payment summary failed", error);
        residentSummaryFailed = true;
        setPaymentSummary(null);
      }
    } else {
      setPaymentSummary(null);
    }

    if (walletFailed && isResident && residentSummaryFailed) {
      setError("Failed to load wallet and payment data.");
    } else if (walletFailed) {
      setError("Wallet summary failed to load.");
    } else if (isResident && residentSummaryFailed) {
      setError("Resident payment summary failed to load.");
    }

    setLoading(false);
  }

  async function refreshAfterAction(successMessage?: string) {
    await loadWallet();
    if (successMessage) window.alert(successMessage);
  }

  useEffect(() => {
    loadWallet();
  }, [isResident]);

  function openWithdrawModal() {
    if (actionLoading) return;

    setWithdrawAmount("");
    setWithdrawMethod("MOBILE_MONEY");
    setWithdrawPhoneNumber(userPhone);
    setWithdrawBankName("");
    setWithdrawAccountName(user?.name || "");
    setWithdrawAccountNumber("");
    setWithdrawCardLast4("");
    setWithdrawModalOpen(true);
  }

  async function submitWithdrawal() {
    if (actionLoading) return;

    const amount = parseAmount(withdrawAmount);

    if (!amount || amount <= 0) {
      window.alert("Enter a valid withdrawal amount.");
      return;
    }

    if (amount > Number(data?.balance ?? 0)) {
      window.alert("Withdrawal amount exceeds wallet balance.");
      return;
    }

    const payload: any = {
      amount,
      method: withdrawMethod,
    };

    if (withdrawMethod === "MOBILE_MONEY") {
      if (!withdrawPhoneNumber.trim()) {
        window.alert("Enter the mobile money phone number.");
        return;
      }

      payload.phoneNumber = withdrawPhoneNumber.trim();
    }

    if (withdrawMethod === "BANK") {
      if (
        !withdrawBankName.trim() ||
        !withdrawAccountName.trim() ||
        !withdrawAccountNumber.trim()
      ) {
        window.alert("Enter complete bank details.");
        return;
      }

      payload.bankName = withdrawBankName.trim();
      payload.accountName = withdrawAccountName.trim();
      payload.accountNumber = withdrawAccountNumber.trim();
    }

    if (withdrawMethod === "CARD") {
      if (!withdrawCardLast4.trim() || withdrawCardLast4.trim().length < 4) {
        window.alert("Enter the last 4 digits of the card.");
        return;
      }

      payload.cardLast4 = withdrawCardLast4.trim().slice(-4);
    }

    try {
      setActionLoading("withdraw");

      await api.post("/wallet/withdraw", payload);

      setWithdrawModalOpen(false);
      await refreshAfterAction("Withdrawal request submitted for admin approval.");
    } catch (error: any) {
      console.error(error);
      window.alert(
        error?.response?.data?.message || "Withdrawal request failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeposit() {
    if (actionLoading) return;

    const rawAmount = window.prompt("Enter deposit amount in UGX");
    if (!rawAmount) return;

    const amount = parseAmount(rawAmount);

    if (!amount || amount <= 0) {
      window.alert("Please enter a valid amount.");
      return;
    }

    try {
      setActionLoading("deposit");
      await api.post("/wallet/fund", { amount });
      await refreshAfterAction("Wallet funded successfully.");
    } catch (error: any) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Deposit failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatementExport() {
    if (actionLoading) return;

    try {
      setActionLoading("statement");

      const res = await api.get<WalletTransactionsResponse>(
        "/wallet/transactions?page=1&limit=100",
      );

      const rows = [
        [
          "Title",
          "Subtitle",
          "Date",
          "Time",
          "Amount",
          "Direction",
          "Status",
          "Reference",
        ],
        ...res.data.items.map((item) => [
          item.title,
          item.subtitle,
          formatDateOnly(item.time),
          formatTimeOnly(item.time),
          formatCurrency(item.amount),
          item.direction,
          getStatusLabel(item.status),
          formatReference(item.reference),
        ]),
      ];

      const csv = rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "wallet-statement.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      window.alert("Statement export failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const residentInvoices = paymentSummary?.currentInvoices ?? [];

  const sortedResidentInvoices = useMemo(() => {
    return [...residentInvoices].sort((a, b) => {
      const dueA = new Date(a.dueDate).getTime();
      const dueB = new Date(b.dueDate).getTime();

      if (dueA !== dueB) return dueA - dueB;

      return Number(b.outstandingAmount ?? 0) - Number(a.outstandingAmount ?? 0);
    });
  }, [residentInvoices]);

  const selectedInvoice = useMemo(() => {
    if (!sortedResidentInvoices.length) return null;

    if (selectedInvoiceId) {
      const explicitSelection = sortedResidentInvoices.find(
        (invoice) => invoice.id === selectedInvoiceId,
      );

      if (explicitSelection) return explicitSelection;
    }

    return sortedResidentInvoices[0];
  }, [sortedResidentInvoices, selectedInvoiceId]);

  useEffect(() => {
    if (!isResident) return;

    if (!sortedResidentInvoices.length) {
      if (selectedInvoiceId) setSelectedInvoiceId("");
      return;
    }

    if (!selectedInvoiceId) {
      setSelectedInvoiceId(sortedResidentInvoices[0].id);
      return;
    }

    const exists = sortedResidentInvoices.some(
      (invoice) => invoice.id === selectedInvoiceId,
    );

    if (!exists) {
      setSelectedInvoiceId(sortedResidentInvoices[0].id);
    }
  }, [isResident, sortedResidentInvoices, selectedInvoiceId]);

  const totalOutstandingAcrossInvoices =
    Number(paymentSummary?.totalOutstanding ?? 0) ||
    sortedResidentInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.outstandingAmount ?? 0),
      0,
    );

  function openPaymentModal() {
    if (actionLoading) return;
    if (!isResident) return;

    if (!sortedResidentInvoices.length) {
      window.alert("There is no active invoice to pay right now.");
      return;
    }

    if (totalOutstandingAcrossInvoices <= 0) {
      window.alert("Your current invoices are already settled.");
      return;
    }

    const preferredInvoice =
      selectedInvoice && Number(selectedInvoice.outstandingAmount ?? 0) > 0
        ? selectedInvoice
        : sortedResidentInvoices.find(
            (invoice) => Number(invoice.outstandingAmount ?? 0) > 0,
          ) || sortedResidentInvoices[0];

    setSelectedMethod("WALLET");
    setSelectedProvider("");
    setSelectedInvoiceId(preferredInvoice.id);
    setPaymentAmount(String(Number(preferredInvoice.outstandingAmount ?? 0)));
    setPaymentModalOpen(true);
  }

  async function submitPayment() {
    if (actionLoading || !isResident) return;

    const invoice = sortedResidentInvoices.find(
      (item) => item.id === selectedInvoiceId,
    );

    const balance = Number(data?.balance ?? 0);

    if (!invoice) {
      window.alert("No active invoice found.");
      return;
    }

    const amount = parseAmount(paymentAmount);
    const invoiceOutstanding = Number(invoice.outstandingAmount ?? 0);

    if (!amount || amount <= 0) {
      window.alert("Enter a valid payment amount.");
      return;
    }

    if (amount > invoiceOutstanding) {
      window.alert("Amount exceeds outstanding balance.");
      return;
    }

    try {
      setActionLoading("pay");

      if (selectedMethod === "WALLET") {
        if (balance < amount) {
          window.alert(
            `Your wallet can cover ${formatCurrency(
              balance,
            )}. Please reduce the wallet amount, top up, or choose mobile money, card, or bank for the remaining balance.`,
          );
          return;
        }

        await api.post("/payments/resident/pay-wallet", {
          invoiceId: invoice.id,
          amount,
        });

        await loadWallet();
        setPaymentModalOpen(false);
        window.alert("Invoice paid successfully from wallet.");
        return;
      }

      if (!selectedProvider) {
        window.alert("Please choose a provider.");
        return;
      }

      const methodMap = {
        MOBILE_MONEY: "MOBILE_MONEY",
        CARD: "CARD",
        BANK: "BANK",
      } as const;

      await api.post("/payments/resident/initiate", {
        invoiceId: invoice.id,
        amount,
        channel: methodMap[selectedMethod as "MOBILE_MONEY" | "CARD" | "BANK"],
        provider: selectedProvider,
      });

      await loadWallet();
      setPaymentModalOpen(false);
      window.alert(
        "External payment initiated. It will settle after provider confirmation.",
      );
    } catch (error: any) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Payment request failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const balance = Number(data?.balance ?? 0);
  const totalInflow = Number(data?.totalInflow ?? 0);
  const totalOutflow = Number(data?.totalOutflow ?? 0);
  const totalProfit = Number(data?.totalProfit ?? 0);
  const recentTransactions = data?.recentTransactions ?? [];
  const selectedInvoiceOutstanding = Number(
    selectedInvoice?.outstandingAmount ?? 0,
  );
  const totalPaid = Number(paymentSummary?.totalPaid ?? 0);
  const latestTransaction = recentTransactions[0];

  const requestedPaymentAmount = parseAmount(paymentAmount);
  const previewPaymentAmount =
    requestedPaymentAmount > 0 ? requestedPaymentAmount : selectedInvoiceOutstanding;
  const walletPreviewAmount = Math.min(balance, previewPaymentAmount);
  const externalPreviewAmount = Math.max(previewPaymentAmount - balance, 0);

  const quickActions: WalletQuickAction[] = isResident
    ? [
        {
          icon: "+",
          label: "Deposit",
          hint: actionLoading === "deposit" ? "Processing..." : "Add funds",
          onClick: handleDeposit,
        },
        {
          icon: "₿",
          label: "Pay Outstanding",
          hint:
            totalOutstandingAcrossInvoices > 0
              ? getCoverageLabel(balance, totalOutstandingAcrossInvoices)
              : "No balance due right now",
          onClick: openPaymentModal,
          disabled: totalOutstandingAcrossInvoices <= 0,
        },
        {
          icon: "↗",
          label: "Withdraw",
          hint:
            actionLoading === "withdraw" ? "Processing..." : "Move funds out",
          onClick: openWithdrawModal,
        },
        {
          icon: "↓",
          label: "Statement",
          hint: actionLoading === "statement" ? "Exporting..." : "Download CSV",
          onClick: handleStatementExport,
        },
        {
          icon: "¤",
          label: "Open Payments",
          hint: "View invoice details",
          onClick: () => {
            window.location.href = "/payments";
          },
        },
        {
          icon: "⟳",
          label: "Refresh",
          hint: loading ? "Loading..." : "Reload wallet",
          onClick: loadWallet,
        },
      ]
    : [
        {
          icon: "+",
          label: "Deposit",
          hint: actionLoading === "deposit" ? "Processing..." : "Add funds",
          onClick: handleDeposit,
        },
        {
          icon: "↗",
          label: "Withdraw",
          hint:
            actionLoading === "withdraw" ? "Processing..." : "Move funds out",
          onClick: openWithdrawModal,
        },
        {
          icon: "↓",
          label: "Statement",
          hint: actionLoading === "statement" ? "Exporting..." : "Download CSV",
          onClick: handleStatementExport,
        },
        {
          icon: "$",
          label: "Profit Center",
          hint: "Open investor profit tools",
          onClick: () => {
            window.location.href = "/profit-center";
          },
        },
        {
          icon: "¤",
          label: "Portfolio",
          hint: "View your investments",
          onClick: () => {
            window.location.href = "/portfolio";
          },
        },
        {
          icon: "⟳",
          label: "Refresh",
          hint: loading ? "Loading..." : "Reload wallet",
          onClick: loadWallet,
        },
      ];

  const statCards = isResident
    ? [
        { label: "Total inflow", value: formatCurrency(totalInflow) },
        { label: "Total outflow", value: formatCurrency(totalOutflow) },
        { label: "Pending withdrawal", value: formatCurrency(0) },
        { label: "Total paid", value: formatCurrency(totalPaid) },
      ]
    : [
        { label: "Total inflow", value: formatCurrency(totalInflow) },
        { label: "Total outflow", value: formatCurrency(totalOutflow) },
        { label: "Total profit", value: formatCurrency(totalProfit) },
        { label: "Wallet balance", value: formatCurrency(balance) },
      ];

  return (
    <>
      <div className="wallet-shell resident-wallet-shell">
        {error ? <div className="wallet-error-banner">{error}</div> : null}

        <section className="wallet-dashboard-grid resident-wallet-grid">
          <div className="wallet-left-stack resident-wallet-left">
            <div className="wallet-hero-card resident-wallet-hero">
              <div className="wallet-hero-top">
                <div>
                  <p className="wallet-hero-eyebrow">
                    {isResident ? "Resident Wallet" : "Investor Wallet"}
                  </p>
                  <h2 className="wallet-hero-balance">
                    {loading ? "Loading..." : formatCurrency(balance)}
                  </h2>
                  <p className="wallet-hero-text">
                    {isResident
                      ? "Keep track of your available balance for rent payments, top-ups, and withdrawals."
                      : "Track completed money in, completed money out, profits received, and available wallet cash."}
                  </p>

                  {!isResident ? (
                    <p className="wallet-hero-text">
                      Available cash in wallet:{" "}
                      <strong>{formatCurrency(balance)}</strong>
                    </p>
                  ) : null}
                </div>

                <span className="wallet-live-chip">Live</span>
              </div>

              <div className="wallet-ref-row">
                <span className="wallet-ref-pill">
                  Wallet Ref · {data?.walletRef ?? "ZYR-WLT-000000"}
                </span>
                <span className="wallet-ref-pill soft">
                  {data?.currency ?? "UGX"} Wallet
                </span>
              </div>

              <div className="wallet-hero-meta-grid">
                <div className="wallet-hero-meta-card">
                  <p className="wallet-hero-meta-label">This Month</p>
                  <p className="wallet-hero-meta-value positive">
                    +{Number(data?.monthlyGrowth ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="wallet-hero-meta-card">
                  <p className="wallet-hero-meta-label">Account Type</p>
                  <p className="wallet-hero-meta-value">
                    {data?.accountType ?? "Primary"}
                  </p>
                </div>
                <div className="wallet-hero-meta-card">
                  <p className="wallet-hero-meta-label">Status</p>
                  <p className="wallet-hero-meta-value">
                    {data?.walletStatus ?? "Active"}
                  </p>
                </div>
              </div>
            </div>

            <div className="resident-wallet-invoice-card">
              <div className="resident-wallet-invoice-head">
                <div>
                  <p className="resident-wallet-invoice-label">
                    {isResident ? "Outstanding balance" : "Wallet cash summary"}
                  </p>
                  <h3 className="resident-wallet-invoice-title">
                    {isResident
                      ? totalOutstandingAcrossInvoices > 0
                        ? formatCurrency(totalOutstandingAcrossInvoices)
                        : "No active invoice"
                      : "Completed money movement overview"}
                  </h3>
                  <p className="resident-wallet-invoice-subtitle">
                    {isResident
                      ? selectedInvoice
                        ? `${selectedInvoice.propertyTitle || "Property"} · Unit ${
                            selectedInvoice.unitNumber || "—"
                          }`
                        : "Your current due amount will show here."
                      : "This wallet shows only completed cash movements that have already affected your balance."}
                  </p>
                </div>

                <span className="resident-wallet-coverage-chip">
                  {isResident
                    ? getCoverageLabel(balance, totalOutstandingAcrossInvoices)
                    : "Active"}
                </span>
              </div>

              {isResident ? (
                <p className="resident-wallet-invoice-note">
                  {getResidentWalletGuidance(
                    balance,
                    selectedInvoiceOutstanding || totalOutstandingAcrossInvoices,
                  )}
                </p>
              ) : null}

              <div className="resident-wallet-invoice-grid">
                {isResident && selectedInvoice ? (
                  <>
                    <div className="resident-wallet-invoice-stat">
                      <span>Selected invoice</span>
                      <strong>{getInvoiceDisplayName(selectedInvoice)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Selected outstanding</span>
                      <strong>{formatCurrency(selectedInvoiceOutstanding)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Due date</span>
                      <strong>{formatDateOnly(selectedInvoice.dueDate)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Status</span>
                      <strong>{formatInvoiceStatus(selectedInvoice.status)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="resident-wallet-invoice-stat">
                      <span>Total inflow</span>
                      <strong>{formatCurrency(totalInflow)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Total outflow</span>
                      <strong>{formatCurrency(totalOutflow)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Total profit received</span>
                      <strong>{formatCurrency(totalProfit)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Wallet balance</span>
                      <strong>{formatCurrency(balance)}</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="resident-wallet-invoice-footer">
                <p className="resident-wallet-invoice-note">
                  {isResident
                    ? "Select the invoice you want to pay, review how much your wallet can cover, then confirm the payment method."
                    : "Deposits, completed withdrawals, investment payments, and profit distributions are reflected here once they affect your actual wallet cash."}
                </p>

                <div className="resident-wallet-invoice-actions">
                  {isResident ? (
                    <>
                      <button
                        type="button"
                        className="resident-wallet-primary-btn"
                        onClick={openPaymentModal}
                        disabled={
                          !!actionLoading || totalOutstandingAcrossInvoices <= 0
                        }
                      >
                        Pay outstanding
                      </button>

                      <Link href="/payments" className="resident-wallet-secondary-btn">
                        View payments
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/profit-center"
                        className="resident-wallet-primary-btn"
                      >
                        Open profit center
                      </Link>

                      <Link href="/portfolio" className="resident-wallet-secondary-btn">
                        View portfolio
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="wallet-stat-grid resident-wallet-stat-grid">
              {statCards.map((item) => (
                <div
                  key={item.label}
                  className="wallet-stat-card resident-wallet-stat-card"
                >
                  <p className="wallet-stat-label">{item.label}</p>
                  <p className="wallet-stat-value">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="wallet-actions-grid resident-wallet-actions-grid resident-wallet-actions-grid-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="wallet-action-card resident-wallet-action-card"
                  type="button"
                  onClick={action.onClick}
                  disabled={!!actionLoading || !!action.disabled}
                >
                  <span className="wallet-action-icon">{action.icon}</span>
                  <span className="wallet-action-copy">
                    <span className="wallet-action-title">{action.label}</span>
                    <span className="wallet-action-hint">{action.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="wallet-right-panel resident-wallet-right">
            <div className="wallet-panel wallet-activity-table-panel resident-wallet-panel">
              <div className="wallet-panel-head">
                <div>
                  <h3 className="wallet-panel-title">Recent wallet activity</h3>
                  <p className="wallet-panel-subtitle">
                    {isResident
                      ? "Your latest completed deposits, payments, and withdrawals"
                      : "Your latest completed wallet cash activity"}
                  </p>
                </div>

                <div className="wallet-mini-actions">
                  <button
                    className="wallet-mini-btn sky"
                    type="button"
                    onClick={handleStatementExport}
                    disabled={!!actionLoading}
                  >
                    Export
                  </button>
                  <button
                    className="wallet-mini-btn blue"
                    type="button"
                    onClick={loadWallet}
                    disabled={!!actionLoading}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {latestTransaction ? (
                <div className="resident-wallet-highlight">
                  <div>
                    <p className="resident-wallet-highlight-label">
                      Latest activity
                    </p>
                    <p className="resident-wallet-highlight-title">
                      {latestTransaction.title}
                    </p>
                    <p className="resident-wallet-highlight-subtitle">
                      {latestTransaction.subtitle}
                    </p>
                    <p className="resident-wallet-highlight-subtitle">
                      Ref: {formatReference(latestTransaction.reference)}
                    </p>
                  </div>
                  <div className="resident-wallet-highlight-right">
                    <p
                      className={`resident-wallet-highlight-amount ${
                        latestTransaction.direction === "positive"
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {latestTransaction.direction === "positive" ? "+" : "-"}{" "}
                      {formatCurrency(latestTransaction.amount)}
                    </p>
                    <p className="resident-wallet-highlight-time">
                      {formatDateOnly(latestTransaction.time)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="wallet-table-head">
                <span>Purpose</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Result</span>
              </div>

              <div className="wallet-table-body">
                {recentTransactions.length === 0 ? (
                  <div className="wallet-table-empty">
                    No wallet activity yet.
                  </div>
                ) : (
                  recentTransactions.map((item) => (
                    <div key={item.id} className="wallet-table-row">
                      <div>
                        <p className="wallet-table-title">{item.title}</p>
                        <p className="wallet-table-subtitle">{item.subtitle}</p>
                        <p className="wallet-table-subtitle">
                          Ref: {formatReference(item.reference)}
                        </p>
                      </div>

                      <div>
                        <p className="wallet-table-date-main">
                          {formatDateOnly(item.time)}
                        </p>
                        <p className="wallet-table-date-sub">
                          {formatTimeOnly(item.time)}
                        </p>
                      </div>

                      <p
                        className={`wallet-table-amount ${
                          item.direction === "positive"
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {item.direction === "positive" ? "+" : "-"}{" "}
                        {formatCurrency(item.amount)}
                      </p>

                      <span className="wallet-table-badge">
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                className="wallet-table-footer-button"
                type="button"
                onClick={handleStatementExport}
                disabled={!!actionLoading}
              >
                Export full wallet statement
              </button>
            </div>
          </div>
        </section>
      </div>

      {withdrawModalOpen ? (
        <div className="resident-payment-modal-backdrop">
          <div className="resident-payment-modal">
            <div className="resident-payment-modal-head">
              <div>
                <p className="resident-payment-modal-eyebrow">Withdraw funds</p>
                <h3 className="resident-payment-modal-title">
                  Choose payout destination
                </h3>
              </div>

              <button
                type="button"
                className="resident-payment-modal-close"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={actionLoading === "withdraw"}
              >
                ×
              </button>
            </div>

            <div className="resident-payment-modal-summary">
              <div className="resident-payment-modal-summary-card">
                <span>Available balance</span>
                <strong>{formatCurrency(balance)}</strong>
                <p>Only approved payout requests will be completed.</p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Default phone</span>
                <strong>{userPhone || "Not set"}</strong>
                <p>Used only as a prefill. Confirm before submitting.</p>
              </div>
            </div>

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Amount</label>
              <input
                className="resident-payment-input"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                disabled={actionLoading === "withdraw"}
              />
            </div>

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Payout method</label>
              <div className="resident-payment-method-grid">
                {(["MOBILE_MONEY", "BANK", "CARD"] as WithdrawalMethod[]).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      className={`resident-payment-method-card ${
                        withdrawMethod === method ? "active" : ""
                      }`}
                      onClick={() => setWithdrawMethod(method)}
                      disabled={actionLoading === "withdraw"}
                    >
                      {method.replace(/_/g, " ")}
                    </button>
                  ),
                )}
              </div>
            </div>

            {withdrawMethod === "MOBILE_MONEY" ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">
                  Mobile money phone number
                </label>
                <input
                  className="resident-payment-input"
                  value={withdrawPhoneNumber}
                  onChange={(e) => setWithdrawPhoneNumber(e.target.value)}
                  placeholder="Example: +256700000000"
                  disabled={actionLoading === "withdraw"}
                />
              </div>
            ) : null}

            {withdrawMethod === "BANK" ? (
              <>
                <div className="resident-payment-modal-section">
                  <label className="resident-payment-label">Bank name</label>
                  <input
                    className="resident-payment-input"
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                    placeholder="Example: Stanbic Bank"
                    disabled={actionLoading === "withdraw"}
                  />
                </div>

                <div className="resident-payment-modal-section">
                  <label className="resident-payment-label">Account name</label>
                  <input
                    className="resident-payment-input"
                    value={withdrawAccountName}
                    onChange={(e) => setWithdrawAccountName(e.target.value)}
                    placeholder="Account holder name"
                    disabled={actionLoading === "withdraw"}
                  />
                </div>

                <div className="resident-payment-modal-section">
                  <label className="resident-payment-label">Account number</label>
                  <input
                    className="resident-payment-input"
                    value={withdrawAccountNumber}
                    onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                    placeholder="Bank account number"
                    disabled={actionLoading === "withdraw"}
                  />
                </div>
              </>
            ) : null}

            {withdrawMethod === "CARD" ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">
                  Card last 4 digits
                </label>
                <input
                  className="resident-payment-input"
                  value={withdrawCardLast4}
                  onChange={(e) =>
                    setWithdrawCardLast4(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="1234"
                  maxLength={4}
                  disabled={actionLoading === "withdraw"}
                />
              </div>
            ) : null}

            <div className="resident-payment-modal-footer">
              <button
                type="button"
                className="resident-payment-cancel-btn"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={actionLoading === "withdraw"}
              >
                Cancel
              </button>

              <button
                type="button"
                className="resident-payment-submit-btn"
                onClick={submitWithdrawal}
                disabled={actionLoading === "withdraw"}
              >
                {actionLoading === "withdraw"
                  ? "Submitting..."
                  : "Submit withdrawal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isResident && paymentModalOpen ? (
        <div className="resident-payment-modal-backdrop">
          <div className="resident-payment-modal">
            <div className="resident-payment-modal-head">
              <div>
                <p className="resident-payment-modal-eyebrow">
                  Pay outstanding
                </p>
                <h3 className="resident-payment-modal-title">
                  Review and confirm payment
                </h3>
              </div>

              <button
                type="button"
                className="resident-payment-modal-close"
                onClick={() => setPaymentModalOpen(false)}
                disabled={actionLoading === "pay"}
              >
                ×
              </button>
            </div>

            <div className="resident-payment-modal-summary">
              <div className="resident-payment-modal-summary-card">
                <span>Selected invoice</span>
                <strong>
                  {selectedInvoice
                    ? `${selectedInvoice.propertyTitle || "Property"} · ${getInvoiceDisplayName(
                        selectedInvoice,
                      )}`
                    : "—"}
                </strong>
                <p>
                  {selectedInvoice?.propertyLocation || "No location"} · Unit{" "}
                  {selectedInvoice?.unitNumber || "—"}
                </p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Selected outstanding</span>
                <strong>{formatCurrency(selectedInvoiceOutstanding)}</strong>
                <p>
                  {selectedInvoice?.dueDate
                    ? `Due ${formatDateOnly(selectedInvoice.dueDate)}`
                    : "—"}
                </p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Wallet balance</span>
                <strong>{formatCurrency(balance)}</strong>
                <p>{getCoverageLabel(balance, selectedInvoiceOutstanding)}</p>
              </div>
            </div>

            {sortedResidentInvoices.length > 0 ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">
                  Select invoice to pay
                </label>
                <select
                  className="resident-payment-input"
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedInvoiceId(nextId);

                    const nextInvoice = sortedResidentInvoices.find(
                      (item) => item.id === nextId,
                    );

                    if (nextInvoice) {
                      setPaymentAmount(
                        String(Number(nextInvoice.outstandingAmount ?? 0)),
                      );
                    }
                  }}
                  disabled={actionLoading === "pay"}
                >
                  {sortedResidentInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {`${getInvoiceDisplayName(invoice)} • ${formatCurrency(
                        Number(invoice.outstandingAmount ?? 0),
                      )} • Due ${formatDateOnly(invoice.dueDate)}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Amount</label>
              <input
                className="resident-payment-input"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={actionLoading === "pay"}
              />
            </div>

            <div className="resident-payment-modal-summary">
              <div className="resident-payment-modal-summary-card">
                <span>Recommended wallet use</span>
                <strong>{formatCurrency(walletPreviewAmount)}</strong>
                <p>
                  {walletPreviewAmount > 0
                    ? "This is the amount your wallet can cover for the entered payment."
                    : "Your wallet has no available amount for this payment."}
                </p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>External balance needed</span>
                <strong>{formatCurrency(externalPreviewAmount)}</strong>
                <p>
                  {externalPreviewAmount > 0
                    ? "Use mobile money, card, bank, or top up before paying by wallet."
                    : "No external payment needed if you pay this amount by wallet."}
                </p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Decision</span>
                <strong>
                  {previewPaymentAmount <= 0
                    ? "Enter amount"
                    : balance >= previewPaymentAmount
                      ? "Wallet can cover"
                      : "Partial wallet cover"}
                </strong>
                <p>Resident confirms the final method before payment is sent.</p>
              </div>
            </div>

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Payment method</label>
              <div className="resident-payment-method-grid">
                {(
                  ["WALLET", "MOBILE_MONEY", "CARD", "BANK"] as PaymentMethod[]
                ).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`resident-payment-method-card ${
                      selectedMethod === method ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedMethod(method);
                      setSelectedProvider("");
                    }}
                    disabled={actionLoading === "pay"}
                  >
                    {method.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {selectedMethod === "MOBILE_MONEY" ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">Provider</label>
                <div className="resident-payment-provider-grid">
                  {(["MTN", "AIRTEL"] as MobileProvider[]).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      className={`resident-payment-provider-card ${
                        selectedProvider === provider ? "active" : ""
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                      disabled={actionLoading === "pay"}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedMethod === "CARD" ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">Provider</label>
                <div className="resident-payment-provider-grid">
                  <button
                    type="button"
                    className={`resident-payment-provider-card ${
                      selectedProvider === "STRIPE" ? "active" : ""
                    }`}
                    onClick={() => setSelectedProvider("STRIPE")}
                    disabled={actionLoading === "pay"}
                  >
                    STRIPE
                  </button>
                </div>
              </div>
            ) : null}

            {selectedMethod === "BANK" ? (
              <div className="resident-payment-modal-section">
                <label className="resident-payment-label">Provider</label>
                <div className="resident-payment-provider-grid">
                  <button
                    type="button"
                    className={`resident-payment-provider-card ${
                      selectedProvider === "FLUTTERWAVE" ? "active" : ""
                    }`}
                    onClick={() => setSelectedProvider("FLUTTERWAVE")}
                    disabled={actionLoading === "pay"}
                  >
                    FLUTTERWAVE
                  </button>
                </div>
              </div>
            ) : null}

            <div className="resident-payment-modal-footer">
              <button
                type="button"
                className="resident-payment-cancel-btn"
                onClick={() => setPaymentModalOpen(false)}
                disabled={actionLoading === "pay"}
              >
                Cancel
              </button>

              <button
                type="button"
                className="resident-payment-submit-btn"
                onClick={submitPayment}
                disabled={actionLoading === "pay"}
              >
                {actionLoading === "pay" ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}