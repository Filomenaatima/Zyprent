"use client";

import "@/styles/portfolio.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type PortfolioProperty = {
  propertyId: string;
  title?: string | null;
  location?: string | null;
  sharesOwned: number;
  totalInvested: number;
  currentValue: number;
  totalProfitEarned: number;
  unrealizedReturn: number;
  totalReturn: number;
  roi: number;
  entryPricePerShare: number;
  currentPricePerShare: number;
  priceMovementDirection?: "UP" | "DOWN" | "FLAT";
  priceMovementPercent?: number;
};

type PropertyAllocationItem = {
  propertyId: string;
  title?: string | null;
  location?: string | null;
  invested: number;
  allocationPercent: number;
};

type PortfolioSignals = {
  topHolding: string | null;
  topPerformer: string | null;
  avgEntryPrice: number;
};

type PortfolioSummary = {
  propertiesCount: number;
  sharesHeld: number;
  walletBalance: number;
  totalInvested: number;
  totalPortfolioValue: number;
  totalProfitEarned: number;
  unrealizedReturn: number;
  totalReturn: number;
  roi: number;
};

type PortfolioResponse = {
  totalInvested: number;
  totalOwnershipPercentage: number;
  walletBalance: number;
  totalPortfolioValue: number;
  totalProfitEarned: number;
  unrealizedReturn: number;
  totalReturn: number;
  roi: number;
  summary: PortfolioSummary;
  propertyAllocation: PropertyAllocationItem[];
  portfolioSignals: PortfolioSignals;
  properties: PortfolioProperty[];
};

type LeaderboardItem = {
  rank: number;
  investorId: string;
  name: string;
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitEarned: number;
  unrealizedReturn: number;
  totalReturn: number;
  sharesOwned: number;
  roi: number;
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "UGX 0";
  }

  return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getMovement(
  currentPricePerShare: number,
  entryPricePerShare: number,
): "up" | "down" | "flat" {
  if (currentPricePerShare > entryPricePerShare) return "up";
  if (currentPricePerShare < entryPricePerShare) return "down";
  return "flat";
}

function getMovementSymbol(movement: "up" | "down" | "flat") {
  if (movement === "up") return "↑";
  if (movement === "down") return "↓";
  return "→";
}

function getMovementLabel(movement: "up" | "down" | "flat") {
  if (movement === "up") return "Up";
  if (movement === "down") return "Down";
  return "Flat";
}

function getBadgeLabel(rank: number) {
  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return null;
}

function anonymizeInvestor(name: string, rank: number) {
  const badge = getBadgeLabel(rank);
  if (badge) return `${badge} Investor`;
  return `Investor #${rank}`;
}

const allocationColors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPortfolio() {
      try {
        const [portfolioRes, leaderboardRes] = await Promise.all([
          api.get<PortfolioResponse>("/portfolio"),
          api.get<LeaderboardItem[]>("/portfolio/leaderboard?limit=5"),
        ]);

        if (!mounted) return;

        setData(portfolioRes.data);
        setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error("Failed to load portfolio", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPortfolio();

    return () => {
      mounted = false;
    };
  }, []);

  const properties = useMemo(() => {
    return data?.properties ?? [];
  }, [data]);

  const summary = data?.summary;

  const totalInvested = Number(summary?.totalInvested ?? data?.totalInvested ?? 0);
  const totalSharesHeld = Number(
    summary?.sharesHeld ?? data?.totalOwnershipPercentage ?? 0,
  );
  const walletBalance = Number(summary?.walletBalance ?? data?.walletBalance ?? 0);
  const totalPortfolioValue = Number(
    summary?.totalPortfolioValue ?? data?.totalPortfolioValue ?? 0,
  );
  const totalProfitEarned = Number(
    summary?.totalProfitEarned ?? data?.totalProfitEarned ?? 0,
  );
  const unrealizedReturn = Number(
    summary?.unrealizedReturn ?? data?.unrealizedReturn ?? 0,
  );
  const totalReturn = Number(summary?.totalReturn ?? data?.totalReturn ?? 0);
  const roi = Number(summary?.roi ?? data?.roi ?? 0);

  const allocationData = useMemo(() => {
    const rows = data?.propertyAllocation ?? [];

    return rows.map((item, index) => ({
      key: item.propertyId,
      name: item.title || "Untitled Property",
      location: item.location || "No location",
      percent: Number(item.allocationPercent || 0),
      color: allocationColors[index % allocationColors.length],
    }));
  }, [data]);

  const performanceData = useMemo(() => {
    const rows = properties;
    const maxReturn = Math.max(
      ...rows.map((row) => Math.abs(Number(row.totalReturn || 0))),
      1,
    );

    return [...rows]
      .sort((a, b) => Number(b.roi || 0) - Number(a.roi || 0))
      .map((row) => ({
        propertyId: row.propertyId,
        title: row.title,
        invested: Number(row.totalInvested || 0),
        currentValue: Number(row.currentValue || 0),
        totalProfitEarned: Number(row.totalProfitEarned || 0),
        unrealizedReturn: Number(row.unrealizedReturn || 0),
        totalReturn: Number(row.totalReturn || 0),
        roi: Number(row.roi || 0),
        entryPricePerShare: Number(row.entryPricePerShare || 0),
        currentPricePerShare: Number(row.currentPricePerShare || 0),
        barWidth: Math.max(
          (Math.abs(Number(row.totalReturn || 0)) / maxReturn) * 100,
          8,
        ),
      }));
  }, [properties]);

  const summaryCards = [
    {
      label: "Properties",
      value: String(summary?.propertiesCount ?? properties.length).padStart(2, "0"),
    },
    {
      label: "Shares Held",
      value: totalSharesHeld.toLocaleString(),
    },
    {
      label: "Wallet Balance",
      value: formatCurrency(walletBalance),
    },
    {
      label: "Total Profit Earned",
      value: formatCurrency(totalProfitEarned),
    },
  ];

  const signals = [
    {
      label: "Top Holding",
      value: data?.portfolioSignals?.topHolding || "No holdings yet",
    },
    {
      label: "Top Performer",
      value: data?.portfolioSignals?.topPerformer || "—",
    },
    {
      label: "Avg Entry Price",
      value:
        Number(data?.portfolioSignals?.avgEntryPrice ?? 0) > 0
          ? formatCurrency(Number(data?.portfolioSignals?.avgEntryPrice ?? 0))
          : "UGX 0",
    },
    {
      label: "Portfolio ROI",
      value: formatPercent(roi),
    },
  ];

  return (
    <div className="portfolio-shell">
      <section className="portfolio-top-grid">
        <div className="portfolio-intro-card">
          <p className="portfolio-hero-eyebrow">Investor Portfolio</p>
          <h1 className="portfolio-hero-title">Your wealth at a glance</h1>
          <p className="portfolio-hero-text">
            Track holdings, invested capital, portfolio value, realized payouts,
            and live performance across your real estate investments.
          </p>

          <div className="portfolio-kpi-row">
            {summaryCards.map((item) => (
              <div key={item.label} className="portfolio-kpi-card">
                <p className="portfolio-kpi-label">{item.label}</p>
                <h3 className="portfolio-kpi-value">{item.value}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="portfolio-hero-card">
          <p className="portfolio-hero-card-label">Total Portfolio Value</p>
          <h2 className="portfolio-hero-card-value">
            {loading ? "Loading..." : formatCurrency(totalPortfolioValue)}
          </h2>

          <div className="portfolio-hero-card-bottom">
            <div className="portfolio-hero-stat-box">
              <p className="portfolio-hero-meta-label">Total Invested</p>
              <p className="portfolio-hero-meta-value">
                {formatCurrency(totalInvested)}
              </p>
            </div>

            <div className="portfolio-hero-stat-box">
              <p className="portfolio-hero-meta-label">Return Position</p>
              <p
                className={`portfolio-hero-meta-value ${
                  unrealizedReturn >= 0 ? "positive" : "negative"
                }`}
              >
                {unrealizedReturn >= 0 ? "+" : "-"}{" "}
                {formatCurrency(Math.abs(unrealizedReturn))}
              </p>
            </div>

            <div className="portfolio-hero-stat-box">
              <p className="portfolio-hero-meta-label">Total Return</p>
              <p
                className={`portfolio-hero-meta-value ${
                  totalReturn >= 0 ? "positive" : "negative"
                }`}
              >
                {totalReturn >= 0 ? "+" : "-"} {formatCurrency(Math.abs(totalReturn))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-middle-grid">
        <div className="portfolio-panel portfolio-allocation-panel">
          <div className="portfolio-panel-head">
            <div>
              <h3 className="portfolio-panel-title">Property Allocation</h3>
              <p className="portfolio-panel-subtitle">
                Where your invested capital is currently placed
              </p>
            </div>
            <span className="portfolio-chip">Live</span>
          </div>

          {allocationData.length === 0 ? (
            <div className="portfolio-empty-state">
              No property allocation yet.
            </div>
          ) : (
            <div className="portfolio-allocation-list">
              {allocationData.map((item) => (
                <div key={item.key} className="portfolio-allocation-item">
                  <div className="portfolio-allocation-item-top">
                    <div className="portfolio-allocation-item-left">
                      <span
                        className="portfolio-allocation-color"
                        style={{ background: item.color }}
                      />
                      <div>
                        <p className="portfolio-allocation-name">{item.name}</p>
                        <p className="portfolio-allocation-location">
                          {item.location}
                        </p>
                      </div>
                    </div>

                    <strong className="portfolio-allocation-percent">
                      {formatPercent(item.percent)}
                    </strong>
                  </div>

                  <div className="portfolio-allocation-bar-track">
                    <div
                      className="portfolio-allocation-bar-fill"
                      style={{
                        width: `${Math.max(item.percent, 4)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="portfolio-panel portfolio-signals-panel">
          <div className="portfolio-panel-head">
            <div>
              <h3 className="portfolio-panel-title">Portfolio Signals</h3>
              <p className="portfolio-panel-subtitle">
                Key live indicators from your holdings
              </p>
            </div>
            <span className="portfolio-chip">Current</span>
          </div>

          <div className="portfolio-signals">
            {signals.map((item) => (
              <div key={item.label} className="portfolio-signal-row">
                <span className="portfolio-signal-label">{item.label}</span>
                <strong className="portfolio-signal-value">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-bottom-grid">
        <section className="portfolio-panel portfolio-performance-panel">
          <div className="portfolio-panel-head">
            <div>
              <h3 className="portfolio-panel-title">Performance by Property</h3>
              <p className="portfolio-panel-subtitle">
                Live return across each holding
              </p>
            </div>
            <span className="portfolio-chip">Performance</span>
          </div>

          {performanceData.length === 0 ? (
            <div className="portfolio-empty-state">
              No performance data yet.
            </div>
          ) : (
            <div className="portfolio-performance-list">
              {performanceData.map((item) => {
                const movement = getMovement(
                  Number(item.currentPricePerShare || 0),
                  Number(item.entryPricePerShare || 0),
                );

                return (
                  <div key={item.propertyId} className="portfolio-performance-row">
                    <div className="portfolio-performance-main">
                      <div className="portfolio-performance-head">
                        <div>
                          <p className="portfolio-performance-title">
                            {item.title || "Untitled Property"}
                          </p>
                          <p className="portfolio-performance-subtitle">
                            Invested {formatCurrency(item.invested)} · Current{" "}
                            {formatCurrency(item.currentValue)}
                          </p>
                        </div>

                        <div className="portfolio-performance-right">
                          <p
                            className={`portfolio-performance-return ${
                              item.totalReturn >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {item.totalReturn >= 0 ? "+" : "-"}{" "}
                            {formatCurrency(Math.abs(item.totalReturn))}
                          </p>
                          <p className="portfolio-performance-roi">
                            {formatPercent(item.roi)}
                          </p>
                        </div>
                      </div>

                      <div className="portfolio-performance-bar-track">
                        <div
                          className={`portfolio-performance-bar-fill ${
                            item.totalReturn >= 0 ? "positive" : "negative"
                          }`}
                          style={{ width: `${item.barWidth}%` }}
                        />
                      </div>

                      <div className="portfolio-performance-meta">
                        <span className={`portfolio-price-movement ${movement}`}>
                          {getMovementSymbol(movement)} {getMovementLabel(movement)}
                        </span>
                        <span>
                          Share price {formatCurrency(item.currentPricePerShare)}
                        </span>
                        <span>
                          Payouts {formatCurrency(item.totalProfitEarned)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="portfolio-panel portfolio-leaderboard-panel">
          <div className="portfolio-panel-head">
            <div>
              <h3 className="portfolio-panel-title">Investor Leaderboard</h3>
              <p className="portfolio-panel-subtitle">
                Highest performing investors on the platform
              </p>
            </div>
            <span className="portfolio-chip">Top 5</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="portfolio-empty-state">
              No leaderboard data yet.
            </div>
          ) : (
            <div className="portfolio-leaderboard-list">
              {leaderboard.map((item) => {
                const badge = getBadgeLabel(item.rank);

                return (
                  <div key={item.investorId} className="portfolio-leaderboard-row">
                    <div className="portfolio-leaderboard-left">
                      <span
                        className={`portfolio-leaderboard-rank ${
                          badge ? badge.toLowerCase() : ""
                        }`}
                      >
                        #{item.rank}
                      </span>

                      <div>
                        <div className="portfolio-leaderboard-name-row">
                          <p className="portfolio-leaderboard-name">
                            {anonymizeInvestor(item.name, item.rank)}
                          </p>

                          {badge && (
                            <span
                              className={`portfolio-investor-badge ${badge.toLowerCase()}`}
                            >
                              {badge}
                            </span>
                          )}
                        </div>

                        <p className="portfolio-leaderboard-meta">
                          Invested {formatCurrency(item.totalInvested)}
                        </p>
                      </div>
                    </div>

                    <div className="portfolio-leaderboard-right">
                      <p className="portfolio-leaderboard-roi">
                        {formatPercent(item.roi)}
                      </p>
                      <p className="portfolio-leaderboard-return">
                        {formatCurrency(item.totalReturn)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <section className="portfolio-panel portfolio-investments-panel">
        <div className="portfolio-panel-head">
          <div>
            <h3 className="portfolio-panel-title">My Investments</h3>
            <p className="portfolio-panel-subtitle">
              Real estate positions across your investor portfolio
            </p>
          </div>
          <span className="portfolio-chip">
            {String(properties.length).padStart(2, "0")} active
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="portfolio-empty-state">
            You have not invested in any property yet.
          </div>
        ) : (
          <div className="portfolio-investment-grid">
            {properties.map((item) => {
              const currentValue = Number(item.currentValue || item.totalInvested || 0);
              const invested = Number(item.totalInvested || 0);
              const movement = getMovement(
                Number(item.currentPricePerShare || 0),
                Number(item.entryPricePerShare || 0),
              );

              return (
                <div key={item.propertyId} className="portfolio-investment-card">
                  <div className="portfolio-investment-top">
                    <div>
                      <h4 className="portfolio-investment-name">
                        {item.title || "Untitled Property"}
                      </h4>
                      <p className="portfolio-investment-location">
                        {item.location || "No location"}
                      </p>
                    </div>
                    <span className="portfolio-investment-link">Holding</span>
                  </div>

                  <div className="portfolio-investment-value-block">
                    <p className="portfolio-investment-value">
                      {formatCurrency(invested)}
                    </p>
                    <p className="portfolio-investment-caption">
                      Invested capital
                    </p>
                  </div>

                  <div className="portfolio-investment-meta-grid">
                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">Shares</p>
                      <p className="portfolio-investment-meta-value">
                        {item.sharesOwned.toLocaleString()}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">
                        Current Value
                      </p>
                      <p className="portfolio-investment-meta-value">
                        {formatCurrency(currentValue)}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">
                        Cash Payouts
                      </p>
                      <p className="portfolio-investment-meta-value">
                        {formatCurrency(item.totalProfitEarned)}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">
                        Share Price
                      </p>
                      <p className="portfolio-investment-meta-value">
                        {formatCurrency(item.currentPricePerShare)}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">
                        Price Move
                      </p>
                      <p
                        className={`portfolio-investment-meta-value movement-${movement}`}
                      >
                        {getMovementSymbol(movement)} {getMovementLabel(movement)}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card">
                      <p className="portfolio-investment-meta-label">
                        Unrealized
                      </p>
                      <p className="portfolio-investment-meta-value">
                        {item.unrealizedReturn >= 0 ? "+" : "-"}{" "}
                        {formatCurrency(Math.abs(item.unrealizedReturn))}
                      </p>
                    </div>

                    <div className="portfolio-investment-meta-card full">
                      <p className="portfolio-investment-meta-label">Total ROI</p>
                      <p className="portfolio-investment-meta-value">
                        {formatPercent(item.roi)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}