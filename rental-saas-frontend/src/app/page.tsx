import "@/styles/landing.css";

const audienceCards = [
  {
    eyebrow: "For Property Managers",
    title: "Run operations with clarity, speed, and control",
    description:
      "Manage properties, units, residents, contracts, invoices, payments, expenses, maintenance, providers, and reporting from one connected operating system.",
    points: [
      "Centralized property and unit management",
      "Rent, invoice, payment, and expense visibility",
      "Maintenance coordination and provider oversight",
    ],
  },
  {
    eyebrow: "For Investors",
    title: "Track performance, capital, and portfolio health",
    description:
      "Monitor capital deployment, property funding activity, billing, distributions, portfolio reporting, and operational performance with clearer financial visibility.",
    points: [
      "Investment and portfolio visibility",
      "Distribution and revenue oversight",
      "Cleaner reporting for better decisions",
    ],
  },
  {
    eyebrow: "For Residents",
    title: "Deliver a more modern resident experience",
    description:
      "Give residents a cleaner, self-service experience for payments, invoices, receipts, maintenance requests, and account activity without constant back and forth.",
    points: [
      "Invoice and receipt access",
      "Maintenance request tracking",
      "A more professional resident journey",
    ],
  },
];

const platformModules = [
  {
    title: "Operations",
    text: "Properties, units, contracts, residents, and day-to-day workflows connected in one place.",
  },
  {
    title: "Finance",
    text: "Invoices, payments, expenses, transactions, subscriptions, and billing built into the system.",
  },
  {
    title: "Maintenance",
    text: "Requests, providers, approvals, and maintenance-linked expense visibility from one command center.",
  },
  {
    title: "Admin Control",
    text: "KYC, approvals, provider verification, reporting, and platform oversight designed for real control.",
  },
];

const showcaseCards = [
  {
    tag: "Dashboard",
    title: "Command visibility across the platform",
    text: "See the moving parts of your portfolio through a cleaner, premium operations dashboard.",
  },
  {
    tag: "Maintenance",
    title: "Track repairs, providers, and approvals",
    text: "Coordinate repair pressure, provider activity, linked costs, and resolution flow more professionally.",
  },
  {
    tag: "Investments",
    title: "Monitor capital and investor participation",
    text: "Track capital deployment, funding concentration, and investor visibility across active opportunities.",
  },
  {
    tag: "Billing",
    title: "Control plans, subscriptions, and usage",
    text: "Manage billing plans, subscriptions, invoices, and usage signals from one admin-ready workspace.",
  },
  {
    tag: "Compliance",
    title: "Run KYC and approvals from one system",
    text: "Process verification, approvals, and sensitive operational reviews without fragmented workflows.",
  },
  {
    tag: "Reports",
    title: "Generate clearer financial and operational insights",
    text: "Create reporting around performance, occupancy, billing, and revenue visibility.",
  },
];

const differentiators = [
  {
    title: "One connected real estate platform",
    text: "Zyprent replaces fragmented property workflows with one structured system for operations, finance, and oversight.",
  },
  {
    title: "Built for real operational complexity",
    text: "This is not a simple dashboard. It is designed around contracts, payments, billing, maintenance, approvals, providers, and portfolio visibility.",
  },
  {
    title: "Premium by design",
    text: "The product experience is intentionally built to feel polished, professional, and ready for serious real estate businesses.",
  },
  {
    title: "Ready for scale",
    text: "Whether you are managing a smaller portfolio or building toward a more complex operation, Zyprent is structured to grow with you.",
  },
];

const faqItems = [
  {
    question: "What is Zyprent?",
    answer:
      "Zyprent is a modern real estate operating platform that brings together property management, finance, maintenance, investor visibility, resident experience, and admin oversight in one system.",
  },
  {
    question: "Who is Zyprent built for?",
    answer:
      "Zyprent is built for property managers, investors, operators, and residents who need a cleaner, more connected way to manage real estate operations.",
  },
  {
    question: "Does Zyprent support both operations and financial visibility?",
    answer:
      "Yes. Zyprent connects operational workflows like contracts, units, residents, and maintenance with financial workflows like invoices, payments, expenses, subscriptions, and reporting.",
  },
  {
    question: "Can I request a demo before using the product?",
    answer:
      "Yes. You can use the demo request flow to start a conversation, understand the product, and explore whether Zyprent fits your operations.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a href="/" className="landing-brand">
          <div className="landing-brand-mark">Z</div>
          <div className="landing-brand-copy">
            <span className="landing-brand-name">ZYPRENT</span>
            <span className="landing-brand-sub">
              Real estate operating platform
            </span>
          </div>
        </a>

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#product">Product</a>
          <a href="#why">Why Zyprent</a>
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
          <h1>
            Manage properties, operations, billing, investors, and residents
            from one premium platform
          </h1>
          <p className="hero-text">
            Zyprent is the all-in-one system for modern real estate businesses
            that need more structure, better visibility, and a more professional
            way to run operations across property management, finance,
            maintenance, reporting, and investor oversight.
          </p>

          <div className="hero-actions">
            <a className="landing-btn primary large" href="mailto:info@zyprent.com">
              Request Demo
            </a>
            <a className="landing-btn secondary large" href="/login">
              Open Platform
            </a>
          </div>

          <div className="hero-trust-row">
            <div className="hero-trust-pill">Property Management</div>
            <div className="hero-trust-pill">Investor Visibility</div>
            <div className="hero-trust-pill">Billing Control</div>
            <div className="hero-trust-pill">Resident Experience</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card main">
            <div className="hero-visual-top">
              <span className="hero-chip">Platform Overview</span>
              <span className="hero-chip subtle">Premium Workflow</span>
            </div>

            <div className="hero-metrics-grid">
              <div className="hero-metric strong">
                <span>Operations</span>
                <strong>Unified</strong>
              </div>
              <div className="hero-metric">
                <span>Finance</span>
                <strong>Tracked</strong>
              </div>
              <div className="hero-metric">
                <span>Maintenance</span>
                <strong>Structured</strong>
              </div>
              <div className="hero-metric">
                <span>Reporting</span>
                <strong>Clearer</strong>
              </div>
            </div>

            <div className="hero-chart-card">
              <div className="hero-chart-head">
                <h3>Built for modern real estate workflows</h3>
                <p>
                  A premium command layer for the work behind property
                  operations, finance, and investor visibility.
                </p>
              </div>

              <div className="hero-bars">
                <div className="hero-bar-row">
                  <span>Property operations</span>
                  <div className="hero-bar-track">
                    <div className="hero-bar-fill fill-1" />
                  </div>
                </div>
                <div className="hero-bar-row">
                  <span>Financial visibility</span>
                  <div className="hero-bar-track">
                    <div className="hero-bar-fill fill-2" />
                  </div>
                </div>
                <div className="hero-bar-row">
                  <span>Maintenance control</span>
                  <div className="hero-bar-track">
                    <div className="hero-bar-fill fill-3" />
                  </div>
                </div>
                <div className="hero-bar-row">
                  <span>Investor reporting</span>
                  <div className="hero-bar-track">
                    <div className="hero-bar-fill fill-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-floating-card card-a">
            <span>Maintenance</span>
            <strong>Repairs, providers, and approvals tracked cleanly</strong>
          </div>

          <div className="hero-floating-card card-b">
            <span>Finance</span>
            <strong>Billing, subscriptions, and reporting built in</strong>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="proof-item">
          <strong>One platform</strong>
          <span>Operations, finance, maintenance, and oversight in one system</span>
        </div>
        <div className="proof-item">
          <strong>Designed for clarity</strong>
          <span>Built to reduce scattered tools, manual follow-up, and fragmented processes</span>
        </div>
        <div className="proof-item">
          <strong>Built to grow</strong>
          <span>Structured for teams building modern, scalable real estate operations</span>
        </div>
      </section>

      <section id="features" className="content-section">
        <div className="section-heading">
          <p className="section-eyebrow">WHO ZYPRENT SERVES</p>
          <h2>Built around the people who actually run real estate</h2>
          <p>
            Zyprent is designed around real workflows across management,
            investment, administration, and resident experience.
          </p>
        </div>

        <div className="feature-stack">
          {audienceCards.map((card) => (
            <article key={card.title} className="feature-card">
              <p className="feature-eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p className="feature-description">{card.description}</p>

              <div className="feature-points">
                {card.points.map((point) => (
                  <div key={point} className="feature-point">
                    <span className="feature-point-dot" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section highlights-section">
        <div className="section-heading compact">
          <p className="section-eyebrow">PLATFORM HIGHLIGHTS</p>
          <h2>What Zyprent brings together</h2>
        </div>

        <div className="highlights-grid">
          {platformModules.map((item) => (
            <article key={item.title} className="highlight-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="content-section product-section">
        <div className="section-heading">
          <p className="section-eyebrow">PRODUCT SHOWCASE</p>
          <h2>
            A connected operating platform for property management, financial
            clarity, and portfolio visibility
          </h2>
          <p>
            Zyprent brings critical real estate workflows into one premium
            system instead of spreading them across multiple disconnected tools.
          </p>
        </div>

        <div className="showcase-grid">
          {showcaseCards.map((card) => (
            <article key={card.title} className="showcase-card">
              <div className="showcase-top">
                <span className="showcase-tag">{card.tag}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className="showcase-mock" />
            </article>
          ))}
        </div>
      </section>

      <section id="why" className="content-section why-section">
        <div className="section-heading">
          <p className="section-eyebrow">WHY ZYPRENT</p>
          <h2>
            Built to replace spreadsheets, fragmented tools, and scattered
            workflows with one cleaner operating layer
          </h2>
          <p>
            Zyprent is designed for businesses that want a more professional,
            more scalable, and more visible way to run real estate.
          </p>
        </div>

        <div className="why-grid">
          {differentiators.map((item) => (
            <article key={item.title} className="why-card">
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
            <h2>
              Bring your operations, billing, maintenance, and investor
              visibility into one premium platform
            </h2>
            <p>
              Start the conversation, request a demo, and explore how Zyprent
              can support a more connected way to manage real estate.
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

        <div className="faq-list">
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
            <p>
              Modern real estate operations, billing, and investor visibility.
            </p>
          </div>
        </div>

        <div className="landing-footer-links">
          <a href="#features">Features</a>
          <a href="#product">Product</a>
          <a href="#why">Why Zyprent</a>
          <a href="#faq">FAQ</a>
          <a href="/login">Sign In</a>
        </div>
      </footer>
    </main>
  );
}