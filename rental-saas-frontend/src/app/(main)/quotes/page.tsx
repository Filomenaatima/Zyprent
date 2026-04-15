"use client";

import "@/styles/quotes.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type QuoteItem = {
  id: string;
  totalAmount?: number | null;
  laborCost?: number | null;
  materialsCost?: number | null;
  estimatedDurationHours?: number | null;
  notes?: string | null;
  status?: string | null;
  createdAt: string;
  request?: {
    id: string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    priority?: string | null;
    property?: {
      title?: string | null;
      location?: string | null;
    } | null;
    unit?: {
      number?: string | null;
    } | null;
  } | null;
};

function formatCurrency(value?: number | null) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function formatStatusLabel(value?: string | null) {
  const raw = String(value || "PENDING").toUpperCase();
  return raw
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusClass(value?: string | null) {
  const raw = String(value || "PENDING").toUpperCase();
  if (raw === "ACCEPTED") return "accepted";
  if (raw === "REJECTED") return "rejected";
  if (raw === "PENDING") return "pending";
  return "neutral";
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadQuotes() {
      try {
        setLoading(true);
        const res = await api.get("/maintenance/provider/quotes");
        const data = Array.isArray(res.data) ? res.data : [];

        if (!mounted) return;
        setQuotes(data);
      } catch (error) {
        console.error("Failed to load provider quotes", error);
        if (mounted) setQuotes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadQuotes();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((item) => {
      const rawStatus = String(item.status || "PENDING").toUpperCase();
      const query = search.trim().toLowerCase();

      const matchesStatus =
        statusFilter === "ALL" || rawStatus === statusFilter;

      const matchesSearch =
        !query ||
        String(item.request?.title || "").toLowerCase().includes(query) ||
        String(item.request?.description || "").toLowerCase().includes(query) ||
        String(item.request?.property?.title || "").toLowerCase().includes(query) ||
        String(item.request?.property?.location || "").toLowerCase().includes(query) ||
        String(item.request?.category || "").toLowerCase().includes(query) ||
        String(item.notes || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter(
      (item) => String(item.status || "PENDING").toUpperCase() === "PENDING",
    ).length;
    const accepted = quotes.filter(
      (item) => String(item.status || "").toUpperCase() === "ACCEPTED",
    ).length;
    const rejected = quotes.filter(
      (item) => String(item.status || "").toUpperCase() === "REJECTED",
    ).length;

    return { total, pending, accepted, rejected };
  }, [quotes]);

  return (
    <div className="quotes-page-shell">
      <section className="quotes-hero">
        <div className="quotes-hero-copy">
          <p className="quotes-eyebrow">Service provider workflow</p>
          <h1 className="quotes-title">Quotes</h1>
          <p className="quotes-text">
            Track all submitted quotes, follow approval status, and keep your
            pricing organized in one clean workspace.
          </p>
        </div>

        <div className="quotes-hero-side">
          <div className="quotes-mini-stat">
            <span>Total quotes</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="quotes-mini-stat">
            <span>Accepted</span>
            <strong>{stats.accepted}</strong>
          </div>
          <div className="quotes-mini-stat">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>
      </section>

      <section className="quotes-toolbar">
        <div className="quotes-search-wrap">
          <input
            type="text"
            placeholder="Search quotes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="quotes-search"
          />
        </div>

        <div className="quotes-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="quotes-select"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </section>

      <section className="quotes-stats-grid">
        <div className="quotes-stat-card">
          <p>Total Quotes</p>
          <h3>{stats.total}</h3>
        </div>
        <div className="quotes-stat-card">
          <p>Pending</p>
          <h3>{stats.pending}</h3>
        </div>
        <div className="quotes-stat-card">
          <p>Accepted</p>
          <h3>{stats.accepted}</h3>
        </div>
        <div className="quotes-stat-card">
          <p>Rejected</p>
          <h3>{stats.rejected}</h3>
        </div>
      </section>

      {loading ? (
        <section className="quotes-loading-state">
          <div className="quotes-empty-card">Loading quotes...</div>
        </section>
      ) : filteredQuotes.length === 0 ? (
        <section className="quotes-empty-state">
          <div className="quotes-empty-card">
            No quotes match your current filters.
          </div>
        </section>
      ) : (
        <section className="quotes-grid">
          {filteredQuotes.map((item) => (
            <article key={item.id} className="quote-card">
              <div className="quote-top">
                <div className="quote-top-copy">
                  <h3 className="quote-request-title">
                    {item.request?.title || "Maintenance request"}
                  </h3>
                  <p className="quote-property">
                    {item.request?.property?.title || "Property"}
                    {item.request?.unit?.number
                      ? ` · Unit ${item.request.unit.number}`
                      : ""}
                  </p>
                </div>

                <div className="quote-badges">
                  <span
                    className={`quote-badge priority ${priorityClass(
                      item.request?.priority,
                    )}`}
                  >
                    {formatPriority(item.request?.priority)}
                  </span>
                  <span
                    className={`quote-badge status ${statusClass(item.status)}`}
                  >
                    {formatStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              <div className="quote-amount-card">
                <span>Total Quote</span>
                <strong>{formatCurrency(item.totalAmount)}</strong>
              </div>

              <div className="quote-meta">
                <div className="quote-meta-item">
                  <span>Category</span>
                  <strong>{item.request?.category || "General"}</strong>
                </div>
                <div className="quote-meta-item">
                  <span>Location</span>
                  <strong>{item.request?.property?.location || "Not set"}</strong>
                </div>
                <div className="quote-meta-item">
                  <span>Labor</span>
                  <strong>{formatCurrency(item.laborCost)}</strong>
                </div>
                <div className="quote-meta-item">
                  <span>Materials</span>
                  <strong>{formatCurrency(item.materialsCost)}</strong>
                </div>
                <div className="quote-meta-item">
                  <span>Duration</span>
                  <strong>
                    {item.estimatedDurationHours
                      ? `${item.estimatedDurationHours} hrs`
                      : "Not set"}
                  </strong>
                </div>
                <div className="quote-meta-item">
                  <span>Created</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>
              </div>

              <p className="quote-notes">
                {item.notes || "No additional notes were added to this quote."}
              </p>

              <div className="quote-actions">
                <button className="quote-btn primary">View Request</button>
                <button className="quote-btn secondary">Quote Details</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}