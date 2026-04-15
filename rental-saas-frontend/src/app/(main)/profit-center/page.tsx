"use client";

import "@/styles/profit-center.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";

type ProfitCenterResponse = {
  hero: {
    totalProfitEarned: number;
    netReturn: number;
    totalCurrentValue: number;
    roi: number;
    yieldPercent: number;
    profitThisMonth: number;
    monthlyGrowth: number;
    withdrawableEstimate: number;
  };
  intelligence: {
    bestProperty: {
      title: string;
      roi: number;
      netReturn: number;
    } | null;
    weakestProperty: {
      title: string;
      roi: number;
      netReturn: number;
    } | null;
    totalAllocatedExpenses: number;
    totalUnrealizedReturn: number;
    grossReturn: number;
    netReturn: number;
  };
  charts: {
    monthlyTrend: {
      month: string;
      grossProfit: number;
      expenses: number;
      netProfit: number;
    }[];
    expenseBreakdown: {
      name: string;
      profit: number;
      expenses: number;
      net: number;
    }[];
  };
  propertyPerformance: {
    propertyId: string;
    title: string;
    location: string | null;
    sharesOwned: number;
    investedCapital: number;
    totalProfitEarned: number;
    allocatedExpenses: number;
    grossReturn: number;
    netReturn: number;
    unrealizedReturn: number;
    currentValue: number;
    roi: number;
    yieldPercent: number;
    expenseImpactPercent: number;
    occupancyRate: number;
    currentSharePrice: number;
    entrySharePrice: number;
    priceMovementPercent: number;
    capRate: number;
    propertyIncome: number;
    propertyExpenses: number;
    propertyNetProfit: number;
  }[];
  recentDistributions: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    amount: number;
    periodMonth: number;
    periodYear: number;
    createdAt: string;
  }[];
  pendingRequest: {
    id: string;
    propertyTitle: string;
    amount: number;
    createdAt: string;
    expiresAt: string;
    votesCount: number;
    status: string;
  } | null;
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatCompactCurrency(value: number) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;

  return `UGX ${num.toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getGrowthTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getPerformanceTone(value: number) {
  if (value >= 15) return "strong";
  if (value >= 0) return "steady";
  return "weak";
}

export default function ProfitCenterPage() {
  const [data, setData] = useState<ProfitCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const heroRef = useRef<HTMLElement | null>(null);
  const propertyRef = useRef<HTMLElement | null>(null);
  const distributionsRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const res = await api.get<ProfitCenterResponse>("/profit-center/me");

        if (!mounted) return;
        setData(res.data);
      } catch (error) {
        console.error("Failed to load profit center", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const monthlySeries = useMemo(() => {
    const rows = data?.charts.monthlyTrend ?? [];
    const maxValue = Math.max(
      ...rows.flatMap((row) => [
        Math.max(row.grossProfit, 0),
        Math.max(row.expenses, 0),
        Math.max(row.netProfit, 0),
      ]),
      1,
    );

    return rows.map((row, index) => {
      const netHeight = Math.max(
        12,
        (Math.max(row.netProfit, 0) / maxValue) * 100,
      );
      const grossHeight = Math.max(
        10,
        (Math.max(row.grossProfit, 0) / maxValue) * 100,
      );

      return {
        ...row,
        index,
        netHeight,
        grossHeight,
      };
    });
  }, [data]);

  const trendPoints = useMemo(() => {
    if (!monthlySeries.length) return "";

    return monthlySeries
      .map((row, index) => {
        const x = (index / Math.max(monthlySeries.length - 1, 1)) * 100;
        const y = 100 - row.netHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }, [monthlySeries]);

  const trendLooksShallow = useMemo(() => {
    const rows = data?.charts.monthlyTrend ?? [];
    const activeMonths = rows.filter(
      (row) => row.grossProfit > 0 || row.expenses > 0 || row.netProfit > 0,
    ).length;
    return activeMonths <= 1;
  }, [data]);

  const donutSegments = useMemo(() => {
    const rows = data?.charts.expenseBreakdown ?? [];
    const total = rows.reduce((sum, row) => sum + row.expenses, 0);

    return rows.map((row) => ({
      ...row,
      percentage: total > 0 ? (row.expenses / total) * 100 : 0,
    }));
  }, [data]);

  const totalExpenseBreakdown = useMemo(() => {
    return donutSegments.reduce((sum, item) => sum + item.expenses, 0);
  }, [donutSegments]);

  const bestProperty = data?.intelligence.bestProperty;
  const weakestProperty = data?.intelligence.weakestProperty;

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="profit-shell">
      <section className="profit-hero" ref={heroRef}>
        <div className="profit-hero-copy">
          <p className="profit-eyebrow">Investor Profit Center</p>
          <h1 className="profit-title">
            Wealth performance, profit intelligence, and yield visibility
          </h1>
          <p className="profit-text">
            Track your portfolio returns, review expense-adjusted performance,
            monitor property profitability, and understand exactly how your
            investments are compounding over time.
          </p>

          <div className="profit-hero-tags">
            <span className="profit-hero-tag">Expense-adjusted returns</span>
            <span className="profit-hero-tag">Property benchmarking</span>
            <span className="profit-hero-tag">Distribution insights</span>
            <span className="profit-hero-tag">Institutional analytics</span>
          </div>
        </div>

        <div className="profit-hero-grid">
          <div className="profit-summary-card dark">
            <p className="profit-summary-label">Total Profit Earned</p>
            <h3 className="profit-summary-value">
              {data ? formatCompactCurrency(data.hero.totalProfitEarned) : "—"}
            </h3>
          </div>

          <div className="profit-summary-card">
            <p className="profit-summary-label">Net Return</p>
            <h3 className="profit-summary-value">
              {data ? formatCompactCurrency(data.hero.netReturn) : "—"}
            </h3>
          </div>

          <div className="profit-summary-card">
            <p className="profit-summary-label">Portfolio ROI</p>
            <h3 className="profit-summary-value">
              {data ? formatPercent(data.hero.roi) : "—"}
            </h3>
          </div>

          <div className="profit-summary-card">
            <p className="profit-summary-label">Withdrawable</p>
            <h3 className="profit-summary-value">
              {data ? formatCompactCurrency(data.hero.withdrawableEstimate) : "—"}
            </h3>
          </div>
        </div>
      </section>

      <nav className="profit-quick-nav">
        <button
          type="button"
          className="profit-quick-pill"
          onClick={() => scrollToSection(heroRef)}
        >
          Overview
        </button>
        <button
          type="button"
          className="profit-quick-pill"
          onClick={() => scrollToSection(propertyRef)}
        >
          Properties
        </button>
        <button
          type="button"
          className="profit-quick-pill"
          onClick={() => scrollToSection(distributionsRef)}
        >
          Distributions
        </button>
        <button
          type="button"
          className="profit-quick-pill"
          onClick={() => scrollToSection(requestRef)}
        >
          Requests
        </button>
      </nav>

      <section className="profit-overview-bar">
        <div className="profit-overview-item">
          <span>Current Value</span>
          <strong>
            {data ? formatCompactCurrency(data.hero.totalCurrentValue) : "—"}
          </strong>
        </div>

        <div className="profit-overview-item">
          <span>Yield</span>
          <strong>{data ? formatPercent(data.hero.yieldPercent) : "—"}</strong>
        </div>

        <div className="profit-overview-item">
          <span>Profit This Month</span>
          <strong className="positive">
            {data ? formatCompactCurrency(data.hero.profitThisMonth) : "—"}
          </strong>
        </div>

        <div className="profit-overview-item">
          <span>Monthly Growth</span>
          <strong className={getGrowthTone(data?.hero.monthlyGrowth ?? 0)}>
            {data ? formatPercent(data.hero.monthlyGrowth) : "—"}
          </strong>
        </div>
      </section>

      <section className="profit-overview-bar secondary">
        <div className="profit-overview-item">
          <span>Gross Return</span>
          <strong>
            {data ? formatCompactCurrency(data.intelligence.grossReturn) : "—"}
          </strong>
        </div>

        <div className="profit-overview-item">
          <span>Allocated Expenses</span>
          <strong>
            {data
              ? formatCompactCurrency(data.intelligence.totalAllocatedExpenses)
              : "—"}
          </strong>
        </div>

        <div className="profit-overview-item">
          <span>Unrealized Return</span>
          <strong>
            {data
              ? formatCompactCurrency(data.intelligence.totalUnrealizedReturn)
              : "—"}
          </strong>
        </div>

        <div className="profit-overview-item">
          <span>Net Return</span>
          <strong className={getGrowthTone(data?.intelligence.netReturn ?? 0)}>
            {data ? formatCompactCurrency(data.intelligence.netReturn) : "—"}
          </strong>
        </div>
      </section>

      <section className="profit-grid-two">
        <div className="profit-section premium-chart">
          <div className="profit-section-head">
            <div>
              <h2 className="profit-section-title">Monthly Profit Trend</h2>
              <p className="profit-section-subtitle">
                Auto-aggregated monthly profit after allocated expenses
              </p>
            </div>
            <span className="profit-chip">6 Months</span>
          </div>

          {loading ? (
            <div className="profit-empty">Loading chart...</div>
          ) : (
            <>
              <div className="profit-trend-chart">
                <div className="profit-trend-gridlines">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                <div className="profit-trend-stage">
                  <svg
                    className="profit-trend-line"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="#2456db"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={trendPoints}
                    />
                  </svg>

                  <div className="profit-trend-columns">
                    {monthlySeries.map((row) => (
                      <div key={row.month} className="profit-trend-column">
                        <div className="profit-trend-bars">
                          <div
                            className="profit-trend-bar gross"
                            style={{ height: `${row.grossHeight}%` }}
                            title={`Gross: ${formatCurrency(row.grossProfit)}`}
                          />
                          <div
                            className="profit-trend-bar net"
                            style={{ height: `${row.netHeight}%` }}
                            title={`Net: ${formatCurrency(row.netProfit)}`}
                          />
                        </div>

                        <strong>{row.month}</strong>
                        <span>{formatCompactCurrency(row.netProfit)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {trendLooksShallow ? (
                <div className="profit-chart-note">
                  Historical monthly snapshots are still building. Earlier months
                  may show low or zero values until more PropertyProfit history
                  accumulates.
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="profit-section premium-chart">
          <div className="profit-section-head">
            <div>
              <h2 className="profit-section-title">Expense Breakdown</h2>
              <p className="profit-section-subtitle">
                Allocated expenses across your holdings
              </p>
            </div>
            <span className="profit-chip">By Property</span>
          </div>

          {loading ? (
            <div className="profit-empty">Loading breakdown...</div>
          ) : (
            <div className="profit-donut-wrap">
              <div
                className="profit-donut"
                style={{
                  background: `conic-gradient(
                    #2563eb 0% ${donutSegments[0]?.percentage ?? 0}%,
                    #60a5fa ${donutSegments[0]?.percentage ?? 0}% ${
                    (donutSegments[0]?.percentage ?? 0) +
                    (donutSegments[1]?.percentage ?? 0)
                  }%,
                    #cfe1ff ${
                      (donutSegments[0]?.percentage ?? 0) +
                      (donutSegments[1]?.percentage ?? 0)
                    }% 100%
                  )`,
                }}
              >
                <div className="profit-donut-center">
                  <strong>{formatCompactCurrency(totalExpenseBreakdown)}</strong>
                  <span>Total Expenses</span>
                </div>
              </div>

              <div className="profit-donut-legend">
                {donutSegments.map((item, index) => (
                  <div key={item.name} className="profit-legend-row">
                    <span className={`profit-legend-dot tone-${index + 1}`} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {formatCurrency(item.expenses)} •{" "}
                        {formatPercent(item.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="profit-grid-two intelligence-grid">
        <div className="profit-section">
          <div className="profit-section-head">
            <div>
              <h2 className="profit-section-title">Portfolio Intelligence</h2>
              <p className="profit-section-subtitle">
                Benchmark your strongest and weakest performers
              </p>
            </div>
            <span className="profit-chip">AI View</span>
          </div>

          <div className="profit-intelligence-grid">
            <div className="profit-intelligence-card">
              <span>Best Property</span>
              <strong>{bestProperty?.title ?? "—"}</strong>
              <p>{bestProperty ? formatPercent(bestProperty.roi) : "—"}</p>
              <small>
                Net return{" "}
                {bestProperty ? formatCompactCurrency(bestProperty.netReturn) : "—"}
              </small>
            </div>

            <div className="profit-intelligence-card">
              <span>Weakest Property</span>
              <strong>{weakestProperty?.title ?? "—"}</strong>
              <p>{weakestProperty ? formatPercent(weakestProperty.roi) : "—"}</p>
              <small>
                Net return{" "}
                {weakestProperty
                  ? formatCompactCurrency(weakestProperty.netReturn)
                  : "—"}
              </small>
            </div>
          </div>
        </div>

        <section className="profit-section" ref={requestRef}>
          <div className="profit-section-head">
            <div>
              <h2 className="profit-section-title">Profit Requests</h2>
              <p className="profit-section-subtitle">
                Track distribution requests currently in progress
              </p>
            </div>
            <span className="profit-chip">Governance</span>
          </div>

          {data?.pendingRequest ? (
            <div className="profit-request-card">
              <strong>{data.pendingRequest.propertyTitle}</strong>
              <p>Requested amount: {formatCurrency(data.pendingRequest.amount)}</p>
              <div className="profit-request-meta">
                <span>Status: {data.pendingRequest.status}</span>
                <span>Votes: {data.pendingRequest.votesCount}</span>
                <span>Expires: {formatDate(data.pendingRequest.expiresAt)}</span>
              </div>
            </div>
          ) : (
            <div className="profit-empty">
              No active profit request.
              <br />
              <span>Any pending vote or distribution request will appear here.</span>
            </div>
          )}
        </section>
      </section>

      <section className="profit-section" ref={propertyRef}>
        <div className="profit-section-head">
          <div>
            <h2 className="profit-section-title">Property Performance</h2>
            <p className="profit-section-subtitle">
              Institutional breakdown of each property in your portfolio
            </p>
          </div>
          <span className="profit-chip">
            {data?.propertyPerformance.length ?? 0} Holdings
          </span>
        </div>

        {loading ? (
          <div className="profit-empty">Loading properties...</div>
        ) : (
          <div className="profit-property-grid">
            {data?.propertyPerformance.map((item) => (
              <div key={item.propertyId} className="profit-property-card">
                <div className="profit-property-top">
                  <div>
                    <div className="profit-property-topline">
                      <span className="profit-top-tag">
                        {item.location || "Location"}
                      </span>
                      <span
                        className={`profit-top-tag ${getPerformanceTone(item.roi)}`}
                      >
                        {item.roi >= 15
                          ? "Outperforming"
                          : item.roi >= 0
                          ? "Stable"
                          : "Under pressure"}
                      </span>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.location || "No location"}</p>
                  </div>

                  <div className="profit-property-price-box">
                    <span>Net Return</span>
                    <strong>{formatCompactCurrency(item.netReturn)}</strong>
                  </div>
                </div>

                <div className="profit-property-metrics">
                  <div className="profit-metric-card">
                    <span>Invested</span>
                    <strong>{formatCompactCurrency(item.investedCapital)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Current Value</span>
                    <strong>{formatCompactCurrency(item.currentValue)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Profit Earned</span>
                    <strong>{formatCompactCurrency(item.totalProfitEarned)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Allocated Expenses</span>
                    <strong>{formatCompactCurrency(item.allocatedExpenses)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>ROI</span>
                    <strong>{formatPercent(item.roi)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Yield</span>
                    <strong>{formatPercent(item.yieldPercent)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Occupancy</span>
                    <strong>{formatPercent(item.occupancyRate)}</strong>
                  </div>
                  <div className="profit-metric-card">
                    <span>Price Move</span>
                    <strong>{formatPercent(item.priceMovementPercent)}</strong>
                  </div>
                </div>

                <div className="profit-property-bottom">
                  <div className="profit-mini-data">
                    <span>Shares Owned</span>
                    <strong>{item.sharesOwned}</strong>
                  </div>
                  <div className="profit-mini-data">
                    <span>Current Share Price</span>
                    <strong>{formatCompactCurrency(item.currentSharePrice)}</strong>
                  </div>
                  <div className="profit-mini-data">
                    <span>Entry Share Price</span>
                    <strong>{formatCompactCurrency(item.entrySharePrice)}</strong>
                  </div>
                  <div className="profit-mini-data">
                    <span>Expense Impact</span>
                    <strong>{formatPercent(item.expenseImpactPercent)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profit-section" ref={distributionsRef}>
        <div className="profit-section-head">
          <div>
            <h2 className="profit-section-title">Recent Distributions</h2>
            <p className="profit-section-subtitle">
              Latest investor profit credits across your portfolio
            </p>
          </div>
          <span className="profit-chip">Payout History</span>
        </div>

        {loading ? (
          <div className="profit-empty">Loading distributions...</div>
        ) : !data?.recentDistributions.length ? (
          <div className="profit-empty">
            No distributions yet.
            <br />
            <span>Profit distributions will appear here once credited.</span>
          </div>
        ) : (
          <div className="profit-distribution-list">
            {data.recentDistributions.map((item) => (
              <div key={item.id} className="profit-distribution-card">
                <div className="profit-distribution-left">
                  <h4>{item.propertyTitle}</h4>
                  <p>
                    Period {item.periodMonth}/{item.periodYear}
                  </p>
                </div>

                <div className="profit-distribution-right">
                  <strong>{formatCurrency(item.amount)}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}