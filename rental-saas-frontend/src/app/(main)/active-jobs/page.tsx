"use client";

import "@/styles/active-jobs.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type ActiveJobItem = {
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
  propertyShare?: number | null;
  residentShare?: number | null;
  paymentResponsibility?: "PROPERTY" | "RESIDENT" | "SHARED" | null;
  paidAt?: string | null;
  paymentReference?: string | null;
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
  expenses?: Array<{
    id: string;
    title?: string | null;
    amount?: number | null;
    status?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
  }>;
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

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatPriority(value?: string | null) {
  const raw = String(value || "NORMAL").toUpperCase();
  if (raw === "EMERGENCY") return "Emergency";
  if (raw === "HIGH") return "High";
  if (raw === "MEDIUM") return "Medium";
  if (raw === "LOW") return "Low";
  return "Normal";
}

function formatStatus(value?: string | null) {
  return String(value || "ASSIGNED")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function priorityClass(value?: string | null) {
  const raw = String(value || "NORMAL").toLowerCase();
  if (raw === "emergency") return "emergency";
  if (raw === "high") return "high";
  if (raw === "medium") return "medium";
  if (raw === "low") return "low";
  return "normal";
}

function statusClass(job: ActiveJobItem | null) {
  if (!job) return "neutral";

  const raw = String(job.status || "").toUpperCase();

  if (raw === "IN_PROGRESS" && job.workCompletedAt) {
    return "awaiting";
  }
  if (raw === "IN_PROGRESS") return "in-progress";
  if (raw === "APPROVED") return "approved";
  if (raw === "ASSIGNED") return "assigned";
  if (raw === "QUOTED") return "quoted";
  if (raw === "COMPLETED") return "completed";

  return "neutral";
}

function getDisplayStatus(job: ActiveJobItem | null) {
  if (!job) return "Unknown";
  const raw = String(job.status || "").toUpperCase();

  if (raw === "IN_PROGRESS" && job.workCompletedAt) {
    return "Awaiting Resident Confirmation";
  }

  return formatStatus(job.status);
}

function getWorkflowState(job: ActiveJobItem | null) {
  if (!job) {
    return {
      isApproved: false,
      isScheduled: false,
      isInProgress: false,
      isWorkFinished: false,
      isCompleted: false,
    };
  }

  const status = String(job.status || "").toUpperCase();

  return {
    isApproved: status === "APPROVED" || status === "IN_PROGRESS" || status === "COMPLETED",
    isScheduled: !!job.workScheduledAt,
    isInProgress: status === "IN_PROGRESS" || status === "COMPLETED",
    isWorkFinished: !!job.workCompletedAt || status === "COMPLETED",
    isCompleted: status === "COMPLETED",
  };
}

function getPaymentProgress(job: ActiveJobItem | null) {
  if (!job) return "No payment details";
  const responsibility = job.paymentResponsibility || null;
  const latestExpense = job.expenses?.[0];

  if (responsibility === "PROPERTY") {
    if (latestExpense?.paidAt || latestExpense?.status === "PAID") {
      return "Property side paid";
    }
    if (latestExpense?.status === "APPROVED") {
      return "Property side approved, awaiting payment";
    }
    if (latestExpense?.status === "SUBMITTED") {
      return "Awaiting investor approval";
    }
    return "Property expense not finalized yet";
  }

  if (responsibility === "RESIDENT") {
    if (job.paidAt) return "Resident paid";
    return "Resident payment pending after confirmation";
  }

  if (responsibility === "SHARED") {
    const propertyDone = !!latestExpense?.paidAt || latestExpense?.status === "PAID";
    const residentDone = !!job.paidAt;

    if (propertyDone && residentDone) return "Property and resident both paid";
    if (propertyDone) return "Property paid, resident still pending";
    if (residentDone) return "Resident paid, property still pending";
    return "Shared payment still pending";
  }

  return "Responsibility not set";
}

export default function ActiveJobsPage() {
  const [jobs, setJobs] = useState<ActiveJobItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "" | "schedule" | "start" | "finish"
  >("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  async function loadJobs() {
    try {
      setLoading(true);
      const res = await api.get("/maintenance/provider/jobs");
      const data: ActiveJobItem[] = Array.isArray(res.data) ? res.data : [];

      const activeOnly = data.filter(
        (job) => String(job.status || "").toUpperCase() !== "COMPLETED",
      );

      setJobs(activeOnly);

      if (activeOnly.length > 0) {
        setSelectedId((current) =>
          current && activeOnly.some((job) => job.id === current)
            ? current
            : activeOnly[0].id,
        );
      } else {
        setSelectedId("");
      }
    } catch (error) {
      console.error("Failed to load active jobs", error);
      setJobs([]);
      setSelectedId("");
      setMessage({
        type: "error",
        text: "Failed to load active jobs.",
      });
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

  const selected =
    filteredJobs.find((job) => job.id === selectedId) ||
    filteredJobs[0] ||
    null;

  const stats = useMemo(() => {
    const active = jobs.length;
    const inProgress = jobs.filter(
      (job) =>
        String(job.status || "").toUpperCase() === "IN_PROGRESS" &&
        !job.workCompletedAt,
    ).length;
    const scheduled = jobs.filter((job) => Boolean(job.workScheduledAt)).length;
    const awaitingConfirmation = jobs.filter(
      (job) =>
        String(job.status || "").toUpperCase() === "IN_PROGRESS" &&
        !!job.workCompletedAt,
    ).length;

    return { active, inProgress, scheduled, awaitingConfirmation };
  }, [jobs]);

  const acceptedQuote =
    selected?.quotes?.find((quote) => quote.status === "ACCEPTED") || null;

  const workflowState = getWorkflowState(selected);

  const canScheduleWork =
    !!selected &&
    String(selected.status || "").toUpperCase() === "APPROVED";

  const canStartJob =
    !!selected &&
    String(selected.status || "").toUpperCase() === "APPROVED" &&
    !!selected.workScheduledAt;

  const canMarkWorkFinished =
    !!selected &&
    String(selected.status || "").toUpperCase() === "IN_PROGRESS" &&
    !selected.workCompletedAt;

  const waitingForResident =
    !!selected &&
    String(selected.status || "").toUpperCase() === "IN_PROGRESS" &&
    !!selected.workCompletedAt;

  function openScheduleModal() {
    if (!selected) return;
    setScheduleDate(
      selected.workScheduledAt
        ? formatDateTimeInput(selected.workScheduledAt)
        : "",
    );
    setShowScheduleModal(true);
  }

  function closeScheduleModal() {
    setShowScheduleModal(false);
  }

  async function handleScheduleWork() {
    if (!selected || !scheduleDate) {
      setMessage({
        type: "error",
        text: "Please choose a work date and time.",
      });
      return;
    }

    try {
      setActionLoading("schedule");
      setMessage(null);

      await api.patch(`/maintenance/${selected.id}/schedule-work`, {
        date: new Date(scheduleDate).toISOString(),
      });

      await loadJobs();
      setShowScheduleModal(false);
      setMessage({
        type: "success",
        text: "Work scheduled successfully.",
      });
    } catch (error: any) {
      console.error("Failed to schedule work", error);
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to schedule work.",
      });
    } finally {
      setActionLoading("");
    }
  }

  async function handleStartJob() {
    if (!selected) return;

    try {
      setActionLoading("start");
      setMessage(null);

      await api.patch(`/maintenance/${selected.id}/start`);
      await loadJobs();

      setMessage({
        type: "success",
        text: "Job started successfully.",
      });
    } catch (error: any) {
      console.error("Failed to start repair", error);
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to start job.",
      });
    } finally {
      setActionLoading("");
    }
  }

  async function handleFinishJob() {
    if (!selected) return;

    try {
      setActionLoading("finish");
      setMessage(null);

      await api.patch(`/maintenance/${selected.id}/complete`);
      await loadJobs();

      setMessage({
        type: "success",
        text: "Work marked finished. Waiting for resident confirmation.",
      });
    } catch (error: any) {
      console.error("Failed to finish repair", error);
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to mark work finished.",
      });
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="active-jobs-page-shell">
      <section className="active-jobs-hero">
        <div className="active-jobs-hero-copy">
          <p className="active-jobs-eyebrow">Service operations board</p>
          <h1 className="active-jobs-title">Active Jobs</h1>
          <p className="active-jobs-text">
            Manage approved and in-progress work, record when work is finished,
            and wait for resident confirmation before the job moves into the
            completed archive.
          </p>
        </div>

        <div className="active-jobs-hero-stats">
          <div className="active-jobs-mini-stat">
            <span>Active jobs</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="active-jobs-mini-stat">
            <span>In progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
          <div className="active-jobs-mini-stat">
            <span>Awaiting confirmation</span>
            <strong>{stats.awaitingConfirmation}</strong>
          </div>
        </div>
      </section>

      {message && (
        <div className={`active-jobs-feedback ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="active-jobs-toolbar">
        <input
          className="active-jobs-search"
          placeholder="Search active jobs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="active-jobs-toolbar-stats">
          <div className="toolbar-chip">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="toolbar-chip">
            <span>Scheduled</span>
            <strong>{stats.scheduled}</strong>
          </div>
        </div>
      </section>

      <section className="active-jobs-layout">
        <aside className="active-jobs-list-panel">
          <div className="panel-title-row">
            <div>
              <h2>Work Queue</h2>
              <p>Select a job to manage details and progress</p>
            </div>
          </div>

          {loading ? (
            <div className="panel-empty-state">Loading active jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="panel-empty-state">No active jobs found.</div>
          ) : (
            <div className="active-jobs-list">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  className={`active-job-list-item ${
                    selected?.id === job.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedId(job.id)}
                >
                  <div className="job-list-item-top">
                    <h3>{job.title}</h3>
                    <span className={`job-list-badge ${statusClass(job)}`}>
                      {getDisplayStatus(job)}
                    </span>
                  </div>

                  <p className="job-list-property">
                    {job.property?.title || "Property"}
                    {job.unit?.number ? ` · Unit ${job.unit.number}` : ""}
                  </p>

                  <div className="job-list-meta">
                    <span className={`priority-pill ${priorityClass(job.priority)}`}>
                      {formatPriority(job.priority)}
                    </span>
                    <span>{job.category || "General"}</span>
                  </div>

                  <div className="job-list-footer">
                    <span>{job.property?.location || "No location"}</span>
                    <strong>
                      {job.workCompletedAt
                        ? formatDate(job.workCompletedAt)
                        : formatDate(job.workScheduledAt || job.updatedAt)}
                    </strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="active-jobs-detail-panel">
          {!selected ? (
            <div className="detail-empty-state">
              Select a job to view job details.
            </div>
          ) : (
            <>
              <div className="detail-top-banner">
                <div className="detail-top-copy">
                  <p className="detail-eyebrow">Current assignment</p>
                  <h2>{selected.title}</h2>
                  <p className="detail-location">
                    {selected.property?.title || "Property"}
                    {selected.unit?.number ? ` · Unit ${selected.unit.number}` : ""}
                    {selected.property?.location
                      ? ` · ${selected.property.location}`
                      : ""}
                  </p>
                </div>

                <div className="detail-top-badges">
                  <span className={`priority-pill large ${priorityClass(selected.priority)}`}>
                    {formatPriority(selected.priority)}
                  </span>
                  <span className={`status-pill ${statusClass(selected)}`}>
                    {getDisplayStatus(selected)}
                  </span>
                </div>
              </div>

              <div className="detail-main-grid">
                <div className="detail-main-column">
                  <div className="detail-card spotlight-card">
                    <div className="detail-card-header">
                      <h3>Job Details</h3>
                      <span className="header-pill">Live</span>
                    </div>

                    <div className="detail-info-grid">
                      <div>
                        <span>Category</span>
                        <strong>{selected.category || "General"}</strong>
                      </div>
                      <div>
                        <span>Priority</span>
                        <strong>{formatPriority(selected.priority)}</strong>
                      </div>
                      <div>
                        <span>Current Status</span>
                        <strong>{getDisplayStatus(selected)}</strong>
                      </div>
                      <div>
                        <span>Scheduled</span>
                        <strong>{formatDate(selected.workScheduledAt)}</strong>
                      </div>
                    </div>

                    <div className="detail-description-block">
                      <span>Description</span>
                      <p>
                        {selected.description || "No description provided for this job."}
                      </p>
                    </div>
                  </div>

                  <div className="detail-card workflow-card">
                    <div className="detail-card-header">
                      <h3>Workflow Actions</h3>
                      <span className="header-pill">Action</span>
                    </div>

                    <div className="workflow-track">
                      <div className={`workflow-step ${workflowState.isApproved ? "done" : ""}`}>
                        <div className="workflow-dot" />
                        <div>
                          <strong>Approved</strong>
                          <p>Quote accepted and cleared for execution</p>
                        </div>
                      </div>
                      <div className={`workflow-step ${workflowState.isScheduled ? "done" : ""}`}>
                        <div className="workflow-dot" />
                        <div>
                          <strong>Scheduled</strong>
                          <p>Set the work date before starting on site</p>
                        </div>
                      </div>
                      <div className={`workflow-step ${workflowState.isInProgress ? "done" : ""}`}>
                        <div className="workflow-dot" />
                        <div>
                          <strong>In Progress</strong>
                          <p>Start repair work once the team is on site</p>
                        </div>
                      </div>
                      <div className={`workflow-step ${workflowState.isWorkFinished ? "done" : ""}`}>
                        <div className="workflow-dot" />
                        <div>
                          <strong>Work Finished</strong>
                          <p>Record that your work is finished</p>
                        </div>
                      </div>
                      <div className={`workflow-step ${workflowState.isCompleted ? "done" : ""}`}>
                        <div className="workflow-dot" />
                        <div>
                          <strong>Resident Confirmation</strong>
                          <p>Resident confirms the work before final archive</p>
                        </div>
                      </div>
                    </div>

                    <div className="detail-actions">
                      <button
                        className="detail-btn tertiary"
                        onClick={openScheduleModal}
                        disabled={
                          actionLoading !== "" ||
                          !canScheduleWork
                        }
                      >
                        {actionLoading === "schedule" ? "Scheduling..." : "Schedule Work"}
                      </button>

                      <button
                        className="detail-btn primary"
                        onClick={handleStartJob}
                        disabled={actionLoading !== "" || !canStartJob}
                      >
                        {actionLoading === "start" ? "Starting..." : "Start Job"}
                      </button>

                      <button
                        className="detail-btn secondary"
                        onClick={handleFinishJob}
                        disabled={actionLoading !== "" || !canMarkWorkFinished}
                      >
                        {actionLoading === "finish"
                          ? "Saving..."
                          : "Mark Work Finished"}
                      </button>
                    </div>

                    {waitingForResident ? (
                      <div className="detail-description-block">
                        <span>Awaiting next step</span>
                        <p>
                          Work has been marked finished. This request is now waiting
                          for the resident to confirm completion before it moves
                          to completed jobs and payout release can proceed.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="detail-side-column">
                  <div className="detail-card compact-card">
                    <div className="detail-card-header">
                      <h3>Resident</h3>
                    </div>

                    <div className="side-stack">
                      <div className="side-row">
                        <span>Name</span>
                        <strong>{selected.resident?.user?.name || "Not set"}</strong>
                      </div>
                      <div className="side-row">
                        <span>Phone</span>
                        <strong>{selected.resident?.user?.phone || "Not set"}</strong>
                      </div>
                      <div className="side-row">
                        <span>Email</span>
                        <strong>{selected.resident?.user?.email || "Not set"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card compact-card">
                    <div className="detail-card-header">
                      <h3>Quote Summary</h3>
                    </div>

                    <div className="side-stack">
                      <div className="side-row">
                        <span>Accepted Quote</span>
                        <strong>
                          {acceptedQuote
                            ? formatCurrency(acceptedQuote.totalAmount)
                            : formatCurrency(selected.estimatedCost)}
                        </strong>
                      </div>
                      <div className="side-row">
                        <span>Labor</span>
                        <strong>
                          {acceptedQuote
                            ? formatCurrency(acceptedQuote.laborCost)
                            : "Not set"}
                        </strong>
                      </div>
                      <div className="side-row">
                        <span>Materials</span>
                        <strong>
                          {acceptedQuote
                            ? formatCurrency(acceptedQuote.materialsCost)
                            : "Not set"}
                        </strong>
                      </div>
                      <div className="side-row">
                        <span>Duration</span>
                        <strong>
                          {acceptedQuote?.estimatedDurationHours
                            ? `${acceptedQuote.estimatedDurationHours} hrs`
                            : "Not set"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card compact-card accent-card">
                    <div className="detail-card-header">
                      <h3>Payment Snapshot</h3>
                    </div>

                    <div className="snapshot-stack">
                      <div className="snapshot-item">
                        <span>Responsibility</span>
                        <strong>{selected.paymentResponsibility || "Not set"}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Property share</span>
                        <strong>{formatCurrency(selected.propertyShare)}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Resident share</span>
                        <strong>{formatCurrency(selected.residentShare)}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Payment progress</span>
                        <strong>{getPaymentProgress(selected)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-card compact-card accent-card">
                    <div className="detail-card-header">
                      <h3>Quick Snapshot</h3>
                    </div>

                    <div className="snapshot-stack">
                      <div className="snapshot-item">
                        <span>Property</span>
                        <strong>{selected.property?.title || "—"}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Unit</span>
                        <strong>{selected.unit?.number || "—"}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Work finished</span>
                        <strong>{formatDateTime(selected.workCompletedAt)}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span>Updated</span>
                        <strong>{formatDate(selected.updatedAt || selected.createdAt)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      {showScheduleModal && selected && (
        <div className="schedule-modal-overlay" onClick={closeScheduleModal}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div>
                <p className="schedule-modal-eyebrow">Schedule work</p>
                <h3 className="schedule-modal-title">{selected.title}</h3>
                <p className="schedule-modal-subtitle">
                  {selected.property?.title || "Property"}
                  {selected.unit?.number ? ` · Unit ${selected.unit.number}` : ""}
                </p>
              </div>

              <button
                type="button"
                className="schedule-modal-close"
                onClick={closeScheduleModal}
              >
                ×
              </button>
            </div>

            <div className="schedule-modal-body">
              <label className="schedule-field">
                <span>Work date and time</span>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </label>
            </div>

            <div className="schedule-modal-actions">
              <button
                type="button"
                className="schedule-btn secondary"
                onClick={closeScheduleModal}
                disabled={actionLoading === "schedule"}
              >
                Cancel
              </button>

              <button
                type="button"
                className="schedule-btn primary"
                onClick={handleScheduleWork}
                disabled={actionLoading === "schedule"}
              >
                {actionLoading === "schedule" ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}