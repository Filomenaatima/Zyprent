"use client";

import "@/styles/reviews.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type ReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  resident?: {
    id?: string;
    user?: {
      name?: string | null;
    } | null;
  } | null;
  request?: {
    id?: string;
    title?: string | null;
    category?: string | null;
    property?: {
      title?: string | null;
      location?: string | null;
    } | null;
    unit?: {
      number?: string | null;
    } | null;
  } | null;
};

type ReviewsResponse = {
  provider?: {
    id?: string;
    companyName?: string | null;
    type?: string | null;
    city?: string | null;
    verificationStatus?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
  summary?: {
    totalReviews?: number;
    averageRating?: number;
    fiveStar?: number;
    fourStar?: number;
    threeStar?: number;
    twoStar?: number;
    oneStar?: number;
    responseRate?: number;
  };
  reviews?: ReviewItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderStars(rating: number) {
  return "★".repeat(Math.max(0, rating)) + "☆".repeat(Math.max(0, 5 - rating));
}

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await api.get("/reviews/provider/me");
      setData(res.data || {});
    } catch (error) {
      console.error("Failed to load provider reviews", error);
      setData({
        provider: {},
        summary: {
          totalReviews: 0,
          averageRating: 0,
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0,
          responseRate: 0,
        },
        reviews: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const reviews = data?.reviews || [];
  const summary = data?.summary || {};

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter((review) => {
      return (
        String(review.comment || "").toLowerCase().includes(query) ||
        String(review.resident?.user?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(review.request?.title || "").toLowerCase().includes(query) ||
        String(review.request?.category || "").toLowerCase().includes(query) ||
        String(review.request?.property?.title || "")
          .toLowerCase()
          .includes(query) ||
        String(review.request?.unit?.number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [reviews, search]);

  return (
    <div className="reviews-page-shell">
      <section className="reviews-hero">
        <div className="reviews-hero-copy">
          <p className="reviews-eyebrow">Service provider reputation</p>
          <h1 className="reviews-title">Reviews</h1>
          <p className="reviews-text">
            Track resident feedback, monitor service quality, and keep a clean
            record of completed job experience across your assignments.
          </p>

          <div className="reviews-hero-tags">
            <span>{data?.provider?.type || "Provider"}</span>
            <span>{data?.provider?.verificationStatus || "Unverified"}</span>
            <span>{data?.provider?.city || "Kampala"}</span>
          </div>
        </div>

        <div className="reviews-rating-orb">
          <span>Rating</span>
          <strong>{Number(summary.averageRating || 0).toFixed(1)}</strong>
          <small>{summary.totalReviews || 0} review(s)</small>
        </div>
      </section>

      <section className="reviews-summary-band">
        <div className="reviews-summary-lead">
          <p className="reviews-summary-label">Average Rating</p>
          <h2>{Number(summary.averageRating || 0).toFixed(1)}</h2>
          <p className="reviews-summary-sub">
            Based on resident reviews from completed maintenance work
          </p>
        </div>

        <div className="reviews-summary-mini-grid">
          <div className="reviews-mini-card">
            <span>Total Reviews</span>
            <strong>{summary.totalReviews || 0}</strong>
          </div>
          <div className="reviews-mini-card">
            <span>5 Star Reviews</span>
            <strong>{summary.fiveStar || 0}</strong>
          </div>
          <div className="reviews-mini-card">
            <span>Response Rate</span>
            <strong>{summary.responseRate || 0}%</strong>
          </div>
          <div className="reviews-mini-card">
            <span>Verified</span>
            <strong>{data?.provider?.verificationStatus || "Pending"}</strong>
          </div>
        </div>
      </section>

      <section className="reviews-toolbar">
        <input
          className="reviews-search"
          placeholder="Search reviews"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="reviews-toolbar-pills">
          <div className="reviews-toolbar-pill">
            <span>All Reviews</span>
            <strong>{summary.totalReviews || 0}</strong>
          </div>
          <div className="reviews-toolbar-pill">
            <span>Average</span>
            <strong>{Number(summary.averageRating || 0).toFixed(1)}</strong>
          </div>
        </div>
      </section>

      <section className="reviews-content-grid">
        <aside className="reviews-breakdown-card">
          <div className="reviews-card-head">
            <h3>Rating Breakdown</h3>
            <p>See how residents are scoring your work</p>
          </div>

          <div className="rating-breakdown-list">
            <div className="rating-breakdown-row">
              <span>5 Stars</span>
              <strong>{summary.fiveStar || 0}</strong>
            </div>
            <div className="rating-breakdown-row">
              <span>4 Stars</span>
              <strong>{summary.fourStar || 0}</strong>
            </div>
            <div className="rating-breakdown-row">
              <span>3 Stars</span>
              <strong>{summary.threeStar || 0}</strong>
            </div>
            <div className="rating-breakdown-row">
              <span>2 Stars</span>
              <strong>{summary.twoStar || 0}</strong>
            </div>
            <div className="rating-breakdown-row">
              <span>1 Star</span>
              <strong>{summary.oneStar || 0}</strong>
            </div>
          </div>
        </aside>

        <section className="reviews-list-card">
          <div className="reviews-card-head">
            <h3>Latest Reviews</h3>
            <p>Recent feedback from completed jobs</p>
          </div>

          {loading ? (
            <div className="reviews-empty-state">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="reviews-empty-state">No reviews found yet.</div>
          ) : (
            <div className="reviews-list">
              {filteredReviews.map((review) => (
                <article key={review.id} className="review-item-card">
                  <div className="review-item-top">
                    <div>
                      <h4>{review.request?.title || "Completed Job"}</h4>
                      <p>
                        {review.request?.property?.title || "Property"}
                        {review.request?.unit?.number
                          ? ` · Unit ${review.request.unit.number}`
                          : ""}
                        {review.request?.property?.location
                          ? ` · ${review.request.property.location}`
                          : ""}
                      </p>
                    </div>

                    <div className="review-rating-badge">
                      <span>{renderStars(Number(review.rating || 0))}</span>
                      <strong>{Number(review.rating || 0)}/5</strong>
                    </div>
                  </div>

                  <div className="review-meta-grid">
                    <div>
                      <span>Resident</span>
                      <strong>{review.resident?.user?.name || "Anonymous"}</strong>
                    </div>
                    <div>
                      <span>Category</span>
                      <strong>{review.request?.category || "General"}</strong>
                    </div>
                    <div>
                      <span>Date</span>
                      <strong>{formatDate(review.createdAt)}</strong>
                    </div>
                  </div>

                  <div className="review-comment-block">
                    <span>Comment</span>
                    <p>{review.comment || "No written comment added."}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}