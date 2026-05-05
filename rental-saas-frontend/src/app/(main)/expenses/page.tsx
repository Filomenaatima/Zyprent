"use client";

import "@/styles/expenses.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

type ExpenseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PAID"
  | "REJECTED";

type ExpenseCategory =
  | "MAINTENANCE"
  | "UTILITIES"
  | "SECURITY"
  | "CLEANING"
  | "STAFF"
  | "REPAIRS"
  | "TAX"
  | "INSURANCE"
  | "MARKETING"
  | "LEGAL"
  | "SUPPLIES"
  | "OTHER";

type PropertyItem = {
  id: string;
  title: string;
  location?: string | null;
};

type ExpenseItem = {
  id: string;
  propertyId: string;
  unitId: string | null;
  maintenanceRequestId: string | null;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  vendorName: string | null;
  receiptUrl: string | null;
  notes: string | null;
  paymentReference: string | null;
  rejectionReason: string | null;
  status: ExpenseStatus;
  isAboveApprovalThreshold: boolean;
  autoApproved: boolean;
  expenseDate: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    location: string | null;
    ownerId?: string | null;
    managerId?: string | null;
    expenseApprovalThreshold?: number;
    autoApproveSmallExpenses?: boolean;
  } | null;
  unit?: {
    id: string;
    number: string;
  } | null;
  maintenanceRequest?: {
    id: string;
    title: string;
    status: string;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  reviewedBy?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type SummaryResponse = {
  totalCount: number;
  totalExpenses: number;
  submittedAmount?: number;
  approvedAmount?: number;
  paidAmount?: number;
  pendingApprovalAmount?: number;
  draftAmount?: number;
  rejectedAmount?: number;
};

type ProfileResponse = {
  id?: string;
  role?: UserRole;
  name?: string;
  email?: string;
};

type FilterKey =
  | "all"
  | "draft"
  | "submitted"
  | "approved"
  | "paid"
  | "rejected";

const categoryOptions: ExpenseCategory[] = [
  "MAINTENANCE",
  "UTILITIES",
  "SECURITY",
  "CLEANING",
  "STAFF",
  "REPAIRS",
  "TAX",
  "INSURANCE",
  "MARKETING",
  "LEGAL",
  "SUPPLIES",
  "OTHER",
];

const expenseStatusPriority: Record<ExpenseStatus, number> = {
  SUBMITTED: 1,
  APPROVED: 2,
  DRAFT: 3,
  PAID: 4,
  REJECTED: 5,
};

function formatCurrency(
  value: number | string | null | undefined,
  currency = "UGX",
) {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatusLabel(status: ExpenseStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "APPROVED":
      return "Approved";
    case "PAID":
      return "Paid";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

function formatCategoryLabel(category: ExpenseCategory) {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function getStatusTone(status: ExpenseStatus) {
  switch (status) {
    case "DRAFT":
      return "slate";
    case "SUBMITTED":
      return "amber";
    case "APPROVED":
      return "blue";
    case "PAID":
      return "success";
    case "REJECTED":
      return "rose";
    default:
      return "neutral";
  }
}

function getFilterStatus(key: FilterKey): ExpenseStatus | undefined {
  switch (key) {
    case "draft":
      return "DRAFT";
    case "submitted":
      return "SUBMITTED";
    case "approved":
      return "APPROVED";
    case "paid":
      return "PAID";
    case "rejected":
      return "REJECTED";
    default:
      return undefined;
  }
}

function getPersonLabel(
  user?: {
    name: string | null;
    email: string | null;
  } | null,
  fallback = "System",
) {
  return user?.name || user?.email || fallback;
}

function getExpenseWorkflowLabel(expense: ExpenseItem, role: UserRole | null) {
  if (expense.status === "PAID") {
    return expense.category === "MAINTENANCE"
      ? "Property-funded maintenance has been settled"
      : "Expense has been settled";
  }

  if (expense.status === "APPROVED") {
    if (role === "ADMIN") {
      return "Approved and ready for platform-level settlement";
    }

    if (role === "MANAGER") {
      return expense.category === "MAINTENANCE"
        ? "Approved maintenance expense ready for property-side payment"
        : "Approved expense ready for settlement";
    }

    return expense.category === "MAINTENANCE"
      ? "Approved and ready for property-side payment"
      : "Approved and ready for settlement";
  }

  if (expense.status === "SUBMITTED") {
    if (role === "ADMIN") {
      return "Submitted and waiting for admin or investor review";
    }

    if (role === "MANAGER") {
      return expense.isAboveApprovalThreshold
        ? "Awaiting investor approval"
        : "Submitted for review";
    }

    return expense.isAboveApprovalThreshold
      ? "Waiting for investor approval"
      : "Submitted for review";
  }

  if (expense.status === "REJECTED") {
    return "Rejected and waiting for revision";
  }

  return "Draft expense waiting for submission";
}

function sortExpenses(rows: ExpenseItem[]) {
  return [...rows].sort((a, b) => {
    const statusDiff =
      expenseStatusPriority[a.status] - expenseStatusPriority[b.status];

    if (statusDiff !== 0) return statusDiff;

    const aDate = new Date(a.expenseDate || a.createdAt).getTime();
    const bDate = new Date(b.expenseDate || b.createdAt).getTime();

    return bDate - aDate;
  });
}

export default function ExpensesPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [properties, setProperties] = useState<PropertyItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    maintenanceRequestId: "",
    title: "",
    description: "",
    category: "MAINTENANCE" as ExpenseCategory,
    amount: "",
    currency: "UGX",
    vendorName: "",
    receiptUrl: "",
    notes: "",
    expenseDate: "",
  });

  const [reviewForm, setReviewForm] = useState({
    rejectionReason: "",
  });

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isInvestor = role === "INVESTOR";

  useEffect(() => {
    let mounted = true;

    async function loadProfileAndProperties() {
      try {
        const profileRes = await api.get<ProfileResponse>("/auth/profile");
        const userRole = profileRes.data?.role ?? null;

        if (!mounted) return;
        setRole(userRole);

        if (userRole === "MANAGER") {
          const propertyRes = await api.get<any[]>("/properties/manager/me");
          if (!mounted) return;

          const mappedProperties = (propertyRes.data ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            location: item.location ?? null,
          }));

          setProperties(mappedProperties);
          setForm((current) => ({
            ...current,
            propertyId: current.propertyId || mappedProperties[0]?.id || "",
          }));
          return;
        }

        if (userRole === "INVESTOR") {
          const propertyRes = await api.get<any[]>("/properties/investor/me");
          if (!mounted) return;

          const mappedProperties = (propertyRes.data ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            location: item.location ?? null,
          }));

          setProperties(mappedProperties);
          return;
        }

        if (userRole === "ADMIN") {
          const propertyRes = await api.get<any[]>("/properties");
          if (!mounted) return;

          const mappedProperties = (propertyRes.data ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            location: item.location ?? null,
          }));

          setProperties(mappedProperties);
          setForm((current) => ({
            ...current,
            propertyId: current.propertyId || mappedProperties[0]?.id || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load expense page context", error);
      }
    }

    loadProfileAndProperties();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadExpenses() {
    if (!role) return;

    try {
      setLoading(true);

      const status = getFilterStatus(activeFilter);
      const params: Record<string, string> = {};

      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (selectedCategory) params.category = selectedCategory;
      if (status) params.status = status;

      let basePath = "";
      let summaryPath = "";

      if (isAdmin) {
        basePath = "/expenses";
        summaryPath = "/expenses/admin/summary";
      } else if (isManager) {
        basePath = "/expenses/manager/me";
        summaryPath = "/expenses/manager/me/summary";
      } else if (isInvestor) {
        basePath = "/expenses/investor/me";
        summaryPath = "/expenses/investor/me/summary";
      } else {
        setExpenses([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      const [expenseRes, summaryRes] = await Promise.all([
        api.get<ExpenseItem[]>(basePath, { params }),
        api.get<SummaryResponse>(summaryPath),
      ]);

      const rows = sortExpenses(expenseRes.data ?? []);

      setExpenses(rows);
      setSummary(summaryRes.data ?? null);

      const visibleSelected =
        rows.find((item) => item.id === selectedExpenseId) || rows[0] || null;

      setSelectedExpenseId(visibleSelected?.id ?? null);
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeFilter, selectedPropertyId, selectedCategory]);

  const filteredExpenses = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sortedRows = sortExpenses(expenses);

    if (!term) return sortedRows;

    return sortedRows.filter((item) => {
      const text = [
        item.title,
        item.description,
        item.category,
        item.status,
        item.vendorName,
        item.property?.title,
        item.property?.location,
        item.unit?.number,
        item.notes,
        item.paymentReference,
        item.maintenanceRequest?.title,
        item.maintenanceRequest?.status,
        item.createdBy?.name,
        item.createdBy?.email,
        item.reviewedBy?.name,
        item.reviewedBy?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [expenses, search]);

  const selectedExpense =
    filteredExpenses.find((item) => item.id === selectedExpenseId) ||
    expenses.find((item) => item.id === selectedExpenseId) ||
    filteredExpenses[0] ||
    null;

  const canCreate = isManager || isAdmin;
  const canReview = isInvestor || isAdmin;
  const canMarkPaid = isInvestor || isAdmin || isManager;

  const dashboardSummary = useMemo(() => {
    const awaitingReview =
      summary?.pendingApprovalAmount ?? summary?.submittedAmount ?? 0;

    const paid = summary?.paidAmount ?? 0;

    const maintenanceCount = expenses.filter(
      (item) => item.category === "MAINTENANCE",
    ).length;

    const propertyPaymentReady = expenses
      .filter((item) => item.status === "APPROVED")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalCount: summary?.totalCount ?? 0,
      totalValue: summary?.totalExpenses ?? 0,
      awaitingReview,
      paid,
      maintenanceCount,
      propertyPaymentReady,
      draftAmount: summary?.draftAmount ?? 0,
      rejectedAmount: summary?.rejectedAmount ?? 0,
    };
  }, [summary, expenses]);

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();

    if (!form.propertyId || !form.title || !form.amount) return;

    try {
      setBusyAction("create");

      await api.post("/expenses", {
        propertyId: form.propertyId,
        unitId: form.unitId || undefined,
        maintenanceRequestId: form.maintenanceRequestId || undefined,
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        amount: Number(form.amount),
        currency: form.currency || "UGX",
        vendorName: form.vendorName || undefined,
        receiptUrl: form.receiptUrl || undefined,
        notes: form.notes || undefined,
        expenseDate: form.expenseDate || undefined,
      });

      setForm((current) => ({
        ...current,
        unitId: "",
        maintenanceRequestId: "",
        title: "",
        description: "",
        amount: "",
        vendorName: "",
        receiptUrl: "",
        notes: "",
        expenseDate: "",
      }));

      await loadExpenses();
    } catch (error) {
      console.error("Failed to create expense", error);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSubmitExpense(expenseId: string) {
    try {
      setBusyAction(`submit-${expenseId}`);
      await api.post(`/expenses/${expenseId}/submit`);
      await loadExpenses();
    } catch (error) {
      console.error("Failed to submit expense", error);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleApproveExpense(expenseId: string) {
    try {
      setBusyAction(`approve-${expenseId}`);
      await api.post(`/expenses/${expenseId}/review`, {
        action: "APPROVE",
      });
      await loadExpenses();
    } catch (error) {
      console.error("Failed to approve expense", error);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRejectExpense(expenseId: string) {
    try {
      setBusyAction(`reject-${expenseId}`);
      await api.post(`/expenses/${expenseId}/review`, {
        action: "REJECT",
        rejectionReason: reviewForm.rejectionReason || "Not approved",
      });
      setReviewForm({ rejectionReason: "" });
      await loadExpenses();
    } catch (error) {
      console.error("Failed to reject expense", error);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleMarkPaid(expenseId: string) {
    try {
      setBusyAction(`paid-${expenseId}`);
      await api.post(`/expenses/${expenseId}/mark-paid`, {
        paymentReference: `EXP-${Date.now()}`,
      });
      await loadExpenses();
    } catch (error) {
      console.error("Failed to mark expense paid", error);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="expenses-shell">
      <section className="expenses-hero">
        <div className="expenses-hero-copy">
          <p className="expenses-eyebrow">
            {isAdmin
              ? "Admin Expense Control Center"
              : isManager
                ? "Manager Expense Control Center"
                : "Investor Expense Control Center"}
          </p>
          <h1 className="expenses-title">
            {isAdmin
              ? "Monitor expense creation, review, approval pressure, and settlement across the platform"
              : isManager
                ? "Track operational costs, submissions, and expense workflow across your managed properties"
                : "Review, approve, and settle property expenses across your portfolio"}
          </h1>
          <p className="expenses-text">
            {isAdmin
              ? "See all property expenses in one workspace, keep visibility on draft, submitted, approved, rejected, and paid items, and intervene when platform-level finance oversight is needed."
              : isManager
                ? "Managers create and submit expenses, monitor operational cost flow, and keep maintenance-linked property expenses moving through review."
                : "Investors review property-side costs, approve operational spend, and make the final settlement decision for approved expenses."}
          </p>

          <div className="expenses-tags">
            <span className="expenses-tag">
              {isAdmin ? "Platform visibility" : "Threshold approvals"}
            </span>
            <span className="expenses-tag">Property-funded maintenance</span>
            <span className="expenses-tag">
              {isAdmin ? "Admin intervention" : "Settlement control"}
            </span>
            <span className="expenses-tag">Paid expense tracking</span>
          </div>
        </div>

        <div className="expenses-hero-grid">
          <div className="expenses-stat-card dark">
            <span>Total Expenses</span>
            <strong>{dashboardSummary.totalCount}</strong>
          </div>
          <div className="expenses-stat-card">
            <span>Total Value</span>
            <strong>{formatCurrency(dashboardSummary.totalValue)}</strong>
          </div>
          <div className="expenses-stat-card">
            <span>Awaiting Review</span>
            <strong>{formatCurrency(dashboardSummary.awaitingReview)}</strong>
          </div>
          <div className="expenses-stat-card">
            <span>Paid</span>
            <strong>{formatCurrency(dashboardSummary.paid)}</strong>
          </div>
        </div>
      </section>

      <section className="expenses-toolbar">
        <div className="expenses-filter-row">
          {[
            ["all", "All"],
            ["draft", "Draft"],
            ["submitted", "Submitted"],
            ["approved", "Approved"],
            ["paid", "Paid"],
            ["rejected", "Rejected"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`expenses-filter-pill ${
                activeFilter === key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(key as FilterKey)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="expenses-toolbar-right">
          <select
            className="expenses-input compact"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>

          <select
            className="expenses-input compact"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {formatCategoryLabel(category)}
              </option>
            ))}
          </select>

          <input
            className="expenses-input search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
          />
        </div>
      </section>

      <section className="expenses-workspace">
        <div className="expenses-left-panel">
          {canCreate && (
            <div className="expenses-form-card">
              <div className="expenses-section-head">
                <h3>Create Expense</h3>
                <span>
                  {isAdmin
                    ? "Admin workflow"
                    : isManager
                      ? "Manager workflow"
                      : "Expense workflow"}
                </span>
              </div>

              <form className="expenses-form-grid" onSubmit={handleCreateExpense}>
                <select
                  className="expenses-input"
                  value={form.propertyId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      propertyId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>

                <input
                  className="expenses-input"
                  placeholder="Expense title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  required
                />

                <select
                  className="expenses-input"
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category: e.target.value as ExpenseCategory,
                    }))
                  }
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </option>
                  ))}
                </select>

                <input
                  className="expenses-input"
                  placeholder="Amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  required
                />

                <input
                  className="expenses-input"
                  placeholder={
                    form.category === "MAINTENANCE"
                      ? "Service provider / contractor name"
                      : "Vendor name"
                  }
                  value={form.vendorName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      vendorName: e.target.value,
                    }))
                  }
                />

                <input
                  className="expenses-input"
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      expenseDate: e.target.value,
                    }))
                  }
                />

                <textarea
                  className="expenses-textarea"
                  placeholder="Description / notes"
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                />

                <input
                  className="expenses-input"
                  placeholder="Receipt URL"
                  value={form.receiptUrl}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      receiptUrl: e.target.value,
                    }))
                  }
                />

                <button
                  type="submit"
                  className="expenses-primary-btn"
                  disabled={busyAction === "create"}
                >
                  {busyAction === "create" ? "Creating..." : "Create Expense"}
                </button>
              </form>
            </div>
          )}

          <div className="expenses-list-card">
            <div className="expenses-section-head">
              <h3>Expense Queue</h3>
              <span>
                {loading ? "Loading..." : `${filteredExpenses.length} items`}
              </span>
            </div>

            {loading ? (
              <div className="expenses-empty">Loading expenses...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="expenses-empty">No expenses found.</div>
            ) : (
              <div className="expenses-list">
                {filteredExpenses.map((expense) => (
                  <button
                    key={expense.id}
                    type="button"
                    className={`expenses-list-item ${
                      selectedExpense?.id === expense.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedExpenseId(expense.id)}
                  >
                    <div className="expenses-list-top">
                      <div className="expenses-detail-topline">
                        <span
                          className={`expenses-badge ${getStatusTone(
                            expense.status,
                          )}`}
                        >
                          {formatStatusLabel(expense.status)}
                        </span>

                        {expense.category === "MAINTENANCE" && (
                          <span className="expenses-badge blue">
                            Maintenance
                          </span>
                        )}
                      </div>

                      <span className="expenses-list-date">
                        {formatDate(expense.expenseDate)}
                      </span>
                    </div>

                    <h4>{expense.title}</h4>

                    <p>
                      {expense.property?.title || "Property"} •{" "}
                      {formatCategoryLabel(expense.category)}
                    </p>

                    <div className="expenses-list-bottom">
                      <span>{expense.vendorName || "No vendor"}</span>
                      <strong>
                        {formatCurrency(expense.amount, expense.currency)}
                      </strong>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="expenses-right-panel">
          {!selectedExpense ? (
            <div className="expenses-empty detail">
              Select an expense to view and act on it.
            </div>
          ) : (
            <>
              <div className="expenses-detail-hero">
                <div>
                  <div className="expenses-detail-topline">
                    <span
                      className={`expenses-badge ${getStatusTone(
                        selectedExpense.status,
                      )}`}
                    >
                      {formatStatusLabel(selectedExpense.status)}
                    </span>

                    <span className="expenses-badge subtle">
                      {formatCategoryLabel(selectedExpense.category)}
                    </span>

                    {selectedExpense.category === "MAINTENANCE" && (
                      <span className="expenses-badge blue">
                        Maintenance linked
                      </span>
                    )}

                    {selectedExpense.isAboveApprovalThreshold && (
                      <span className="expenses-badge rose">
                        Above threshold
                      </span>
                    )}

                    {selectedExpense.autoApproved && (
                      <span className="expenses-badge success">
                        Auto approved
                      </span>
                    )}
                  </div>

                  <h2 className="expenses-detail-title">
                    {selectedExpense.title}
                  </h2>
                  <p className="expenses-detail-subtitle">
                    {selectedExpense.property?.title || "Property"} •{" "}
                    {selectedExpense.property?.location || "No location"}
                    {selectedExpense.unit?.number
                      ? ` • Unit ${selectedExpense.unit.number}`
                      : ""}
                  </p>
                </div>

                <div className="expenses-amount-box">
                  <span>Expense Amount</span>
                  <strong>
                    {formatCurrency(
                      selectedExpense.amount,
                      selectedExpense.currency,
                    )}
                  </strong>
                </div>
              </div>

              <section className="expenses-detail-section">
                <div className="expenses-section-head">
                  <h3>Details</h3>
                  <span>Operational metadata</span>
                </div>

                <div className="expenses-info-grid">
                  <div className="expenses-info-card">
                    <span>Vendor</span>
                    <strong>
                      {selectedExpense.vendorName || "Not provided"}
                    </strong>
                  </div>

                  <div className="expenses-info-card">
                    <span>Expense Date</span>
                    <strong>{formatDate(selectedExpense.expenseDate)}</strong>
                  </div>

                  <div className="expenses-info-card">
                    <span>Payment Reference</span>
                    <strong>
                      {selectedExpense.paymentReference || "Not set"}
                    </strong>
                  </div>

                  <div className="expenses-info-card">
                    <span>Created By</span>
                    <strong>
                      {getPersonLabel(selectedExpense.createdBy, "System")}
                    </strong>
                  </div>

                  <div className="expenses-info-card">
                    <span>Reviewed By</span>
                    <strong>
                      {getPersonLabel(
                        selectedExpense.reviewedBy,
                        "Not reviewed",
                      )}
                    </strong>
                  </div>

                  <div className="expenses-info-card">
                    <span>Property Threshold</span>
                    <strong>
                      {formatCurrency(
                        selectedExpense.property?.expenseApprovalThreshold ?? 0,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="expenses-description-card">
                  <p>
                    {selectedExpense.description ||
                      selectedExpense.notes ||
                      "No description or notes provided."}
                  </p>
                  {selectedExpense.description && selectedExpense.notes && (
                    <small>Notes: {selectedExpense.notes}</small>
                  )}
                </div>

                {selectedExpense.maintenanceRequest && (
                  <div className="expenses-description-card">
                    <p>
                      This expense is linked to maintenance request:{" "}
                      <strong>{selectedExpense.maintenanceRequest.title}</strong>
                    </p>
                    <small>
                      Maintenance status:{" "}
                      {selectedExpense.maintenanceRequest.status}
                    </small>
                  </div>
                )}

                {selectedExpense.receiptUrl && (
                  <div className="expenses-description-card">
                    <p>
                      Receipt:{" "}
                      <a
                        href={selectedExpense.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open receipt
                      </a>
                    </p>
                  </div>
                )}
              </section>

              <section className="expenses-detail-section">
                <div className="expenses-section-head">
                  <h3>Workflow</h3>
                  <span>{getExpenseWorkflowLabel(selectedExpense, role)}</span>
                </div>

                <div className="expenses-action-grid">
                  {canCreate && selectedExpense.status === "DRAFT" && (
                    <button
                      type="button"
                      className="expenses-primary-btn"
                      onClick={() => handleSubmitExpense(selectedExpense.id)}
                      disabled={busyAction === `submit-${selectedExpense.id}`}
                    >
                      {busyAction === `submit-${selectedExpense.id}`
                        ? "Submitting..."
                        : "Submit Expense"}
                    </button>
                  )}

                  {canReview && selectedExpense.status === "SUBMITTED" && (
                    <>
                      <button
                        type="button"
                        className="expenses-primary-btn"
                        onClick={() => handleApproveExpense(selectedExpense.id)}
                        disabled={busyAction === `approve-${selectedExpense.id}`}
                      >
                        {busyAction === `approve-${selectedExpense.id}`
                          ? "Approving..."
                          : selectedExpense.category === "MAINTENANCE"
                            ? isAdmin
                              ? "Approve Maintenance"
                              : "Approve Property Maintenance"
                            : "Approve Expense"}
                      </button>

                      <div className="expenses-review-box">
                        <input
                          className="expenses-input"
                          placeholder="Rejection reason"
                          value={reviewForm.rejectionReason}
                          onChange={(e) =>
                            setReviewForm({
                              rejectionReason: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="expenses-secondary-btn danger"
                          onClick={() => handleRejectExpense(selectedExpense.id)}
                          disabled={busyAction === `reject-${selectedExpense.id}`}
                        >
                          {busyAction === `reject-${selectedExpense.id}`
                            ? "Rejecting..."
                            : "Reject Expense"}
                        </button>
                      </div>
                    </>
                  )}

                  {canMarkPaid && selectedExpense.status === "APPROVED" && (
                    <button
                      type="button"
                      className="expenses-secondary-btn"
                      onClick={() => handleMarkPaid(selectedExpense.id)}
                      disabled={busyAction === `paid-${selectedExpense.id}`}
                    >
                      {busyAction === `paid-${selectedExpense.id}`
                        ? "Marking..."
                        : selectedExpense.category === "MAINTENANCE"
                          ? "Pay Property Maintenance"
                          : "Mark Paid"}
                    </button>
                  )}

                  {selectedExpense.status !== "DRAFT" &&
                    selectedExpense.status !== "SUBMITTED" &&
                    selectedExpense.status !== "APPROVED" && (
                      <div className="expenses-empty">
                        No action is required for this expense.
                      </div>
                    )}
                </div>
              </section>

              <section className="expenses-detail-section">
                <div className="expenses-section-head">
                  <h3>Timestamps</h3>
                  <span>Audit trail</span>
                </div>

                <div className="expenses-info-grid">
                  <div className="expenses-info-card">
                    <span>Created At</span>
                    <strong>{formatDateTime(selectedExpense.createdAt)}</strong>
                  </div>
                  <div className="expenses-info-card">
                    <span>Submitted At</span>
                    <strong>
                      {formatDateTime(selectedExpense.submittedAt)}
                    </strong>
                  </div>
                  <div className="expenses-info-card">
                    <span>Reviewed At</span>
                    <strong>{formatDateTime(selectedExpense.reviewedAt)}</strong>
                  </div>
                  <div className="expenses-info-card">
                    <span>Paid At</span>
                    <strong>{formatDateTime(selectedExpense.paidAt)}</strong>
                  </div>
                </div>

                {selectedExpense.rejectionReason && (
                  <div className="expenses-rejection-card">
                    Rejection reason: {selectedExpense.rejectionReason}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}