"use client";

import "@/styles/payouts.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type ProviderPayoutItem = {
  id: string;
  totalAmount?: number | null;
  providerEarning?: number | null;
  platformFee?: number | null;
  status?: string | null;
  createdAt?: string | null;
  request?: {
    id?: string;
    title?: string | null;
    category?: string | null;
    property?: {
      id?: string;
      title?: string | null;
      location?: string | null;
    } | null;
    unit?: {
      id?: string;
      number?: string | null;
    } | null;
  } | null;
};

type ProviderWalletResponse = {
  provider?: {
    id?: string;
    companyName?: string | null;
    type?: string | null;
    verificationStatus?: string | null;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
  wallet?: {
    accountId?: string;
    balance?: number;
  };
  summary?: {
    grossEarnings?: number;
    netEarnings?: number;
    platformFees?: number;
    pendingPayouts?: number;
    completedPayouts?: number;
  };
};

function formatCurrency(value?: number | null) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(value?: string | null) {
  return String(value || "PENDING")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusClass(value?: string | null) {
  const raw = String(value || "").toUpperCase();

  if (raw === "COMPLETED" || raw === "PAID") return "paid";
  if (raw === "PENDING" || raw === "PROCESSING") return "pending";
  if (raw === "FAILED" || raw === "REJECTED") return "failed";

  return "neutral";
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<ProviderPayoutItem[]>([]);
  const [walletData, setWalletData] = useState<ProviderWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadPayouts() {
    try {
      setLoading(true);
      const res = await api.get("/maintenance/provider/payouts");
      const data = Array.isArray(res.data) ? res.data : [];
      setPayouts(data);
    } catch (error) {
      console.error("Failed to load payouts", error);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadWallet() {
    try {
      setWalletLoading(true);
      const res = await api.get("/payouts/provider/wallet");
      setWalletData(res.data);
    } catch (error) {
      console.error("Failed to load provider wallet", error);
      setWalletData(null);
    } finally {
      setWalletLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadPayouts(), loadWallet()]);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredPayouts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payouts.filter((item) => {
      const itemStatus = String(item.status || "").toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || itemStatus === statusFilter;

      const matchesSearch =
        !query ||
        String(item.request?.title || "").toLowerCase().includes(query) ||
        String(item.request?.category || "").toLowerCase().includes(query) ||
        String(item.request?.property?.title || "")
          .toLowerCase()
          .includes(query) ||
        String(item.request?.property?.location || "")
          .toLowerCase()
          .includes(query) ||
        String(item.request?.unit?.number || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payouts, search, statusFilter]);

  const derivedStats = useMemo(() => {
    const totalGross = payouts.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );

    const totalNet = payouts.reduce(
      (sum, item) => sum + Number(item.providerEarning || 0),
      0,
    );

    const totalFees = payouts.reduce(
      (sum, item) => sum + Number(item.platformFee || 0),
      0,
    );

    const pendingCount = payouts.filter(
      (item) => String(item.status || "").toUpperCase() === "PENDING",
    ).length;

    return {
      totalGross,
      totalNet,
      totalFees,
      pendingCount,
    };
  }, [payouts]);

  const grossEarnings =
    Number(walletData?.summary?.grossEarnings ?? derivedStats.totalGross) || 0;
  const netEarnings =
    Number(walletData?.summary?.netEarnings ?? derivedStats.totalNet) || 0;
  const platformFees =
    Number(walletData?.summary?.platformFees ?? derivedStats.totalFees) || 0;
  const pendingCount =
    Number(walletData?.summary?.pendingPayouts ?? derivedStats.pendingCount) || 0;

  const latestPayout = payouts[0] || null;
  const walletBalance = Number(walletData?.wallet?.balance || 0);

  async function handleWithdraw() {
    if (!withdrawAmount.trim()) {
      setMessage({
        type: "error",
        text: "Enter a withdrawal amount.",
      });
      return;
    }

    try {
      setWithdrawing(true);
      setMessage(null);

      await api.post("/payouts/provider/withdraw", {
        amount: Number(withdrawAmount),
      });

      setMessage({
        type: "success",
        text: "Withdrawal processed successfully.",
      });

      setWithdrawAmount("");
      setShowWithdrawModal(false);
      await refreshAll();
    } catch (error: any) {
      console.error("Failed to withdraw", error);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to process withdrawal.",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleRepairLegacy() {
    try {
      setRepairing(true);
      setMessage(null);

      await api.post("/payouts/provider/repair-legacy");
      await refreshAll();

      setMessage({
        type: "success",
        text: "Legacy provider payouts repaired successfully.",
      });
    } catch (error: any) {
      console.error("Failed to repair legacy payouts", error);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to repair legacy payouts.",
      });
    } finally {
      setRepairing(false);
    }
  }

  return (
    <div className="provider-payouts-page-shell">
      <section className="provider-payouts-hero">
        <div className="provider-payouts-hero-copy">
          <p className="provider-payouts-eyebrow">Provider finance center</p>
          <h1 className="provider-payouts-title">Payouts</h1>
          <p className="provider-payouts-text">
            Monitor gross earnings, net earnings, wallet balance, review payout
            history, and withdraw available funds from your provider wallet.
          </p>
        </div>

        <div className="provider-payouts-hero-side">
          <div className="provider-payouts-mini-stat">
            <span>Wallet balance</span>
            <strong>
              {walletLoading ? "Loading..." : formatCurrency(walletBalance)}
            </strong>
          </div>
          <div className="provider-payouts-mini-stat">
            <span>Gross earnings</span>
            <strong>{formatCurrency(grossEarnings)}</strong>
          </div>
          <div className="provider-payouts-mini-stat">
            <span>Platform fees</span>
            <strong>{formatCurrency(platformFees)}</strong>
          </div>
        </div>
      </section>

      {message && (
        <div className={`provider-payouts-feedback ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="provider-payouts-overview-grid">
        <div className="payouts-balance-card">
          <p className="payouts-balance-label">Wallet balance</p>
          <h2 className="payouts-balance-value">
            {walletLoading ? "Loading..." : formatCurrency(walletBalance)}
          </h2>
          <p className="payouts-balance-subtext">
            Net earnings recorded: {formatCurrency(netEarnings)}
          </p>

          <div className="payouts-balance-strip">
            <div>
              <span>Gross</span>
              <strong>{formatCurrency(grossEarnings)}</strong>
            </div>
            <div>
              <span>Net</span>
              <strong>{formatCurrency(netEarnings)}</strong>
            </div>
            <div>
              <span>Fees</span>
              <strong>{formatCurrency(platformFees)}</strong>
            </div>
          </div>

          <div className="payouts-balance-actions">
            <button
              className="payout-action-btn primary"
              onClick={() => setShowWithdrawModal(true)}
              disabled={walletBalance <= 0}
            >
              Withdraw Funds
            </button>
            <button
              className="payout-action-btn secondary"
              onClick={refreshAll}
            >
              Refresh
            </button>
            <button
              className="payout-action-btn secondary"
              onClick={handleRepairLegacy}
              disabled={repairing}
            >
              {repairing ? "Repairing..." : "Repair Legacy Data"}
            </button>
          </div>
        </div>

        <div className="payouts-highlight-card">
          <div className="payouts-highlight-header">
            <div>
              <h3>Latest payout</h3>
              <p>Most recent processed payout record</p>
            </div>
            <span
              className={`payout-status-pill ${statusClass(latestPayout?.status)}`}
            >
              {formatStatus(latestPayout?.status)}
            </span>
          </div>

          {latestPayout ? (
            <div className="payouts-highlight-content">
              <div className="highlight-amount-block">
                <span>Provider earning</span>
                <strong>
                  {formatCurrency(latestPayout.providerEarning)}
                </strong>
              </div>

              <div className="highlight-meta-grid">
                <div>
                  <span>Job</span>
                  <strong>{latestPayout.request?.title || "—"}</strong>
                </div>
                <div>
                  <span>Property</span>
                  <strong>
                    {latestPayout.request?.property?.title || "—"}
                  </strong>
                </div>
                <div>
                  <span>Unit</span>
                  <strong>
                    {latestPayout.request?.unit?.number || "—"}
                  </strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{formatDate(latestPayout.createdAt)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="payouts-empty-mini">
              No payout history yet.
            </div>
          )}
        </div>
      </section>

      <section className="provider-payouts-toolbar">
        <input
          className="provider-payouts-search"
          placeholder="Search payouts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="provider-payouts-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
      </section>

      <section className="provider-payouts-stats-grid">
        <div className="provider-payouts-stat-card">
          <p>Gross Earnings</p>
          <h3>{formatCurrency(grossEarnings)}</h3>
        </div>
        <div className="provider-payouts-stat-card">
          <p>Net Earnings</p>
          <h3>{formatCurrency(netEarnings)}</h3>
        </div>
        <div className="provider-payouts-stat-card">
          <p>Wallet Balance</p>
          <h3>{formatCurrency(walletBalance)}</h3>
        </div>
        <div className="provider-payouts-stat-card">
          <p>Pending Count</p>
          <h3>{pendingCount}</h3>
        </div>
      </section>

      {loading ? (
        <section className="provider-payouts-empty-wrap">
          <div className="provider-payouts-empty-card">
            Loading payouts...
          </div>
        </section>
      ) : filteredPayouts.length === 0 ? (
        <section className="provider-payouts-empty-wrap">
          <div className="provider-payouts-empty-card">
            No payouts found yet.
          </div>
        </section>
      ) : (
        <section className="provider-payouts-ledger">
          {filteredPayouts.map((item) => (
            <article key={item.id} className="payout-ledger-row">
              <div className="payout-ledger-main">
                <div className="payout-ledger-top">
                  <div className="payout-ledger-copy">
                    <h3>{item.request?.title || "Maintenance payout"}</h3>
                    <p>
                      {item.request?.property?.title || "Property"}
                      {item.request?.unit?.number
                        ? ` · Unit ${item.request.unit.number}`
                        : ""}
                      {item.request?.property?.location
                        ? ` · ${item.request.property.location}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`payout-status-pill ${statusClass(item.status)}`}
                  >
                    {formatStatus(item.status)}
                  </span>
                </div>

                <div className="payout-ledger-grid">
                  <div className="payout-ledger-box">
                    <span>Gross Amount</span>
                    <strong>{formatCurrency(item.totalAmount)}</strong>
                  </div>

                  <div className="payout-ledger-box net">
                    <span>Net Earning</span>
                    <strong>{formatCurrency(item.providerEarning)}</strong>
                  </div>

                  <div className="payout-ledger-box">
                    <span>Platform Fee</span>
                    <strong>{formatCurrency(item.platformFee)}</strong>
                  </div>

                  <div className="payout-ledger-box">
                    <span>Date</span>
                    <strong>{formatDate(item.createdAt)}</strong>
                  </div>
                </div>
              </div>

              <div className="payout-ledger-side">
                <button className="payout-ledger-btn primary">
                  View Record
                </button>
                <button className="payout-ledger-btn secondary">
                  Export
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {showWithdrawModal && (
        <div
          className="withdraw-modal-overlay"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            className="withdraw-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="withdraw-modal-header">
              <div>
                <p className="withdraw-modal-eyebrow">Withdraw funds</p>
                <h3 className="withdraw-modal-title">Provider Wallet</h3>
                <p className="withdraw-modal-subtitle">
                  Available balance: {formatCurrency(walletBalance)}
                </p>
              </div>

              <button
                className="withdraw-modal-close"
                type="button"
                onClick={() => setShowWithdrawModal(false)}
              >
                ×
              </button>
            </div>

            <div className="withdraw-modal-body">
              <label className="withdraw-field">
                <span>Withdrawal amount</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </label>
            </div>

            <div className="withdraw-modal-actions">
              <button
                className="withdraw-btn secondary"
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
              >
                Cancel
              </button>

              <button
                className="withdraw-btn primary"
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}