"use client";

import { useState } from "react";
import "@/styles/landing.css";

const roles = {
  Managers: {
    title: "Property Managers",
    label: "Portfolio control",
    text: "Manage properties, units, contracts, invoices, rent, expenses, residents, providers, and maintenance from one workspace.",
    items: ["Rent collection", "Unit occupancy", "Expense tracking"],
  },
  Investors: {
    title: "Investors",
    label: "Returns visibility",
    text: "Track property performance, profit movement, expenses, payouts, wallet activity, and returns clearly.",
    items: ["Profit movement", "Expense share", "Portfolio returns"],
  },
  Residents: {
    title: "Residents",
    label: "Resident self-service",
    text: "Pay rent, view receipts, manage wallet activity, and submit maintenance requests from a clean portal.",
    items: ["Rent receipts", "Wallet history", "Maintenance requests"],
  },
  Providers: {
    title: "Service Providers",
    label: "Job workflow",
    text: "Receive jobs, submit quotes, update work progress, manage completion, and track payouts.",
    items: ["Assigned jobs", "Quote approvals", "Payout tracking"],
  },
};

const faqs = [
  {
    question: "What is Zyprent?",
    answer:
      "Zyprent is a real estate operating platform for managing property operations, finance, maintenance, residents, providers, and investor visibility.",
  },
  {
    question: "Who is Zyprent built for?",
    answer:
      "Zyprent is built for property managers, investors, residents, and service providers who need one connected real estate workspace.",
  },
  {
    question: "Can I request a demo?",
    answer:
      "Yes. You can request a demo and review how Zyprent fits your workflow before rollout.",
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
          <a href="#roles">Who it&apos;s for</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="landing-nav-actions">
          <a href="/login" className="landing-link">
            Sign In
          </a>
          <a href="mailto:info@zyprent.com" className="landing-btn primary">
            Book Demo
          </a>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="hero-eyebrow">Modern real estate operating system</p>

          <h1>Real estate operations made simple.</h1>

          <p className="hero-subtext">
            A premium workspace for property operations, finance, maintenance,
            residents, providers, and investor visibility.
          </p>

          <div className="hero-actions">
            <a href="mailto:info@zyprent.com" className="landing-btn primary large">
              Request Demo
            </a>
            <a href="/login" className="landing-btn secondary large">
              Open Platform
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

              <div className="dashboard-search">Search properties, payments, requests</div>

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

      <section className="section inside-section">
        <div className="section-heading center">
          <span>Inside Zyprent</span>
          <h2>A command center for your property business.</h2>
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
              <span>Finance</span>
              <h3>Follow every shilling clearly.</h3>
              <p>
                Rent, expenses, payouts, wallet movement, and investor deductions
                stay tied to the right property, unit, and user.
              </p>
            </div>
          </article>

          <article className="inside-card">
            <span>Maintenance</span>
            <h3>Requests move with structure.</h3>
            <p>From request to quote, approval, assignment, progress, and completion.</p>
          </article>

          <article className="inside-card">
            <span>Visibility</span>
            <h3>No guessing.</h3>
            <p>Every user sees the information that matters to them.</p>
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
        <h2>Run your entire property operation from one system.</h2>
        <p>
          From rent collection to maintenance and investor reporting, everything
          stays connected.
        </p>

        <div className="final-actions">
          <a href="mailto:info@zyprent.com" className="landing-btn primary large">
            Book Demo
          </a>
          <a href="/login" className="landing-btn secondary large">
            Open Platform
          </a>
        </div>
      </section>
    </main>
  );
}