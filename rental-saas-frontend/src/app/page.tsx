"use client";

import { useState } from "react";
import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

const roles = {
  Managers: {
    title: "Property Managers",
    label: "Portfolio control",
    text: "Control rent, units, residents, contracts, expenses, maintenance and reporting from one connected workspace.",
    items: ["Rent collection", "Unit occupancy", "Expense tracking"],
  },
  Investors: {
    title: "Investors",
    label: "Returns visibility",
    text: "See property performance, expenses, returns, payouts, wallet activity and investment movement clearly.",
    items: ["Profit movement", "Expense share", "Portfolio returns"],
  },
  Residents: {
    title: "Residents",
    label: "Resident self-service",
    text: "Pay rent, view receipts, track wallet activity, raise maintenance requests and stay updated without confusion.",
    items: ["Rent receipts", "Wallet history", "Maintenance requests"],
  },
  Providers: {
    title: "Service Providers",
    label: "Job workflow",
    text: "Receive jobs, submit quotes, update work progress, manage completion and track payouts with clarity.",
    items: ["Assigned jobs", "Quote approvals", "Payout tracking"],
  },
};

const faqs = [
  {
    question: "What is Zyprent?",
    answer:
      "Zyprent is a real estate operating system that connects property operations, finance, maintenance, residents, providers and investor visibility in one secure workspace.",
  },
  {
    question: "Who is Zyprent built for?",
    answer:
      "Zyprent is built for property managers, investors, residents and service providers who need one connected real estate workspace.",
  },
  {
    question: "Can I request a demo?",
    answer:
      "Yes. You can request a demo and review how Zyprent fits your property workflow before rollout.",
  },
];

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<keyof typeof roles>("Managers");
  const role = roles[activeRole];

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a href="/" className="landing-brand" aria-label="Zyprent home">
          <span className="landing-brand-mark">Z</span>
          <strong>Zyprent</strong>
        </a>

        <nav className="landing-nav-links" aria-label="Landing navigation">
          <a href="#solution">Solution</a>
          <a href="#platform">Platform</a>
          <a href="#why">Why Zyprent</a>
          <a href="#faq">FAQ</a>
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

      <section className="hero-section">
        <div className="hero-copy">
          <p className="hero-eyebrow">Modern real estate operating system</p>

          <h1>Property operations, finally connected.</h1>

          <p className="hero-subtext">
            Payments, maintenance, residents, providers, reporting and
            investments connected in one secure workspace.
          </p>

          <div className="hero-actions">
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

        <div className="hero-graphic">
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-orb orb-three" />

          <div className="hero-dashboard">
            <div className="hero-dashboard-top">
              <div className="dashboard-window-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="dashboard-search">
                Search properties, payments, requests
              </div>

              <div className="dashboard-user-dot" />
            </div>

            <div className="hero-dashboard-body">
              <aside className="dashboard-sidebar">
                <span className="sidebar-pill active">Dashboard</span>
                <span className="sidebar-pill">Finance</span>
                <span className="sidebar-pill">Maintenance</span>
                <span className="sidebar-pill">Reports</span>
              </aside>

              <div className="dashboard-main">
                <div className="dashboard-hero-card">
                  <div>
                    <span>Operating balance</span>
                    <strong>UGX 2.8M</strong>
                    <small>Live property overview</small>
                  </div>

                  <div className="balance-ring">
                    <span>82%</span>
                  </div>
                </div>

                <div className="dashboard-grid">
                  <div className="dashboard-tile">
                    <span>Rent status</span>
                    <strong>Paid</strong>
                  </div>

                  <div className="dashboard-tile">
                    <span>Requests</span>
                    <strong>2 Open</strong>
                  </div>

                  <div className="dashboard-chart-card">
                    <div className="chart-bars">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <strong>Revenue trend</strong>
                  </div>

                  <div className="dashboard-task-card">
                    <span />
                    <div>
                      <strong>Maintenance update</strong>
                      <p>Provider assigned and work is in progress.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-floating-card hero-card-one">
            <span>Finance</span>
            <strong>Payments connected</strong>
          </div>

          <div className="hero-floating-card hero-card-two">
            <span>Maintenance</span>
            <strong>Requests tracked</strong>
          </div>

          <div className="hero-floating-card hero-card-three">
            <span>Investors</span>
            <strong>Returns visible</strong>
          </div>
        </div>
      </section>

      <section id="solution" className="section solution-section">
        <div className="section-heading center">
          <span>Solution</span>
          <h2>Everything connected in one operating layer.</h2>
        </div>

        <div className="system-flow">
          <div className="flow-node">
            <small>01</small>
            <strong>Properties</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-node highlight">
            <small>02</small>
            <strong>Finance</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-node">
            <small>03</small>
            <strong>Maintenance</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-node">
            <small>04</small>
            <strong>Reports</strong>
          </div>
        </div>

        <p className="system-flow-subtext">
          Properties, payments, wallets, residents, maintenance, providers and
          investors stay connected in one place, so your operations run smoothly
          without scattered spreadsheets or manual follow ups.
        </p>
      </section>

      <section id="platform" className="section inside-section">
        <div className="section-heading center">
          <span>Platform</span>
          <h2>Built to replace scattered property operations.</h2>
        </div>

        <div className="inside-grid">
          <article className="inside-card large finance-card">
            <div className="finance-visual" aria-hidden="true">
              <div className="finance-orbit orbit-a" />
              <div className="finance-orbit orbit-b" />

              <div className="finance-tower tower-one" />
              <div className="finance-tower tower-two" />
              <div className="finance-tower tower-three" />
              <div className="finance-tower tower-four" />

              <div className="finance-coin coin-one">UGX</div>
              <div className="finance-coin coin-two">%</div>

              <div className="finance-mini-card finance-mini-card-one">
                <span>Collected</span>
                <strong>UGX 2.8M</strong>
              </div>

              <div className="finance-mini-card finance-mini-card-two">
                <span>Returns</span>
                <strong>18.4%</strong>
              </div>
            </div>

            <div className="inside-card-content">
              <span>Financial clarity</span>
              <h3>Follow every shilling clearly.</h3>
              <p>
                Rent, expenses, payouts, wallet movement and investor deductions
                stay tied to the right property, unit and user.
              </p>
            </div>
          </article>

          <article className="inside-card">
            <span>Maintenance</span>
            <h3>Requests move with structure.</h3>
            <p>
              From request to quote, approval, assignment, progress and
              completion.
            </p>
          </article>

          <article className="inside-card">
            <span>Visibility</span>
            <h3>No guessing.</h3>
            <p>
              Every user sees the information that matters to them, without
              chasing updates.
            </p>
          </article>
        </div>
      </section>

      <section id="roles" className="section roles-section">
        <div className="section-heading">
          <span>Built for</span>
          <h2>Four user experiences. One connected system.</h2>
        </div>

        <div className="role-box">
          <div className="role-tabs">
            {(Object.keys(roles) as Array<keyof typeof roles>).map((item) => (
              <button
                key={item}
                type="button"
                className={activeRole === item ? "active" : ""}
                onClick={() => setActiveRole(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="role-content">
            <div className="role-copy">
              <span>{role.label}</span>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
            </div>

            <div className="role-panel">
              <div className="role-panel-header">
                <strong>{role.title}</strong>
                <small>Live view</small>
              </div>

              {role.items.map((item) => (
                <div key={item} className="role-row">
                  <i />
                  <strong>{item}</strong>
                  <small>Connected</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="section inside-section">
        <div className="section-heading center">
          <span>Why Zyprent</span>
          <h2>Property operations should not feel chaotic.</h2>
        </div>

        <div className="inside-grid">
          <article className="inside-card">
            <span>Problem</span>
            <h3>Too much is still scattered.</h3>
            <p>
              Payments sit in one place, maintenance conversations happen
              elsewhere, reports are delayed and investors wait for updates.
            </p>
          </article>

          <article className="inside-card">
            <span>Control</span>
            <h3>Everything becomes traceable.</h3>
            <p>
              Workflows, records, payments, requests and activity are connected
              to the right property and user.
            </p>
          </article>

          <article className="inside-card large">
            <span>Built for Africa</span>
            <h3>Designed around how modern property teams actually work.</h3>
            <p>
              Zyprent is built for real operating environments where property
              teams need clarity across payments, maintenance, communication,
              residents, providers and investors.
            </p>
          </article>
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="section-heading center">
          <span>FAQ</span>
          <h2>Common questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <span>Ready when you are</span>
        <h2>A more connected way to run property operations.</h2>
        <p>
          From rent collection to maintenance and investor reporting, everything
          stays connected.
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
          <a href="/login" className="landing-btn secondary large">
            Explore Platform
          </a>
        </div>
      </section>
    </main>
  );
}