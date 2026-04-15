"use client";

import "@/styles/wallet.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type WalletTransactionItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  amount: number;
  direction: "positive" | "negative";
  status: string;
};

type WalletSummaryResponse = {
  balance: number;
  walletRef: string;
  accountType: string;
  currency: string;
  monthlyGrowth: number;
  totalInvestment: number;
  totalProfit: number;
  pendingWithdrawal: number;
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

type ResidentPaymentSummaryResponse = {
  totalPaid: number;
  successfulPaymentsCount: number;
  currentInvoice: {
    id: string;
    period: string;
    dueDate: string;
    status: string;
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
    status: string;
    invoiceId: string;
    propertyTitle: string | null;
    unitNumber: string | null;
    period: string | null;
  } | null;
  audience: "resident";
};

type PaymentMethod = "WALLET" | "MOBILE_MONEY" | "CARD" | "BANK";
type MobileProvider = "MTN" | "AIRTEL";
type CardProvider = "STRIPE";
type BankProvider = "FLUTTERWAVE";

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(value: string) {
  return new Date(value).toLocaleTimeString("en-UG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusLabel(status: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "PENDING") return "Pending";
  return status;
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

export default function WalletPage() {
  const [data, setData] = useState<WalletSummaryResponse | null>(null);
  const [paymentSummary, setPaymentSummary] =
    useState<ResidentPaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("WALLET");
  const [selectedProvider, setSelectedProvider] = useState<
    MobileProvider | CardProvider | BankProvider | ""
  >("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function loadWallet() {
    try {
      const [walletRes, paymentRes] = await Promise.all([
        api.get("/wallet/summary", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        api.get("/payments/resident/summary", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      setData(walletRes.data);
      setPaymentSummary(paymentRes.data);
    } catch (error) {
      console.error("Failed to load wallet", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeposit() {
    const rawAmount = window.prompt("Enter deposit amount in UGX");
    if (!rawAmount) return;

    const amount = Number(rawAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      window.alert("Please enter a valid amount.");
      return;
    }

    try {
      setActionLoading("deposit");

      await api.post(
        "/wallet/fund",
        { amount },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      await loadWallet();
      window.alert("Wallet funded successfully.");
    } catch (error) {
      console.error(error);
      window.alert("Deposit failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWithdraw() {
    const rawAmount = window.prompt("Enter withdrawal amount in UGX");
    if (!rawAmount) return;

    const amount = Number(rawAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      window.alert("Please enter a valid amount.");
      return;
    }

    try {
      setActionLoading("withdraw");

      await api.post(
        "/wallet/withdraw",
        { amount },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      await loadWallet();
      window.alert("Withdrawal request submitted.");
    } catch (error) {
      console.error(error);
      window.alert("Withdrawal request failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatementExport() {
    try {
      setActionLoading("statement");

      const res = await api.get<WalletTransactionsResponse>(
        "/wallet/transactions?page=1&limit=100",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      const rows = [
        ["Title", "Subtitle", "Date", "Time", "Amount", "Direction", "Status"],
        ...res.data.items.map((item) => [
          item.title,
          item.subtitle,
          formatDateOnly(item.time),
          formatTimeOnly(item.time),
          String(item.amount),
          item.direction,
          item.status,
        ]),
      ];

      const csv = rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "resident-wallet-statement.csv");
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

  function openPaymentModal() {
    if (!paymentSummary?.currentInvoice) {
      window.alert("There is no active invoice to pay right now.");
      return;
    }

    const outstanding = Number(paymentSummary.currentInvoice.outstandingAmount ?? 0);

    if (outstanding <= 0) {
      window.alert("Your current invoice is already settled.");
      return;
    }

    setSelectedMethod("WALLET");
    setSelectedProvider("");
    setPaymentAmount(String(outstanding));
    setPaymentModalOpen(true);
  }

  async function submitPayment() {
    const invoice = paymentSummary?.currentInvoice;
    const balance = Number(data?.balance ?? 0);

    if (!invoice) {
      window.alert("No active invoice found.");
      return;
    }

    const amount = Number(paymentAmount.replace(/,/g, ""));

    if (!amount || amount <= 0) {
      window.alert("Enter a valid payment amount.");
      return;
    }

    if (amount > Number(invoice.outstandingAmount ?? 0)) {
      window.alert("Amount exceeds outstanding balance.");
      return;
    }

    try {
      setActionLoading("pay");

      if (selectedMethod === "WALLET") {
        if (balance < amount) {
          window.alert(
            `Wallet balance is ${formatCurrency(
              balance,
            )}. Please top up before paying ${formatCurrency(amount)}.`,
          );
          return;
        }

        await api.post(
          "/payments/resident/pay-wallet",
          {
            invoiceId: invoice.id,
            amount,
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

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

      await api.post(
        "/payments/resident/initiate",
        {
          invoiceId: invoice.id,
          amount,
          channel: methodMap[selectedMethod as "MOBILE_MONEY" | "CARD" | "BANK"],
          provider: selectedProvider,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      await loadWallet();
      setPaymentModalOpen(false);
      window.alert(
        "External payment initiated. It will settle after provider confirmation.",
      );
    } catch (error: any) {
      console.error(error);
      window.alert(
        error?.response?.data?.message ||
          "Payment request failed.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  const balance = Number(data?.balance ?? 0);
  const pendingWithdrawal = Number(data?.pendingWithdrawal ?? 0);
  const recentTransactions = data?.recentTransactions ?? [];
  const currentInvoice = paymentSummary?.currentInvoice ?? null;
  const outstandingAmount = Number(currentInvoice?.outstandingAmount ?? 0);
  const totalPaid = Number(paymentSummary?.totalPaid ?? 0);

  const depositTotal = useMemo(
    () =>
      recentTransactions
        .filter((item) => item.direction === "positive")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [recentTransactions],
  );

  const outgoingTotal = useMemo(
    () =>
      recentTransactions
        .filter((item) => item.direction === "negative")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [recentTransactions],
  );

  const latestTransaction = recentTransactions[0];

  const quickActions = [
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
        outstandingAmount > 0
          ? "Choose a payment channel"
          : "No balance due right now",
      onClick: openPaymentModal,
    },
    {
      icon: "↗",
      label: "Withdraw",
      hint: actionLoading === "withdraw" ? "Processing..." : "Move funds out",
      onClick: handleWithdraw,
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
  ];

  const statCards = [
    {
      label: "Total inflow",
      value: formatCurrency(depositTotal),
    },
    {
      label: "Total outflow",
      value: formatCurrency(outgoingTotal),
    },
    {
      label: "Pending withdrawal",
      value: formatCurrency(pendingWithdrawal),
    },
    {
      label: "Total paid",
      value: formatCurrency(totalPaid),
    },
  ];

  return (
    <>
      <div className="wallet-shell resident-wallet-shell">
        <section className="wallet-dashboard-grid resident-wallet-grid">
          <div className="wallet-left-stack resident-wallet-left">
            <div className="wallet-hero-card resident-wallet-hero">
              <div className="wallet-hero-top">
                <div>
                  <p className="wallet-hero-eyebrow">Resident Wallet</p>
                  <h2 className="wallet-hero-balance">
                    {loading ? "Loading..." : formatCurrency(balance)}
                  </h2>
                  <p className="wallet-hero-text">
                    Keep track of your available balance for rent payments,
                    top-ups, and withdrawals.
                  </p>
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
                  <p className="resident-wallet-invoice-label">Current invoice</p>
                  <h3 className="resident-wallet-invoice-title">
                    {currentInvoice?.propertyTitle || "No active invoice"}
                  </h3>
                  <p className="resident-wallet-invoice-subtitle">
                    {currentInvoice
                      ? `${currentInvoice.propertyLocation || "No location"} · Unit ${
                          currentInvoice.unitNumber || "—"
                        }`
                      : "Your current due amount will show here."}
                  </p>
                </div>

                <span className="resident-wallet-coverage-chip">
                  {getCoverageLabel(balance, outstandingAmount)}
                </span>
              </div>

              {currentInvoice ? (
                <>
                  <div className="resident-wallet-invoice-grid">
                    <div className="resident-wallet-invoice-stat">
                      <span>Invoice total</span>
                      <strong>{formatCurrency(currentInvoice.totalAmount)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Outstanding</span>
                      <strong>{formatCurrency(outstandingAmount)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Due date</span>
                      <strong>{formatDateOnly(currentInvoice.dueDate)}</strong>
                    </div>
                    <div className="resident-wallet-invoice-stat">
                      <span>Status</span>
                      <strong>{formatInvoiceStatus(currentInvoice.status)}</strong>
                    </div>
                  </div>

                  <div className="resident-wallet-invoice-footer">
                    <p className="resident-wallet-invoice-note">
                      Choose wallet, mobile money, card, or bank when paying your
                      current outstanding balance.
                    </p>

                    <div className="resident-wallet-invoice-actions">
                      <button
                        type="button"
                        className="resident-wallet-primary-btn"
                        onClick={openPaymentModal}
                      >
                        Pay outstanding
                      </button>

                      <Link
                        href="/payments"
                        className="resident-wallet-secondary-btn"
                      >
                        View payments
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="resident-wallet-no-invoice">
                  No invoice is active right now.
                </div>
              )}
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
                  disabled={!!actionLoading}
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
                    Your latest deposits, payments, and withdrawals
                  </p>
                </div>

                <div className="wallet-mini-actions">
                  <button
                    className="wallet-mini-btn sky"
                    type="button"
                    onClick={handleStatementExport}
                  >
                    Export
                  </button>
                  <button
                    className="wallet-mini-btn blue"
                    type="button"
                    onClick={loadWallet}
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
                  <div className="wallet-table-empty">No wallet activity yet.</div>
                ) : (
                  recentTransactions.map((item) => (
                    <div key={item.id} className="wallet-table-row">
                      <div>
                        <p className="wallet-table-title">{item.title}</p>
                        <p className="wallet-table-subtitle">{item.subtitle}</p>
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
                          item.direction === "positive" ? "positive" : "negative"
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
              >
                Export full wallet statement
              </button>
            </div>
          </div>
        </section>
      </div>

      {paymentModalOpen ? (
        <div className="resident-payment-modal-backdrop">
          <div className="resident-payment-modal">
            <div className="resident-payment-modal-head">
              <div>
                <p className="resident-payment-modal-eyebrow">Pay outstanding</p>
                <h3 className="resident-payment-modal-title">
                  Choose how you want to pay
                </h3>
              </div>

              <button
                type="button"
                className="resident-payment-modal-close"
                onClick={() => setPaymentModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="resident-payment-modal-summary">
              <div className="resident-payment-modal-summary-card">
                <span>Invoice</span>
                <strong>{currentInvoice?.propertyTitle || "—"}</strong>
                <p>
                  {currentInvoice?.propertyLocation || "No location"} · Unit{" "}
                  {currentInvoice?.unitNumber || "—"}
                </p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Outstanding</span>
                <strong>{formatCurrency(outstandingAmount)}</strong>
                <p>Due {formatDateOnly(currentInvoice?.dueDate || "")}</p>
              </div>

              <div className="resident-payment-modal-summary-card">
                <span>Wallet balance</span>
                <strong>{formatCurrency(balance)}</strong>
                <p>{getCoverageLabel(balance, outstandingAmount)}</p>
              </div>
            </div>

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Amount</label>
              <input
                className="resident-payment-input"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="resident-payment-modal-section">
              <label className="resident-payment-label">Payment method</label>
              <div className="resident-payment-method-grid">
                {(["WALLET", "MOBILE_MONEY", "CARD", "BANK"] as PaymentMethod[]).map(
                  (method) => (
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
                    >
                      {method.replace(/_/g, " ")}
                    </button>
                  ),
                )}
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