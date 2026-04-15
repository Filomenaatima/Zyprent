"use client";

import "@/styles/job-requests.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type JobRequestItem = {
  id: string;
  requestId?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  propertyTitle?: string | null;
  unitNumber?: string | null;
  location?: string | null;
  status?: string | null;
  sentAt?: string | null;
  estimatedBudget?: number | null;
};

type ProviderDispatchApiItem = {
  id: string;
  status?: string | null;
  sentAt?: string | null;
  request?: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    priority?: string | null;
    estimatedCost?: number | null;
    property?: {
      title?: string | null;
      location?: string | null;
    } | null;
    unit?: {
      number?: string | null;
    } | null;
  } | null;
};

type QuoteFormState = {
  amount: string;
  laborCost: string;
  materialsCost: string;
  estimatedDurationHours: string;
  notes: string;
};

const initialQuoteForm: QuoteFormState = {
  amount: "",
  laborCost: "",
  materialsCost: "",
  estimatedDurationHours: "",
  notes: "",
};

function formatDate(value?: string | null) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value?: number | null) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function normalizeStatus(value?: string | null) {
  const raw = String(value || "SENT").toUpperCase();
  if (raw === "SENT") return "NEW";
  if (raw === "VIEWED" || raw === "QUOTED") return "RESPONDED";
  if (raw === "DECLINED" || raw === "EXPIRED") return "EXPIRED";
  return raw;
}

function formatStatusLabel(value?: string | null) {
  const status = normalizeStatus(value);
  if (status === "NEW") return "New";
  if (status === "RESPONDED") return "Responded";
  if (status === "EXPIRED") return "Expired";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPriority(value?: string | null) {
  const raw = String(value || "NORMAL").toUpperCase();
  if (raw === "EMERGENCY") return "Emergency";
  if (raw === "HIGH") return "High";
  if (raw === "MEDIUM") return "Medium";
  if (raw === "LOW") return "Low";
  return "Normal";
}

function priorityClass(value?: string | null) {
  const raw = String(value || "NORMAL").toLowerCase();
  if (raw === "emergency") return "emergency";
  if (raw === "high") return "high";
  if (raw === "medium") return "medium";
  if (raw === "low") return "low";
  return "normal";
}

function statusClass(value?: string | null) {
  const status = normalizeStatus(value).toLowerCase();
  if (status === "new") return "new";
  if (status === "responded") return "responded";
  if (status === "expired") return "expired";
  return "neutral";
}

export default function JobRequestsPage() {
  const [requests, setRequests] = useState<JobRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<JobRequestItem | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(initialQuoteForm);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);

      const res = await api.get("/maintenance/provider/dispatches");
      const rawData: ProviderDispatchApiItem[] = Array.isArray(res.data)
        ? res.data
        : [];

      const mapped: JobRequestItem[] = rawData.map((item) => ({
        id: item.id,
        requestId: item.request?.id ?? null,
        title: item.request?.title || "Maintenance request",
        description: item.request?.description || null,
        category: item.request?.category || null,
        priority: item.request?.priority || null,
        propertyTitle: item.request?.property?.title || null,
        unitNumber: item.request?.unit?.number || null,
        location: item.request?.property?.location || null,
        status: item.status || null,
        sentAt: item.sentAt || null,
        estimatedBudget: Number(item.request?.estimatedCost ?? 0),
      }));

      setRequests(mapped);
    } catch (error) {
      console.error("Failed to load provider dispatches", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const itemStatus = normalizeStatus(item.status);
      const itemPriority = String(item.priority || "NORMAL").toUpperCase();
      const query = search.trim().toLowerCase();

      const matchesStatus =
        statusFilter === "ALL" || itemStatus === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || itemPriority === priorityFilter;

      const matchesSearch =
        !query ||
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.description || "").toLowerCase().includes(query) ||
        String(item.propertyTitle || "").toLowerCase().includes(query) ||
        String(item.location || "").toLowerCase().includes(query) ||
        String(item.category || "").toLowerCase().includes(query);

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [requests, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const total = requests.length;
    const fresh = requests.filter(
      (item) => normalizeStatus(item.status) === "NEW",
    ).length;
    const responded = requests.filter(
      (item) => normalizeStatus(item.status) === "RESPONDED",
    ).length;
    const emergency = requests.filter(
      (item) => String(item.priority || "").toUpperCase() === "EMERGENCY",
    ).length;

    return { total, fresh, responded, emergency };
  }, [requests]);

  function openRespondModal(item: JobRequestItem) {
    setSelectedRequest(item);
    setQuoteError("");
    setQuoteSuccess("");
    setQuoteForm({
      amount: item.estimatedBudget ? String(item.estimatedBudget) : "",
      laborCost: "",
      materialsCost: "",
      estimatedDurationHours: "",
      notes: "",
    });
  }

  function closeRespondModal() {
    setSelectedRequest(null);
    setQuoteError("");
    setQuoteSuccess("");
    setQuoteForm(initialQuoteForm);
  }

  function updateQuoteForm<K extends keyof QuoteFormState>(
    field: K,
    value: QuoteFormState[K],
  ) {
    setQuoteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function submitQuote() {
    if (!selectedRequest?.requestId) {
      setQuoteError("This request is missing a valid request ID.");
      return;
    }

    if (!quoteForm.amount.trim()) {
      setQuoteError("Enter the total quote amount.");
      return;
    }

    try {
      setSubmittingQuote(true);
      setQuoteError("");
      setQuoteSuccess("");

      await api.post("/maintenance/provider/quotes", {
        requestId: selectedRequest.requestId,
        amount: Number(quoteForm.amount || 0),
        laborCost: quoteForm.laborCost ? Number(quoteForm.laborCost) : undefined,
        materialsCost: quoteForm.materialsCost
          ? Number(quoteForm.materialsCost)
          : undefined,
        estimatedDurationHours: quoteForm.estimatedDurationHours
          ? Number(quoteForm.estimatedDurationHours)
          : undefined,
        notes: quoteForm.notes || undefined,
      });

      setQuoteSuccess("Quote submitted successfully.");
      await loadRequests();

      setTimeout(() => {
        closeRespondModal();
      }, 900);
    } catch (error: any) {
      console.error("Failed to submit quote", error);
      setQuoteError(
        error?.response?.data?.message || "Failed to submit quote.",
      );
    } finally {
      setSubmittingQuote(false);
    }
  }

  return (
    <div className="job-requests-page-shell">
      <section className="job-requests-hero">
        <div className="job-requests-hero-copy">
          <p className="job-requests-eyebrow">Service provider workflow</p>
          <h1 className="job-requests-title">Job Requests</h1>
          <p className="job-requests-text">
            Review incoming dispatches, assess urgency, and turn requests into
            approved quotes with a faster field-ready workflow.
          </p>
        </div>

        <div className="job-requests-hero-side">
          <div className="job-requests-mini-stat">
            <span>Total requests</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="job-requests-mini-stat">
            <span>New</span>
            <strong>{stats.fresh}</strong>
          </div>
          <div className="job-requests-mini-stat">
            <span>Emergency</span>
            <strong>{stats.emergency}</strong>
          </div>
        </div>
      </section>

      <section className="job-requests-toolbar">
        <div className="job-requests-search-wrap">
          <input
            type="text"
            placeholder="Search job requests"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="job-requests-search"
          />
        </div>

        <div className="job-requests-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="job-requests-select"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="RESPONDED">Responded</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="job-requests-select"
          >
            <option value="ALL">All Priority</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </section>

      <section className="job-requests-stats-grid">
        <div className="job-requests-stat-card">
          <p>Total Requests</p>
          <h3>{stats.total}</h3>
        </div>
        <div className="job-requests-stat-card">
          <p>New Requests</p>
          <h3>{stats.fresh}</h3>
        </div>
        <div className="job-requests-stat-card">
          <p>Responded</p>
          <h3>{stats.responded}</h3>
        </div>
        <div className="job-requests-stat-card">
          <p>Emergency</p>
          <h3>{stats.emergency}</h3>
        </div>
      </section>

      {loading ? (
        <section className="job-requests-loading-state">
          <div className="job-requests-empty-card">Loading job requests...</div>
        </section>
      ) : filteredRequests.length === 0 ? (
        <section className="job-requests-empty-state">
          <div className="job-requests-empty-card">
            No job requests match your current filters.
          </div>
        </section>
      ) : (
        <section className="job-requests-grid">
          {filteredRequests.map((item) => (
            <article key={item.id} className="job-request-card">
              <div className="job-request-top">
                <div className="job-request-top-copy">
                  <h3 className="job-request-title">{item.title}</h3>
                  <p className="job-request-property">
                    {item.propertyTitle || "Property"}
                    {item.unitNumber ? ` · Unit ${item.unitNumber}` : ""}
                  </p>
                </div>

                <div className="job-request-badges">
                  <span
                    className={`job-request-badge priority ${priorityClass(
                      item.priority,
                    )}`}
                  >
                    {formatPriority(item.priority)}
                  </span>
                  <span
                    className={`job-request-badge status ${statusClass(
                      item.status,
                    )}`}
                  >
                    {formatStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              <div className="job-request-route-line">
                <div className="job-route-stop active">
                  <span className="job-route-dot" />
                  <small>Received</small>
                </div>
                <div className="job-route-connector" />
                <div
                  className={`job-route-stop ${
                    normalizeStatus(item.status) === "RESPONDED" ? "active" : ""
                  }`}
                >
                  <span className="job-route-dot" />
                  <small>Quote</small>
                </div>
                <div className="job-route-connector" />
                <div className="job-route-stop">
                  <span className="job-route-dot" />
                  <small>Approval</small>
                </div>
              </div>

              <div className="job-request-meta">
                <div className="job-request-meta-item">
                  <span>Category</span>
                  <strong>{item.category || "General"}</strong>
                </div>
                <div className="job-request-meta-item">
                  <span>Location</span>
                  <strong>{item.location || "Not set"}</strong>
                </div>
                <div className="job-request-meta-item">
                  <span>Sent</span>
                  <strong>{formatDate(item.sentAt)}</strong>
                </div>
                <div className="job-request-meta-item">
                  <span>Budget</span>
                  <strong>
                    {item.estimatedBudget
                      ? formatCurrency(item.estimatedBudget)
                      : "Not set"}
                  </strong>
                </div>
              </div>

              <p className="job-request-description">
                {item.description || "No additional description provided."}
              </p>

              <div className="job-request-actions">
                <button
                  className="job-request-btn primary"
                  onClick={() => openRespondModal(item)}
                >
                  Respond
                </button>
                <button className="job-request-btn secondary">
                  View Details
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedRequest && (
        <div className="quote-modal-overlay" onClick={closeRespondModal}>
          <div
            className="quote-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quote-modal-header">
              <div>
                <p className="quote-modal-eyebrow">Create quote</p>
                <h2 className="quote-modal-title">{selectedRequest.title}</h2>
                <p className="quote-modal-subtitle">
                  {selectedRequest.propertyTitle || "Property"}
                  {selectedRequest.unitNumber
                    ? ` · Unit ${selectedRequest.unitNumber}`
                    : ""}
                </p>
              </div>

              <button
                className="quote-modal-close"
                onClick={closeRespondModal}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="quote-modal-request-card">
              <div className="quote-modal-request-row">
                <span>Category</span>
                <strong>{selectedRequest.category || "General"}</strong>
              </div>
              <div className="quote-modal-request-row">
                <span>Priority</span>
                <strong>{formatPriority(selectedRequest.priority)}</strong>
              </div>
              <div className="quote-modal-request-row">
                <span>Location</span>
                <strong>{selectedRequest.location || "Not set"}</strong>
              </div>
              <div className="quote-modal-request-row">
                <span>Suggested budget</span>
                <strong>
                  {selectedRequest.estimatedBudget
                    ? formatCurrency(selectedRequest.estimatedBudget)
                    : "Not set"}
                </strong>
              </div>
            </div>

            <div className="quote-modal-grid">
              <label className="quote-field">
                <span>Total amount</span>
                <input
                  type="number"
                  value={quoteForm.amount}
                  onChange={(e) => updateQuoteForm("amount", e.target.value)}
                  placeholder="Enter total quote"
                />
              </label>

              <label className="quote-field">
                <span>Labor cost</span>
                <input
                  type="number"
                  value={quoteForm.laborCost}
                  onChange={(e) => updateQuoteForm("laborCost", e.target.value)}
                  placeholder="Enter labor cost"
                />
              </label>

              <label className="quote-field">
                <span>Materials cost</span>
                <input
                  type="number"
                  value={quoteForm.materialsCost}
                  onChange={(e) =>
                    updateQuoteForm("materialsCost", e.target.value)
                  }
                  placeholder="Enter materials cost"
                />
              </label>

              <label className="quote-field">
                <span>Estimated duration (hrs)</span>
                <input
                  type="number"
                  value={quoteForm.estimatedDurationHours}
                  onChange={(e) =>
                    updateQuoteForm("estimatedDurationHours", e.target.value)
                  }
                  placeholder="e.g. 3"
                />
              </label>
            </div>

            <label className="quote-field quote-field-full">
              <span>Notes</span>
              <textarea
                value={quoteForm.notes}
                onChange={(e) => updateQuoteForm("notes", e.target.value)}
                placeholder="Add a short explanation of the scope of work, materials, or timing."
                rows={4}
              />
            </label>

            {quoteError ? (
              <div className="quote-message error">{quoteError}</div>
            ) : null}

            {quoteSuccess ? (
              <div className="quote-message success">{quoteSuccess}</div>
            ) : null}

            <div className="quote-modal-actions">
              <button
                type="button"
                className="quote-modal-btn secondary"
                onClick={closeRespondModal}
                disabled={submittingQuote}
              >
                Cancel
              </button>
              <button
                type="button"
                className="quote-modal-btn primary"
                onClick={submitQuote}
                disabled={submittingQuote}
              >
                {submittingQuote ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}