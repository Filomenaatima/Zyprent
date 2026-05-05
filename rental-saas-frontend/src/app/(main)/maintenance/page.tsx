"use client";

import "@/styles/maintenance.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type Role =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER"
  | null;

type MaintenanceStatus =
  | "PENDING"
  | "ASSIGNED"
  | "INSPECTION_REQUIRED"
  | "QUOTED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
type PaymentResponsibility = "PROPERTY" | "RESIDENT" | "SHARED" | null;
type QuoteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
type DispatchStatus = "SENT" | "VIEWED" | "QUOTED" | "DECLINED";
type PaymentMethod = "WALLET" | "MOBILE_MONEY" | "BANK" | "CARD";
type ExpenseStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED";

type MaintenanceRequestItem = {
  id: string;
  propertyId: string | null;
  unitId: string | null;
  residentId: string | null;
  title: string;
  description: string;
  category: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  requiresInspection: boolean;
  assignedProviderId: string | null;
  estimatedCost: number | null;
  paymentResponsibility: PaymentResponsibility;
  paidByUserId: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  propertyShare: number | null;
  residentShare: number | null;
  inspectionScheduledAt: string | null;
  workScheduledAt: string | null;
  workCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    location: string | null;
  } | null;
  unit?: {
    id: string;
    number: string;
  } | null;
  resident?: {
    id: string;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      phone?: string | null;
    } | null;
  } | null;
  assignedProvider?: {
    id: string;
    companyName: string | null;
    type: string;
    rating: number | null;
    verificationStatus?: string | null;
    user?: {
      id: string;
      name: string | null;
      email: string | null;
      phone?: string | null;
    } | null;
  } | null;
  photos?: {
    id: string;
    url: string;
    createdAt?: string;
  }[];
  quotes?: {
    id: string;
    providerId: string;
    totalAmount: number;
    laborCost: number | null;
    materialsCost: number | null;
    estimatedDurationHours: number | null;
    notes: string | null;
    status: QuoteStatus;
    createdAt: string;
    acceptedAt: string | null;
    items?: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    provider?: {
      id: string;
      companyName: string | null;
      type: string;
      rating: number | null;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
      } | null;
    } | null;
  }[];
  dispatches?: {
    id: string;
    providerId: string;
    status: DispatchStatus;
    sentAt: string;
    viewedAt: string | null;
    respondedAt: string | null;
    provider?: {
      id: string;
      companyName: string | null;
      type: string;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
      } | null;
    } | null;
  }[];
  expenses?: {
    id: string;
    title: string;
    amount: number;
    status: ExpenseStatus;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
  }[];
  payouts?: {
    id: string;
    totalAmount: number;
    platformFee: number;
    providerEarning: number;
    status: PayoutStatus;
    createdAt: string;
    paidAt?: string | null;
    paymentReference?: string | null;
    provider?: {
      id: string;
      companyName: string | null;
      type?: string | null;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
      } | null;
    } | null;
  }[];
  reviews?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    residentId?: string;
  }[];
};

type ProviderItem = {
  id: string;
  type: string;
  companyName: string | null;
  city: string | null;
  rating: number | null;
  reviewCount?: number;
  verificationStatus: string;
  isActive: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

type ProviderDispatchItem = {
  id: string;
  status: DispatchStatus;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  request?: MaintenanceRequestItem | null;
};

type ProviderQuoteItem = {
  id: string;
  totalAmount: number;
  laborCost: number | null;
  materialsCost: number | null;
  estimatedDurationHours: number | null;
  notes: string | null;
  status: QuoteStatus;
  createdAt: string;
  acceptedAt?: string | null;
  request?: MaintenanceRequestItem | null;
};

type ProviderPayoutItem = {
  id: string;
  totalAmount: number;
  platformFee: number;
  providerEarning: number;
  status: PayoutStatus;
  createdAt: string;
  request?: {
    id: string;
    title: string;
    property?: { title: string } | null;
    unit?: { number: string } | null;
  } | null;
};

type WalletResponse = {
  balance?: number;
};

type PlatformAnalytics = {
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  inProgressRequests: number;
  statusCounts: Record<string, number>;
  avgCompletionHours: number;
  quoteCount: number;
  acceptedQuoteCount: number;
  quoteAcceptanceRate: number;
  dispatchCount: number;
  acceptedDispatchCount: number;
  completedPayoutCount: number;
  pendingPayoutCount: number;
  totalPayoutAmount: number;
  totalProviderEarning: number;
  totalPlatformFee: number;
  linkedExpenseAmount: number;
  avgRating: number;
  propertyBreakdown: {
    propertyId: string;
    propertyTitle: string;
    location: string | null;
    totalRequests: number;
    openRequests: number;
    completedRequests: number;
    totalEstimatedCost: number;
    completionRate: number;
  }[];
  topProviders: {
    providerId: string;
    providerName: string;
    jobs: number;
    completedPayouts: number;
    avgRating: number;
  }[];
};

type CreateRequestForm = {
  category: string;
  priority: MaintenancePriority;
  title: string;
  description: string;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0);
}

function formatCurrency(value: number | string | null | undefined) {
  const amount = toNumber(value);

  if (!Number.isFinite(amount)) {
    return "UGX 0";
  }

  return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
}


function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatusLabel(status: MaintenanceStatus) {
  switch (status) {
    case "INSPECTION_REQUIRED":
      return "Inspection required";
    case "IN_PROGRESS":
      return "In progress";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
  }
}

function getStatusTone(status: MaintenanceStatus) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
      return "blue";
    case "APPROVED":
      return "violet";
    case "QUOTED":
      return "amber";
    case "INSPECTION_REQUIRED":
      return "orange";
    case "CANCELLED":
      return "slate";
    default:
      return "neutral";
  }
}

function getPriorityTone(priority: MaintenancePriority) {
  switch (priority) {
    case "EMERGENCY":
      return "emergency";
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    default:
      return "low";
  }
}

function formatResponsibility(value: PaymentResponsibility) {
  if (!value) return "Not set";
  if (value === "PROPERTY") return "Property";
  if (value === "RESIDENT") return "Resident";
  return "Shared";
}

function getDispatchLabel(status: DispatchStatus) {
  switch (status) {
    case "SENT":
      return "Sent";
    case "VIEWED":
      return "Viewed";
    case "QUOTED":
      return "Quoted";
    case "DECLINED":
      return "Declined";
    default:
      return status;
  }
}

function getQuoteLabel(status: QuoteStatus) {
  switch (status) {
    case "ACCEPTED":
      return "Accepted";
    case "REJECTED":
      return "Rejected";
    case "EXPIRED":
      return "Expired";
    default:
      return "Pending";
  }
}

function getPayoutLabel(status: PayoutStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    default:
      return "Pending";
  }
}

function getExpenseTone(status: ExpenseStatus) {
  switch (status) {
    case "PAID":
      return "success";
    case "APPROVED":
      return "violet";
    case "SUBMITTED":
      return "amber";
    case "REJECTED":
      return "slate";
    default:
      return "neutral";
  }
}

function getNextActionLabel(request: MaintenanceRequestItem | null) {
  if (!request) return "Select request";

  const latestExpense = request.expenses?.[0];
  const hasResidentCharge =
    (request.paymentResponsibility === "RESIDENT" ||
      request.paymentResponsibility === "SHARED") &&
    toNumber(request.residentShare) > 0;

  switch (request.status) {
    case "PENDING":
      return "We’re assigning a technician";
    case "ASSIGNED":
      return request.requiresInspection
        ? "Inspection is the next step"
        : "Quote review is the next step";
    case "INSPECTION_REQUIRED":
      return "Quote review is the next step";
    case "QUOTED":
      if (
        request.paymentResponsibility === "PROPERTY" ||
        request.paymentResponsibility === "SHARED"
      ) {
        if (latestExpense?.status === "SUBMITTED") {
          return "Awaiting investor approval";
        }
        if (latestExpense?.status === "REJECTED") {
          return "Expense rejected, revise quote";
        }
      }
      return "Awaiting approval and scheduling";
    case "APPROVED":
      return request.workScheduledAt
        ? "Repair will begin soon"
        : "Work scheduling is in progress";
    case "IN_PROGRESS":
      return request.workCompletedAt
        ? "Awaiting resident confirmation"
        : "Repair is underway";
    case "COMPLETED":
      if (hasResidentCharge && !request.paidAt) {
        return "Resident payment is now due";
      }
      return "Issue has been completed";
    default:
      return "Team review in progress";
  }
}

function getManagerNextActionLabel(request: MaintenanceRequestItem | null) {
  if (!request) return "Select request";

  const latestExpense = request.expenses?.[0];
  const hasAcceptedQuote = request.quotes?.some((quote) => quote.status === "ACCEPTED");
  const hasAnyQuote = request.quotes?.some((quote) => quote.status === "PENDING" || quote.status === "ACCEPTED");

  switch (request.status) {
    case "PENDING":
      return request.assignedProviderId ? "Wait for provider response" : "Assign service provider";
    case "ASSIGNED":
      return request.requiresInspection ? "Schedule inspection" : "Wait for provider quote";
    case "INSPECTION_REQUIRED":
      return request.inspectionScheduledAt ? "Wait for inspection/quote" : "Schedule inspection";
    case "QUOTED":
      if (!hasAcceptedQuote && hasAnyQuote) return "Review and accept quote";
      if (!request.paymentResponsibility) return "Set payment responsibility";
      if (latestExpense?.status === "SUBMITTED") return "Await investor approval";
      if (latestExpense?.status === "REJECTED") return "Quote expense rejected";
      return "Confirm approval and schedule work";
    case "APPROVED":
      return request.workScheduledAt ? "Start repair" : "Schedule work date";
    case "IN_PROGRESS":
      return request.workCompletedAt ? "Await resident confirmation" : "Record work finished";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Review request";
  }
}

function getResidentStage(request: MaintenanceRequestItem) {
  if (request.status === "COMPLETED") return 6;
  if (request.status === "IN_PROGRESS" && request.workCompletedAt) return 5;
  if (request.status === "IN_PROGRESS") return 5;
  if (request.workScheduledAt || request.status === "APPROVED") return 4;
  if (
    request.status === "QUOTED" ||
    request.status === "INSPECTION_REQUIRED"
  ) {
    return 3;
  }
  if (request.status === "ASSIGNED") return 2;
  return 1;
}

function getRoleFromStoredUser(): Role {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (!storedUser || storedUser === "undefined" || storedUser === "null") {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as { role?: Role };
    return parsedUser?.role || null;
  } catch {
    return null;
  }
}

const RESIDENT_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "CARPENTRY",
  "APPLIANCE",
  "PAINTING",
  "CLEANING",
  "SECURITY",
  "GENERAL",
];

function toDateTimeInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function sortMaintenanceRequests(rows: MaintenanceRequestItem[]) {
  const priorityWeight: Record<MaintenancePriority, number> = {
    EMERGENCY: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const statusWeight: Record<MaintenanceStatus, number> = {
    PENDING: 7,
    ASSIGNED: 6,
    INSPECTION_REQUIRED: 5,
    QUOTED: 8,
    APPROVED: 4,
    IN_PROGRESS: 3,
    COMPLETED: 1,
    CANCELLED: 0,
  };

  return [...rows].sort((a, b) => {
    const statusDifference = statusWeight[b.status] - statusWeight[a.status];
    if (statusDifference !== 0) return statusDifference;

    const priorityDifference = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDifference !== 0) return priorityDifference;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function sortByNewest<T extends { createdAt?: string; sentAt?: string }>(rows: T[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.createdAt || b.sentAt || 0).getTime() -
      new Date(a.createdAt || a.sentAt || 0).getTime(),
  );
}

function requestHasAcceptedQuote(request: MaintenanceRequestItem | null) {
  return !!request?.quotes?.some((quote) => quote.status === "ACCEPTED");
}

function requestPropertySideCleared(request: MaintenanceRequestItem | null) {
  if (!request) return false;

  const propertyShare = getComputedShares(request).propertyShare;
  const needsPropertyApproval =
    (request.paymentResponsibility === "PROPERTY" ||
      request.paymentResponsibility === "SHARED") &&
    propertyShare > 0;

  if (!needsPropertyApproval) return true;

  const latestExpense = getLatestExpense(request);
  return latestExpense?.status === "APPROVED" || latestExpense?.status === "PAID";
}

function getAcceptedQuote(request: MaintenanceRequestItem | null) {
  return request?.quotes?.find((quote) => quote.status === "ACCEPTED") || null;
}

function getPrimaryQuote(request: MaintenanceRequestItem | null) {
  if (!request?.quotes?.length) return null;
  const acceptedQuote = getAcceptedQuote(request);
  if (acceptedQuote) return acceptedQuote;
  return [...request.quotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

function getLatestExpense(request: MaintenanceRequestItem | null) {
  if (!request?.expenses?.length) return null;
  return [...request.expenses].sort(
    (a, b) =>
      new Date(b.submittedAt || b.reviewedAt || b.paidAt || 0).getTime() -
      new Date(a.submittedAt || a.reviewedAt || a.paidAt || 0).getTime(),
  )[0];
}

function getLatestPayout(request: MaintenanceRequestItem | null) {
  if (!request?.payouts?.length) return null;
  return [...request.payouts].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  )[0];
}

function getComputedShares(request: MaintenanceRequestItem | null) {
  if (!request) return { total: 0, propertyShare: 0, residentShare: 0 };

  const quoteTotal = toNumber(getAcceptedQuote(request)?.totalAmount);
  const estimatedTotal = toNumber(request.estimatedCost);
  const total = quoteTotal || estimatedTotal;
  const existingPropertyShare = toNumber(request.propertyShare);
  const existingResidentShare = toNumber(request.residentShare);

  if (existingPropertyShare > 0 || existingResidentShare > 0) {
    return {
      total,
      propertyShare: existingPropertyShare,
      residentShare: existingResidentShare,
    };
  }

  if (request.paymentResponsibility === "PROPERTY") {
    return { total, propertyShare: total, residentShare: 0 };
  }

  if (request.paymentResponsibility === "RESIDENT") {
    return { total, propertyShare: 0, residentShare: total };
  }

  if (request.paymentResponsibility === "SHARED") {
    const propertyShare = Math.round(total / 2);
    return {
      total,
      propertyShare,
      residentShare: Math.max(0, total - propertyShare),
    };
  }

  return { total, propertyShare: 0, residentShare: 0 };
}

function getPropertyPaymentLabel(request: MaintenanceRequestItem | null) {
  const latestExpense = getLatestExpense(request);
  const propertyShare = getComputedShares(request).propertyShare;

  if (propertyShare <= 0) return "Not required";
  if (!latestExpense) return "Expense not created";
  if (latestExpense.status === "PAID") {
    return latestExpense.paidAt ? `Paid ${formatDateTime(latestExpense.paidAt)}` : "Paid";
  }
  if (latestExpense.status === "APPROVED") return "Approved, awaiting payment";
  if (latestExpense.status === "SUBMITTED") return "Submitted for approval";
  if (latestExpense.status === "REJECTED") return "Rejected";
  return latestExpense.status;
}

function getResidentPaymentLabel(request: MaintenanceRequestItem | null) {
  if (!request) return "—";

  const residentShare = getComputedShares(request).residentShare;
  if (residentShare <= 0) return "Not required";
  if (request.paidAt) return `Paid ${formatDateTime(request.paidAt)}`;
  if (request.status === "COMPLETED") return "Due now";
  if (request.workCompletedAt) return "Awaiting resident confirmation";
  return "Not due yet";
}

function getResidentChargeLabel(request: MaintenanceRequestItem | null) {
  const residentShare = getComputedShares(request).residentShare;

  if (!request || residentShare <= 0) return "No charge assigned";
  return formatCurrency(residentShare);
}

function getResidentPaymentStatusLabel(request: MaintenanceRequestItem | null) {
  if (!request) return "—";

  const residentShare = getComputedShares(request).residentShare;
  if (residentShare <= 0) return "No charge due";
  if (request.paidAt) return "Paid";
  if (request.status === "COMPLETED") return "Payment due";
  if (request.workCompletedAt) return "Awaiting confirmation";
  return "Not due yet";
}

function getResidentScheduleLabel(value: string | null | undefined, pendingLabel: string) {
  if (value) return formatDateTime(value);
  return pendingLabel;
}

function getWorkFinishedLabel(request: MaintenanceRequestItem | null) {
  if (!request?.workCompletedAt) return "Not finished";
  if (request.status === "COMPLETED") return `Completed ${formatDateTime(request.workCompletedAt)}`;
  return `Finished ${formatDateTime(request.workCompletedAt)}`;
}

function canAcceptMaintenanceQuote(request: MaintenanceRequestItem | null, quote: { status: QuoteStatus }) {
  if (!request) return false;
  if (request.status === "COMPLETED" || request.status === "CANCELLED") return false;
  if (requestHasAcceptedQuote(request)) return false;
  return quote.status === "PENDING";
}

function ResidentMaintenanceView({
  requests,
  loading,
  onRefresh,
}: {
  requests: MaintenanceRequestItem[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "open" | "scheduled" | "completed" | "charges"
  >("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentCardRef, setPaymentCardRef] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);

  const [form, setForm] = useState<CreateRequestForm>({
    category: "GENERAL",
    priority: "MEDIUM",
    title: "",
    description: "",
  });

  const filteredRequests = useMemo(() => {
    let rows = [...requests];

    if (activeFilter === "open") {
      rows = rows.filter((item) =>
        [
          "PENDING",
          "ASSIGNED",
          "INSPECTION_REQUIRED",
          "QUOTED",
          "APPROVED",
          "IN_PROGRESS",
        ].includes(item.status),
      );
    } else if (activeFilter === "scheduled") {
      rows = rows.filter(
        (item) =>
          !!item.inspectionScheduledAt ||
          !!item.workScheduledAt ||
          item.status === "APPROVED",
      );
    } else if (activeFilter === "completed") {
      rows = rows.filter((item) => item.status === "COMPLETED");
    } else if (activeFilter === "charges") {
      rows = rows.filter(
        (item) =>
          (item.paymentResponsibility === "RESIDENT" ||
            item.paymentResponsibility === "SHARED") &&
          toNumber(item.residentShare) > 0,
      );
    }

    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((item) =>
      [
        item.title,
        item.description,
        item.category,
        item.status,
        item.priority,
        item.property?.title,
        item.property?.location,
        item.unit?.number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requests, activeFilter, search]);

  const selectedRequest =
    filteredRequests.find((item) => item.id === selectedId) ||
    requests.find((item) => item.id === selectedId) ||
    filteredRequests[0] ||
    requests[0] ||
    null;

  useEffect(() => {
    if (!selectedRequest && requests.length > 0) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedRequest]);

  useEffect(() => {
    if (!showPaymentModal) return;
    let mounted = true;

    async function loadWallet() {
      try {
        setLoadingWallet(true);
        const res = await api.get<WalletResponse>("/wallet/resident");
        if (mounted) setWalletBalance(toNumber(res.data?.balance));
      } catch {
        if (mounted) setWalletBalance(0);
      } finally {
        if (mounted) setLoadingWallet(false);
      }
    }

    loadWallet();
    return () => {
      mounted = false;
    };
  }, [showPaymentModal]);

  const summary = useMemo(() => {
    const openCount = requests.filter((item) =>
      [
        "PENDING",
        "ASSIGNED",
        "INSPECTION_REQUIRED",
        "QUOTED",
        "APPROVED",
        "IN_PROGRESS",
      ].includes(item.status),
    ).length;

    const urgentCount = requests.filter(
      (item) => item.priority === "HIGH" || item.priority === "EMERGENCY",
    ).length;

    const scheduledCount = requests.filter(
      (item) => !!item.inspectionScheduledAt || !!item.workScheduledAt,
    ).length;

    const residentCharges = requests.reduce((sum, item) => {
      const chargeable =
        item.paymentResponsibility === "RESIDENT" ||
        item.paymentResponsibility === "SHARED";
      return chargeable ? sum + toNumber(item.residentShare) : sum;
    }, 0);

    const unpaidResidentCharges = requests.reduce((sum, item) => {
      const chargeable =
        item.paymentResponsibility === "RESIDENT" ||
        item.paymentResponsibility === "SHARED";
      const unpaid = chargeable && !item.paidAt && item.status === "COMPLETED";
      return unpaid ? sum + toNumber(item.residentShare) : sum;
    }, 0);

    return {
      total: requests.length,
      openCount,
      urgentCount,
      scheduledCount,
      residentCharges,
      unpaidResidentCharges,
    };
  }, [requests]);

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    try {
      setSubmitting(true);
      await api.post("/maintenance", {
        category: form.category,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
      });

      setForm({
        category: "GENERAL",
        priority: "MEDIUM",
        title: "",
        description: "",
      });
      setShowCreate(false);
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  const hasCharge =
    !!selectedRequest &&
    (selectedRequest.paymentResponsibility === "RESIDENT" ||
      selectedRequest.paymentResponsibility === "SHARED") &&
    toNumber(selectedRequest.residentShare) > 0;

  const canPayCharge =
    !!selectedRequest &&
    hasCharge &&
    selectedRequest.status === "COMPLETED" &&
    !selectedRequest.paidAt;

  const latestExpense = selectedRequest?.expenses?.[0];

  const canConfirmCompletion =
    !!selectedRequest &&
    selectedRequest.status === "IN_PROGRESS" &&
    !!selectedRequest.workCompletedAt;

  const currentResidentStage = selectedRequest ? getResidentStage(selectedRequest) : 0;

  const residentTimeline = selectedRequest
    ? [
        { label: "Reported", done: currentResidentStage >= 1, current: currentResidentStage === 1 },
        { label: "Assigned", done: currentResidentStage >= 2, current: currentResidentStage === 2 },
        { label: "Reviewed", done: currentResidentStage >= 3, current: currentResidentStage === 3 },
        { label: "Scheduled", done: currentResidentStage >= 4, current: currentResidentStage === 4 },
        { label: "Repairing", done: currentResidentStage >= 5, current: currentResidentStage === 5 },
        { label: "Completed", done: currentResidentStage >= 6, current: currentResidentStage === 6 },
      ]
    : [];

  async function handlePayMaintenanceCharge() {
    if (!selectedRequest || !canPayCharge || paying) return;

    const amount = toNumber(selectedRequest.residentShare);
    const requestId = selectedRequest.id;

    try {
      setPaying(true);
      setPaymentMessage(null);

      if (paymentMethod === "WALLET") {
        if (walletBalance < amount) {
          setPaymentMessage("Your wallet balance is not enough for this charge.");
          return;
        }

        await api.post("/payments", {
          amount,
          channel: "WALLET",
          purpose: "MAINTENANCE",
          requestId,
        });

        await api.patch(`/maintenance/request/${requestId}/pay`, {
          paymentReference: `WALLET_${Date.now()}`,
        });
      } else if (paymentMethod === "MOBILE_MONEY") {
        await api.post("/payments", {
          amount,
          channel: "MOBILE_MONEY",
          purpose: "MAINTENANCE",
          requestId,
          phone: paymentPhone,
        });

        await api.patch(`/maintenance/request/${requestId}/pay`, {
          paymentReference: `MOBILE_MONEY_${Date.now()}`,
        });
      } else if (paymentMethod === "BANK") {
        await api.post("/payments", {
          amount,
          channel: "BANK",
          purpose: "MAINTENANCE",
          requestId,
          bankReference: paymentBank,
        });

        await api.patch(`/maintenance/request/${requestId}/pay`, {
          paymentReference: `BANK_${Date.now()}`,
        });
      } else {
        await api.post("/payments", {
          amount,
          channel: "CARD",
          purpose: "MAINTENANCE",
          requestId,
          cardReference: paymentCardRef,
        });

        await api.patch(`/maintenance/request/${requestId}/pay`, {
          paymentReference: `CARD_${Date.now()}`,
        });
      }

      setShowPaymentModal(false);
      setPaymentPhone("");
      setPaymentBank("");
      setPaymentCardRef("");
      await onRefresh();
    } catch {
      setPaymentMessage("Payment could not be completed right now.");
    } finally {
      setPaying(false);
    }
  }

  async function handleConfirmCompletion() {
    if (!selectedRequest || !canConfirmCompletion || confirmingCompletion) return;

    try {
      setConfirmingCompletion(true);
      await api.post(
        `/maintenance/request/${selectedRequest.id}/confirm-completion`,
      );
      await onRefresh();
    } finally {
      setConfirmingCompletion(false);
    }
  }

  return (
    <div className="maintenance-shell maintenance-shell-resident">
      <section className="resident-maintenance-hero">
        <div className="resident-maintenance-hero-copy">
          <p className="resident-maintenance-eyebrow">Resident Maintenance</p>
          <h1 className="resident-maintenance-title">
            Report issues and track repairs in real time
          </h1>
          <p className="resident-maintenance-text">
            Follow progress, receive updates, and only pay when work is completed
            and confirmed.
          </p>

          <div className="resident-maintenance-actions">
            <button
              type="button"
              className="resident-maintenance-primary-btn"
              onClick={() => setShowCreate(true)}
            >
              Report an issue
            </button>
            <button
              type="button"
              className="resident-maintenance-secondary-btn"
              onClick={onRefresh}
            >
              Refresh requests
            </button>
          </div>
        </div>

        <div className="resident-maintenance-hero-side">
          <div className="resident-maintenance-glass-card main">
            <span>Open requests</span>
            <strong>{summary.openCount}</strong>
          </div>

          <div className="resident-maintenance-glass-grid">
            <div className="resident-maintenance-glass-card">
              <span>Urgent</span>
              <strong>{summary.urgentCount}</strong>
            </div>
            <div className="resident-maintenance-glass-card">
              <span>Scheduled</span>
              <strong>{summary.scheduledCount}</strong>
            </div>
            <div className="resident-maintenance-glass-card">
              <span>Charges due</span>
              <strong>
                {summary.unpaidResidentCharges > 0
                  ? formatCurrency(summary.unpaidResidentCharges)
                  : "No charges yet"}
              </strong>
            </div>
            <div className="resident-maintenance-glass-card">
              <span>Total requests</span>
              <strong>{summary.total}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="resident-maintenance-overview">
        <div className="resident-maintenance-overview-card dark">
          <span>Resident repair charges</span>
          <strong>
            {summary.residentCharges > 0
              ? formatCurrency(summary.residentCharges)
              : "No charges yet"}
          </strong>
          <small>You’ll only be billed after work is completed and approved.</small>
        </div>

        <div className="resident-maintenance-overview-card">
          <span>Outstanding maintenance charges</span>
          <strong>
            {summary.unpaidResidentCharges > 0
              ? formatCurrency(summary.unpaidResidentCharges)
              : "Nothing due"}
          </strong>
          <small>Charges only become payable after completion is confirmed.</small>
        </div>

        <div className="resident-maintenance-overview-card">
          <span>Latest request status</span>
          <strong>
            {selectedRequest
              ? formatStatusLabel(selectedRequest.status)
              : "No requests"}
          </strong>
          <small>
            {selectedRequest
              ? getNextActionLabel(selectedRequest)
              : "Your latest issue will appear here."}
          </small>
        </div>
      </section>

      <section className="resident-maintenance-toolbar">
        <div className="resident-maintenance-filter-row">
          {[
            ["all", "All"],
            ["open", "Open"],
            ["scheduled", "Scheduled"],
            ["completed", "Completed"],
            ["charges", "Charges"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`resident-maintenance-filter-pill ${
                activeFilter === key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="resident-maintenance-search-wrap">
          <input
            className="resident-maintenance-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by issue, category, unit, or status."
          />
        </div>
      </section>

      <section className="resident-maintenance-board">
        <div className="resident-maintenance-list-panel">
          <div className="resident-maintenance-panel-head">
            <div>
              <h2>My requests</h2>
              <p>Your issues and repair history in one place</p>
            </div>
            <span className="resident-maintenance-count-chip">
              {loading ? "Loading..." : `${filteredRequests.length} items`}
            </span>
          </div>

          {loading ? (
            <div className="resident-maintenance-empty">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="resident-maintenance-empty">
              No issues reported yet.
              <br />
              <span>Everything looks good in your unit for now.</span>
            </div>
          ) : (
            <div className="resident-maintenance-request-list">
              {filteredRequests.map((item) => {
                const selected = selectedRequest?.id === item.id;
                const requestHasCharge =
                  (item.paymentResponsibility === "RESIDENT" ||
                    item.paymentResponsibility === "SHARED") &&
                  toNumber(item.residentShare) > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`resident-maintenance-request-card ${
                      selected ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <h3>{item.title}</h3>

                    <div className="resident-maintenance-request-top polished">
                      <div className="resident-maintenance-request-badges">
                        <span
                          className={`maintenance-badge ${getStatusTone(
                            item.status,
                          )}`}
                        >
                          {formatStatusLabel(item.status)}
                        </span>
                        <span
                          className={`maintenance-badge ${getPriorityTone(
                            item.priority,
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <span className="resident-maintenance-request-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p>
                      {item.property?.title || "Property"} • Unit{" "}
                      {item.unit?.number || "—"}
                    </p>

                    <div className="resident-maintenance-request-bottom">
                      <span>{item.category || "General"}</span>
                      <strong>{getResidentChargeLabel(item)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="resident-maintenance-focus-panel">
          {!selectedRequest ? (
            <div className="resident-maintenance-detail-empty">
              Select a request to view details.
            </div>
          ) : (
            <>
              <div className="resident-maintenance-focus-hero">
                <div className="resident-maintenance-focus-head">
                  <div className="resident-maintenance-request-badges">
                    <span
                      className={`maintenance-badge ${getPriorityTone(
                        selectedRequest.priority,
                      )}`}
                    >
                      {selectedRequest.priority}
                    </span>
                    <span
                      className={`maintenance-badge ${getStatusTone(
                        selectedRequest.status,
                      )}`}
                    >
                      {formatStatusLabel(selectedRequest.status)}
                    </span>
                    <span className="maintenance-badge subtle">
                      {selectedRequest.category || "General"}
                    </span>
                  </div>

                  <h2>{selectedRequest.title}</h2>
                  <p>
                    {selectedRequest.property?.title || "Property"} • Unit{" "}
                    {selectedRequest.unit?.number || "—"} •{" "}
                    {selectedRequest.property?.location || "No location"}
                  </p>
                </div>

                <div className="resident-maintenance-summary-grid cleaner">
                  <div className="resident-maintenance-summary-card">
                    <span>Reported</span>
                    <strong>{formatDateTime(selectedRequest.createdAt)}</strong>
                  </div>
                  <div className="resident-maintenance-summary-card">
                    <span>Assigned provider</span>
                    <strong>
                      {selectedRequest.assignedProvider?.companyName ||
                        selectedRequest.assignedProvider?.user?.name ||
                        "Awaiting assignment"}
                    </strong>
                  </div>
                  <div className="resident-maintenance-summary-card">
                    <span>Next step</span>
                    <strong>{getNextActionLabel(selectedRequest)}</strong>
                  </div>
                </div>
              </div>

              <div className="resident-maintenance-progress-strip compact">
                {residentTimeline.map((step, index) => (
                  <div
                    key={step.label}
                    className={`resident-progress-step ${step.done ? "done" : ""} ${step.current ? "current" : ""}`}
                  >
                    <div className="resident-progress-step-number">
                      {index + 1}
                    </div>
                    <div className="resident-progress-step-copy">
                      <strong>{step.label}</strong>
                      <span>{step.current ? "Current step" : step.done ? "Done" : "Waiting"}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="resident-maintenance-clean-grid">
                <div className="resident-maintenance-stack-column">
                  <div className="resident-maintenance-detail-mini issue">
                    <div className="resident-maintenance-mini-head">
                      <h3>Issue details</h3>
                      <p>Your reported description</p>
                    </div>

                    <div className="resident-maintenance-description-card compact">
                      {selectedRequest.description}
                    </div>
                  </div>

                  <div className="resident-maintenance-detail-mini schedule">
                    <div className="resident-maintenance-mini-head">
                      <h3>Schedule</h3>
                      <p>Inspection and work timing</p>
                    </div>

                    <div className="resident-maintenance-info-stack compact">
                      <div className="resident-maintenance-info-row">
                        <span>Inspection</span>
                        <strong>
                          {getResidentScheduleLabel(
                            selectedRequest.inspectionScheduledAt,
                            "Not scheduled yet",
                          )}
                        </strong>
                      </div>
                      <div className="resident-maintenance-info-row">
                        <span>Work scheduled</span>
                        <strong>
                          {getResidentScheduleLabel(
                            selectedRequest.workScheduledAt,
                            "Pending",
                          )}
                        </strong>
                      </div>
                      <div className="resident-maintenance-info-row">
                        <span>Work finished</span>
                        <strong>
                          {getResidentScheduleLabel(
                            selectedRequest.workCompletedAt,
                            "—",
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {latestExpense ? (
                    <div className="resident-maintenance-detail-mini schedule">
                      <div className="resident-maintenance-mini-head">
                        <h3>Property approval side</h3>
                        <p>For property or shared responsibility</p>
                      </div>

                      <div className="resident-maintenance-info-stack compact">
                        <div className="resident-maintenance-info-row">
                          <span>Expense status</span>
                          <strong>{latestExpense.status}</strong>
                        </div>
                        <div className="resident-maintenance-info-row">
                          <span>Submitted</span>
                          <strong>{formatDateTime(latestExpense.submittedAt)}</strong>
                        </div>
                        <div className="resident-maintenance-info-row">
                          <span>Reviewed</span>
                          <strong>{formatDateTime(latestExpense.reviewedAt)}</strong>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="resident-maintenance-payment-panel">
                  <div className="resident-maintenance-mini-head">
                    <h3>Maintenance payment</h3>
                    <p>Costs appear here only if responsibility is assigned to you.</p>
                  </div>

                  <div className="resident-maintenance-payment-amount">
                    <span>Your charge</span>
                    <strong>
                      {getResidentChargeLabel(selectedRequest)}
                    </strong>
                  </div>

                  <div className="resident-maintenance-info-stack compact">
                    <div className="resident-maintenance-info-row">
                      <span>Responsibility</span>
                      <strong>
                        {formatResponsibility(selectedRequest.paymentResponsibility)}
                      </strong>
                    </div>
                    <div className="resident-maintenance-info-row">
                      <span>Payment status</span>
                      <strong>
                        {getResidentPaymentStatusLabel(selectedRequest)}
                      </strong>
                    </div>
                    <div className="resident-maintenance-info-row">
                      <span>Reference</span>
                      <strong>
                        {selectedRequest.paymentReference || "No reference yet"}
                      </strong>
                    </div>
                    <div className="resident-maintenance-info-row">
                      <span>Completed at</span>
                      <strong>
                        {formatDateTime(selectedRequest.workCompletedAt)}
                      </strong>
                    </div>
                  </div>

                  {canPayCharge ? (
                    <>
                      <div className="resident-maintenance-payment-channels">
                        <div className="resident-maintenance-channel-card">
                          <span>Available options</span>
                          <strong>Wallet · Mobile Money · Bank · Card</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="resident-maintenance-primary-btn muted"
                        onClick={() => {
                          setPaymentMethod("WALLET");
                          setPaymentMessage(null);
                          setShowPaymentModal(true);
                        }}
                      >
                        Pay maintenance charge
                      </button>
                    </>
                  ) : null}

                  {canConfirmCompletion ? (
                    <button
                      type="button"
                      className="resident-maintenance-primary-btn muted"
                      onClick={handleConfirmCompletion}
                      disabled={confirmingCompletion}
                    >
                      {confirmingCompletion
                        ? "Confirming..."
                        : "Confirm work completion"}
                    </button>
                  ) : null}

                  {selectedRequest.status === "QUOTED" && !canPayCharge ? (
                    <div className="resident-maintenance-payment-note">
                      Quote is being reviewed. Payment will only appear here if a
                      resident charge is assigned after approval and completion.
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showCreate ? (
        <div
          className="resident-maintenance-modal-backdrop"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="resident-maintenance-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resident-maintenance-modal-head">
              <div>
                <p className="resident-maintenance-eyebrow dark">
                  Report issue
                </p>
                <h3>Tell us what needs attention</h3>
              </div>
              <button
                type="button"
                className="resident-maintenance-close-btn"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>

            <form className="resident-maintenance-form" onSubmit={handleSubmitRequest}>
              <div className="resident-maintenance-form-grid">
                <div>
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {RESIDENT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: e.target.value as MaintenancePriority,
                      }))
                    }
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Example: Bathroom shower leaking"
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the issue clearly so the team can act faster."
                  rows={5}
                />
              </div>

              <div className="resident-maintenance-modal-actions">
                <button
                  type="button"
                  className="resident-maintenance-secondary-btn modal"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="resident-maintenance-primary-btn modal"
                  disabled={submitting || !form.title.trim() || !form.description.trim()}
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showPaymentModal && selectedRequest ? (
        <div
          className="resident-maintenance-modal-backdrop"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="resident-maintenance-modal resident-maintenance-payment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resident-maintenance-modal-head">
              <div>
                <p className="resident-maintenance-eyebrow dark">
                  Maintenance payment
                </p>
                <h3>Pay charge inside maintenance</h3>
              </div>
              <button
                type="button"
                className="resident-maintenance-close-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="resident-maintenance-payment-modal-body">
              <div className="resident-payment-summary-card">
                <span>Request</span>
                <strong>{selectedRequest.title}</strong>
                <p>
                  Amount due: {formatCurrency(selectedRequest.residentShare)}
                </p>
              </div>

              <div className="resident-payment-methods">
                {(["WALLET", "MOBILE_MONEY", "BANK", "CARD"] as PaymentMethod[]).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      className={`resident-payment-method-pill ${
                        paymentMethod === method ? "active" : ""
                      }`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === "MOBILE_MONEY"
                        ? "Mobile Money"
                        : method === "CARD"
                          ? "Card"
                          : method}
                    </button>
                  ),
                )}
              </div>

              {paymentMethod === "WALLET" ? (
                <div className="resident-payment-channel-panel">
                  <div className="resident-payment-channel-row">
                    <span>Wallet balance</span>
                    <strong>
                      {loadingWallet ? "Loading..." : formatCurrency(walletBalance)}
                    </strong>
                  </div>
                  <div className="resident-payment-channel-row">
                    <span>Charge due</span>
                    <strong>{formatCurrency(selectedRequest.residentShare)}</strong>
                  </div>
                </div>
              ) : null}

              {paymentMethod === "MOBILE_MONEY" ? (
                <div className="resident-payment-channel-panel">
                  <label>Mobile Money Number</label>
                  <input
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              ) : null}

              {paymentMethod === "BANK" ? (
                <div className="resident-payment-channel-panel">
                  <label>Bank reference</label>
                  <input
                    value={paymentBank}
                    onChange={(e) => setPaymentBank(e.target.value)}
                    placeholder="Enter bank transfer reference"
                  />
                </div>
              ) : null}

              {paymentMethod === "CARD" ? (
                <div className="resident-payment-channel-panel">
                  <label>Card payment reference</label>
                  <input
                    value={paymentCardRef}
                    onChange={(e) => setPaymentCardRef(e.target.value)}
                    placeholder="Enter card payment reference"
                  />
                </div>
              ) : null}

              {paymentMessage ? (
                <div className="resident-payment-message">{paymentMessage}</div>
              ) : null}

              <div className="resident-maintenance-modal-actions">
                <button
                  type="button"
                  className="resident-maintenance-secondary-btn modal"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="resident-maintenance-primary-btn modal"
                  onClick={handlePayMaintenanceCharge}
                  disabled={paying}
                >
                  {paying ? "Processing..." : "Confirm payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ManagerMaintenanceView() {
  const [requests, setRequests] = useState<MaintenanceRequestItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "quoted" | "approved" | "inprogress" | "completed" | "high"
  >("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [assigningProviderId, setAssigningProviderId] = useState("");
  const [schedulingInspection, setSchedulingInspection] = useState("");
  const [schedulingWork, setSchedulingWork] = useState("");
  const [paymentResponsibility, setPaymentResponsibility] =
    useState<PaymentResponsibility>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function reloadRequests() {
    const res = await api.get<MaintenanceRequestItem[]>("/maintenance/manager/me");
    const rows = sortMaintenanceRequests(res.data ?? []);
    setRequests(rows);
    setSelectedId((current) => {
      if (current && rows.some((item) => item.id === current)) return current;
      return rows[0]?.id ?? null;
    });
  }

  useEffect(() => {
    let mounted = true;

    async function loadRequests() {
      try {
        setLoading(true);
        const res = await api.get<MaintenanceRequestItem[]>("/maintenance/manager/me");
        if (!mounted) return;
        const rows = sortMaintenanceRequests(res.data ?? []);
        setRequests(rows);
        if (rows.length > 0) setSelectedId((current) => current ?? rows[0].id);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function loadProviders() {
      try {
        setLoadingProviders(true);
        const res = await api.get<ProviderItem[]>("/service-providers");
        if (mounted) setProviders(res.data ?? []);
      } finally {
        if (mounted) setLoadingProviders(false);
      }
    }

    loadRequests();
    loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    let rows = [...requests];

    if (activeFilter === "pending") rows = rows.filter((item) => item.status === "PENDING");
    else if (activeFilter === "quoted") rows = rows.filter((item) => item.status === "QUOTED");
    else if (activeFilter === "approved") rows = rows.filter((item) => item.status === "APPROVED");
    else if (activeFilter === "inprogress") rows = rows.filter((item) => item.status === "IN_PROGRESS");
    else if (activeFilter === "completed") rows = rows.filter((item) => item.status === "COMPLETED");
    else if (activeFilter === "high") {
      rows = rows.filter((item) => item.priority === "HIGH" || item.priority === "EMERGENCY");
    }

    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((item) =>
      [
        item.title,
        item.description,
        item.category,
        item.status,
        item.priority,
        item.property?.title,
        item.property?.location,
        item.unit?.number,
        item.resident?.user?.name,
        item.resident?.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requests, activeFilter, search]);

  const selectedRequest =
    filteredRequests.find((item) => item.id === selectedId) ||
    requests.find((item) => item.id === selectedId) ||
    filteredRequests[0] ||
    null;

  const latestExpense = getLatestExpense(selectedRequest);

  useEffect(() => {
    if (!selectedRequest) return;
    setAssigningProviderId(selectedRequest.assignedProviderId || "");
    setPaymentResponsibility(selectedRequest.paymentResponsibility || null);
    setSchedulingInspection(toDateTimeInputValue(selectedRequest.inspectionScheduledAt));
    setSchedulingWork(toDateTimeInputValue(selectedRequest.workScheduledAt));
  }, [selectedRequest?.id]);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      open: requests.filter((item) =>
        [
          "PENDING",
          "ASSIGNED",
          "INSPECTION_REQUIRED",
          "QUOTED",
          "APPROVED",
          "IN_PROGRESS",
        ].includes(item.status),
      ).length,
      completed: requests.filter((item) => item.status === "COMPLETED").length,
      urgent: requests.filter((item) => item.priority === "HIGH" || item.priority === "EMERGENCY").length,
      estimatedValue: requests.reduce((sum, item) => sum + toNumber(item.estimatedCost), 0),
    };
  }, [requests]);

  const providerOptions = useMemo(
    () => providers.filter((provider) => provider.isActive),
    [providers],
  );

  const isFinalRequest =
    selectedRequest?.status === "COMPLETED" || selectedRequest?.status === "CANCELLED";

  const canAssignProvider =
    !!selectedRequest &&
    !isFinalRequest &&
    !!assigningProviderId &&
    assigningProviderId !== selectedRequest.assignedProviderId;

  const canScheduleInspection =
    !!selectedRequest &&
    !isFinalRequest &&
    !!selectedRequest.assignedProviderId &&
    !!schedulingInspection &&
    schedulingInspection !== toDateTimeInputValue(selectedRequest.inspectionScheduledAt);

  const canSetResponsibility =
    !!selectedRequest &&
    !isFinalRequest &&
    requestHasAcceptedQuote(selectedRequest) &&
    !!paymentResponsibility &&
    paymentResponsibility !== selectedRequest.paymentResponsibility;

  const canScheduleWork =
    !!selectedRequest &&
    selectedRequest.status === "APPROVED" &&
    !!selectedRequest.paymentResponsibility &&
    requestPropertySideCleared(selectedRequest) &&
    !!schedulingWork &&
    schedulingWork !== toDateTimeInputValue(selectedRequest.workScheduledAt);

  const canStartRepair =
    !!selectedRequest &&
    selectedRequest.status === "APPROVED" &&
    !!selectedRequest.workScheduledAt &&
    !!selectedRequest.paymentResponsibility &&
    requestPropertySideCleared(selectedRequest);

  const canRecordFinished =
    !!selectedRequest &&
    selectedRequest.status === "IN_PROGRESS" &&
    !selectedRequest.workCompletedAt;


  function applyRequestUpdate(updated: MaintenanceRequestItem | null | undefined) {
    if (!updated?.id) return;

    setRequests((current) =>
      sortMaintenanceRequests(
        current.map((item) => (item.id === updated.id ? updated : item)),
      ),
    );
    setSelectedId(updated.id);
  }

  async function reloadAfterAction(responseData?: MaintenanceRequestItem | null) {
    applyRequestUpdate(responseData);
    await reloadRequests();
  }

  async function handleAssignProvider() {
    if (!selectedRequest || !canAssignProvider) return;
    try {
      setBusyAction("assign");
      const res = await api.patch<MaintenanceRequestItem>(
        `/maintenance/request/${selectedRequest.id}/assign/${assigningProviderId}`,
      );
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleScheduleInspection() {
    if (!selectedRequest || !canScheduleInspection) return;
    try {
      setBusyAction("inspection");
      const res = await api.patch<MaintenanceRequestItem>(
        `/maintenance/request/${selectedRequest.id}/inspection`,
        { date: new Date(schedulingInspection).toISOString() },
      );
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSetResponsibility() {
    if (!selectedRequest || !canSetResponsibility) return;
    try {
      setBusyAction("responsibility");
      const res = await api.patch<MaintenanceRequestItem>(
        `/maintenance/request/${selectedRequest.id}/payment-responsibility`,
        { responsibility: paymentResponsibility },
      );
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleScheduleWork() {
    if (!selectedRequest || !canScheduleWork) return;
    try {
      setBusyAction("schedule-work");
      const res = await api.patch<MaintenanceRequestItem>(
        `/maintenance/${selectedRequest.id}/schedule-work`,
        { date: new Date(schedulingWork).toISOString() },
      );
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStartRepair() {
    if (!selectedRequest || !canStartRepair) return;
    try {
      setBusyAction("start");
      const res = await api.patch<MaintenanceRequestItem>(`/maintenance/${selectedRequest.id}/start`);
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCompleteRepair() {
    if (!selectedRequest || !canRecordFinished) return;
    try {
      setBusyAction("complete");
      const res = await api.patch<MaintenanceRequestItem>(`/maintenance/${selectedRequest.id}/complete`);
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAcceptQuote(quoteId: string) {
    try {
      setBusyAction(`quote-${quoteId}`);
      const res = await api.patch<MaintenanceRequestItem>(`/maintenance/quote/${quoteId}/accept`);
      await reloadAfterAction(res.data);
    } finally {
      setBusyAction(null);
    }
  }

  const latestPayout = getLatestPayout(selectedRequest);
  const managerPhotos = selectedRequest?.photos ?? [];
  const managerDispatches = selectedRequest?.dispatches ?? [];
  const managerReviews = selectedRequest?.reviews ?? [];
  const acceptedQuote = getAcceptedQuote(selectedRequest);
  const primaryQuote = getPrimaryQuote(selectedRequest);
  const computedShares = getComputedShares(selectedRequest);
  const effectiveEstimatedCost =
    computedShares.total || toNumber(selectedRequest?.estimatedCost);
  const propertyPaymentLabel = getPropertyPaymentLabel(selectedRequest);
  const residentPaymentLabel = getResidentPaymentLabel(selectedRequest);
  const workFinishedLabel = getWorkFinishedLabel(selectedRequest);

  const awaitingResidentConfirmation =
    !!selectedRequest &&
    selectedRequest.status === "IN_PROGRESS" &&
    !!selectedRequest.workCompletedAt;

  return (
    <div className="maintenance-shell">
      <section className="maintenance-hero">
        <div className="maintenance-hero-copy">
          <p className="maintenance-eyebrow">Manager Maintenance Workspace</p>
          <h1 className="maintenance-title">
            Coordinate requests, providers, quotes, approvals, repairs, and payment responsibility
          </h1>
          <p className="maintenance-text">
            Handle maintenance as an operations workflow. Move each issue from
            request to inspection, quoting, approval, repair, resident confirmation,
            and final payment from one command center.
          </p>

          <div className="maintenance-tags">
            <span className="maintenance-tag">Request queue</span>
            <span className="maintenance-tag">Quote review</span>
            <span className="maintenance-tag">Expense approval</span>
            <span className="maintenance-tag">Repair workflow</span>
          </div>
        </div>

        <div className="maintenance-hero-grid">
          <div className="maintenance-stat-card dark">
            <span>Total Requests</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Open</span>
            <strong>{summary.open}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Urgent</span>
            <strong>{summary.urgent}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Estimated Value</span>
            <strong>{formatCurrency(summary.estimatedValue)}</strong>
          </div>
        </div>
      </section>

      <section className="maintenance-toolbar">
        <div className="maintenance-filter-row">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["quoted", "Quoted"],
            ["approved", "Approved"],
            ["inprogress", "In Progress"],
            ["completed", "Completed"],
            ["high", "High Priority"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`maintenance-filter-pill ${
                activeFilter === key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="maintenance-search-wrap">
          <input
            className="maintenance-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, resident, property, category, status..."
          />
        </div>
      </section>

      <section className="maintenance-workspace">
        <div className="maintenance-queue-panel">
          <div className="maintenance-panel-head">
            <div>
              <h2 className="maintenance-panel-title">Request Queue</h2>
              <p className="maintenance-panel-subtitle">
                Pick a request to manage the full workflow
              </p>
            </div>
            <span className="maintenance-chip">
              {loading ? "Loading..." : `${filteredRequests.length} items`}
            </span>
          </div>

          {loading ? (
            <div className="maintenance-empty">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="maintenance-empty">
              No maintenance requests found.
            </div>
          ) : (
            <div className="maintenance-queue-list">
              {filteredRequests.map((item) => {
                const isSelected = selectedRequest?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`maintenance-queue-row ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="maintenance-queue-top">
                      <div className="maintenance-queue-top-tags">
                        <span
                          className={`maintenance-badge ${getPriorityTone(item.priority)}`}
                        >
                          {item.priority}
                        </span>
                        <span
                          className={`maintenance-badge ${getStatusTone(item.status)}`}
                        >
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      <span className="maintenance-queue-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3>{item.title}</h3>
                    <p>
                      {item.property?.title || "Property"} • Unit {item.unit?.number || "—"}
                    </p>

                    <div className="maintenance-queue-bottom">
                      <span>{item.category || "General"}</span>
                      <strong>{formatCurrency(item.estimatedCost)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="maintenance-detail-panel">
          {!selectedRequest ? (
            <div className="maintenance-empty detail">
              Select a maintenance request to manage it.
            </div>
          ) : (
            <>
              <div className="maintenance-detail-hero">
                <div>
                  <div className="maintenance-detail-topline">
                    <span
                      className={`maintenance-badge ${getPriorityTone(selectedRequest.priority)}`}
                    >
                      {selectedRequest.priority}
                    </span>
                    <span
                      className={`maintenance-badge ${getStatusTone(selectedRequest.status)}`}
                    >
                      {formatStatusLabel(selectedRequest.status)}
                    </span>
                    <span className="maintenance-badge subtle">
                      {selectedRequest.category || "General"}
                    </span>
                    <span className="maintenance-badge workflow">
                      Next: {getManagerNextActionLabel(selectedRequest)}
                    </span>
                  </div>

                  <h2 className="maintenance-detail-title">{selectedRequest.title}</h2>
                  <p className="maintenance-detail-subtitle">
                    {selectedRequest.property?.title || "Property"} • Unit{" "}
                    {selectedRequest.unit?.number || "—"} •{" "}
                    {selectedRequest.property?.location || "No location"}
                  </p>
                </div>

                <div className="maintenance-cost-box">
                  <span>Estimated Cost</span>
                  <strong>{formatCurrency(effectiveEstimatedCost)}</strong>
                </div>
              </div>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Issue Summary</h3>
                  <span>Core request context</span>
                </div>

                <div className="maintenance-description-card">
                  {selectedRequest.description}
                </div>

                <div className="maintenance-info-grid three">
                  <div className="maintenance-info-card">
                    <span>Resident</span>
                    <strong>
                      {selectedRequest.resident?.user?.name ||
                        selectedRequest.resident?.user?.email ||
                        "Resident"}
                    </strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Created</span>
                    <strong>{formatDateTime(selectedRequest.createdAt)}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Requires Inspection</span>
                    <strong>{selectedRequest.requiresInspection ? "Yes" : "No"}</strong>
                  </div>
                </div>
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Photos & Dispatch History</h3>
                  <span>Evidence, provider outreach, and response trail</span>
                </div>

                <div className="maintenance-info-grid two">
                  <div className="maintenance-info-card">
                    <span>Photos attached</span>
                    <strong>{managerPhotos.length}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Dispatch attempts</span>
                    <strong>{managerDispatches.length}</strong>
                  </div>
                </div>

                {managerPhotos.length ? (
                  <div className="maintenance-quote-list">
                    {managerPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        className="maintenance-quote-card"
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="maintenance-quote-top">
                          <div>
                            <h4>Request photo</h4>
                            <p>{photo.url}</p>
                          </div>
                          <span className="maintenance-badge blue">Open</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="maintenance-empty mini">No photos attached yet.</div>
                )}

                {managerDispatches.length ? (
                  <div className="maintenance-quote-list">
                    {managerDispatches.map((dispatch) => (
                      <div key={dispatch.id} className="maintenance-quote-card">
                        <div className="maintenance-quote-top">
                          <div>
                            <h4>
                              {dispatch.provider?.companyName ||
                                dispatch.provider?.user?.name ||
                                "Provider"}
                            </h4>
                            <p>
                              Sent {formatDateTime(dispatch.sentAt)} • Viewed {formatDateTime(dispatch.viewedAt)} • Responded {formatDateTime(dispatch.respondedAt)}
                            </p>
                          </div>
                          <span
                            className={`maintenance-badge ${
                              dispatch.status === "DECLINED"
                                ? "slate"
                                : dispatch.status === "QUOTED"
                                  ? "success"
                                  : dispatch.status === "VIEWED"
                                    ? "blue"
                                    : "amber"
                            }`}
                          >
                            {getDispatchLabel(dispatch.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="maintenance-empty mini">No dispatch history yet.</div>
                )}
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Workflow Actions</h3>
                  <span>Move the issue through operations</span>
                </div>

                <div className="maintenance-action-grid">
                  <div className="maintenance-action-card">
                    <label className="maintenance-label">Assign provider</label>
                    <select
                      className="maintenance-input"
                      value={assigningProviderId}
                      onChange={(e) => setAssigningProviderId(e.target.value)}
                      disabled={loadingProviders || isFinalRequest}
                    >
                      <option value="">Select provider</option>
                      {providerOptions.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.companyName || provider.user?.name || "Provider"} •{" "}
                          {provider.type}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="maintenance-primary-btn"
                      onClick={handleAssignProvider}
                      disabled={!canAssignProvider || busyAction === "assign"}
                    >
                      {busyAction === "assign" ? "Assigning..." : "Assign Provider"}
                    </button>
                  </div>

                  <div className="maintenance-action-card">
                    <label className="maintenance-label">Schedule inspection</label>
                    <input
                      className="maintenance-input"
                      type="datetime-local"
                      value={schedulingInspection}
                      onChange={(e) => setSchedulingInspection(e.target.value)}
                      disabled={isFinalRequest}
                    />
                    <button
                      type="button"
                      className="maintenance-secondary-btn"
                      onClick={handleScheduleInspection}
                      disabled={!canScheduleInspection || busyAction === "inspection"}
                    >
                      {busyAction === "inspection" ? "Saving..." : "Save Inspection"}
                    </button>
                  </div>

                  <div className="maintenance-action-card">
                    <label className="maintenance-label">Payment responsibility</label>
                    <select
                      className="maintenance-input"
                      value={paymentResponsibility || ""}
                      onChange={(e) =>
                        setPaymentResponsibility(
                          (e.target.value || null) as PaymentResponsibility,
                        )
                      }
                      disabled={isFinalRequest}
                    >
                      <option value="">Select responsibility</option>
                      <option value="PROPERTY">Property</option>
                      <option value="RESIDENT">Resident</option>
                      <option value="SHARED">Shared</option>
                    </select>
                    <button
                      type="button"
                      className="maintenance-secondary-btn"
                      onClick={handleSetResponsibility}
                      disabled={!canSetResponsibility || busyAction === "responsibility"}
                    >
                      {busyAction === "responsibility" ? "Saving..." : "Set Responsibility"}
                    </button>
                  </div>

                  <div className="maintenance-action-card">
                    <label className="maintenance-label">Schedule work</label>
                    <input
                      className="maintenance-input"
                      type="datetime-local"
                      value={schedulingWork}
                      onChange={(e) => setSchedulingWork(e.target.value)}
                      disabled={isFinalRequest}
                    />
                    <button
                      type="button"
                      className="maintenance-secondary-btn"
                      onClick={handleScheduleWork}
                      disabled={!canScheduleWork || busyAction === "schedule-work"}
                    >
                      {busyAction === "schedule-work" ? "Saving..." : "Save Work Date"}
                    </button>
                  </div>
                </div>

                <div className="maintenance-inline-actions">
                  <button
                    type="button"
                    className="maintenance-secondary-btn"
                    onClick={handleStartRepair}
                    disabled={!canStartRepair || busyAction === "start"}
                  >
                    {busyAction === "start" ? "Starting..." : "Start Repair"}
                  </button>

                  <button
                    type="button"
                    className="maintenance-primary-btn"
                    onClick={handleCompleteRepair}
                    disabled={!canRecordFinished || busyAction === "complete"}
                  >
                    {busyAction === "complete" ? "Saving..." : "Record Work Finished"}
                  </button>
                </div>

                {awaitingResidentConfirmation ? (
                  <div className="maintenance-description-card">
                    Work has been marked finished. This request is now awaiting resident confirmation before it becomes completed.
                  </div>
                ) : null}
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Approval & Payment Position</h3>
                  <span>Property approval, resident payment, and scheduling</span>
                </div>

                <div className="maintenance-info-grid three">
                  <div className="maintenance-info-card">
                    <span>Assigned Provider</span>
                    <strong>
                      {selectedRequest.assignedProvider?.companyName ||
                        selectedRequest.assignedProvider?.user?.name ||
                        "Not assigned"}
                    </strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Inspection</span>
                    <strong>{getResidentScheduleLabel(
                            selectedRequest.inspectionScheduledAt,
                            "Not scheduled yet",
                          )}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Work Scheduled</span>
                    <strong>{getResidentScheduleLabel(
                            selectedRequest.workScheduledAt,
                            "Pending",
                          )}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Payment Responsibility</span>
                    <strong>{formatResponsibility(selectedRequest.paymentResponsibility)}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Property Share</span>
                    <strong>{formatCurrency(computedShares.propertyShare)}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Resident Share</span>
                    <strong>{formatCurrency(computedShares.residentShare)}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Accepted Quote</span>
                    <strong>
                      {acceptedQuote
                        ? formatCurrency(acceptedQuote.totalAmount)
                        : "Not accepted"}
                    </strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Active Quote</span>
                    <strong>
                      {primaryQuote ? getQuoteLabel(primaryQuote.status) : "No quote"}
                    </strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Property Payment</span>
                    <strong>{propertyPaymentLabel}</strong>
                  </div>
                </div>

                {latestExpense ? (
                  <div className="maintenance-info-grid three">
                    <div className="maintenance-info-card">
                      <span>Linked expense</span>
                      <strong>{latestExpense.title}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Expense status</span>
                      <strong>{latestExpense.status}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Property payment</span>
                      <strong>{propertyPaymentLabel}</strong>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Quotes</h3>
                  <span>Compare submitted provider quotes</span>
                </div>

                {!selectedRequest.quotes?.length ? (
                  <div className="maintenance-empty mini">No quotes submitted yet.</div>
                ) : (
                  <div className="maintenance-quote-list">
                    {sortByNewest(selectedRequest.quotes).map((quote) => (
                      <div
                        key={quote.id}
                        className={`maintenance-quote-card ${
                          quote.status === "ACCEPTED" ? "accepted" : ""
                        }`}
                      >
                        <div className="maintenance-quote-top">
                          <div>
                            <h4>
                              {quote.provider?.companyName ||
                                quote.provider?.user?.name ||
                                "Provider"}
                            </h4>
                            <p>
                              {quote.provider?.type || "Provider"} •{" "}
                              {quote.provider?.rating
                                ? `${quote.provider.rating.toFixed(1)}★`
                                : "No rating"}
                            </p>
                          </div>

                          <span
                            className={`maintenance-badge ${
                              quote.status === "ACCEPTED"
                                ? "success"
                                : quote.status === "REJECTED"
                                  ? "slate"
                                  : "amber"
                            }`}
                          >
                            {getQuoteLabel(quote.status)}
                          </span>
                        </div>

                        <div className="maintenance-info-grid three compact">
                          <div className="maintenance-info-card">
                            <span>Total</span>
                            <strong>{formatCurrency(quote.totalAmount)}</strong>
                          </div>
                          <div className="maintenance-info-card">
                            <span>Labor</span>
                            <strong>{formatCurrency(quote.laborCost)}</strong>
                          </div>
                          <div className="maintenance-info-card">
                            <span>Materials</span>
                            <strong>{formatCurrency(quote.materialsCost)}</strong>
                          </div>
                        </div>

                        {quote.items?.length ? (
                          <div className="maintenance-info-grid three compact">
                            {quote.items.map((item) => (
                              <div key={item.id} className="maintenance-info-card">
                                <span>{item.description}</span>
                                <strong>{formatCurrency(item.total)}</strong>
                                <small>
                                  Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                                </small>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="maintenance-quote-bottom">
                          <p>{quote.notes || "No notes added."}</p>
                          {quote.status !== "ACCEPTED" ? (
                            <button
                              type="button"
                              className="maintenance-primary-btn"
                              onClick={() => handleAcceptQuote(quote.id)}
                              disabled={
                                busyAction === `quote-${quote.id}` ||
                                !canAcceptMaintenanceQuote(selectedRequest, quote)
                              }
                            >
                              {busyAction === `quote-${quote.id}`
                                ? "Accepting..."
                                : "Accept Quote"}
                            </button>
                          ) : (
                            <span className="maintenance-static-note">
                              Accepted on {formatDateTime(quote.acceptedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Completion & Payment</h3>
                  <span>Operational finish, resident confirmation, and payment</span>
                </div>

                <div className="maintenance-info-grid three">
                  <div className="maintenance-info-card">
                    <span>Work finished</span>
                    <strong>{workFinishedLabel}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Resident payment</span>
                    <strong>{residentPaymentLabel}</strong>
                  </div>
                  <div className="maintenance-info-card">
                    <span>Reference</span>
                    <strong>
                      {selectedRequest.paymentReference ||
                        latestExpense?.paymentReference ||
                        "Not recorded"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="maintenance-detail-section">
                <div className="maintenance-section-head">
                  <h3>Provider Payout & Review</h3>
                  <span>Provider earnings, platform fee, and resident feedback</span>
                </div>

                {latestPayout ? (
                  <div className="maintenance-info-grid three">
                    <div className="maintenance-info-card">
                      <span>Payout status</span>
                      <strong>{getPayoutLabel(latestPayout.status)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Provider earning</span>
                      <strong>{formatCurrency(latestPayout.providerEarning)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Platform fee</span>
                      <strong>{formatCurrency(latestPayout.platformFee)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="maintenance-empty mini">No provider payout has been created yet. It will appear after resident confirmation and payout creation.</div>
                )}

                {managerReviews.length ? (
                  <div className="maintenance-quote-list">
                    {managerReviews.map((review) => (
                      <div key={review.id} className="maintenance-quote-card">
                        <div className="maintenance-quote-top">
                          <div>
                            <h4>{Number(review.rating || 0).toFixed(1)}★ resident review</h4>
                            <p>{review.comment || "No comment added."}</p>
                          </div>
                          <span className="maintenance-badge success">Reviewed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="maintenance-empty mini">No resident review has been submitted yet.</div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ProviderMaintenanceView() {
  const [activeFilter, setActiveFilter] = useState<
    "dispatches" | "jobs" | "quotes" | "payouts"
  >("dispatches");
  const [dispatches, setDispatches] = useState<ProviderDispatchItem[]>([]);
  const [jobs, setJobs] = useState<MaintenanceRequestItem[]>([]);
  const [quotes, setQuotes] = useState<ProviderQuoteItem[]>([]);
  const [payouts, setPayouts] = useState<ProviderPayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [quoteForm, setQuoteForm] = useState<Record<
    string,
    {
      amount: string;
      laborCost: string;
      materialsCost: string;
      estimatedDurationHours: string;
      notes: string;
    }
  >>({});

  async function loadAll() {
    try {
      setLoading(true);
      const [dispatchRes, jobsRes, quotesRes, payoutsRes] = await Promise.all([
        api.get<ProviderDispatchItem[]>("/maintenance/provider/dispatches"),
        api.get<MaintenanceRequestItem[]>("/maintenance/provider/jobs"),
        api.get<ProviderQuoteItem[]>("/maintenance/provider/quotes"),
        api.get<ProviderPayoutItem[]>("/maintenance/provider/payouts"),
      ]);

      const sortByLatest = <T extends { createdAt?: string; sentAt?: string }>(items: T[]) =>
        [...items].sort(
          (a, b) =>
            new Date(b.createdAt || b.sentAt || 0).getTime() -
            new Date(a.createdAt || a.sentAt || 0).getTime(),
        );

      setDispatches(sortByLatest(dispatchRes.data ?? []));
      setJobs(sortByLatest(jobsRes.data ?? []));
      setQuotes(sortByLatest(quotesRes.data ?? []));
      setPayouts(sortByLatest(payoutsRes.data ?? []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const summary = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
    const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
    const pendingPayouts = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + toNumber(p.providerEarning), 0);

    return {
      dispatches: dispatches.length,
      quoted: quotes.filter((q) => q.status === "ACCEPTED").length,
      activeJobs,
      completedJobs,
      pendingPayouts,
    };
  }, [dispatches, jobs, quotes, payouts]);

  function getQuoteForm(requestId: string) {
    return (
      quoteForm[requestId] || {
        amount: "",
        laborCost: "",
        materialsCost: "",
        estimatedDurationHours: "",
        notes: "",
      }
    );
  }

  function updateQuoteForm(requestId: string, patch: Record<string, string>) {
    setQuoteForm((prev) => ({
      ...prev,
      [requestId]: {
        ...getQuoteForm(requestId),
        ...patch,
      },
    }));
  }

  async function handleViewDispatch(requestId: string) {
    try {
      setBusyAction(`view-${requestId}`);
      await api.patch(`/maintenance/provider/dispatch/${requestId}/view`);
      await loadAll();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAcceptDispatch(requestId: string) {
    try {
      setBusyAction(`accept-${requestId}`);
      await api.patch(`/maintenance/provider/dispatch/${requestId}/accept`);
      await loadAll();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeclineDispatch(requestId: string) {
    try {
      setBusyAction(`decline-${requestId}`);
      await api.patch(`/maintenance/provider/dispatch/${requestId}/decline`);
      await loadAll();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSubmitQuote(requestId: string) {
    const form = getQuoteForm(requestId);
    if (!form.amount) return;

    try {
      setBusyAction(`quote-${requestId}`);
      await api.post("/maintenance/provider/quote", {
        requestId,
        amount: Number(form.amount),
        laborCost: form.laborCost ? Number(form.laborCost) : undefined,
        materialsCost: form.materialsCost ? Number(form.materialsCost) : undefined,
        estimatedDurationHours: form.estimatedDurationHours
          ? Number(form.estimatedDurationHours)
          : undefined,
        notes: form.notes || undefined,
      });

      setQuoteForm((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });

      await loadAll();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="maintenance-shell">
      <section className="maintenance-hero">
        <div className="maintenance-hero-copy">
          <p className="maintenance-eyebrow">Provider Maintenance Workspace</p>
          <h1 className="maintenance-title">
            Review dispatches, quote faster, manage active jobs, and track payouts
          </h1>
          <p className="maintenance-text">
            A provider-facing workspace for incoming assignments, quote handling,
            active work, and payout visibility without affecting the resident or manager flows.
          </p>

          <div className="maintenance-tags">
            <span className="maintenance-tag">Dispatches</span>
            <span className="maintenance-tag">Quotes</span>
            <span className="maintenance-tag">Jobs</span>
            <span className="maintenance-tag">Payouts</span>
          </div>
        </div>

        <div className="maintenance-hero-grid">
          <div className="maintenance-stat-card dark">
            <span>Dispatches</span>
            <strong>{summary.dispatches}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Active Jobs</span>
            <strong>{summary.activeJobs}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Completed</span>
            <strong>{summary.completedJobs}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Pending Payouts</span>
            <strong>{formatCurrency(summary.pendingPayouts)}</strong>
          </div>
        </div>
      </section>

      <section className="maintenance-toolbar">
        <div className="maintenance-filter-row">
          {[
            ["dispatches", "Dispatches"],
            ["jobs", "Jobs"],
            ["quotes", "Quotes"],
            ["payouts", "Payouts"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`maintenance-filter-pill ${
                activeFilter === key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(key as any)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="maintenance-section-shell">
        {loading ? (
          <div className="maintenance-empty">Loading provider workspace...</div>
        ) : activeFilter === "dispatches" ? (
          <div className="maintenance-provider-grid">
            {dispatches.length === 0 ? (
              <div className="maintenance-empty">No dispatches yet.</div>
            ) : (
              dispatches.map((dispatch) => (
                <div key={dispatch.id} className="maintenance-provider-card">
                  <div className="maintenance-provider-top">
                    <div>
                      <h3>{dispatch.request?.title || "Maintenance Request"}</h3>
                      <p>
                        {dispatch.request?.property?.title || "Property"} • Unit{" "}
                        {dispatch.request?.unit?.number || "—"}
                      </p>
                    </div>
                    <span className={`maintenance-badge ${dispatch.status === "DECLINED" ? "slate" : "amber"}`}>
                      {getDispatchLabel(dispatch.status)}
                    </span>
                  </div>

                  <div className="maintenance-info-grid three compact">
                    <div className="maintenance-info-card">
                      <span>Sent</span>
                      <strong>{formatDateTime(dispatch.sentAt)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Viewed</span>
                      <strong>{formatDateTime(dispatch.viewedAt)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Responded</span>
                      <strong>{formatDateTime(dispatch.respondedAt)}</strong>
                    </div>
                  </div>

                  <div className="maintenance-inline-actions">
                    <button
                      type="button"
                      className="maintenance-secondary-btn"
                      onClick={() => handleViewDispatch(dispatch.request?.id || "")}
                      disabled={!dispatch.request?.id || busyAction === `view-${dispatch.request?.id}`}
                    >
                      {busyAction === `view-${dispatch.request?.id}` ? "Saving..." : "Mark Viewed"}
                    </button>
                    <button
                      type="button"
                      className="maintenance-primary-btn"
                      onClick={() => handleAcceptDispatch(dispatch.request?.id || "")}
                      disabled={!dispatch.request?.id || busyAction === `accept-${dispatch.request?.id}`}
                    >
                      {busyAction === `accept-${dispatch.request?.id}` ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      className="maintenance-secondary-btn danger"
                      onClick={() => handleDeclineDispatch(dispatch.request?.id || "")}
                      disabled={!dispatch.request?.id || busyAction === `decline-${dispatch.request?.id}`}
                    >
                      {busyAction === `decline-${dispatch.request?.id}` ? "Saving..." : "Decline"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeFilter === "jobs" ? (
          <div className="maintenance-provider-grid">
            {jobs.length === 0 ? (
              <div className="maintenance-empty">No active jobs yet.</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="maintenance-provider-card">
                  <div className="maintenance-provider-top">
                    <div>
                      <h3>{job.title}</h3>
                      <p>
                        {job.property?.title || "Property"} • Unit {job.unit?.number || "—"}
                      </p>
                    </div>
                    <span className={`maintenance-badge ${getStatusTone(job.status)}`}>
                      {formatStatusLabel(job.status)}
                    </span>
                  </div>

                  <div className="maintenance-description-card">
                    {job.description}
                  </div>

                  <div className="maintenance-info-grid three compact">
                    <div className="maintenance-info-card">
                      <span>Inspection</span>
                      <strong>{formatDateTime(job.inspectionScheduledAt)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Work Scheduled</span>
                      <strong>{formatDateTime(job.workScheduledAt)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Completed</span>
                      <strong>{formatDateTime(job.workCompletedAt)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeFilter === "quotes" ? (
          <div className="maintenance-provider-grid">
            {dispatches.length === 0 && quotes.length === 0 ? (
              <div className="maintenance-empty">No quotes available.</div>
            ) : (
              <>
                {dispatches
                  .filter((dispatch) => !!dispatch.request?.id)
                  .map((dispatch) => {
                    const requestId = dispatch.request?.id || "";
                    const existingQuote = quotes.find((q) => q.request?.id === requestId);
                    const form = getQuoteForm(requestId);

                    return (
                      <div key={`quote-form-${requestId}`} className="maintenance-provider-card">
                        <div className="maintenance-provider-top">
                          <div>
                            <h3>{dispatch.request?.title || "Request"}</h3>
                            <p>
                              {dispatch.request?.property?.title || "Property"} • Unit{" "}
                              {dispatch.request?.unit?.number || "—"}
                            </p>
                          </div>
                          <span className={`maintenance-badge ${existingQuote ? "success" : "amber"}`}>
                            {existingQuote ? getQuoteLabel(existingQuote.status) : "Quote Needed"}
                          </span>
                        </div>

                        {existingQuote ? (
                          <div className="maintenance-info-grid three compact">
                            <div className="maintenance-info-card">
                              <span>Total</span>
                              <strong>{formatCurrency(existingQuote.totalAmount)}</strong>
                            </div>
                            <div className="maintenance-info-card">
                              <span>Labor</span>
                              <strong>{formatCurrency(existingQuote.laborCost)}</strong>
                            </div>
                            <div className="maintenance-info-card">
                              <span>Materials</span>
                              <strong>{formatCurrency(existingQuote.materialsCost)}</strong>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="maintenance-action-grid provider">
                              <div className="maintenance-action-card">
                                <label className="maintenance-label">Total amount</label>
                                <input
                                  className="maintenance-input"
                                  value={form.amount}
                                  onChange={(e) =>
                                    updateQuoteForm(requestId, { amount: e.target.value })
                                  }
                                  placeholder="Amount"
                                />
                              </div>
                              <div className="maintenance-action-card">
                                <label className="maintenance-label">Labor</label>
                                <input
                                  className="maintenance-input"
                                  value={form.laborCost}
                                  onChange={(e) =>
                                    updateQuoteForm(requestId, { laborCost: e.target.value })
                                  }
                                  placeholder="Labor cost"
                                />
                              </div>
                              <div className="maintenance-action-card">
                                <label className="maintenance-label">Materials</label>
                                <input
                                  className="maintenance-input"
                                  value={form.materialsCost}
                                  onChange={(e) =>
                                    updateQuoteForm(requestId, { materialsCost: e.target.value })
                                  }
                                  placeholder="Materials cost"
                                />
                              </div>
                              <div className="maintenance-action-card">
                                <label className="maintenance-label">Duration (hrs)</label>
                                <input
                                  className="maintenance-input"
                                  value={form.estimatedDurationHours}
                                  onChange={(e) =>
                                    updateQuoteForm(requestId, {
                                      estimatedDurationHours: e.target.value,
                                    })
                                  }
                                  placeholder="Hours"
                                />
                              </div>
                            </div>

                            <div className="maintenance-action-card full">
                              <label className="maintenance-label">Notes</label>
                              <textarea
                                className="maintenance-input maintenance-textarea"
                                value={form.notes}
                                onChange={(e) =>
                                  updateQuoteForm(requestId, { notes: e.target.value })
                                }
                                placeholder="Scope, parts, timing, remarks..."
                              />
                            </div>

                            <button
                              type="button"
                              className="maintenance-primary-btn"
                              onClick={() => handleSubmitQuote(requestId)}
                              disabled={!form.amount || busyAction === `quote-${requestId}`}
                            >
                              {busyAction === `quote-${requestId}`
                                ? "Submitting..."
                                : "Submit Quote"}
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}

                {quotes
                  .filter((quote) => !!quote.request?.id)
                  .map((quote) => (
                    <div key={quote.id} className="maintenance-provider-card">
                      <div className="maintenance-provider-top">
                        <div>
                          <h3>{quote.request?.title || "Quote"}</h3>
                          <p>
                            {quote.request?.property?.title || "Property"} • Unit{" "}
                            {quote.request?.unit?.number || "—"}
                          </p>
                        </div>
                        <span
                          className={`maintenance-badge ${
                            quote.status === "ACCEPTED" ? "success" : "amber"
                          }`}
                        >
                          {getQuoteLabel(quote.status)}
                        </span>
                      </div>

                      <div className="maintenance-info-grid three compact">
                        <div className="maintenance-info-card">
                          <span>Total</span>
                          <strong>{formatCurrency(quote.totalAmount)}</strong>
                        </div>
                        <div className="maintenance-info-card">
                          <span>Labor</span>
                          <strong>{formatCurrency(quote.laborCost)}</strong>
                        </div>
                        <div className="maintenance-info-card">
                          <span>Materials</span>
                          <strong>{formatCurrency(quote.materialsCost)}</strong>
                        </div>
                      </div>

                      <div className="maintenance-description-card">
                        {quote.notes || "No notes added."}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        ) : (
          <div className="maintenance-provider-grid">
            {payouts.length === 0 ? (
              <div className="maintenance-empty">No payouts yet.</div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="maintenance-provider-card">
                  <div className="maintenance-provider-top">
                    <div>
                      <h3>{payout.request?.title || "Payout"}</h3>
                      <p>
                        {payout.request?.property?.title || "Property"} • Unit{" "}
                        {payout.request?.unit?.number || "—"}
                      </p>
                    </div>
                    <span
                      className={`maintenance-badge ${
                        payout.status === "COMPLETED" ? "success" : "amber"
                      }`}
                    >
                      {getPayoutLabel(payout.status)}
                    </span>
                  </div>

                  <div className="maintenance-info-grid three compact">
                    <div className="maintenance-info-card">
                      <span>Total</span>
                      <strong>{formatCurrency(payout.totalAmount)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Platform Fee</span>
                      <strong>{formatCurrency(payout.platformFee)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Your Earning</span>
                      <strong>{formatCurrency(payout.providerEarning)}</strong>
                    </div>
                  </div>

                  <div className="maintenance-static-note">
                    Created {formatDateTime(payout.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminMaintenanceView() {
  const [requests, setRequests] = useState<MaintenanceRequestItem[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [requestsRes, analyticsRes] = await Promise.all([
        api.get<MaintenanceRequestItem[]>("/maintenance/admin/all", {
          params: statusFilter !== "all" ? { status: statusFilter } : undefined,
        }),
        api.get<PlatformAnalytics>("/maintenance/admin/analytics"),
      ]);

      const rows = (requestsRes.data ?? []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setRequests(rows);
      setAnalytics(analyticsRes.data ?? null);
      if (rows.length > 0) setSelectedId((current) => current ?? rows[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((item) =>
      [
        item.title,
        item.description,
        item.category,
        item.status,
        item.priority,
        item.property?.title,
        item.property?.location,
        item.unit?.number,
        item.resident?.user?.name,
        item.assignedProvider?.companyName,
        item.assignedProvider?.user?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [requests, search]);

  const selectedRequest =
    filteredRequests.find((item) => item.id === selectedId) ||
    requests.find((item) => item.id === selectedId) ||
    filteredRequests[0] ||
    null;

  const computedShares = getComputedShares(selectedRequest);

  return (
    <div className="maintenance-shell">
      <section className="maintenance-hero">
        <div className="maintenance-hero-copy">
          <p className="maintenance-eyebrow">Admin Maintenance Command Center</p>
          <h1 className="maintenance-title">
            Monitor platform-wide maintenance flow, approvals, providers, payouts, and repair pressure
          </h1>
          <p className="maintenance-text">
            Admin oversight across all properties, providers, repair states, quote behavior,
            and maintenance-linked financial movement.
          </p>

          <div className="maintenance-tags">
            <span className="maintenance-tag">Platform oversight</span>
            <span className="maintenance-tag">Provider performance</span>
            <span className="maintenance-tag">Quote behavior</span>
            <span className="maintenance-tag">Payout visibility</span>
          </div>
        </div>

        <div className="maintenance-hero-grid">
          <div className="maintenance-stat-card dark">
            <span>Total Requests</span>
            <strong>{analytics?.totalRequests ?? 0}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Open</span>
            <strong>{analytics?.openRequests ?? 0}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Completed</span>
            <strong>{analytics?.completedRequests ?? 0}</strong>
          </div>
          <div className="maintenance-stat-card">
            <span>Platform Fee</span>
            <strong>{formatCurrency(analytics?.totalPlatformFee ?? 0)}</strong>
          </div>
        </div>
      </section>

      <section className="maintenance-overview-strip">
        <div className="maintenance-overview-box">
          <span>Average completion</span>
          <strong>{(analytics?.avgCompletionHours ?? 0).toFixed(1)} hrs</strong>
        </div>
        <div className="maintenance-overview-box">
          <span>Quote acceptance</span>
          <strong>{(analytics?.quoteAcceptanceRate ?? 0).toFixed(0)}%</strong>
        </div>
        <div className="maintenance-overview-box">
          <span>Pending payouts</span>
          <strong>{analytics?.pendingPayoutCount ?? 0}</strong>
        </div>
        <div className="maintenance-overview-box">
          <span>Linked expenses</span>
          <strong>{formatCurrency(analytics?.linkedExpenseAmount ?? 0)}</strong>
        </div>
      </section>

      <section className="maintenance-toolbar">
        <div className="maintenance-filter-row">
          {[
            ["all", "All"],
            ["PENDING", "Pending"],
            ["QUOTED", "Quoted"],
            ["APPROVED", "Approved"],
            ["IN_PROGRESS", "In Progress"],
            ["COMPLETED", "Completed"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`maintenance-filter-pill ${
                statusFilter === key ? "active" : ""
              }`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="maintenance-search-wrap">
          <input
            className="maintenance-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request, property, provider, resident..."
          />
        </div>
      </section>

      <section className="maintenance-admin-grid">
        <div className="maintenance-admin-side">
          <div className="maintenance-panel-card">
            <div className="maintenance-panel-head">
              <div>
                <h2 className="maintenance-panel-title">Platform Queue</h2>
                <p className="maintenance-panel-subtitle">
                  Full maintenance registry across the platform
                </p>
              </div>
              <span className="maintenance-chip">
                {loading ? "Loading..." : `${filteredRequests.length} items`}
              </span>
            </div>

            {loading ? (
              <div className="maintenance-empty">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="maintenance-empty">No maintenance requests found.</div>
            ) : (
              <div className="maintenance-queue-list">
                {filteredRequests.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`maintenance-queue-row ${
                      selectedRequest?.id === item.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="maintenance-queue-top">
                      <div className="maintenance-queue-top-tags">
                        <span className={`maintenance-badge ${getPriorityTone(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`maintenance-badge ${getStatusTone(item.status)}`}>
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      <span className="maintenance-queue-date">{formatDate(item.createdAt)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.property?.title || "Property"} •{" "}
                      {item.assignedProvider?.companyName ||
                        item.assignedProvider?.user?.name ||
                        "No provider"}
                    </p>
                    <div className="maintenance-queue-bottom">
                      <span>{item.category || "General"}</span>
                      <strong>{formatCurrency(item.estimatedCost)}</strong>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="maintenance-panel-card">
            <div className="maintenance-panel-head">
              <div>
                <h2 className="maintenance-panel-title">Top Providers</h2>
                <p className="maintenance-panel-subtitle">
                  Best-covered provider performance snapshot
                </p>
              </div>
            </div>

            {!analytics?.topProviders?.length ? (
              <div className="maintenance-empty mini">No provider data yet.</div>
            ) : (
              <div className="maintenance-provider-score-list">
                {analytics.topProviders.map((provider) => (
                  <div key={provider.providerId} className="maintenance-provider-score-card">
                    <div>
                      <h4>{provider.providerName}</h4>
                      <p>{provider.jobs} jobs handled</p>
                    </div>
                    <div className="maintenance-provider-score-side">
                      <strong>
                        {provider.avgRating > 0 ? provider.avgRating.toFixed(1) : "—"}★
                      </strong>
                      <span>{provider.completedPayouts} paid</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="maintenance-admin-main">
          <div className="maintenance-panel-card">
            {!selectedRequest ? (
              <div className="maintenance-empty detail">Select a request to inspect.</div>
            ) : (
              <>
                <div className="maintenance-detail-hero">
                  <div>
                    <div className="maintenance-detail-topline">
                      <span className={`maintenance-badge ${getPriorityTone(selectedRequest.priority)}`}>
                        {selectedRequest.priority}
                      </span>
                      <span className={`maintenance-badge ${getStatusTone(selectedRequest.status)}`}>
                        {formatStatusLabel(selectedRequest.status)}
                      </span>
                      <span className="maintenance-badge subtle">
                        {selectedRequest.category || "General"}
                      </span>
                    </div>

                    <h2 className="maintenance-detail-title">{selectedRequest.title}</h2>
                    <p className="maintenance-detail-subtitle">
                      {selectedRequest.property?.title || "Property"} • Unit{" "}
                      {selectedRequest.unit?.number || "—"} •{" "}
                      {selectedRequest.property?.location || "No location"}
                    </p>
                  </div>

                  <div className="maintenance-cost-box">
                    <span>Estimated Cost</span>
                    <strong>{formatCurrency(selectedRequest.estimatedCost)}</strong>
                  </div>
                </div>

                <section className="maintenance-detail-section">
                  <div className="maintenance-section-head">
                    <h3>Request Context</h3>
                    <span>Platform-wide detail</span>
                  </div>

                  <div className="maintenance-description-card">
                    {selectedRequest.description}
                  </div>

                  <div className="maintenance-info-grid three">
                    <div className="maintenance-info-card">
                      <span>Resident</span>
                      <strong>
                        {selectedRequest.resident?.user?.name ||
                          selectedRequest.resident?.user?.email ||
                          "Not linked"}
                      </strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Provider</span>
                      <strong>
                        {selectedRequest.assignedProvider?.companyName ||
                          selectedRequest.assignedProvider?.user?.name ||
                          "Not assigned"}
                      </strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Next Step</span>
                      <strong>{getNextActionLabel(selectedRequest)}</strong>
                    </div>
                  </div>
                </section>

                <section className="maintenance-detail-section">
                  <div className="maintenance-section-head">
                    <h3>Financial Position</h3>
                    <span>Approval and payout visibility</span>
                  </div>

                  <div className="maintenance-info-grid three">
                    <div className="maintenance-info-card">
                      <span>Responsibility</span>
                      <strong>{formatResponsibility(selectedRequest.paymentResponsibility)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Property Share</span>
                      <strong>{formatCurrency(computedShares.propertyShare)}</strong>
                    </div>
                    <div className="maintenance-info-card">
                      <span>Resident Share</span>
                      <strong>{formatCurrency(computedShares.residentShare)}</strong>
                    </div>
                  </div>

                  {selectedRequest.expenses?.length ? (
                    <div className="maintenance-linked-list">
                      {selectedRequest.expenses.map((expense) => (
                        <div key={expense.id} className="maintenance-linked-card">
                          <div>
                            <h4>{expense.title}</h4>
                            <p>{formatCurrency(expense.amount)}</p>
                          </div>
                          <span className={`maintenance-badge ${getExpenseTone(expense.status)}`}>
                            {expense.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="maintenance-empty mini">No linked expenses yet.</div>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="maintenance-panel-card">
            <div className="maintenance-panel-head">
              <div>
                <h2 className="maintenance-panel-title">Property Breakdown</h2>
                <p className="maintenance-panel-subtitle">
                  Maintenance pressure by property
                </p>
              </div>
            </div>

            {!analytics?.propertyBreakdown?.length ? (
              <div className="maintenance-empty mini">No property analytics yet.</div>
            ) : (
              <div className="maintenance-property-breakdown">
                {analytics.propertyBreakdown.map((property) => (
                  <div key={property.propertyId} className="maintenance-property-card">
                    <div className="maintenance-property-top">
                      <h4>{property.propertyTitle}</h4>
                      <span>{property.location || "No location"}</span>
                    </div>

                    <div className="maintenance-info-grid three compact">
                      <div className="maintenance-info-card">
                        <span>Total</span>
                        <strong>{property.totalRequests}</strong>
                      </div>
                      <div className="maintenance-info-card">
                        <span>Open</span>
                        <strong>{property.openRequests}</strong>
                      </div>
                      <div className="maintenance-info-card">
                        <span>Complete Rate</span>
                        <strong>{property.completionRate}%</strong>
                      </div>
                    </div>

                    <div className="maintenance-static-note">
                      Estimated value {formatCurrency(property.totalEstimatedCost)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [role, setRole] = useState<Role>((user?.role as Role) || null);
  const [residentRequests, setResidentRequests] = useState<MaintenanceRequestItem[]>([]);
  const [residentLoading, setResidentLoading] = useState(true);

  async function reloadResident() {
    try {
      setResidentLoading(true);
      const res = await api.get<MaintenanceRequestItem[]>("/maintenance/resident/me");
      setResidentRequests(
        (res.data ?? []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } finally {
      setResidentLoading(false);
    }
  }

  useEffect(() => {
    const resolvedRole = (user?.role as Role) || getRoleFromStoredUser();
    setRole(resolvedRole);

    if (resolvedRole === "RESIDENT") {
      reloadResident();
    }
  }, [user?.role]);

  if (role === "RESIDENT") {
    return (
      <ResidentMaintenanceView
        requests={residentRequests}
        loading={residentLoading}
        onRefresh={reloadResident}
      />
    );
  }

  if (role === "MANAGER") {
    return <ManagerMaintenanceView />;
  }

  if (role === "SERVICE_PROVIDER") {
    return <ProviderMaintenanceView />;
  }

  if (role === "ADMIN") {
    return <AdminMaintenanceView />;
  }

  return (
    <div className="maintenance-shell">
      <section className="maintenance-hero">
        <div className="maintenance-hero-copy">
          <p className="maintenance-eyebrow">Maintenance</p>
          <h1 className="maintenance-title">Maintenance workspace</h1>
          <p className="maintenance-text">
            Your role does not currently have a maintenance workspace view.
          </p>
        </div>
      </section>

      <div className="maintenance-empty">
        This page is available for residents, managers, providers, and admin.
      </div>
    </div>
  );
}