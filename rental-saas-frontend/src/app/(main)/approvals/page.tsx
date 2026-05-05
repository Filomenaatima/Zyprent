"use client";

import { useEffect, useMemo, useState } from "react";
import "@/styles/approvals.css";
import { api } from "@/services/api";

type ApprovalType =
  | "KYC"
  | "PROVIDER"
  | "EXPENSE"
  | "PROFIT_REQUEST"
  | "WITHDRAWAL";

type ApprovalQueueItem = {
  id: string;
  type: ApprovalType;
  status: string;
  title: string;
  subtitle: string;
  meta: string;
  updatedAt: string;
  raw: any;
};

type ApprovalSummary = {
  totalPending: number;
  pendingKyc: number;
  pendingProviders: number;
  submittedExpenses: number;
  pendingProfitRequests: number;
  approvedTodayExpenses: number;
  pendingWithdrawals?: number;
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  return `UGX ${Number(value || 0).toLocaleString("en-UG")}`;
}

function getStatusTone(status: string) {
  const normalized = String(status || "").toUpperCase();

  if (["APPROVED", "VERIFIED", "COMPLETED"].includes(normalized)) {
    return "approved";
  }

  if (["REJECTED", "DECLINED", "FAILED"].includes(normalized)) {
    return "rejected";
  }

  if (["SUBMITTED", "PENDING", "PROCESSING"].includes(normalized)) {
    return "pending";
  }

  return "neutral";
}

function getWithdrawalDestination(item: any) {
  const method = String(item?.method || "MOBILE_MONEY").replace("_", " ");

  if (item?.phoneNumber) return `${method} • ${item.phoneNumber}`;

  if (item?.bankName || item?.accountNumber) {
    return `${method} • ${item.bankName || "Bank"} • ${
      item.accountNumber || "—"
    }`;
  }

  if (item?.cardLast4) return `${method} • Card ending ${item.cardLast4}`;

  return method;
}

export default function ApprovalsPage() {
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [selected, setSelected] = useState<ApprovalQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadApprovals = async () => {
    try {
      setLoading(true);

      const [summaryResult, queueResult, withdrawalsResult] =
        await Promise.allSettled([
          api.get("/approvals/summary"),
          api.get("/approvals/queue", {
            params: {
              type: typeFilter === "WITHDRAWAL" ? "ALL" : typeFilter,
              search: search || undefined,
            },
          }),
          api.get("/wallet/withdrawals"),
        ]);

      const summaryData =
        summaryResult.status === "fulfilled"
          ? summaryResult.value.data || {}
          : {};

      const baseQueue: ApprovalQueueItem[] =
        queueResult.status === "fulfilled" ? queueResult.value.data || [] : [];

      const withdrawalsData =
        withdrawalsResult.status === "fulfilled"
          ? withdrawalsResult.value.data || []
          : [];

      const actionableWithdrawalStatuses = [
        "PENDING",
        "APPROVED",
        "PROCESSING",
      ];

      const withdrawalItems: ApprovalQueueItem[] = withdrawalsData
        .filter((item: any) =>
          actionableWithdrawalStatuses.includes(
            String(item.status).toUpperCase(),
          ),
        )
        .map((item: any) => ({
          id: item.id,
          type: "WITHDRAWAL",
          status: item.status,
          title:
            String(item.status).toUpperCase() === "PENDING"
              ? "Withdrawal Request"
              : String(item.status).toUpperCase() === "APPROVED"
                ? "Approved Withdrawal"
                : "Processing Withdrawal",
          subtitle: `${
            item.investor?.name || item.investor?.email || "Investor"
          } • ${formatMoney(Number(item.amount || 0))}`,
          meta: getWithdrawalDestination(item),
          updatedAt: item.updatedAt || item.createdAt,
          raw: item,
        }));

      const mergedQueue =
        typeFilter === "WITHDRAWAL"
          ? withdrawalItems
          : typeFilter === "ALL"
            ? [...withdrawalItems, ...baseQueue]
            : baseQueue;

      mergedQueue.sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
      );

      setSummary({
        ...summaryData,
        pendingWithdrawals: withdrawalItems.length,
        totalPending:
          Number(summaryData.totalPending || 0) + withdrawalItems.length,
      });

      setQueue(mergedQueue);

      setSelected((current) => {
        if (!mergedQueue.length) return null;
        if (!current) return mergedQueue[0];
        return (
          mergedQueue.find((item) => item.id === current.id) || mergedQueue[0]
        );
      });
    } catch (error) {
      console.error("Failed to load approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const filteredQueue = useMemo(() => {
    if (!search.trim()) return queue;

    const term = search.toLowerCase().trim();

    return queue.filter((item) =>
      [item.title, item.subtitle, item.meta]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [queue, search]);

  const selectedItem =
    filteredQueue.find((item) => item.id === selected?.id) ||
    filteredQueue[0] ||
    null;

  const review = async (action: "APPROVE" | "REJECT") => {
    if (!selectedItem) return;

    try {
      setBusyId(selectedItem.id);

      if (selectedItem.type === "WITHDRAWAL") {
        if (action === "REJECT") {
          const reason = window.prompt("Enter rejection reason") || undefined;

          await api.post(`/wallet/withdraw/${selectedItem.id}/reject`, {
            reason,
          });

          await loadApprovals();
          return;
        }

        await api.post(`/wallet/withdraw/${selectedItem.id}/approve`);
        await loadApprovals();
        return;
      }

      const reason =
        action === "REJECT"
          ? window.prompt("Enter rejection reason (optional)") || undefined
          : undefined;

      const routeMap: Record<Exclude<ApprovalType, "WITHDRAWAL">, string> = {
        KYC: `/approvals/kyc/${selectedItem.id}/review`,
        PROVIDER: `/approvals/provider/${selectedItem.id}/review`,
        EXPENSE: `/approvals/expense/${selectedItem.id}/review`,
        PROFIT_REQUEST: `/approvals/profit-request/${selectedItem.id}/review`,
      };

      await api.post(routeMap[selectedItem.type], {
        action,
        reason,
      });

      await loadApprovals();
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} approval`, error);
    } finally {
      setBusyId(null);
    }
  };

  const completePayout = async () => {
    if (!selectedItem || selectedItem.type !== "WITHDRAWAL") return;

    try {
      setBusyId(selectedItem.id);

      await api.post(`/wallet/withdraw/${selectedItem.id}/complete`, {});

      await loadApprovals();
    } catch (error: any) {
      console.error("Failed to complete payout", error);
      window.alert(
        error?.response?.data?.message || "Failed to complete payout.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const processPayout = async () => {
    if (!selectedItem || selectedItem.type !== "WITHDRAWAL") return;

    try {
      setBusyId(selectedItem.id);
      await api.post(`/wallet/withdraw/${selectedItem.id}/process`);
      await loadApprovals();
    } catch (error: any) {
      console.error("Failed to mark payout as processing", error);
      window.alert(
        error?.response?.data?.message || "Failed to mark payout as processing.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const failPayout = async () => {
    if (!selectedItem || selectedItem.type !== "WITHDRAWAL") return;

    try {
      setBusyId(selectedItem.id);

      const reason = window.prompt("Enter failure reason") || undefined;

      await api.post(`/wallet/withdraw/${selectedItem.id}/fail`, {
        reason,
      });

      await loadApprovals();
    } catch (error: any) {
      console.error("Failed to fail payout", error);
      window.alert(error?.response?.data?.message || "Failed to fail payout.");
    } finally {
      setBusyId(null);
    }
  };

  const selectedWithdrawalStatus =
    selectedItem?.type === "WITHDRAWAL"
      ? String(selectedItem.status || "").toUpperCase()
      : "";

  return (
    <div className="approvals-page-shell">
      <section className="approvals-hero">
        <div className="approvals-hero-copy">
          <p className="approvals-label">ADMIN APPROVALS</p>
          <h1>
            Review platform approvals across KYC, providers, expenses, profit
            requests, and withdrawals
          </h1>
          <p className="approvals-sub">
            A centralized workspace for processing sensitive approval queues and
            keeping operational control across the platform.
          </p>

          <div className="approvals-tags">
            <span>KYC review</span>
            <span>Provider verification</span>
            <span>Expense approval</span>
            <span>Profit governance</span>
            <span>Withdrawals</span>
          </div>
        </div>

        <div className="approvals-hero-metrics">
          <div className="approvals-metric-card main">
            <span>Total Pending</span>
            <h2>{summary?.totalPending ?? 0}</h2>
          </div>
          <div className="approvals-metric-card">
            <span>KYC</span>
            <h3>{summary?.pendingKyc ?? 0}</h3>
          </div>
          <div className="approvals-metric-card">
            <span>Providers</span>
            <h3>{summary?.pendingProviders ?? 0}</h3>
          </div>
          <div className="approvals-metric-card">
            <span>Withdrawals</span>
            <h3>{summary?.pendingWithdrawals ?? 0}</h3>
          </div>
        </div>
      </section>

      <section className="approvals-summary-strip">
        <div className="approvals-summary-card">
          <span>Expenses</span>
          <strong>{summary?.submittedExpenses ?? 0}</strong>
        </div>
        <div className="approvals-summary-card">
          <span>Profit Requests</span>
          <strong>{summary?.pendingProfitRequests ?? 0}</strong>
        </div>
        <div className="approvals-summary-card">
          <span>Queue Visible</span>
          <strong>{filteredQueue.length}</strong>
        </div>
        <div className="approvals-summary-card">
          <span>Status</span>
          <strong>{loading ? "Loading" : "Live"}</strong>
        </div>
      </section>

      <section className="approvals-main-grid">
        <div className="approvals-left-panel">
          <div className="approvals-panel">
            <div className="approvals-panel-head">
              <div>
                <h2>Approval Queue</h2>
                <p>Review pending and processed approval records</p>
              </div>
              <span className="approvals-count-chip">
                {loading ? "Loading..." : `${filteredQueue.length} visible`}
              </span>
            </div>

            <div className="approvals-toolbar">
              <div className="approvals-toolbar-row">
                <select
                  className="approvals-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All approvals</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                  <option value="KYC">KYC</option>
                  <option value="PROVIDER">Providers</option>
                  <option value="EXPENSE">Expenses</option>
                  <option value="PROFIT_REQUEST">Profit Requests</option>
                </select>
              </div>

              <input
                className="approvals-search"
                placeholder="Search title, contact, or metadata..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="approvals-list">
              {loading ? (
                <div className="approvals-empty">Loading approvals...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="approvals-empty">No approvals found.</div>
              ) : (
                filteredQueue.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={`approvals-record-card ${
                      selectedItem?.id === item.id ? "active" : ""
                    }`}
                    onClick={() => setSelected(item)}
                  >
                    <div className="approvals-record-top">
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.subtitle}</p>
                      </div>
                      <span
                        className={`approvals-badge ${getStatusTone(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="approvals-record-meta">
                      <span>{item.type.replace("_", " ")}</span>
                      <span>{item.meta}</span>
                    </div>

                    <div className="approvals-record-bottom">
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="approvals-right-panel">
          <div className="approvals-panel detail">
            {!selectedItem ? (
              <div className="approvals-empty detail">
                Select an approval record to inspect details.
              </div>
            ) : (
              <>
                <div className="approvals-detail-hero">
                  <div>
                    <div className="approvals-detail-badges">
                      <span className="approvals-type-pill">
                        {selectedItem.type.replace("_", " ")}
                      </span>
                      <span
                        className={`approvals-badge ${getStatusTone(
                          selectedItem.status,
                        )}`}
                      >
                        {selectedItem.status}
                      </span>
                    </div>

                    <h2>{selectedItem.title}</h2>
                    <p>{selectedItem.subtitle}</p>
                  </div>

                  <div
                    className={`approvals-status-box ${getStatusTone(
                      selectedItem.status,
                    )}`}
                  >
                    <span>Status</span>
                    <strong>{selectedItem.status}</strong>
                  </div>
                </div>

                <div className="approvals-detail-grid">
                  <div className="approvals-detail-card full">
                    <span>Approval Metadata</span>
                    <p>{selectedItem.meta}</p>
                  </div>

                  <div className="approvals-detail-card">
                    <span>Type</span>
                    <p>{selectedItem.type.replace("_", " ")}</p>
                  </div>

                  <div className="approvals-detail-card">
                    <span>Updated</span>
                    <p>{formatDate(selectedItem.updatedAt)}</p>
                  </div>

                  {selectedItem.type === "WITHDRAWAL" && (
                    <>
                      <div className="approvals-detail-card full">
                        <span>Withdrawal Amount</span>
                        <p>
                          {formatMoney(Number(selectedItem.raw?.amount || 0))}
                        </p>
                      </div>

                      <div className="approvals-detail-card">
                        <span>Method</span>
                        <p>
                          {String(selectedItem.raw?.method || "—").replace(
                            "_",
                            " ",
                          )}
                        </p>
                      </div>

                      <div className="approvals-detail-card">
                        <span>Destination</span>
                        <p>{getWithdrawalDestination(selectedItem.raw)}</p>
                      </div>

                      {selectedItem.raw?.payoutReference && (
                        <div className="approvals-detail-card full">
                          <span>Payout Reference</span>
                          <p>{selectedItem.raw.payoutReference}</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="approvals-detail-card full">
                    <span>Raw Detail Snapshot</span>
                    <pre className="approvals-json-block">
                      {JSON.stringify(selectedItem.raw, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="approvals-actions">
                  {selectedItem.type === "WITHDRAWAL" ? (
                    <>
                      {selectedWithdrawalStatus === "PENDING" && (
                        <>
                          <button
                            className="approvals-btn approve"
                            disabled={busyId === selectedItem.id}
                            onClick={() => review("APPROVE")}
                          >
                            {busyId === selectedItem.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            className="approvals-btn reject"
                            disabled={busyId === selectedItem.id}
                            onClick={() => review("REJECT")}
                          >
                            {busyId === selectedItem.id
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        </>
                      )}

                      {selectedWithdrawalStatus === "APPROVED" && (
                        <>
                          <button
                            className="approvals-btn approve"
                            disabled={busyId === selectedItem.id}
                            onClick={completePayout}
                          >
                            {busyId === selectedItem.id
                              ? "Completing..."
                              : "Complete Payout"}
                          </button>

                          <button
                            className="approvals-btn reject"
                            disabled={busyId === selectedItem.id}
                            onClick={processPayout}
                          >
                            Mark Processing
                          </button>
                        </>
                      )}

                      {selectedWithdrawalStatus === "PROCESSING" && (
                        <>
                          <button
                            className="approvals-btn approve"
                            disabled={busyId === selectedItem.id}
                            onClick={completePayout}
                          >
                            {busyId === selectedItem.id
                              ? "Completing..."
                              : "Complete Payout"}
                          </button>

                          <button
                            className="approvals-btn reject"
                            disabled={busyId === selectedItem.id}
                            onClick={failPayout}
                          >
                            Mark Failed
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="approvals-btn approve"
                        disabled={busyId === selectedItem.id}
                        onClick={() => review("APPROVE")}
                      >
                        {busyId === selectedItem.id ? "Processing..." : "Approve"}
                      </button>

                      <button
                        className="approvals-btn reject"
                        disabled={busyId === selectedItem.id}
                        onClick={() => review("REJECT")}
                      >
                        {busyId === selectedItem.id ? "Processing..." : "Reject"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}