import "@/styles/landing.css";

const trustStats = [
  { value: "All-in-one", label: "Property operating system" },
  { value: "7 core layers", label: "Operations, finance, maintenance, investors, residents, providers, admin" },
  { value: "Built to scale", label: "From active properties to growing portfolios" },
];

const solutionPillars = [
  {
    title: "Property Operations",
    description:
      "Units, residents, contracts, invoices, and day-to-day workflows connected in one place.",
  },
  {
    title: "Financial Control",
    description:
      "Payments, expenses, transactions, subscriptions, billing, and reporting with cleaner visibility.",
  },
  {
    title: "Maintenance & Providers",
    description:
      "Requests, quotes, dispatches, approvals, payouts, and provider oversight in one workflow.",
  },
  {
    title: "Admin & Compliance",
    description:
      "KYC, approvals, verification, platform governance, and operational control built into the core.",
  },
];

const audiences = [
  {
    eyebrow: "For Property Managers",
    title: "Operate faster with more structure",
    description:
      "Manage units, residents, contracts, invoices, payments, expenses, maintenance, and provider activity from one connected system.",
    points: [
      "Centralized property and unit management",
      "Rent, invoice, and payment visibility",
      "Maintenance coordination and provider oversight",
    ],
  },
  {
    eyebrow: "For Investors",
    title: "Track capital, performance, and portfolio health",
    description:
      "Monitor funding activity, investment positions, profit visibility, subscriptions, and reporting across the portfolio.",
    points: [
      "Investment and portfolio visibility",
      "Revenue and distribution oversight",
      "Cleaner reporting for stronger decisions",
    ],
  },
  {
    eyebrow: "For Residents",
    title: "Deliver a more modern resident experience",
    description:
      "Give residents a cleaner experience for invoices, receipts, payments, maintenance requests, and account activity.",
    points: [
      "Invoice and receipt access",
      "Maintenance request tracking",
      "A more professional resident journey",
    ],
  },
  {
    eyebrow: "For Service Providers",
    title: "Coordinate service delivery professionally",
    description:
      "Track dispatches, quotes, approvals, payouts, ratings, and provider verification inside one platform workflow.",
    points: [
      "Quote and dispatch visibility",
      "Provider verification and ratings",
      "Payout and job tracking",
    ],
  },
];

const capabilities = [
  "Properties & units",
  "Contracts & invoices",
  "Payments & expenses",
  "Maintenance workflows",
  "Service providers",
  "KYC & approvals",
  "Investments",
  "Subscriptions & billing",
];

const productRows = [
  {
    tag: "Command Center",
    title: "One dashboard for the moving parts of real estate",
    description:
      "See the operating picture clearly across financial activity, maintenance pressure, provider operations, investor visibility, and admin control.",
  },
  {
    tag: "Maintenance + Providers",
    title: "Repairs, quotes, dispatches, approvals, and payouts connected",
    description:
      "Zyprent brings maintenance requests together with service providers, quotes, dispatches, approval flow, ratings, and provider payouts.",
  },
  {
    tag: "Finance + Reporting",
    title: "Billing, subscriptions, expenses, transactions, and reports in one system",
    description:
      "Track money movement and operating performance through billing controls, subscription workflows, expenses, transactions, and reporting.",
  },
];

const differentiators = [
  {
    title: "One connected platform",
    text: "Zyprent replaces fragmented workflows with one structured system for operations, finance, maintenance, providers, and oversight.",
  },
  {
    title: "Built for real operational complexity",
    text: "It is designed around the actual work: contracts, invoices, payments, maintenance, service providers, KYC, approvals, and reporting.",
  },
  {
    title: "Minimal, premium, and clear",
    text: "The product experience is intentionally built to feel polished, modern, and credible for serious real estate businesses.",
  },
  {
    title: "Ready for scale",
    text: "Whether you are running a growing portfolio or building a more advanced operating company, Zyprent is structured to grow with you.",
  },
];

const faqItems = [
  {
    question: "What is Zyprent?",
    answer:
      "Zyprent is a real estate operating platform that brings together property management, finance, maintenance, service providers, investor visibility, resident workflows, and admin oversight.",
  },
  {
    question: "Who is Zyprent built for?",
    answer:
      "Zyprent is built for property managers, investors, residents, operators, and service providers who need a cleaner, more connected operating system.",
  },
  {
    question: "Does Zyprent include service provider workflows?",
    answer:
      "Yes. Zyprent covers provider verification, dispatches, quotes, reviews, payouts, and maintenance-linked provider coordination.",
  },
  {
    question: "Can I request a demo before using the product?",
    answer:
      "Yes. You can request a demo to explore how Zyprent fits your business before rollout.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-ambient landing-ambient-one" />
      <div className="landing-ambient landing-ambient-two" />

      <header className="landing-nav">
        <a href="/" className="landing-brand">
          <div className="landing-brand-mark">Z</div>
          <div className="landing-brand-copy">
            <span className="landing-brand-name">ZYPRENT</span>
            <span className="landing-brand-sub">Real estate operating platform</span>
          </div>
        </a>

        <nav className="landing-nav-links">
          <a href="#solution">Solution</a>
          <a href="#audiences">Who it&apos;s for</a>
          <a href="#product">Product</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="landing-nav-actions">
          <a className="landing-btn ghost" href="/login">
            Sign In
          </a>
          <a className="landing-btn primary" href="mailto:info@zyprent.com">
            Book Demo
          </a>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="section-eyebrow">MODERN REAL ESTATE OPERATING SYSTEM</p>
          <h1>Run properties, finance, maintenance, providers, investors, and residents from one platform</h1>
          <p className="hero-text">
            Zyprent gives modern real estate businesses a cleaner way to manage operations,
            payments, expenses, maintenance, service providers, subscriptions, approvals,
            reporting, and portfolio visibility without scattered tools.
          </p>

          <div className="hero-actions">
            <a className="landing-btn primary large" href="mailto:info@zyprent.com">
              Request Demo
            </a>
            <a className="landing-btn secondary large" href="/login">
              Open Platform
            </a>
          </div>

          <div className="hero-meta">
            <span className="hero-meta-label">Built for modern real estate operators</span>
            <div className="hero-meta-line" />
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-frame">
            <div className="hero-frame-top">
              <span className="hero-chip">Live platform preview</span>
              <span className="hero-chip subtle">Premium workflow</span>
            </div>

            <div className="hero-panel-grid">
              <article className="hero-panel hero-panel-main">
                <span>Operations</span>
                <strong>Unified</strong>
                <p>Properties, units, contracts, and residents connected.</p>
              </article>

              <article className="hero-panel">
                <span>Finance</span>
                <strong>Tracked</strong>
                <p>Invoices, payments, billing, and expenses clearly visible.</p>
              </article>

              <article className="hero-panel">
                <span>Maintenance</span>
                <strong>Structured</strong>
                <p>Requests, providers, quotes, dispatches, and payouts aligned.</p>
              </article>

              <article className="hero-panel">
                <span>Admin</span>
                <strong>Controlled</strong>
                <p>KYC, approvals, verification, and reporting built in.</p>
              </article>
            </div>

            <div className="hero-system-card">
              <div className="hero-system-copy">
                <p className="hero-system-kicker">Core platform coverage</p>
                <h3>One operating layer across the business</h3>
              </div>

              <div className="hero-system-list">
                {capabilities.map((item) => (
                  <div key={item} className="hero-system-item">
                    <span className="hero-system-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-floating-card hero-floating-left">
            <span>Service Providers</span>
            <strong>Quotes, dispatches, verification, and payouts</strong>
          </div>

          <div className="hero-floating-card hero-floating-right">
            <span>Reporting</span>
            <strong>Financial and operating visibility built in</strong>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        {trustStats.map((stat) => (
          <article key={stat.value} className="trust-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section id="solution" className="content-section split-section">
        <div className="section-heading split-heading">
          <p className="section-eyebrow">WHY IT MATTERS</p>
          <h2>Real estate operations break down when the system is fragmented</h2>
          <p>
            Spreadsheets, manual follow-up, scattered billing, disconnected maintenance, and weak
            provider coordination create friction. Zyprent brings those layers together into one
            clean operating system.
          </p>
        </div>

        <div className="solution-grid">
          {solutionPillars.map((pillar) => (
            <article key={pillar.title} className="solution-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="content-section product-preview-section">
        <div className="section-heading">
          <p className="section-eyebrow">PRODUCT PREVIEW</p>
          <h2>A premium operating platform, not a patchwork of disconnected tools</h2>
          <p>
            The product is built to feel clear, structured, and investor-grade while supporting the
            complexity behind property operations.
          </p>
        </div>

        <div className="product-preview-shell">
          <div className="product-preview-main">
            <div className="product-preview-topbar">
              <span className="preview-pill active">Platform overview</span>
              <span className="preview-pill">Operations</span>
              <span className="preview-pill">Finance</span>
              <span className="preview-pill">Maintenance</span>
            </div>

            <div className="product-preview-grid">
              <div className="preview-card preview-card-large">
                <span>Portfolio visibility</span>
                <strong>One command layer</strong>
              </div>
              <div className="preview-card">
                <span>Billing</span>
                <strong>Live control</strong>
              </div>
              <div className="preview-card">
                <span>Providers</span>
                <strong>Verified flow</strong>
              </div>
              <div className="preview-card">
                <span>Approvals</span>
                <strong>Structured review</strong>
              </div>
            </div>

            <div className="preview-chart">
              <div className="preview-chart-head">
                <h3>Operating coverage across the platform</h3>
                <p>Built for real estate businesses that need visibility and control.</p>
              </div>

              <div className="preview-bars">
                <div className="preview-bar-row">
                  <span>Property operations</span>
                  <div className="preview-bar-track"><div className="preview-bar-fill fill-1" /></div>
                </div>
                <div className="preview-bar-row">
                  <span>Financial visibility</span>
                  <div className="preview-bar-track"><div className="preview-bar-fill fill-2" /></div>
                </div>
                <div className="preview-bar-row">
                  <span>Maintenance & providers</span>
                  <div className="preview-bar-track"><div className="preview-bar-fill fill-3" /></div>
                </div>
                <div className="preview-bar-row">
                  <span>Admin governance</span>
                  <div className="preview-bar-track"><div className="preview-bar-fill fill-4" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="product-preview-side">
            {productRows.map((row) => (
              <article key={row.title} className="preview-side-card">
                <span className="preview-side-tag">{row.tag}</span>
                <h3>{row.title}</h3>
                <p>{row.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="audiences" className="content-section">
        <div className="section-heading">
          <p className="section-eyebrow">WHO ZYPRENT SERVES</p>
          <h2>Built around the people who actually run real estate</h2>
          <p>
            Zyprent is designed around real workflows across management, investment, resident
            experience, service providers, and platform administration.
          </p>
        </div>

        <div className="audience-grid">
          {audiences.map((item) => (
            <article key={item.title} className="audience-card">
              <p className="audience-eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p className="audience-description">{item.description}</p>

              <div className="audience-points">
                {item.points.map((point) => (
                  <div key={point} className="audience-point">
                    <span className="audience-point-dot" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading compact">
          <p className="section-eyebrow">WHY ZYPRENT</p>
          <h2>Built to replace fragmented workflows with one cleaner operating layer</h2>
        </div>

        <div className="differentiator-grid">
          {differentiators.map((item) => (
            <article key={item.title} className="differentiator-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section cta-section">
        <div className="cta-card">
          <div className="cta-copy">
            <p className="section-eyebrow">READY TO RUN REAL ESTATE BETTER?</p>
            <h2>Bring operations, billing, maintenance, providers, and investor visibility into one premium platform</h2>
            <p>
              Start the conversation, request a demo, and explore how Zyprent can support a more
              structured and scalable way to manage real estate.
            </p>
          </div>

          <div className="cta-actions">
            <a className="landing-btn primary large" href="mailto:info@zyprent.com">
              Request Demo
            </a>
            <a className="landing-btn secondary large" href="/login">
              Sign In
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="content-section faq-section">
        <div className="section-heading compact">
          <p className="section-eyebrow">FAQ</p>
          <h2>Common questions</h2>
        </div>

        <div className="faq-grid">
          {faqItems.map((item) => (
            <article key={item.question} className="faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <div className="landing-brand-mark">Z</div>
          <div>
            <strong>ZYPRENT</strong>
            <p>Modern real estate operations, billing, maintenance, providers, and investor visibility.</p>
          </div>
        </div>

        <div className="landing-footer-links">
          <a href="#solution">Solution</a>
          <a href="#audiences">Who it&apos;s for</a>
          <a href="#product">Product</a>
          <a href="#faq">FAQ</a>
          <a href="/login">Sign In</a>
        </div>
      </footer>
    </main>
  );
}