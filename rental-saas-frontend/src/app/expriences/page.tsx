"use client";

import { useMemo, useState } from "react";
import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

const experiences = {
  Managers: {
    eyebrow: "PROPERTY MANAGERS",
    title: "Run properties without chasing people, payments, or paperwork.",
    text: "Zyprent gives managers one command center for rent, units, residents, contracts, expenses, maintenance, providers, and reporting.",
    cards: [
      "Rent collection stays visible",
      "Units and residents stay organized",
      "Maintenance moves from request to completion",
      "Expenses are tied to the right property",
    ],
    stat: "Live operations",
    accent: "Portfolio control",
  },
  Investors: {
    eyebrow: "INVESTORS",
    title: "See what is happening with your money, not just promises.",
    text: "Investors get visibility into holdings, returns, expenses, wallet activity, profit center movement, and property performance.",
    cards: [
      "Portfolio performance",
      "Expense allocations",
      "Profit movement",
      "Wallet and payout tracking",
    ],
    stat: "Return visibility",
    accent: "Capital clarity",
  },
  Residents: {
    eyebrow: "RESIDENTS",
    title: "A simpler way for residents to pay, request, and stay informed.",
    text: "Residents can view rent, receipts, wallet activity, maintenance requests, and updates from the same workspace.",
    cards: [
      "Rent records",
      "Receipts and wallet history",
      "Maintenance requests",
      "Clear updates",
    ],
    stat: "Self-service",
    accent: "Resident clarity",
  },
  Providers: {
    eyebrow: "SERVICE PROVIDERS",
    title: "Turn service work into a proper tracked workflow.",
    text: "Providers can receive jobs, submit quotes, update progress, mark completion, and track payouts without messy back-and-forth.",
    cards: [
      "Assigned jobs",
      "Quote approval",
      "Progress tracking",
      "Payout visibility",
    ],
    stat: "Job workflow",
    accent: "Service control",
  },
};

type ExperienceKey = keyof typeof experiences;

export default function ExperiencesPage() {
  const [active, setActive] = useState<ExperienceKey>("Managers");
  const item = experiences[active];

  const tabs = useMemo(
    () => Object.keys(experiences) as ExperienceKey[],
    [],
  );

  return (
    <main className="experiences-page">
      <header className="landing-nav experiences-nav">
        <a href="/" className="landing-brand" aria-label="Zyprent home">
          <span className="landing-brand-mark">Z</span>
          <strong>Zyprent</strong>
        </a>

        <nav className="landing-nav-links" aria-label="Experiences navigation">
          <a href="/">Home</a>
          <a href="/#solution">Solution</a>
          <a href="/#platform">Platform</a>
          <a href="/experiences">Experiences</a>
          <a href="/#faq">FAQ</a>
        </nav>

        <div className="landing-nav-actions">
          <a href="/login" className="landing-link">
            Sign In
          </a>
          <a
            href={DEMO_FORM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn primary"
          >
            Request Demo
          </a>
        </div>
      </header>

      <section className="experiences-hero">
        <div className="experiences-copy">
          <p className="hero-eyebrow">Zyprent experiences</p>

          <h1>One platform. Different users. Connected work.</h1>

          <p>
            Every person in a property operation sees a different side of the
            business. Zyprent connects those experiences into one clear system.
          </p>

          <div className="experiences-actions">
            <a
              href={DEMO_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn primary large"
            >
              Request Demo
            </a>
            <a href="/login" className="landing-btn secondary large">
              Explore Platform
            </a>
          </div>
        </div>

        <div className="experience-visual-wrap" aria-hidden="true">
          <div className="experience-glow glow-a" />
          <div className="experience-glow glow-b" />

          <div className="experience-platform">
            <div className="platform-ring ring-one" />
            <div className="platform-ring ring-two" />

            <div className="city-base">
              <div className="tower tower-1" />
              <div className="tower tower-2" />
              <div className="tower tower-3" />
              <div className="tower tower-4" />
              <div className="tower tower-5" />
              <div className="tower tower-6" />
            </div>

            <div className="floating-cloud cloud-one" />
            <div className="floating-cloud cloud-two" />
            <div className="floating-chip chip-one">
              <span>Payments</span>
              <strong>Connected</strong>
            </div>
            <div className="floating-chip chip-two">
              <span>Maintenance</span>
              <strong>Tracked</strong>
            </div>
            <div className="floating-chip chip-three">
              <span>Reports</span>
              <strong>Live</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="experience-switcher">
        <div className="experience-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={active === tab ? "active" : ""}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="experience-story-grid">
          <article className="experience-story-card">
            <span>{item.eyebrow}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>

            <div className="story-stat">
              <strong>{item.stat}</strong>
              <small>{item.accent}</small>
            </div>
          </article>

          <div className="experience-dashboard-card">
            <div className="experience-dashboard-top">
              <span>{active}</span>
              <strong>Live workspace</strong>
            </div>

            <div className="experience-dashboard-grid">
              {item.cards.map((card, index) => (
                <div key={card} className="experience-mini-card">
                  <i>{index + 1}</i>
                  <strong>{card}</strong>
                  <span>Connected</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="experience-flow-section">
        <div className="section-heading center">
          <span>How it connects</span>
          <h2>Each action becomes part of the same operating record.</h2>
        </div>

        <div className="experience-flow-grid">
          <div>
            <small>01</small>
            <strong>User acts</strong>
            <p>A resident pays, a manager approves, a provider updates, or an investor reviews.</p>
          </div>

          <div>
            <small>02</small>
            <strong>Zyprent links it</strong>
            <p>The action is tied to the right property, user, wallet, request, or report.</p>
          </div>

          <div>
            <small>03</small>
            <strong>Everyone sees clarity</strong>
            <p>The right people see the right information without chasing updates.</p>
          </div>
        </div>
      </section>

      <section className="final-cta experiences-final">
        <span>Built for connected property work</span>
        <h2>Give every user a better way to work.</h2>
        <p>
          Managers, investors, residents and service providers all operate from
          one connected property system.
        </p>

        <div className="final-actions">
          <a
            href={DEMO_FORM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn primary large"
          >
            Request Demo
          </a>
          <a href="/" className="landing-btn secondary large">
            Back Home
          </a>
        </div>
      </section>

      <style jsx>{`
        .experiences-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 12%, rgba(134, 198, 255, 0.26), transparent 30%),
            radial-gradient(circle at 12% 78%, rgba(51, 83, 221, 0.2), transparent 34%),
            linear-gradient(135deg, #030107 0%, #07051a 45%, #0b1026 100%);
          color: #ffffff;
          overflow-x: hidden;
        }

        .experiences-nav {
          position: relative;
          z-index: 10;
        }

        .experiences-hero {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          min-height: calc(100vh - 90px);
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          align-items: center;
          gap: 42px;
          padding: 48px 0 70px;
        }

        .experiences-copy h1 {
          margin: 0;
          max-width: 640px;
          font-size: clamp(58px, 7vw, 104px);
          line-height: 0.9;
          letter-spacing: -0.08em;
        }

        .experiences-copy p:not(.hero-eyebrow) {
          margin: 24px 0 0;
          max-width: 560px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 18px;
          line-height: 1.65;
        }

        .experiences-actions {
          margin-top: 30px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .experience-visual-wrap {
          min-height: 610px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .experience-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
        }

        .glow-a {
          width: 470px;
          height: 470px;
          background: rgba(128, 199, 255, 0.18);
          right: 20px;
          top: 44px;
        }

        .glow-b {
          width: 330px;
          height: 330px;
          background: rgba(63, 88, 240, 0.2);
          left: 12px;
          bottom: 50px;
        }

        .experience-platform {
          position: relative;
          width: min(560px, 100%);
          height: 560px;
          display: grid;
          place-items: center;
          transform-style: preserve-3d;
          animation: floatVisual 7s ease-in-out infinite;
        }

        @keyframes floatVisual {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        .platform-ring {
          position: absolute;
          border-radius: 50%;
          transform: rotateX(64deg);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(64, 104, 255, 0.12));
          border: 1px solid rgba(180, 210, 255, 0.22);
          box-shadow:
            inset 0 0 60px rgba(115, 176, 255, 0.12),
            0 30px 90px rgba(0, 0, 0, 0.36);
        }

        .ring-one {
          width: 430px;
          height: 430px;
          bottom: 40px;
        }

        .ring-two {
          width: 320px;
          height: 320px;
          bottom: 82px;
          background: rgba(255, 255, 255, 0.08);
        }

        .city-base {
          position: absolute;
          bottom: 154px;
          width: 300px;
          height: 250px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 10px;
          transform: perspective(700px) rotateX(6deg);
        }

        .tower {
          width: 34px;
          border-radius: 12px 12px 4px 4px;
          background: linear-gradient(155deg, #8fd0ff 0%, #3858f0 48%, #0a1b67 100%);
          box-shadow:
            inset 8px 0 18px rgba(255, 255, 255, 0.18),
            0 22px 44px rgba(0, 0, 0, 0.34);
        }

        .tower-1 { height: 105px; }
        .tower-2 { height: 160px; }
        .tower-3 { height: 220px; width: 48px; clip-path: polygon(50% 0, 100% 22%, 100% 100%, 0 100%, 0 22%); }
        .tower-4 { height: 188px; width: 42px; }
        .tower-5 { height: 135px; }
        .tower-6 { height: 82px; }

        .floating-cloud {
          position: absolute;
          width: 76px;
          height: 30px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(143,208,255,0.24));
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);
          opacity: 0.65;
        }

        .floating-cloud::before,
        .floating-cloud::after {
          content: "";
          position: absolute;
          bottom: 10px;
          border-radius: 999px;
          background: inherit;
        }

        .floating-cloud::before {
          width: 34px;
          height: 34px;
          left: 12px;
        }

        .floating-cloud::after {
          width: 42px;
          height: 42px;
          right: 10px;
        }

        .cloud-one {
          top: 110px;
          left: 34px;
          animation: cloudMove 8s ease-in-out infinite;
        }

        .cloud-two {
          top: 74px;
          right: 22px;
          transform: scale(0.8);
          animation: cloudMove 9s ease-in-out infinite reverse;
        }

        @keyframes cloudMove {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }

        .floating-chip {
          position: absolute;
          min-width: 150px;
          padding: 14px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
        }

        .floating-chip span {
          display: block;
          color: #8fd0ff;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 950;
        }

        .floating-chip strong {
          display: block;
          margin-top: 5px;
          font-size: 14px;
        }

        .chip-one {
          left: 0;
          bottom: 170px;
        }

        .chip-two {
          right: 0;
          bottom: 250px;
        }

        .chip-three {
          left: 150px;
          top: 92px;
        }

        .experience-switcher,
        .experience-flow-section {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .experience-tabs {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .experience-tabs button {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.74);
          border-radius: 16px;
          padding: 13px 18px;
          font-weight: 950;
          cursor: pointer;
        }

        .experience-tabs button.active {
          background: linear-gradient(135deg, #6aa9ff, #3e50e8);
          color: #fff;
          box-shadow: 0 18px 44px rgba(75, 111, 255, 0.28);
        }

        .experience-story-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 22px;
        }

        .experience-story-card,
        .experience-dashboard-card,
        .experience-flow-grid div {
          border: 1px solid rgba(180, 210, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(18px);
          border-radius: 30px;
        }

        .experience-story-card {
          padding: 32px;
        }

        .experience-story-card > span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .experience-story-card h2 {
          margin: 16px 0 0;
          font-size: clamp(34px, 4vw, 58px);
          line-height: 0.96;
          letter-spacing: -0.07em;
        }

        .experience-story-card p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.65;
          font-size: 16px;
        }

        .story-stat {
          margin-top: 30px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .story-stat strong,
        .story-stat small {
          display: block;
        }

        .story-stat strong {
          font-size: 24px;
        }

        .story-stat small {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.62);
        }

        .experience-dashboard-card {
          padding: 24px;
        }

        .experience-dashboard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.08);
          margin-bottom: 16px;
        }

        .experience-dashboard-top span {
          color: #8fd0ff;
          font-weight: 950;
        }

        .experience-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .experience-mini-card {
          min-height: 132px;
          border-radius: 22px;
          padding: 18px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(75, 111, 255, 0.12));
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .experience-mini-card i {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(143, 208, 255, 0.16);
          color: #8fd0ff;
          font-style: normal;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .experience-mini-card strong,
        .experience-mini-card span {
          display: block;
        }

        .experience-mini-card strong {
          font-size: 18px;
          line-height: 1.15;
        }

        .experience-mini-card span {
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 13px;
          font-weight: 800;
        }

        .experience-flow-section {
          padding: 96px 0;
        }

        .experience-flow-grid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .experience-flow-grid div {
          padding: 26px;
        }

        .experience-flow-grid small {
          color: #8fd0ff;
          font-weight: 950;
          letter-spacing: 0.14em;
        }

        .experience-flow-grid strong {
          display: block;
          margin-top: 12px;
          font-size: 22px;
        }

        .experience-flow-grid p {
          color: rgba(255, 255, 255, 0.64);
          line-height: 1.6;
        }

        .experiences-final {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto 60px;
        }

        @media (max-width: 980px) {
          .experiences-hero,
          .experience-story-grid {
            grid-template-columns: 1fr;
          }

          .experience-visual-wrap {
            min-height: 500px;
          }

          .experience-flow-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .experiences-hero {
            width: min(100% - 28px, 1120px);
            padding-top: 28px;
          }

          .experiences-copy h1 {
            font-size: 52px;
          }

          .experience-visual-wrap {
            min-height: 390px;
          }

          .experience-platform {
            transform: scale(0.78);
          }

          .experience-dashboard-grid,
          .experience-steps {
            grid-template-columns: 1fr;
          }

          .floating-chip {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}