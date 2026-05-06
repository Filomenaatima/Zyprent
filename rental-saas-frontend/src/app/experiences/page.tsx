"use client";

import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiences-page">
      <header className="landing-nav experiences-nav">
        <a href="/" className="landing-brand">
          <span className="landing-brand-mark">Z</span>
          <strong>Zyprent</strong>
        </a>

        <nav className="landing-nav-links">
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

      <section className="xp-hero">
        <div className="xp-hero-copy">
          <span>Zyprent experiences</span>
          <h1>Property operations, shown clearly.</h1>
          <p>
            A cleaner view of how residents, managers, service providers and
            investors move through one connected property workspace.
          </p>

          <div className="xp-actions">
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
        </div>

        <div className="xp-product-shot">
          <div className="mock-topbar">
            <i />
            <i />
            <i />
            <strong>Live property workspace</strong>
          </div>

          <div className="mock-layout">
            <aside>
              <span />
              <span />
              <span />
              <span />
            </aside>

            <section>
              <div className="mock-hero-card">
                <div>
                  <small>Portfolio status</small>
                  <strong>UGX 48.2M</strong>
                  <p>Collected this month</p>
                </div>
                <button>Live</button>
              </div>

              <div className="mock-grid">
                <div>
                  <small>Residents</small>
                  <strong>128</strong>
                </div>
                <div>
                  <small>Open jobs</small>
                  <strong>06</strong>
                </div>
                <div>
                  <small>Expenses</small>
                  <strong>UGX 3.4M</strong>
                </div>
              </div>

              <div className="mock-table">
                <p>
                  <span>Rent payment received</span>
                  <strong>Receipt saved</strong>
                </p>
                <p>
                  <span>Bathroom leak request</span>
                  <strong>Provider assigned</strong>
                </p>
                <p>
                  <span>Investor return update</span>
                  <strong>Report ready</strong>
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="xp-section">
        <div className="xp-heading">
          <span>Built around real users</span>
          <h2>Every role gets the view they need.</h2>
        </div>

        <div className="xp-role-grid">
          {[
            ["Residents", "Pay rent, view receipts, submit requests."],
            ["Managers", "Track units, residents, payments and work orders."],
            ["Service Providers", "Receive jobs, quote, update and complete work."],
            ["Investors", "Follow returns, expenses, wallets and performance."],
          ].map(([title, text]) => (
            <article key={title} className="xp-role-card">
              <div className="xp-card-preview">
                <div className="preview-line large" />
                <div className="preview-line" />
                <div className="preview-line short" />
                <div className="preview-chip">Live</div>
              </div>
              <span>{title}</span>
              <h3>{text}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="xp-workflow">
        <div>
          <span>Connected workflow</span>
          <h2>From one action to a complete record.</h2>
          <p>
            Payments, maintenance updates, approvals and reports stay tied to
            the right property and user.
          </p>
        </div>

        <div className="xp-flow-list">
          <p>
            <strong>01</strong> Resident pays rent
          </p>
          <p>
            <strong>02</strong> Manager sees payment status
          </p>
          <p>
            <strong>03</strong> Provider completes assigned work
          </p>
          <p>
            <strong>04</strong> Investor reviews performance
          </p>
        </div>
      </section>

      <section className="final-cta experiences-final">
        <span>One workspace for property operations</span>
        <h2>Give every user a clearer way to work.</h2>
        <p>
          Zyprent connects the people, payments, maintenance and financial
          records behind every property.
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
            radial-gradient(circle at 80% 8%, rgba(102, 164, 255, 0.2), transparent 30%),
            linear-gradient(135deg, #04040c 0%, #080a1d 48%, #0b1026 100%);
          color: #fff;
          overflow-x: hidden;
        }

        .experiences-nav {
          position: relative;
          z-index: 20;
        }

        .xp-hero {
          width: min(1120px, calc(100% - 40px));
          height: calc(100vh - 92px);
          max-height: 650px;
          min-height: 560px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.78fr 1.22fr;
          align-items: center;
          gap: 42px;
          padding: 22px 0 34px;
        }

        .xp-hero-copy span,
        .xp-heading span,
        .xp-workflow span,
        .final-cta span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .xp-hero-copy h1 {
          margin: 14px 0 0;
          max-width: 520px;
          font-size: clamp(44px, 5vw, 68px);
          line-height: 0.95;
          letter-spacing: -0.075em;
        }

        .xp-hero-copy p {
          margin: 20px 0 0;
          max-width: 460px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 17px;
          line-height: 1.6;
        }

        .xp-actions {
          margin-top: 26px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .xp-product-shot {
          border-radius: 34px;
          overflow: hidden;
          border: 1px solid rgba(185, 214, 255, 0.18);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(18px);
        }

        .mock-topbar {
          height: 54px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
        }

        .mock-topbar i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
        }

        .mock-topbar strong {
          margin-left: auto;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.72);
        }

        .mock-layout {
          display: grid;
          grid-template-columns: 150px 1fr;
          min-height: 430px;
        }

        .mock-layout aside {
          padding: 22px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(2, 4, 18, 0.34);
        }

        .mock-layout aside span {
          display: block;
          height: 12px;
          border-radius: 999px;
          margin-bottom: 18px;
          background: rgba(255, 255, 255, 0.22);
        }

        .mock-layout aside span:nth-child(1) {
          width: 76px;
        }

        .mock-layout aside span:nth-child(2) {
          width: 96px;
          background: rgba(96, 130, 255, 0.8);
        }

        .mock-layout aside span:nth-child(3) {
          width: 70px;
        }

        .mock-layout aside span:nth-child(4) {
          width: 86px;
        }

        .mock-layout section {
          padding: 24px;
        }

        .mock-hero-card {
          min-height: 145px;
          border-radius: 26px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          background: linear-gradient(135deg, #101d55, #315bea);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }

        .mock-hero-card small,
        .mock-grid small {
          color: rgba(255, 255, 255, 0.68);
          font-weight: 800;
        }

        .mock-hero-card strong {
          display: block;
          margin-top: 10px;
          font-size: 38px;
          letter-spacing: -0.06em;
        }

        .mock-hero-card p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.68);
        }

        .mock-hero-card button {
          align-self: flex-start;
          border: 0;
          border-radius: 999px;
          padding: 9px 14px;
          color: #0b1026;
          font-weight: 950;
          background: #fff;
        }

        .mock-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .mock-grid div {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .mock-grid strong {
          display: block;
          margin-top: 8px;
          font-size: 24px;
        }

        .mock-table {
          margin-top: 16px;
          padding: 8px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mock-table p {
          margin: 0;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: rgba(255, 255, 255, 0.72);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mock-table p:last-child {
          border-bottom: 0;
        }

        .mock-table strong {
          color: #fff;
        }

        .xp-section,
        .xp-workflow,
        .experiences-final {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .xp-section {
          padding: 70px 0;
        }

        .xp-heading {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }

        .xp-heading h2,
        .xp-workflow h2 {
          margin: 12px 0 0;
          font-size: clamp(34px, 4vw, 56px);
          line-height: 0.98;
          letter-spacing: -0.07em;
        }

        .xp-role-grid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .xp-role-card {
          padding: 18px;
          min-height: 320px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(185, 214, 255, 0.16);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
        }

        .xp-card-preview {
          height: 150px;
          position: relative;
          border-radius: 22px;
          padding: 18px;
          background:
            radial-gradient(circle at 70% 28%, rgba(143, 208, 255, 0.2), transparent 34%),
            rgba(255, 255, 255, 0.07);
          margin-bottom: 18px;
        }

        .preview-line {
          width: 72%;
          height: 10px;
          border-radius: 999px;
          margin-top: 14px;
          background: rgba(255, 255, 255, 0.26);
        }

        .preview-line.large {
          width: 48%;
          height: 18px;
          background: #8fd0ff;
        }

        .preview-line.short {
          width: 54%;
        }

        .preview-chip {
          position: absolute;
          right: 16px;
          bottom: 16px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(86, 119, 255, 0.4);
          font-size: 12px;
          font-weight: 950;
        }

        .xp-role-card span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
        }

        .xp-role-card h3 {
          margin: 10px 0 0;
          font-size: 23px;
          line-height: 1.05;
          letter-spacing: -0.05em;
        }

        .xp-workflow {
          padding: 38px;
          border-radius: 32px;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 28px;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(185, 214, 255, 0.16);
        }

        .xp-workflow p {
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.65;
        }

        .xp-flow-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .xp-flow-list p {
          margin: 0;
          padding: 20px;
          border-radius: 22px;
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .xp-flow-list strong {
          display: block;
          color: #8fd0ff;
          margin-bottom: 8px;
        }

        .experiences-final {
          margin: 70px auto 60px;
        }

        @media (max-width: 980px) {
          .xp-hero,
          .xp-workflow {
            grid-template-columns: 1fr;
            height: auto;
            max-height: none;
          }

          .xp-role-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .xp-hero {
            width: min(100% - 28px, 1120px);
            min-height: auto;
          }

          .xp-hero-copy h1 {
            font-size: 44px;
          }

          .mock-layout {
            grid-template-columns: 1fr;
          }

          .mock-layout aside {
            display: none;
          }

          .mock-grid,
          .xp-role-grid,
          .xp-flow-list {
            grid-template-columns: 1fr;
          }

          .xp-product-shot {
            border-radius: 26px;
          }
        }
      `}</style>
    </main>
  );
}