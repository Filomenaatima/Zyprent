"use client";

import Link from "next/link";

const plans = [
  {
    name: "Resident Access",
    amount: 5000,
    price: "UGX 5K",
    period: "/month",
    description:
      "For residents who need simple payments, invoices, support, and updates.",
    features: [
      "Rent and invoice access",
      "Payment history",
      "Maintenance requests",
      "Notifications",
      "Wallet visibility",
    ],
    badge: "Resident",
  },
  {
    name: "Investor Access",
    amount: 49000,
    price: "UGX 49K",
    period: "/month",
    description:
      "For investors who need portfolio visibility and financial reporting.",
    features: [
      "Portfolio dashboard",
      "Profit reports",
      "Investment tracking",
      "Wallet reporting",
      "Property performance",
    ],
    badge: "Investor",
  },
  {
    name: "Manager Starter",
    amount: 149000,
    price: "UGX 149K",
    period: "/month",
    description:
      "For landlords and managers running smaller property operations.",
    features: [
      "Up to 15 units",
      "Resident management",
      "Rent invoicing",
      "Payment tracking",
      "Maintenance workflows",
      "Investor access support",
    ],
    badge: "Manager",
  },
  {
    name: "Manager Professional",
    amount: 399000,
    price: "UGX 399K",
    period: "/month",
    description:
      "For apartment operators, real estate firms, and growing portfolios.",
    features: [
      "Unlimited properties",
      "Advanced analytics",
      "Provider management",
      "Financial reports",
      "Investor dashboards",
      "Priority support",
    ],
    badge: "Most Popular",
    featured: true,
  },
];

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <div className="pricing-pill">ZYPRENT BILLING</div>

        <h1>Choose the right access for your role.</h1>

        <p>
          Zyprent connects managers, investors, residents, and service providers
          through one premium real estate operations platform.
        </p>
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`pricing-card ${plan.featured ? "featured" : ""}`}
          >
            <span className="pricing-badge">{plan.badge}</span>

            <h2>{plan.name}</h2>

            <p className="pricing-description">{plan.description}</p>

            <div className="pricing-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <Link
              href={`/subscription-checkout?plan=${encodeURIComponent(
                plan.name,
              )}&amount=${plan.amount}`}
              className="pricing-button"
            >
              Choose Plan
            </Link>
          </article>
        ))}
      </section>

      <section className="provider-note">
        <div>
          <span>Service Providers</span>

          <h3>Join free. Get discovered. Earn from completed jobs.</h3>

          <p>
            Service providers can join Zyprent without a monthly subscription.
            Zyprent supports job discovery, workflow tracking, and secure
            payment coordination, with a small platform service fee applied only
            on successfully completed work.
          </p>
        </div>
      </section>

      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          padding: 90px 6vw;
          color: #ffffff;
          background:
            radial-gradient(
              circle at top left,
              rgba(96, 165, 250, 0.2),
              transparent 32%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(37, 99, 235, 0.14),
              transparent 36%
            ),
            linear-gradient(135deg, #020617 0%, #061129 48%, #081a3a 100%);
        }

        .pricing-hero {
          max-width: 900px;
          margin: 0 auto 56px;
          text-align: center;
        }

        .pricing-pill {
          display: inline-flex;
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.32);
          background: rgba(96, 165, 250, 0.12);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.22em;
        }

        .pricing-hero h1 {
          margin: 24px 0 0;
          font-size: clamp(44px, 6vw, 82px);
          line-height: 0.95;
          letter-spacing: -0.07em;
          font-weight: 950;
        }

        .pricing-hero p {
          margin: 24px auto 0;
          max-width: 720px;
          color: rgba(226, 232, 240, 0.72);
          font-size: 18px;
          line-height: 1.7;
        }

        .pricing-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .pricing-card {
          min-height: 560px;
          padding: 30px;
          border-radius: 32px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(
              180deg,
              rgba(15, 23, 42, 0.88),
              rgba(5, 12, 30, 0.96)
            );
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
        }

        .pricing-card.featured {
          border-color: rgba(96, 165, 250, 0.8);
          background:
            radial-gradient(
              circle at top,
              rgba(37, 99, 235, 0.28),
              transparent 36%
            ),
            linear-gradient(
              180deg,
              rgba(15, 23, 42, 0.96),
              rgba(8, 26, 58, 0.98)
            );
          transform: translateY(-10px);
        }

        .pricing-badge {
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(96, 165, 250, 0.14);
          border: 1px solid rgba(147, 197, 253, 0.24);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
        }

        .pricing-card h2 {
          margin: 28px 0 0;
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .pricing-description {
          margin: 14px 0 0;
          color: rgba(203, 213, 225, 0.72);
          line-height: 1.6;
          font-size: 14px;
        }

        .pricing-price {
          margin: 32px 0 0;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }

        .pricing-price strong {
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .pricing-price span {
          color: rgba(203, 213, 225, 0.68);
          padding-bottom: 5px;
        }

        .pricing-card ul {
          margin: 30px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 14px;
          color: rgba(226, 232, 240, 0.78);
          font-size: 14px;
        }

        .provider-note {
          max-width: 1280px;
          margin: 28px auto 0;
          padding: 30px;
          border-radius: 30px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background:
            linear-gradient(
              180deg,
              rgba(15, 23, 42, 0.72),
              rgba(8, 26, 58, 0.82)
            );
          box-shadow:
            0 30px 70px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .provider-note span {
          color: #93c5fd;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.18em;
        }

        .provider-note h3 {
          margin: 12px 0 0;
          font-size: 30px;
          letter-spacing: -0.04em;
        }

        .provider-note p {
          margin: 10px 0 0;
          color: rgba(226, 232, 240, 0.72);
          max-width: 820px;
          line-height: 1.7;
        }

        .pricing-card :global(.pricing-button) {
          margin-top: auto;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          color: #ffffff;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 22px 46px rgba(37, 99, 235, 0.35);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .pricing-card :global(.pricing-button:hover) {
          transform: translateY(-1px);
          box-shadow: 0 28px 56px rgba(37, 99, 235, 0.46);
        }

        @media (max-width: 1180px) {
          .pricing-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pricing-card.featured {
            transform: none;
          }
        }

        @media (max-width: 680px) {
          .pricing-page {
            padding: 60px 18px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card {
            min-height: auto;
          }
        }
      `}</style>
    </main>
  );
}