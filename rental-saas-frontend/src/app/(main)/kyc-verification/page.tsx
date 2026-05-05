"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import "@/styles/kyc-verification.css";

type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

type KycRecord = {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  idType: string;
  idNumber: string;
  documentUrl: string;
  status: KycStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusTone(status: string) {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function formatRole(role?: string | null) {
  if (!role) return "User";
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function KycVerificationPage() {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [selected, setSelected] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  async function loadKyc() {
    try {
      setLoading(true);
      const res = await api.get("/kyc/admin/all");
      const rows: KycRecord[] = res.data ?? [];

      setRecords(rows);
      setSelected((current) => {
        if (!rows.length) return null;
        if (!current) return rows[0];
        return rows.find((item) => item.id === current.id) ?? rows[0];
      });
    } catch (error) {
      console.error("Failed to load KYC records", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKyc();
  }, []);

  const filteredRecords = useMemo(() => {
    let rows = [...records];

    if (statusFilter !== "ALL") {
      rows = rows.filter((item) => item.status === statusFilter);
    }

    if (roleFilter !== "ALL") {
      rows = rows.filter((item) => item.user?.role === roleFilter);
    }

    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) =>
      [
        item.fullName,
        item.nationality,
        item.address,
        item.idType,
        item.idNumber,
        item.user?.name,
        item.user?.email,
        item.user?.phone,
        item.user?.role,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [records, search, statusFilter, roleFilter]);

  const selectedRecord =
    filteredRecords.find((item) => item.id === selected?.id) ||
    records.find((item) => item.id === selected?.id) ||
    filteredRecords[0] ||
    null;

  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter((item) => item.status === "PENDING").length;
    const approved = records.filter((item) => item.status === "APPROVED").length;
    const rejected = records.filter((item) => item.status === "REJECTED").length;

    return { total, pending, approved, rejected };
  }, [records]);

  async function reviewKyc(kycId: string, status: "APPROVED" | "REJECTED") {
    try {
      setBusyId(kycId);
      await api.post(`/kyc/review/${kycId}`, { status });
      await loadKyc();
    } catch (error) {
      console.error("Failed to review KYC", error);
    } finally {
      setBusyId(null);
    }
  }

  const approveDisabled =
    !selectedRecord ||
    busyId === selectedRecord.id ||
    selectedRecord.status === "APPROVED";

  const rejectDisabled =
    !selectedRecord ||
    busyId === selectedRecord.id ||
    selectedRecord.status === "REJECTED";

  return (
    <div className="kyc-page-shell">
      <section className="kyc-hero">
        <div className="kyc-hero-copy">
          <p className="kyc-label">ADMIN KYC / VERIFICATION</p>
          <h1>
            Review identity submissions, approve compliant profiles, and keep
            platform onboarding trusted
          </h1>
          <p className="kyc-sub">
            A premium admin verification workspace for KYC review, user trust
            checks, and compliance visibility across the platform.
          </p>

          <div className="kyc-tags">
            <span>Identity review</span>
            <span>Approval control</span>
            <span>Compliance visibility</span>
            <span>Platform trust</span>
          </div>
        </div>

        <div className="kyc-hero-metrics">
          <div className="kyc-metric-card main">
            <span>Total Records</span>
            <h2>{stats.total}</h2>
          </div>
          <div className="kyc-metric-card">
            <span>Pending</span>
            <h3>{stats.pending}</h3>
          </div>
          <div className="kyc-metric-card">
            <span>Approved</span>
            <h3>{stats.approved}</h3>
          </div>
          <div className="kyc-metric-card">
            <span>Rejected</span>
            <h3>{stats.rejected}</h3>
          </div>
        </div>
      </section>

      <section className="kyc-summary-strip">
        <div className="kyc-summary-card">
          <span>Pending reviews</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="kyc-summary-card">
          <span>Approved profiles</span>
          <strong>{stats.approved}</strong>
        </div>
        <div className="kyc-summary-card">
          <span>Rejected profiles</span>
          <strong>{stats.rejected}</strong>
        </div>
        <div className="kyc-summary-card">
          <span>Visible records</span>
          <strong>{filteredRecords.length}</strong>
        </div>
      </section>

      <section className="kyc-main-grid">
        <div className="kyc-left-panel">
          <div className="kyc-panel">
            <div className="kyc-panel-head">
              <div>
                <h2>KYC Registry</h2>
                <p>Browse and review all verification submissions</p>
              </div>
              <span className="kyc-count-chip">
                {loading ? "Loading..." : `${filteredRecords.length} visible`}
              </span>
            </div>

            <div className="kyc-toolbar polished">
              <div className="kyc-toolbar-row">
                <select
                  className="kyc-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <select
                  className="kyc-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All roles</option>
                  <option value="SERVICE_PROVIDER">Service Provider</option>
                  <option value="RESIDENT">Resident</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              <input
                className="kyc-search"
                placeholder="Search full name, email, phone, ID number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="kyc-list">
              {loading ? (
                <div className="kyc-empty">Loading KYC records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="kyc-empty">No KYC records found.</div>
              ) : (
                filteredRecords.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`kyc-record-card ${
                      selectedRecord?.id === item.id ? "active" : ""
                    }`}
                    onClick={() => setSelected(item)}
                  >
                    <div className="kyc-record-top">
                      <div>
                        <h4>{item.fullName}</h4>
                        <p>
                          {formatRole(item.user?.role)} •{" "}
                          {item.user?.email || item.user?.phone || "No contact"}
                        </p>
                      </div>
                      <span className={`kyc-badge ${getStatusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="kyc-record-meta">
                      <span>{item.idType}</span>
                      <span>{item.nationality}</span>
                    </div>

                    <div className="kyc-record-bottom">
                      <span>{item.idNumber}</span>
                      <strong>{formatDate(item.updatedAt || item.createdAt)}</strong>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="kyc-right-panel">
          <div className="kyc-panel detail">
            {!selectedRecord ? (
              <div className="kyc-empty detail">
                Select a KYC record to inspect identity details.
              </div>
            ) : (
              <>
                <div className="kyc-detail-hero">
                  <div>
                    <div className="kyc-detail-badges">
                      <span className="kyc-type-pill">
                        {formatRole(selectedRecord.user?.role)}
                      </span>
                      <span
                        className={`kyc-badge ${getStatusTone(selectedRecord.status)}`}
                      >
                        {selectedRecord.status}
                      </span>
                    </div>

                    <h2>{selectedRecord.fullName}</h2>
                    <p>
                      {selectedRecord.user?.email ||
                        selectedRecord.user?.phone ||
                        "No user contact"}
                    </p>
                  </div>

                  <div
                    className={`kyc-status-box ${getStatusTone(
                      selectedRecord.status,
                    )}`}
                  >
                    <span>Status</span>
                    <strong>{selectedRecord.status}</strong>
                  </div>
                </div>

                <div className="kyc-detail-grid">
                  <div className="kyc-detail-card">
                    <span>Date of Birth</span>
                    <p>{formatDate(selectedRecord.dateOfBirth)}</p>
                  </div>
                  <div className="kyc-detail-card">
                    <span>Nationality</span>
                    <p>{selectedRecord.nationality}</p>
                  </div>
                  <div className="kyc-detail-card full">
                    <span>Address</span>
                    <p>{selectedRecord.address}</p>
                  </div>
                  <div className="kyc-detail-card">
                    <span>ID Type</span>
                    <p>{selectedRecord.idType}</p>
                  </div>
                  <div className="kyc-detail-card">
                    <span>ID Number</span>
                    <p>{selectedRecord.idNumber}</p>
                  </div>
                  <div className="kyc-detail-card full">
                    <span>Document URL</span>
                    <a
                      href={selectedRecord.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="kyc-doc-link"
                    >
                      Open submitted document
                    </a>
                  </div>
                  <div className="kyc-detail-card">
                    <span>Submitted</span>
                    <p>{formatDate(selectedRecord.createdAt)}</p>
                  </div>
                  <div className="kyc-detail-card">
                    <span>Reviewed</span>
                    <p>{formatDate(selectedRecord.reviewedAt)}</p>
                  </div>
                </div>

                <div className="kyc-actions polished">
                  <button
                    className={`kyc-btn approve ${
                      selectedRecord.status === "APPROVED" ? "state-done" : ""
                    }`}
                    disabled={approveDisabled}
                    onClick={() => reviewKyc(selectedRecord.id, "APPROVED")}
                  >
                    {busyId === selectedRecord.id &&
                    selectedRecord.status !== "APPROVED"
                      ? "Processing..."
                      : selectedRecord.status === "APPROVED"
                        ? "Already Approved"
                        : "Approve KYC"}
                  </button>

                  <button
                    className={`kyc-btn reject ${
                      selectedRecord.status === "REJECTED" ? "state-done" : ""
                    }`}
                    disabled={rejectDisabled}
                    onClick={() => reviewKyc(selectedRecord.id, "REJECTED")}
                  >
                    {busyId === selectedRecord.id &&
                    selectedRecord.status !== "REJECTED"
                      ? "Processing..."
                      : selectedRecord.status === "REJECTED"
                        ? "Already Rejected"
                        : "Reject KYC"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}