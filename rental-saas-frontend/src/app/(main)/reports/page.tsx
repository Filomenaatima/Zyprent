"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import "@/styles/reports.css";

type ReportType =
  | "PROPERTY_INCOME"
  | "MANAGER_SUMMARY"
  | "INVESTOR_INCOME"
  | "OCCUPANCY"
  | string;

type PropertyIncomeReport = {
  propertyId?: string;
  propertyName?: string;
  totalIncome?: number;
  totalExpenses?: number;
  netIncome?: number;
  paidInvoices?: number;
  outstandingInvoices?: number;
  occupancyRate?: number;
};

type OccupancyReport = {
  propertyId?: string;
  propertyName?: string;
  totalUnits?: number;
  occupiedUnits?: number;
  vacantUnits?: number;
  occupancyRate?: number;
};

type GenericReportOutput = Record<string, any>;

type PropertyOption = {
  id: string;
  title: string;
  location?: string | null;
};

function formatCurrency(value?: number | null) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatPercent(value?: number | null) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatTypeLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ReportsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("PROPERTY_INCOME");

  const [propertyIncome, setPropertyIncome] =
    useState<PropertyIncomeReport | null>(null);
  const [occupancyReport, setOccupancyReport] =
    useState<OccupancyReport | null>(null);
  const [genericOutput, setGenericOutput] = useState<GenericReportOutput | null>(
    null,
  );

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoadingProperties(true);
        const res = await axios.get("/properties");
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.items)
            ? res.data.items
            : [];

        setProperties(rows);

        if (rows.length > 0) {
          setSelectedPropertyId(rows[0].id);
        }
      } catch (error) {
        console.error("Failed to load properties", error);
      } finally {
        setLoadingProperties(false);
      }
    }

    loadProperties();
  }, []);

  async function runSelectedReport() {
    try {
      setLoadingReport(true);
      setGenericOutput(null);
      setPropertyIncome(null);
      setOccupancyReport(null);

      if (reportType === "PROPERTY_INCOME") {
        if (!selectedPropertyId) return;
        const res = await axios.get(
          `/reports/property-income/${selectedPropertyId}`,
        );
        setPropertyIncome(res.data);
        return;
      }

      if (reportType === "OCCUPANCY") {
        if (!selectedPropertyId) return;
        const res = await axios.get(`/reports/occupancy/${selectedPropertyId}`);
        setOccupancyReport(res.data);
        return;
      }

      const res = await axios.get(`/reports/${reportType}`);
      setGenericOutput(res.data);
    } catch (error) {
      console.error("Failed to run report", error);
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    if (!loadingProperties && selectedPropertyId) {
      runSelectedReport();
    }
  }, [loadingProperties, selectedPropertyId, reportType]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) || null,
    [properties, selectedPropertyId],
  );

  const summaryCards = useMemo(() => {
    if (reportType === "PROPERTY_INCOME" && propertyIncome) {
      return [
        {
          label: "Total Income",
          value: formatCurrency(propertyIncome.totalIncome),
        },
        {
          label: "Total Expenses",
          value: formatCurrency(propertyIncome.totalExpenses),
        },
        {
          label: "Net Income",
          value: formatCurrency(propertyIncome.netIncome),
        },
        {
          label: "Outstanding",
          value: formatCurrency(propertyIncome.outstandingInvoices),
        },
      ];
    }

    if (reportType === "OCCUPANCY" && occupancyReport) {
      return [
        {
          label: "Total Units",
          value: String(occupancyReport.totalUnits || 0),
        },
        {
          label: "Occupied",
          value: String(occupancyReport.occupiedUnits || 0),
        },
        {
          label: "Vacant",
          value: String(occupancyReport.vacantUnits || 0),
        },
        {
          label: "Occupancy Rate",
          value: formatPercent(occupancyReport.occupancyRate),
        },
      ];
    }

    if (genericOutput) {
      const entries = Object.entries(genericOutput).slice(0, 4);
      return entries.map(([key, value]) => ({
        label: formatTypeLabel(key),
        value:
          typeof value === "number"
            ? value.toLocaleString()
            : typeof value === "string"
              ? value
              : Array.isArray(value)
                ? `${value.length} items`
                : value && typeof value === "object"
                  ? "Available"
                  : "—",
      }));
    }

    return [
      { label: "Total Income", value: "UGX 0" },
      { label: "Total Expenses", value: "UGX 0" },
      { label: "Net Position", value: "UGX 0" },
      { label: "Report State", value: "No data" },
    ];
  }, [reportType, propertyIncome, occupancyReport, genericOutput]);

  return (
    <div className="reports-page-shell">
      <section className="reports-hero">
        <div className="reports-hero-copy">
          <p className="reports-label">ADMIN REPORTS</p>
          <h1>
            Generate financial, occupancy, and performance reports across the
            platform
          </h1>
          <p className="reports-sub">
            A central reporting workspace for property income visibility,
            occupancy analysis, and executive-level portfolio oversight.
          </p>

          <div className="reports-tags">
            <span>Portfolio reporting</span>
            <span>Income visibility</span>
            <span>Occupancy analysis</span>
            <span>Executive reporting</span>
          </div>
        </div>

        <div className="reports-hero-metrics">
          <div className="reports-metric-card main">
            <span>Properties</span>
            <h2>{properties.length}</h2>
          </div>
          <div className="reports-metric-card">
            <span>Report Type</span>
            <h3>{formatTypeLabel(reportType)}</h3>
          </div>
          <div className="reports-metric-card">
            <span>Selected Asset</span>
            <h3>{selectedProperty?.title || "—"}</h3>
          </div>
          <div className="reports-metric-card">
            <span>Status</span>
            <h3>{loadingReport ? "Running..." : "Ready"}</h3>
          </div>
        </div>
      </section>

      <section className="reports-summary-strip">
        {summaryCards.map((card) => (
          <div key={card.label} className="reports-summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </section>

      <section className="reports-main-grid">
        <div className="reports-left-panel">
          <div className="reports-panel">
            <div className="reports-panel-head">
              <div>
                <h2>Report Controls</h2>
                <p>Select report type and reporting target</p>
              </div>
              <span className="reports-count-chip">
                {loadingProperties ? "Loading..." : `${properties.length} assets`}
              </span>
            </div>

            <div className="reports-form-grid">
              <div className="reports-field">
                <label>Report Type</label>
                <select
                  className="reports-input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="PROPERTY_INCOME">Property Income</option>
                  <option value="OCCUPANCY">Occupancy</option>
                  <option value="MANAGER_SUMMARY">Manager Summary</option>
                  <option value="INVESTOR_INCOME">Investor Income</option>
                </select>
              </div>

              <div className="reports-field">
                <label>Property</label>
                <select
                  className="reports-input"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  disabled={properties.length === 0}
                >
                  {properties.length === 0 ? (
                    <option value="">No properties</option>
                  ) : (
                    properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                        {property.location ? ` • ${property.location}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="reports-actions">
              <button
                className="reports-btn primary"
                onClick={runSelectedReport}
                disabled={loadingReport || (!selectedPropertyId && reportType !== "MANAGER_SUMMARY" && reportType !== "INVESTOR_INCOME")}
              >
                {loadingReport ? "Running Report..." : "Run Report"}
              </button>
            </div>
          </div>

          <div className="reports-panel compact">
            <div className="reports-panel-head">
              <div>
                <h2>Quick Notes</h2>
                <p>What each report is best used for</p>
              </div>
            </div>

            <div className="reports-note-list">
              <div className="reports-note-card">
                <strong>Property Income</strong>
                <p>Use this to inspect revenue, expenses, net income, and invoice exposure.</p>
              </div>
              <div className="reports-note-card">
                <strong>Occupancy</strong>
                <p>Use this to review occupied units, vacancy pressure, and utilization levels.</p>
              </div>
              <div className="reports-note-card">
                <strong>Manager Summary</strong>
                <p>Use this for operational performance and high-level management oversight.</p>
              </div>
              <div className="reports-note-card">
                <strong>Investor Income</strong>
                <p>Use this to inspect income performance relevant to investment reporting.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="reports-right-panel">
          <div className="reports-panel detail">
            <div className="reports-detail-hero">
              <div>
                <div className="reports-detail-badges">
                  <span className="reports-type-pill">
                    {formatTypeLabel(reportType)}
                  </span>
                  <span className="reports-badge ready">
                    {loadingReport ? "Running" : "Completed"}
                  </span>
                </div>

                <h2>
                  {selectedProperty?.title ||
                    (reportType === "MANAGER_SUMMARY"
                      ? "Manager Summary"
                      : reportType === "INVESTOR_INCOME"
                        ? "Investor Income"
                        : "Report Output")}
                </h2>
                <p>
                  {selectedProperty?.location ||
                    "Platform-level generated reporting output"}
                </p>
              </div>

              <div className="reports-status-box">
                <span>Output Status</span>
                <strong>{loadingReport ? "Running" : "Ready"}</strong>
              </div>
            </div>

            {reportType === "PROPERTY_INCOME" && propertyIncome ? (
              <div className="reports-detail-grid">
                <div className="reports-detail-card">
                  <span>Total Income</span>
                  <p>{formatCurrency(propertyIncome.totalIncome)}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Total Expenses</span>
                  <p>{formatCurrency(propertyIncome.totalExpenses)}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Net Income</span>
                  <p>{formatCurrency(propertyIncome.netIncome)}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Paid Invoices</span>
                  <p>{formatCurrency(propertyIncome.paidInvoices)}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Outstanding Invoices</span>
                  <p>{formatCurrency(propertyIncome.outstandingInvoices)}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Occupancy Rate</span>
                  <p>{formatPercent(propertyIncome.occupancyRate)}</p>
                </div>
              </div>
            ) : reportType === "OCCUPANCY" && occupancyReport ? (
              <div className="reports-detail-grid">
                <div className="reports-detail-card">
                  <span>Total Units</span>
                  <p>{occupancyReport.totalUnits || 0}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Occupied Units</span>
                  <p>{occupancyReport.occupiedUnits || 0}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Vacant Units</span>
                  <p>{occupancyReport.vacantUnits || 0}</p>
                </div>
                <div className="reports-detail-card">
                  <span>Occupancy Rate</span>
                  <p>{formatPercent(occupancyReport.occupancyRate)}</p>
                </div>
              </div>
            ) : genericOutput ? (
              <div className="reports-json-panel">
                <div className="reports-json-head">
                  <h3>Generated Output</h3>
                  <p>Structured report data returned by the backend</p>
                </div>
                <pre className="reports-json-block">
                  {JSON.stringify(genericOutput, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="reports-empty">
                {loadingReport
                  ? "Generating report..."
                  : "Run a report to see output here."}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}