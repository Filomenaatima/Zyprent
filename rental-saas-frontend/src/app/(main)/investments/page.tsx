"use client";

import "@/styles/investments.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type OpportunityItem = {
  propertyId: string;
  title: string;
  location: string | null;
  slug?: string | null;
  phase?: number;
  version?: number;
  isPropertyActive?: boolean;
  pricePerShare: number;
  totalShares: number;
  sharesSold: number;
  sharesRemaining: number;
  progress: number;
  isActive: boolean;
  isSoldOut: boolean;
  userSharesOwned: number;
  hasInvested: boolean;
};

type MarketplaceItem = {
  id: string;
  investorId: string;
  propertyId: string;
  shares: number;
  pricePerShare: number;
  isActive: boolean;
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug?: string | null;
    location?: string | null;
  };
  investor: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

type HistoryItem = {
  id: string;
  investorId: string;
  propertyId: string;
  investorShareId: string;
  shares: number;
  amount: number;
  type: "BUY" | "SELL" | "TRANSFER";
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug?: string | null;
    location?: string | null;
  };
};

type InactiveOfferItem = {
  propertyId: string;
  title: string;
  location: string | null;
  slug?: string | null;
  phase?: number;
  version?: number;
  pricePerShare: number;
  totalShares: number;
  sharesSold: number;
  sharesRemaining: number;
  isActive: boolean;
  isSoldOut: boolean;
};

type AdminInvestmentItem = {
  id: string;
  amount: number;
  createdAt?: string;
  investor?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  property?: {
    id?: string;
    title?: string;
    location?: string | null;
  };
};

type AdminOverview = {
  totalInvestments: number;
  totalInvested: number;
  totalDistributed: number;
  totalProperties: number;
  activeOffers: number;
};

type SortMode =
  | "featured"
  | "price-low"
  | "price-high"
  | "progress-high"
  | "progress-low"
  | "roi-high";

type OfferFilter = "all" | "watchlist" | "holdings" | "open-only";

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

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOfferStatus(item: OpportunityItem) {
  if (item.isSoldOut) return "Sold Out";
  if (!item.isActive) return "Inactive";
  return "Open";
}

function getHistoryTone(type: HistoryItem["type"]) {
  if (type === "BUY") return "buy";
  if (type === "SELL") return "sell";
  return "transfer";
}

function getDemandLabel(progress: number) {
  if (progress >= 70) return "High demand";
  if (progress >= 40) return "Momentum building";
  return "Early opportunity";
}

function estimateRoi(item: OpportunityItem) {
  const base = 12;
  const demandBoost = item.progress * 0.06;
  const scarcityBoost = item.sharesRemaining <= 20 ? 2.2 : 0;
  return Number((base + demandBoost + scarcityBoost).toFixed(1));
}

function estimateYield(item: OpportunityItem) {
  const yieldValue = 8 + item.progress * 0.03;
  return Number(yieldValue.toFixed(1));
}

function estimateUpside(item: OpportunityItem) {
  const upside = item.progress >= 70 ? 18 : item.progress >= 40 ? 13 : 10;
  return upside;
}

function getLocationTone(location?: string | null) {
  const value = (location || "").toLowerCase();
  if (value.includes("naguru")) return "Prime district";
  if (value.includes("bugolobi")) return "High-demand zone";
  return "Growth zone";
}

function AdminInvestmentsView() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [investments, setInvestments] = useState<AdminInvestmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/investments/admin/overview");
      setOverview(res.data?.summary ?? null);
      setInvestments(res.data?.investments ?? []);
    } catch (error) {
      console.error("Failed to load admin investments overview", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const filteredInvestments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return investments;

    return investments.filter((item) =>
      [
        item.property?.title,
        item.property?.location,
        item.investor?.name,
        item.investor?.email,
        item.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [investments, searchTerm]);

  const propertyMap = useMemo(() => {
    const map = new Map<
      string,
      { title: string; location: string; amount: number; count: number }
    >();

    filteredInvestments.forEach((item) => {
      const key = item.property?.id || item.property?.title || item.id;
      const current = map.get(key);

      if (current) {
        current.amount += Number(item.amount || 0);
        current.count += 1;
      } else {
        map.set(key, {
          title: item.property?.title || "Unknown property",
          location: item.property?.location || "No location",
          amount: Number(item.amount || 0),
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredInvestments]);

  const investorCount = useMemo(() => {
    const ids = new Set(
      filteredInvestments.map((item) => item.investor?.email || item.investor?.name || item.id),
    );
    return ids.size;
  }, [filteredInvestments]);

  const averageInvestment = useMemo(() => {
    if (!filteredInvestments.length) return 0;
    const total = filteredInvestments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    return total / filteredInvestments.length;
  }, [filteredInvestments]);

  return (
    <div className="investments-shell">
      <section className="investments-hero">
        <div className="investments-hero-copy">
          <p className="investments-eyebrow">Admin Investments</p>
          <h1 className="investments-title">
            Monitor capital deployment, investor participation, and funding performance
          </h1>
          <p className="investments-text">
            A premium command center for tracking platform investment activity,
            total capital flow, property-level funding concentration, and profit
            distribution readiness across the portfolio.
          </p>

          <div className="investments-hero-tags">
            <span className="investments-hero-tag">Capital visibility</span>
            <span className="investments-hero-tag">Investor intelligence</span>
            <span className="investments-hero-tag">Funding oversight</span>
            <span className="investments-hero-tag">Distribution readiness</span>
          </div>
        </div>

        <div className="investments-summary-grid">
          <div className="investments-summary-card dark">
            <p className="investments-summary-label">Total Investments</p>
            <h3 className="investments-summary-value">
              {overview?.totalInvestments ?? 0}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">Capital Deployed</p>
            <h3 className="investments-summary-value small">
              {formatCompactCurrency(overview?.totalInvested ?? 0)}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">Profit Distributed</p>
            <h3 className="investments-summary-value small">
              {formatCompactCurrency(overview?.totalDistributed ?? 0)}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">Active Offers</p>
            <h3 className="investments-summary-value">
              {overview?.activeOffers ?? 0}
            </h3>
          </div>
        </div>
      </section>

      <section className="investments-overview-bar">
        <div className="investments-overview-item">
          <span>Tracked Properties</span>
          <strong>{overview?.totalProperties ?? 0}</strong>
        </div>
        <div className="investments-overview-item">
          <span>Visible Investors</span>
          <strong>{investorCount}</strong>
        </div>
        <div className="investments-overview-item">
          <span>Average Ticket</span>
          <strong>{formatCompactCurrency(averageInvestment)}</strong>
        </div>
        <div className="investments-overview-item">
          <span>Registry Status</span>
          <strong>{loading ? "Loading" : "Live"}</strong>
        </div>
      </section>

      <section className="investments-section investments-compare-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">Investment Registry</h2>
            <p className="investments-section-subtitle">
              Platform-wide visibility into investor allocations and capital movements
            </p>
          </div>
          <span className="investments-chip">
            {loading ? "Loading..." : `${filteredInvestments.length} records`}
          </span>
        </div>

        <div className="investments-toolbar">
          <div className="investments-toolbar-left">
            <button type="button" className="investments-filter-pill active">
              All Investments
            </button>
            <button type="button" className="investments-filter-pill">
              Capital View
            </button>
            <button type="button" className="investments-filter-pill">
              Property View
            </button>
          </div>

          <div className="investments-toolbar-right">
            <input
              className="investments-search-input"
              placeholder="Search property or investor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="investments-empty">Loading investment data...</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="investments-empty">
            No investments available yet.
            <br />
            <span>Records will appear once platform investments are created.</span>
          </div>
        ) : (
          <div className="investments-history-list">
            {filteredInvestments.map((item) => (
              <div key={item.id} className="investments-history-card premium">
                <div className="investments-history-left">
                  <h4>{item.property?.title || "Unknown property"}</h4>
                  <p>{item.property?.location || "No location"}</p>
                </div>

                <div className="investments-history-mid">
                  <span className="investments-history-type buy">INVESTMENT</span>
                  <span>{item.investor?.name || item.investor?.email || "Unknown investor"}</span>
                </div>

                <div className="investments-history-right">
                  <strong>{formatCurrency(Number(item.amount || 0))}</strong>
                  <span>
                    {item.createdAt ? formatDate(item.createdAt) : "Capital deployed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">Property Funding Breakdown</h2>
            <p className="investments-section-subtitle">
              Identify where capital is concentrated across the portfolio
            </p>
          </div>
          <span className="investments-chip">Admin Insight</span>
        </div>

        {propertyMap.length === 0 ? (
          <div className="investments-empty">
            No property funding breakdown yet.
            <br />
            <span>Funding analytics will appear when investments exist.</span>
          </div>
        ) : (
          <div className="investments-card-grid compact">
            {propertyMap.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="investments-card premium elevated"
              >
                <div className="investments-card-top">
                  <div>
                    <div className="investments-card-topline">
                      <span className="investments-location-tone">
                        {getLocationTone(item.location)}
                      </span>
                      <span className="investments-demand-tone">
                        {item.count} allocation{item.count > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 className="investments-card-title">{item.title}</h3>
                    <p className="investments-card-location">{item.location}</p>
                  </div>

                  <span className="investments-status open">Active</span>
                </div>

                <div className="investments-price-block">
                  <div>
                    <p className="investments-price">
                      {formatCompactCurrency(item.amount)}
                    </p>
                    <p className="investments-price-caption">
                      Total capital deployed
                    </p>
                  </div>

                  <div className="investments-price-side">
                    <span>Investment count</span>
                    <strong>{item.count}</strong>
                  </div>
                </div>

                <div className="investments-signal-row">
                  <div className="investments-signal-card">
                    <span>Avg Ticket</span>
                    <strong>{formatCompactCurrency(item.amount / item.count)}</strong>
                  </div>
                  <div className="investments-signal-card">
                    <span>Portfolio Share</span>
                    <strong>
                      {overview?.totalInvested
                        ? `${((item.amount / overview.totalInvested) * 100).toFixed(1)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="investments-signal-card">
                    <span>Capital Rank</span>
                    <strong>#{index + 1}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">Executive Snapshot</h2>
            <p className="investments-section-subtitle">
              High-level signals for investment administration
            </p>
          </div>
          <span className="investments-chip">Snapshot</span>
        </div>

        <div className="investments-card-grid compact">
          <div className="investments-compare-card">
            <h3>Distribution Readiness</h3>
            <p>Capital and distribution performance across all recorded positions</p>

            <div className="investments-compare-row">
              <span>Total Distributed</span>
              <strong>{formatCurrency(overview?.totalDistributed ?? 0)}</strong>
            </div>
            <div className="investments-compare-row">
              <span>Total Capital</span>
              <strong>{formatCurrency(overview?.totalInvested ?? 0)}</strong>
            </div>
            <div className="investments-compare-row">
              <span>Distribution Ratio</span>
              <strong>
                {overview?.totalInvested
                  ? `${(((overview.totalDistributed ?? 0) / overview.totalInvested) * 100).toFixed(1)}%`
                  : "0%"}
              </strong>
            </div>
          </div>

          <div className="investments-compare-card">
            <h3>Portfolio Coverage</h3>
            <p>Property and offer-level visibility for admin monitoring</p>

            <div className="investments-compare-row">
              <span>Tracked Properties</span>
              <strong>{overview?.totalProperties ?? 0}</strong>
            </div>
            <div className="investments-compare-row">
              <span>Active Offers</span>
              <strong>{overview?.activeOffers ?? 0}</strong>
            </div>
            <div className="investments-compare-row">
              <span>Investment Records</span>
              <strong>{overview?.totalInvestments ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InvestorInvestmentsView() {
  const { user, hydrateAuth } = useAuthStore();

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inactiveOffers, setInactiveOffers] = useState<InactiveOfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [offerFilter, setOfferFilter] = useState<OfferFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [buyingPropertyId, setBuyingPropertyId] = useState<string | null>(null);
  const [buyingListingId, setBuyingListingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const offersRef = useRef<HTMLElement | null>(null);
  const marketplaceRef = useRef<HTMLElement | null>(null);
  const historyRef = useRef<HTMLElement | null>(null);
  const archiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    hydrateAuth();

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [hydrateAuth]);

  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem("investment_watchlist");
      const storedCompare = localStorage.getItem("investment_compare");

      if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
      if (storedCompare) setCompareIds(JSON.parse(storedCompare));
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("investment_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("investment_compare", JSON.stringify(compareIds));
  }, [compareIds]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [opportunitiesRes, marketplaceRes, historyRes, inactiveRes] =
        await Promise.all([
          api.get<OpportunityItem[]>("/investments/opportunities"),
          api.get<MarketplaceItem[]>("/investments/marketplace"),
          api.get<HistoryItem[]>("/investments/history"),
          api.get<InactiveOfferItem[]>("/investments/inactive"),
        ]);

      setOpportunities(opportunitiesRes.data ?? []);
      setMarketplace(marketplaceRes.data ?? []);
      setHistory(historyRes.data ?? []);
      setInactiveOffers(inactiveRes.data ?? []);
    } catch (error) {
      console.error("Failed to load investments page", error);
      setActionError("Failed to load investment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        setLoading(true);
        const [opportunitiesRes, marketplaceRes, historyRes, inactiveRes] =
          await Promise.all([
            api.get<OpportunityItem[]>("/investments/opportunities"),
            api.get<MarketplaceItem[]>("/investments/marketplace"),
            api.get<HistoryItem[]>("/investments/history"),
            api.get<InactiveOfferItem[]>("/investments/inactive"),
          ]);

        if (!mounted) return;

        setOpportunities(opportunitiesRes.data ?? []);
        setMarketplace(marketplaceRes.data ?? []);
        setHistory(historyRes.data ?? []);
        setInactiveOffers(inactiveRes.data ?? []);
      } catch (error) {
        console.error("Failed to load investments page", error);
        if (mounted) setActionError("Failed to load investment data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    start();

    return () => {
      mounted = false;
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const baseOpenOffers = useMemo(
    () => opportunities.filter((item) => item.isActive && !item.isSoldOut),
    [opportunities],
  );

  const investedOffers = useMemo(
    () => opportunities.filter((item) => item.hasInvested),
    [opportunities],
  );

  const filteredOffers = useMemo(() => {
    let items = [...baseOpenOffers];

    if (offerFilter === "watchlist") {
      items = items.filter((item) => watchlist.includes(item.propertyId));
    }

    if (offerFilter === "holdings") {
      items = items.filter((item) => item.hasInvested);
    }

    if (offerFilter === "open-only") {
      items = items.filter((item) => item.isActive && !item.isSoldOut);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          (item.location || "").toLowerCase().includes(term),
      );
    }

    items.sort((a, b) => {
      switch (sortMode) {
        case "price-low":
          return a.pricePerShare - b.pricePerShare;
        case "price-high":
          return b.pricePerShare - a.pricePerShare;
        case "progress-high":
          return b.progress - a.progress;
        case "progress-low":
          return a.progress - b.progress;
        case "roi-high":
          return estimateRoi(b) - estimateRoi(a);
        case "featured":
        default:
          return (
            (b.progress + (b.hasInvested ? 15 : 0)) -
            (a.progress + (a.hasInvested ? 15 : 0))
          );
      }
    });

    return items;
  }, [baseOpenOffers, offerFilter, watchlist, searchTerm, sortMode]);

  const compareItems = useMemo(
    () => opportunities.filter((item) => compareIds.includes(item.propertyId)),
    [opportunities, compareIds],
  );

  const summary = useMemo(() => {
    const totalOpenProperties = baseOpenOffers.length;
    const totalMarketplaceListings = marketplace.length;
    const totalInvestedProperties = investedOffers.length;
    const totalOwnedShares = investedOffers.reduce(
      (sum, item) => sum + Number(item.userSharesOwned || 0),
      0,
    );
    const totalCapitalOpen = baseOpenOffers.reduce(
      (sum, item) => sum + item.sharesRemaining * item.pricePerShare,
      0,
    );

    return {
      totalOpenProperties,
      totalMarketplaceListings,
      totalInvestedProperties,
      totalOwnedShares,
      totalCapitalOpen,
    };
  }, [baseOpenOffers, marketplace, investedOffers]);

  const averageProjectedRoi = useMemo(() => {
    if (!baseOpenOffers.length) return 0;

    return Number(
      (
        baseOpenOffers.reduce((sum, item) => sum + estimateRoi(item), 0) /
        baseOpenOffers.length
      ).toFixed(1),
    );
  }, [baseOpenOffers]);

  const toggleWatchlist = (propertyId: string) => {
    setWatchlist((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  };

  const toggleCompare = (propertyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      }

      if (prev.length >= 3) {
        return [...prev.slice(1), propertyId];
      }

      return [...prev, propertyId];
    });
  };

  const handleBuyShares = async (item: OpportunityItem) => {
    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setActionError("User not authenticated.");
      return;
    }

    const sharesInput = window.prompt(
      `How many shares do you want to buy in ${item.title}?`,
    );

    if (!sharesInput) return;

    const shares = Number(sharesInput);

    if (!Number.isFinite(shares) || shares <= 0) {
      setActionError("Enter a valid number of shares.");
      return;
    }

    if (shares > item.sharesRemaining) {
      setActionError(`Only ${item.sharesRemaining} shares remain for this offer.`);
      return;
    }

    try {
      setBuyingPropertyId(item.propertyId);

      await api.post("/investment-offers/buy", {
        investorId: user.id,
        propertyId: item.propertyId,
        shares,
      });

      setActionMessage(
        `Successfully purchased ${shares} share${shares > 1 ? "s" : ""} in ${item.title}.`,
      );

      await loadData();
    } catch (error: any) {
      console.error("Failed to buy shares", error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to buy shares.";
      setActionError(
        Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage,
      );
    } finally {
      setBuyingPropertyId(null);
    }
  };

  const handleBuyListing = async (item: MarketplaceItem) => {
    setActionMessage("");
    setActionError("");

    if (!user?.id) {
      setActionError("User not authenticated.");
      return;
    }

    const sharesInput = window.prompt(
      `This listing has ${item.shares} shares. How many do you want to buy?`,
    );

    if (!sharesInput) return;

    const shares = Number(sharesInput);

    if (!Number.isFinite(shares) || shares <= 0) {
      setActionError("Enter a valid number of shares.");
      return;
    }

    if (shares > item.shares) {
      setActionError(`This listing only has ${item.shares} shares available.`);
      return;
    }

    try {
      setBuyingListingId(item.id);

      await api.post("/share-market/buy", {
        listingId: item.id,
        buyerId: user.id,
        shares,
      });

      setActionMessage(
        `Successfully purchased ${shares} listed share${shares > 1 ? "s" : ""} from ${item.property.title}.`,
      );

      await loadData();
    } catch (error: any) {
      console.error("Failed to buy listing", error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to buy listing.";
      setActionError(
        Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage,
      );
    } finally {
      setBuyingListingId(null);
    }
  };

  return (
    <div className="investments-shell">
      <section className="investments-hero">
        <div className="investments-hero-copy">
          <p className="investments-eyebrow">Investor Investments</p>
          <h1 className="investments-title">
            Explore premium opportunities and expand your portfolio
          </h1>
          <p className="investments-text">
            Review direct property offers, watch high-conviction opportunities,
            compare returns, browse secondary listings, and monitor your
            investment activity in one institutional-grade workspace.
          </p>

          <div className="investments-hero-tags">
            <span className="investments-hero-tag">Primary market</span>
            <span className="investments-hero-tag">Secondary market</span>
            <span className="investments-hero-tag">Investor history</span>
            <span className="investments-hero-tag">Watchlist ready</span>
          </div>
        </div>

        <div className="investments-summary-grid">
          <div className="investments-summary-card dark">
            <p className="investments-summary-label">Open Offers</p>
            <h3 className="investments-summary-value">
              {summary.totalOpenProperties}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">My Active Positions</p>
            <h3 className="investments-summary-value">
              {summary.totalInvestedProperties}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">Shares Owned</p>
            <h3 className="investments-summary-value">
              {summary.totalOwnedShares.toLocaleString()}
            </h3>
          </div>

          <div className="investments-summary-card">
            <p className="investments-summary-label">Open Market Value</p>
            <h3 className="investments-summary-value small">
              {formatCompactCurrency(summary.totalCapitalOpen)}
            </h3>
          </div>
        </div>
      </section>

      {(actionMessage || actionError) && (
        <section className="investments-section">
          <div
            className="investments-empty"
            style={{
              borderStyle: "solid",
              borderColor: actionError ? "#fecaca" : "#bbf7d0",
              background: actionError ? "#fff7f7" : "#f3fff7",
              color: actionError ? "#991b1b" : "#166534",
              padding: "18px 20px",
            }}
          >
            {actionError || actionMessage}
          </div>
        </section>
      )}

      <section className="investments-overview-bar">
        <div className="investments-overview-item">
          <span>Projected ROI</span>
          <strong>{averageProjectedRoi}%</strong>
        </div>
        <div className="investments-overview-item">
          <span>Watchlist</span>
          <strong>{watchlist.length}</strong>
        </div>
        <div className="investments-overview-item">
          <span>Compare Queue</span>
          <strong>{compareIds.length}/3</strong>
        </div>
        <div className="investments-overview-item">
          <span>Marketplace Listings</span>
          <strong>{summary.totalMarketplaceListings}</strong>
        </div>
      </section>

      <nav className="investments-quick-nav">
        <button
          type="button"
          className="investments-quick-pill"
          onClick={() => scrollToSection(offersRef)}
        >
          Offers
        </button>
        <button
          type="button"
          className="investments-quick-pill"
          onClick={() => scrollToSection(marketplaceRef)}
        >
          Marketplace
        </button>
        <button
          type="button"
          className="investments-quick-pill"
          onClick={() => scrollToSection(historyRef)}
        >
          History
        </button>
        <button
          type="button"
          className="investments-quick-pill"
          onClick={() => scrollToSection(archiveRef)}
        >
          Archive
        </button>
      </nav>

      {compareItems.length > 0 && (
        <section className="investments-section investments-compare-section">
          <div className="investments-section-head">
            <div>
              <h2 className="investments-section-title">Offer Comparison</h2>
              <p className="investments-section-subtitle">
                Compare your selected opportunities side by side
              </p>
            </div>

            <button
              type="button"
              className="investments-clear-button"
              onClick={() => setCompareIds([])}
            >
              Clear comparison
            </button>
          </div>

          <div className="investments-compare-grid">
            {compareItems.map((item) => (
              <div key={item.propertyId} className="investments-compare-card">
                <h3>{item.title}</h3>
                <p>{item.location || "No location"}</p>

                <div className="investments-compare-row">
                  <span>Price / share</span>
                  <strong>{formatCurrency(item.pricePerShare)}</strong>
                </div>
                <div className="investments-compare-row">
                  <span>Projected ROI</span>
                  <strong>{estimateRoi(item)}%</strong>
                </div>
                <div className="investments-compare-row">
                  <span>Projected Yield</span>
                  <strong>{estimateYield(item)}%</strong>
                </div>
                <div className="investments-compare-row">
                  <span>Upside Potential</span>
                  <strong>{estimateUpside(item)}%</strong>
                </div>
                <div className="investments-compare-row">
                  <span>Funding Progress</span>
                  <strong>{item.progress}%</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section ref={offersRef} className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">
              Available Investment Offers
            </h2>
            <p className="investments-section-subtitle">
              Discover, filter, compare, and invest in active opportunities
            </p>
          </div>
          <span className="investments-chip">Primary Market</span>
        </div>

        <div className="investments-toolbar">
          <div className="investments-toolbar-left">
            <button
              type="button"
              className={`investments-filter-pill ${
                offerFilter === "all" ? "active" : ""
              }`}
              onClick={() => setOfferFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`investments-filter-pill ${
                offerFilter === "watchlist" ? "active" : ""
              }`}
              onClick={() => setOfferFilter("watchlist")}
            >
              Watchlist
            </button>
            <button
              type="button"
              className={`investments-filter-pill ${
                offerFilter === "holdings" ? "active" : ""
              }`}
              onClick={() => setOfferFilter("holdings")}
            >
              My Holdings
            </button>
            <button
              type="button"
              className={`investments-filter-pill ${
                offerFilter === "open-only" ? "active" : ""
              }`}
              onClick={() => setOfferFilter("open-only")}
            >
              Open Only
            </button>
          </div>

          <div className="investments-toolbar-right">
            <input
              className="investments-search-input"
              placeholder="Search by property or area"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="investments-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="featured">Sort: Featured</option>
              <option value="roi-high">Sort: Highest ROI</option>
              <option value="progress-high">Sort: Highest Progress</option>
              <option value="progress-low">Sort: Lowest Progress</option>
              <option value="price-low">Sort: Lowest Price</option>
              <option value="price-high">Sort: Highest Price</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="investments-empty">Loading opportunities...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="investments-empty">
            No offers match your current filters.
            <br />
            <span>Try changing your search, filters, or watchlist view.</span>
          </div>
        ) : (
          <div className="investments-card-grid">
            {filteredOffers.map((item) => {
              const roi = estimateRoi(item);
              const yieldEstimate = estimateYield(item);
              const upside = estimateUpside(item);
              const onWatchlist = watchlist.includes(item.propertyId);
              const inCompare = compareIds.includes(item.propertyId);

              return (
                <div
                  key={item.propertyId}
                  className="investments-card premium elevated"
                >
                  <div className="investments-card-top">
                    <div>
                      <div className="investments-card-topline">
                        <span className="investments-location-tone">
                          {getLocationTone(item.location)}
                        </span>
                        <span className="investments-demand-tone">
                          {getDemandLabel(item.progress)}
                        </span>
                      </div>

                      <h3 className="investments-card-title">{item.title}</h3>
                      <p className="investments-card-location">
                        {item.location || "No location"}
                      </p>
                    </div>

                    <span
                      className={`investments-status ${getOfferStatus(item)
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {getOfferStatus(item)}
                    </span>
                  </div>

                  <div className="investments-price-block">
                    <div>
                      <p className="investments-price">
                        {formatCurrency(item.pricePerShare)}
                      </p>
                      <p className="investments-price-caption">
                        Price per share
                      </p>
                    </div>

                    <div className="investments-price-side">
                      <span>Projected ROI</span>
                      <strong>{roi}%</strong>
                    </div>
                  </div>

                  <div className="investments-signal-row">
                    <div className="investments-signal-card">
                      <span>Yield</span>
                      <strong>{yieldEstimate}% / yr</strong>
                    </div>
                    <div className="investments-signal-card">
                      <span>Upside</span>
                      <strong>{upside}%</strong>
                    </div>
                    <div className="investments-signal-card">
                      <span>My Position</span>
                      <strong>
                        {item.hasInvested
                          ? `${item.userSharesOwned} shares`
                          : "None"}
                      </strong>
                    </div>
                  </div>

                  <div className="investments-metrics-grid">
                    <div className="investments-metric-card">
                      <p className="investments-metric-label">Total Shares</p>
                      <p className="investments-metric-value">
                        {item.totalShares}
                      </p>
                    </div>

                    <div className="investments-metric-card">
                      <p className="investments-metric-label">Shares Sold</p>
                      <p className="investments-metric-value">
                        {item.sharesSold}
                      </p>
                    </div>

                    <div className="investments-metric-card">
                      <p className="investments-metric-label">Remaining</p>
                      <p className="investments-metric-value">
                        {item.sharesRemaining}
                      </p>
                    </div>

                    <div className="investments-metric-card">
                      <p className="investments-metric-label">Watch Status</p>
                      <p className="investments-metric-value">
                        {onWatchlist ? "Watching" : "Not saved"}
                      </p>
                    </div>
                  </div>

                  <div className="investments-progress-wrap">
                    <div className="investments-progress-top">
                      <span>Funding Progress</span>
                      <strong>{item.progress}%</strong>
                    </div>

                    <div className="investments-progress-track">
                      <div
                        className="investments-progress-fill"
                        style={{ width: `${Math.max(item.progress, 4)}%` }}
                      />
                    </div>

                    <div className="investments-mini-chart">
                      <div style={{ height: `${35 + item.progress * 0.45}px` }} />
                      <div style={{ height: `${45 + item.progress * 0.55}px` }} />
                      <div style={{ height: `${30 + item.progress * 0.4}px` }} />
                      <div style={{ height: `${52 + item.progress * 0.5}px` }} />
                      <div style={{ height: `${38 + item.progress * 0.42}px` }} />
                    </div>
                  </div>

                  <div className="investments-card-actions-top">
                    <button
                      type="button"
                      className={`investments-ghost-button ${
                        onWatchlist ? "active" : ""
                      }`}
                      onClick={() => toggleWatchlist(item.propertyId)}
                    >
                      {onWatchlist ? "Saved" : "Watchlist"}
                    </button>

                    <button
                      type="button"
                      className={`investments-ghost-button ${
                        inCompare ? "active" : ""
                      }`}
                      onClick={() => toggleCompare(item.propertyId)}
                    >
                      {inCompare ? "Added to Compare" : "Compare"}
                    </button>

                    <button
                      type="button"
                      className="investments-ghost-button"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="investments-card-bottom sticky-cta">
                    <div className="investments-holding-note">
                      {item.hasInvested
                        ? `You already own ${item.userSharesOwned} shares`
                        : "You have not invested here yet"}
                    </div>

                    <button
                      className="investments-primary-button"
                      type="button"
                      onClick={() => handleBuyShares(item)}
                      disabled={buyingPropertyId === item.propertyId}
                    >
                      {buyingPropertyId === item.propertyId
                        ? "Processing..."
                        : "Buy Shares"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section ref={marketplaceRef} className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">
              Secondary Market Listings
            </h2>
            <p className="investments-section-subtitle">
              Premium resale opportunities from other investors
            </p>
          </div>
          <span className="investments-chip">Marketplace</span>
        </div>

        {marketplace.length === 0 ? (
          <div className="investments-empty">
            No active marketplace listings.
            <br />
            <span>
              Check back later for investor-to-investor opportunities.
            </span>
          </div>
        ) : (
          <div className="investments-market-grid">
            {marketplace.map((item) => (
              <div
                key={item.id}
                className="investments-market-card premium-market"
              >
                <div className="investments-market-top">
                  <div>
                    <h4 className="investments-market-title">
                      {item.property.title}
                    </h4>
                    <p className="investments-market-location">
                      {item.property.location || "No location"}
                    </p>
                  </div>
                  <span className="investments-market-badge">
                    Live Listing
                  </span>
                </div>

                <div className="investments-market-stats">
                  <div className="investments-market-stat">
                    <span>Seller</span>
                    <strong>
                      {item.investor.name || item.investor.email || "Investor"}
                    </strong>
                  </div>
                  <div className="investments-market-stat">
                    <span>Shares</span>
                    <strong>{item.shares}</strong>
                  </div>
                  <div className="investments-market-stat">
                    <span>Price / Share</span>
                    <strong>{formatCurrency(item.pricePerShare)}</strong>
                  </div>
                  <div className="investments-market-stat">
                    <span>Total Asking</span>
                    <strong>
                      {formatCurrency(item.shares * item.pricePerShare)}
                    </strong>
                  </div>
                </div>

                <div className="investments-market-bottom">
                  <span className="investments-market-date">
                    Listed {formatDate(item.createdAt)}
                  </span>

                  <div className="investments-market-actions">
                    <button type="button" className="investments-ghost-button">
                      Compare
                    </button>
                    <button
                      className="investments-secondary-button"
                      type="button"
                      onClick={() => handleBuyListing(item)}
                      disabled={buyingListingId === item.id}
                    >
                      {buyingListingId === item.id
                        ? "Processing..."
                        : "Buy Listing"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section ref={historyRef} className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">My Purchase History</h2>
            <p className="investments-section-subtitle">
              A clean record of your share activity across all investment
              positions
            </p>
          </div>
          <span className="investments-chip">History</span>
        </div>

        {history.length === 0 ? (
          <div className="investments-empty">
            No investment history yet.
            <br />
            <span>Your completed buys and transfers will appear here.</span>
          </div>
        ) : (
          <div className="investments-history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className="investments-history-card premium"
              >
                <div className="investments-history-left">
                  <h4>{item.property.title}</h4>
                  <p>{item.property.location || "No location"}</p>
                </div>

                <div className="investments-history-mid">
                  <span
                    className={`investments-history-type ${getHistoryTone(
                      item.type,
                    )}`}
                  >
                    {item.type}
                  </span>
                  <span>{item.shares} shares</span>
                </div>

                <div className="investments-history-right">
                  <strong>{formatCurrency(item.amount)}</strong>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section ref={archiveRef} className="investments-section">
        <div className="investments-section-head">
          <div>
            <h2 className="investments-section-title">
              Sold Out / Inactive Offers
            </h2>
            <p className="investments-section-subtitle">
              A record of opportunities no longer open for direct purchase
            </p>
          </div>
          <span className="investments-chip">Archive</span>
        </div>

        {inactiveOffers.length === 0 ? (
          <div className="investments-empty">
            No inactive or sold out offers.
            <br />
            <span>All current opportunities are active and open.</span>
          </div>
        ) : (
          <div className="investments-card-grid compact">
            {inactiveOffers.map((item) => (
              <div key={item.propertyId} className="investments-card inactive">
                <div className="investments-card-top">
                  <div>
                    <h3 className="investments-card-title">{item.title}</h3>
                    <p className="investments-card-location">
                      {item.location || "No location"}
                    </p>
                  </div>
                  <span className="investments-status sold-out">
                    {item.isSoldOut ? "Sold Out" : "Inactive"}
                  </span>
                </div>

                <div className="investments-metrics-grid">
                  <div className="investments-metric-card">
                    <p className="investments-metric-label">Price</p>
                    <p className="investments-metric-value">
                      {formatCompactCurrency(item.pricePerShare)}
                    </p>
                  </div>

                  <div className="investments-metric-card">
                    <p className="investments-metric-label">Shares Sold</p>
                    <p className="investments-metric-value">
                      {item.sharesSold}
                    </p>
                  </div>

                  <div className="investments-metric-card">
                    <p className="investments-metric-label">Remaining</p>
                    <p className="investments-metric-value">
                      {item.sharesRemaining}
                    </p>
                  </div>

                  <div className="investments-metric-card">
                    <p className="investments-metric-label">Status</p>
                    <p className="investments-metric-value">
                      {item.isSoldOut ? "Sold Out" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function InvestmentsPage() {
  const { user, hydrateAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await hydrateAuth();
      setReady(true);
    };
    init();
  }, [hydrateAuth]);

  if (!ready) {
    return (
      <div className="investments-shell">
        <section className="investments-section">
          <div className="investments-empty">Loading investments workspace...</div>
        </section>
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return <AdminInvestmentsView />;
  }

  return <InvestorInvestmentsView />;
}