"use client";

import "@/styles/completed-jobs.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type CompletedJobItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  workScheduledAt?: string | null;
  workCompletedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  estimatedCost?: number | null;
  property?: {
    id?: string;
    title?: string | null;
    location?: string | null;
  } | null;
  unit?: {
    id?: string;
    number?: string | null;
  } | null;
  resident?: {
    id?: string;
    user?: {
      name?: string | null;
      phone?: string | null;
      email?: string | null;
    } | null;
  } | null;
  quotes?: Array<{
    id: string;
    status?: string | null;
    totalAmount?: number | null;
    laborCost?: number | null;
    materialsCost?: number | null;
    estimatedDurationHours?: number | null;
    notes?: string | null;
  }>;
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

export default function CompletedJobsPage() {
  const [jobs, setJobs] = useState<CompletedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadJobs() {
    try {
      setLoading(true);
      const res = await api.get("/maintenance/provider/jobs");
      const data: CompletedJobItem[] = Array.isArray(res.data) ? res.data : [];

      const completedOnly = data.filter(
        (job) => String(job.status || "").toUpperCase() === "COMPLETED",
      );

      setJobs(completedOnly);
    } catch (error) {
      console.error("Failed to load completed jobs", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      return (
        String(job.title || "").toLowerCase().includes(query) ||
        String(job.description || "").toLowerCase().includes(query) ||
        String(job.category || "").toLowerCase().includes(query) ||
        String(job.property?.title || "").toLowerCase().includes(query) ||
        String(job.property?.location || "").toLowerCase().includes(query) ||
        String(job.unit?.number || "").toLowerCase().includes(query) ||
        String(job.resident?.user?.name || "").toLowerCase().includes(query)
      );
    });
  }, [jobs, search]);

  const stats = useMemo(() => {
    const totalCompleted = jobs.length;
    const totalRevenue = jobs.reduce(
      (sum, job) => sum + Number(job.estimatedCost || 0),
      0,
    );
    const scheduledBeforeCompletion = jobs.filter(
      (job) => Boolean(job.workScheduledAt),
    ).length;
    const highPriority = jobs.filter(
      (job) => String(job.priority || "").toUpperCase() === "HIGH",
    ).length;

    return {
      totalCompleted,
      totalRevenue,
      scheduledBeforeCompletion,
      highPriority,
    };
  }, [jobs]);

  return (
    <div className="completed-jobs-page-shell">
      <section className="completed-jobs-hero">
        <div className="completed-jobs-hero-copy">
          <p className="completed-jobs-eyebrow">Completed work archive</p>
          <h1 className="completed-jobs-title">Completed Jobs</h1>
          <p className="completed-jobs-text">
            Review finished assignments, track completed work value, and keep a
            polished record of delivery history across all serviced properties.
          </p>
        </div>

        <div className="completed-jobs-hero-side">
          <div className="completed-jobs-mini-stat">
            <span>Completed jobs</span>
            <strong>{stats.totalCompleted}</strong>
          </div>
          <div className="completed-jobs-mini-stat">
            <span>Total value</span>
            <strong>{formatCurrency(stats.totalRevenue)}</strong>
          </div>
          <div className="completed-jobs-mini-stat">
            <span>High priority</span>
            <strong>{stats.highPriority}</strong>
          </div>
        </div>
      </section>

      <section className="completed-jobs-toolbar">
        <input
          className="completed-jobs-search"
          placeholder="Search completed jobs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="completed-jobs-toolbar-pills">
          <div className="completed-toolbar-pill">
            <span>Completed</span>
            <strong>{stats.totalCompleted}</strong>
          </div>
          <div className="completed-toolbar-pill">
            <span>Scheduled</span>
            <strong>{stats.scheduledBeforeCompletion}</strong>
          </div>
        </div>
      </section>

      <section className="completed-jobs-summary-grid">
        <div className="completed-summary-card">
          <p>Completed Jobs</p>
          <h3>{stats.totalCompleted}</h3>
        </div>
        <div className="completed-summary-card">
          <p>Total Work Value</p>
          <h3>{formatCurrency(stats.totalRevenue)}</h3>
        </div>
        <div className="completed-summary-card">
          <p>Scheduled Before Finish</p>
          <h3>{stats.scheduledBeforeCompletion}</h3>
        </div>
        <div className="completed-summary-card">
          <p>High Priority</p>
          <h3>{stats.highPriority}</h3>
        </div>
      </section>

      {loading ? (
        <section className="completed-jobs-empty-wrap">
          <div className="completed-jobs-empty-card">
            Loading completed jobs...
          </div>
        </section>
      ) : filteredJobs.length === 0 ? (
        <section className="completed-jobs-empty-wrap">
          <div className="completed-jobs-empty-card">
            No completed jobs found yet.
          </div>
        </section>
      ) : (
        <section className="completed-jobs-history">
          {filteredJobs.map((job) => {
            const acceptedQuote =
              job.quotes?.find((quote) => quote.status === "ACCEPTED") || null;

            return (
              <article key={job.id} className="completed-history-card">
                <div className="completed-history-left-rail">
                  <div className="history-rail-dot" />
                  <div className="history-rail-line" />
                </div>

                <div className="completed-history-main">
                  <div className="completed-history-top">
                    <div className="completed-history-copy">
                      <h2>{job.title}</h2>
                      <p>
                        {job.property?.title || "Property"}
                        {job.unit?.number ? ` · Unit ${job.unit.number}` : ""}
                        {job.property?.location
                          ? ` · ${job.property.location}`
                          : ""}
                      </p>
                    </div>

                    <div className="completed-history-badges">
                      <span className={`completed-priority ${priorityClass(job.priority)}`}>
                        {formatPriority(job.priority)}
                      </span>
                      <span className="completed-status">Completed</span>
                    </div>
                  </div>

                  <div className="completed-history-grid">
                    <div className="completed-history-panel">
                      <span>Resident</span>
                      <strong>{job.resident?.user?.name || "Not set"}</strong>
                    </div>
                    <div className="completed-history-panel">
                      <span>Category</span>
                      <strong>{job.category || "General"}</strong>
                    </div>
                    <div className="completed-history-panel">
                      <span>Completed On</span>
                      <strong>
                        {formatDate(job.workCompletedAt || job.updatedAt)}
                      </strong>
                    </div>
                    <div className="completed-history-panel">
                      <span>Total Value</span>
                      <strong>
                        {acceptedQuote
                          ? formatCurrency(acceptedQuote.totalAmount)
                          : formatCurrency(job.estimatedCost)}
                      </strong>
                    </div>
                  </div>

                  <div className="completed-history-description">
                    <span>Work Summary</span>
                    <p>
                      {job.description || "No work summary was added for this job."}
                    </p>
                  </div>

                  <div className="completed-history-footer">
                    <div className="completed-footer-metrics">
                      <div>
                        <span>Labor</span>
                        <strong>
                          {acceptedQuote
                            ? formatCurrency(acceptedQuote.laborCost)
                            : "Not set"}
                        </strong>
                      </div>
                      <div>
                        <span>Materials</span>
                        <strong>
                          {acceptedQuote
                            ? formatCurrency(acceptedQuote.materialsCost)
                            : "Not set"}
                        </strong>
                      </div>
                      <div>
                        <span>Duration</span>
                        <strong>
                          {acceptedQuote?.estimatedDurationHours
                            ? `${acceptedQuote.estimatedDurationHours} hrs`
                            : "Not set"}
                        </strong>
                      </div>
                    </div>

                    <div className="completed-footer-actions">
                      <button className="completed-btn primary">
                        View Record
                      </button>
                      <button className="completed-btn secondary">
                        Export Summary
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}