"use client";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav">
          <a href="/" className="brand">
            <span>Z</span>
            <strong>Zyprent</strong>
          </a>

          <div className="links">
            <a href="/">Home</a>
            <a href="/#solution">Solution</a>
            <a href="/#platform">Platform</a>
            <a href="/experiences">Experiences</a>
            <a href="/#faq">FAQ</a>
          </div>

          <div className="actions">
            <a href="/login">Sign In</a>
            <a href={DEMO_FORM_LINK} target="_blank" rel="noopener noreferrer" className="demo">
              Request Demo
            </a>
          </div>
        </nav>

        <section className="hero">
          <div className="copy">
            <p className="eyebrow">Welcome to Zyprent Experiences</p>

            <h1>
              Property work,
              <br />
              built around
              <br />
              real people.
            </h1>

            <p className="sub">
              Residents, managers, providers and investors stay connected through one clean property workflow.
            </p>

            <div className="buttons">
              <a href={DEMO_FORM_LINK} target="_blank" rel="noopener noreferrer" className="primary">
                Request Demo
              </a>
              <a href="/login" className="secondary">
                Explore Platform
              </a>
            </div>

            <div className="proof">
              <div className="people">
                <span>R</span>
                <span>M</span>
                <span>I</span>
              </div>
              <div>
                <strong>Built for every role</strong>
                <small>Residents · Managers · Providers · Investors</small>
              </div>
            </div>
          </div>

          <div className="visual">
            <div className="glow" />

            <img
              src="/experiences/hero-person.png"
              alt="Professional using Zyprent workspace"
              className="person"
            />

            <div className="floatCard receipt">
              <span className="icon">▣</span>
              <div>
                <small>Resident payment</small>
                <strong>Receipt saved</strong>
              </div>
            </div>

            <div className="floatCard metric">
              <span className="icon">▥</span>
              <strong>550+</strong>
              <small>Actions tracked</small>
            </div>

            <div className="floatCard workflow">
              <span className="icon">♙</span>
              <div>
                <small>Team workflow</small>
                <strong>Manager approved</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          overflow: hidden;
          color: white;
          background:
            radial-gradient(circle at 76% 48%, rgba(42, 105, 255, 0.45), transparent 31%),
            radial-gradient(circle at 92% 12%, rgba(105, 167, 255, 0.16), transparent 24%),
            linear-gradient(135deg, #030713 0%, #050817 48%, #071327 100%);
        }

        .shell {
          width: min(1440px, calc(100% - 70px));
          height: 100vh;
          margin: 0 auto;
        }

        .nav {
          height: 86px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          color: white;
          text-decoration: none;
        }

        .brand span {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: white;
          color: #030713;
          font-size: 21px;
          font-weight: 950;
        }

        .brand strong {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .links {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        .links a,
        .actions a {
          color: rgba(255, 255, 255, 0.84);
          text-decoration: none;
          font-size: 15px;
          font-weight: 850;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .demo {
          height: 50px;
          padding: 0 24px;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white !important;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.34);
        }

        .hero {
          height: calc(100vh - 86px);
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: center;
          gap: 24px;
          position: relative;
        }

        .copy {
          position: relative;
          z-index: 10;
          padding-bottom: 16px;
        }

        .eyebrow {
          margin: 0;
          color: #69a7ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        h1 {
          margin: 24px 0 22px;
          max-width: 640px;
          font-size: clamp(54px, 5vw, 82px);
          line-height: 0.96;
          letter-spacing: -0.075em;
        }

        .sub {
          max-width: 560px;
          margin: 0;
          color: rgba(255, 255, 255, 0.74);
          font-size: 19px;
          line-height: 1.55;
        }

        .buttons {
          display: flex;
          gap: 18px;
          margin-top: 32px;
        }

        .primary,
        .secondary {
          height: 56px;
          padding: 0 32px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 16px;
          font-weight: 950;
        }

        .primary {
          color: white;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.36);
        }

        .secondary {
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.02);
        }

        .proof {
          margin-top: 34px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .people {
          display: flex;
        }

        .people span {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          margin-left: -10px;
          border: 3px solid #040816;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 950;
          color: #071027;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        }

        .people span:first-child {
          margin-left: 0;
          background: linear-gradient(135deg, #f2b574, #bd7540);
        }

        .people span:nth-child(2) {
          background: linear-gradient(135deg, #ffffff, #dbe3f4);
        }

        .people span:nth-child(3) {
          color: white;
          background: linear-gradient(135deg, #7eb5ff, #4a55ff);
        }

        .proof strong,
        .proof small {
          display: block;
        }

        .proof strong {
          font-size: 15px;
          font-weight: 950;
        }

        .proof small {
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 14px;
        }

        .visual {
          position: relative;
          height: 100%;
          min-height: 560px;
          overflow: visible;
        }

        .glow {
          position: absolute;
          right: -80px;
          top: 30px;
          width: 820px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(63, 124, 255, 0.75), rgba(39, 83, 190, 0.26) 40%, transparent 70%);
          filter: blur(18px);
          z-index: 1;
        }

        .person {
          position: absolute;
          right: -82px;
          bottom: 0;
          height: 98%;
          width: auto;
          object-fit: contain;
          z-index: 3;
          filter: drop-shadow(0 34px 78px rgba(0, 0, 0, 0.34));
          -webkit-mask-image:
            linear-gradient(to right, transparent 0%, transparent 10%, #000 26%, #000 100%),
            linear-gradient(to top, transparent 0%, #000 7%, #000 100%);
          mask-image:
            linear-gradient(to right, transparent 0%, transparent 10%, #000 26%, #000 100%),
            linear-gradient(to top, transparent 0%, #000 7%, #000 100%);
        }

        .visual::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
          background:
            linear-gradient(to right, #050817 0%, rgba(5, 8, 23, 0.68) 16%, rgba(5, 8, 23, 0.16) 35%, transparent 62%),
            linear-gradient(to top, #050817 0%, rgba(5, 8, 23, 0.22) 10%, transparent 28%);
        }

        .floatCard {
          position: absolute;
          z-index: 6;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 16px;
          border-radius: 18px;
          background: rgba(12, 25, 58, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 46px rgba(0, 0, 0, 0.26);
          backdrop-filter: blur(18px);
        }

        .icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, #68a6ff, #4a55ff);
          box-shadow: 0 12px 24px rgba(75, 88, 255, 0.32);
          flex: 0 0 auto;
          font-size: 16px;
          font-weight: 950;
        }

        .floatCard small {
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .floatCard strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.05;
        }

        .receipt {
          top: 128px;
          left: 74px;
        }

        .metric {
          top: 258px;
          right: -20px;
          display: block;
          min-width: 172px;
          padding: 18px 20px;
        }

        .metric .icon {
          margin-bottom: 12px;
        }

        .metric strong {
          margin-top: 0;
          font-size: 42px;
          letter-spacing: -0.06em;
        }

        .workflow {
          left: 80px;
          bottom: 86px;
        }
      `}</style>
    </main>
  );
}