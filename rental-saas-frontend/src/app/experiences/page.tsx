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
            <a
              href={DEMO_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="demo"
            >
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
              <a
                href={DEMO_FORM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="primary"
              >
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

            <div className="personCrop">
              <img
                src="/experiences/hero-person.png"
                alt="Professional using Zyprent workspace"
                className="person"
              />
            </div>

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

      <section className="controlSection">
        <div className="controlInner">
          <div className="controlVisual">
            <div className="phoneMockup">
              <div className="phoneTop" />
              <div className="phoneHeader">
                <span>9:41</span>
                <strong>Zyprent</strong>
              </div>

              <div className="balanceCard">
                <small>Collected this month</small>
                <strong>UGX 48.2M</strong>
                <span>Payments, maintenance and reports connected</span>
              </div>

              <div className="phoneGrid">
                <div>
                  <small>Units</small>
                  <strong>42</strong>
                </div>
                <div>
                  <small>Open jobs</small>
                  <strong>06</strong>
                </div>
              </div>

              <div className="phoneList">
                <p>
                  <span>Rent payment</span>
                  <strong>Receipt saved</strong>
                </p>
                <p>
                  <span>Maintenance</span>
                  <strong>Provider assigned</strong>
                </p>
                <p>
                  <span>Investor report</span>
                  <strong>Ready</strong>
                </p>
              </div>
            </div>

            <div className="blackCard">
              <small>Zyprent Card</small>
              <strong>Property wallet</strong>
              <span>UGX</span>
            </div>

            <div className="miniCard secureCard">
              <span>✓</span>
              <strong>Secure payments</strong>
            </div>

            <div className="miniCard recordCard">
              <span>↗</span>
              <strong>Records updated</strong>
            </div>
          </div>

          <div className="controlCopy">
            <p className="sectionEyebrow">Connected property control</p>

            <h2>
              Control every property experience from one connected workspace.
            </h2>

            <p>
              Rent payments, maintenance updates, approvals, resident records
              and investor activity stay organized in one place, so every role
              knows what is happening.
            </p>

            <div className="controlButtons">
              <a
                href={DEMO_FORM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="darkBtn"
              >
                Request Demo
              </a>

              <a href="/login" className="lightBtn">
                Explore Platform
              </a>
            </div>

            <div className="controlStat">
              <div className="statAvatars">
                <span>R</span>
                <span>M</span>
                <span>P</span>
                <span>I</span>
              </div>

              <div>
                <strong>4 core user roles</strong>
                <small>Connected through one operating record</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          overflow-x: hidden;
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

        .personCrop {
          position: absolute;
          right: -82px;
          bottom: 0;
          width: 760px;
          height: 675px;
          overflow: hidden;
          z-index: 3;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 18%, #000 100%);
          mask-image: linear-gradient(to right, transparent 0%, #000 18%, #000 100%);
        }

        .person {
          position: absolute;
          right: 0;
          bottom: 0;
          height: 100%;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 34px 78px rgba(0, 0, 0, 0.34));
        }

        .personCrop::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(to right, rgba(5, 8, 23, 0.95) 0%, rgba(5, 8, 23, 0.28) 20%, transparent 42%);
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
          left: 104px;
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
          left: 108px;
          bottom: 86px;
        }

        .controlSection {
          background: linear-gradient(180deg, #f7f8fb 0%, #ffffff 100%);
          color: #080b13;
          padding: 96px 0 110px;
        }

        .controlInner {
          width: min(1320px, calc(100% - 70px));
          margin: 0 auto;
          min-height: 720px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 70px;
        }

        .controlVisual {
          position: relative;
          min-height: 640px;
        }

        .phoneMockup {
          position: absolute;
          left: 120px;
          top: 20px;
          width: 300px;
          height: 590px;
          border-radius: 44px;
          background: linear-gradient(180deg, #ffffff, #eef2f8);
          border: 10px solid #111318;
          box-shadow: 0 32px 90px rgba(9, 20, 42, 0.18);
          padding: 28px 20px;
          overflow: hidden;
          transform: rotate(-5deg);
        }

        .phoneTop {
          width: 92px;
          height: 24px;
          border-radius: 999px;
          background: #111318;
          margin: 0 auto 20px;
        }

        .phoneHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #111318;
          font-size: 12px;
          margin-bottom: 22px;
        }

        .balanceCard {
          border-radius: 26px;
          background: linear-gradient(135deg, #111827, #182546);
          color: white;
          padding: 22px;
          box-shadow: 0 18px 40px rgba(31, 49, 93, 0.25);
        }

        .balanceCard small,
        .balanceCard span {
          display: block;
          color: rgba(255, 255, 255, 0.65);
          font-size: 11px;
          font-weight: 800;
        }

        .balanceCard strong {
          display: block;
          margin: 8px 0;
          font-size: 32px;
          letter-spacing: -0.05em;
        }

        .phoneGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .phoneGrid div {
          background: white;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 12px 28px rgba(20, 29, 49, 0.08);
        }

        .phoneGrid small,
        .phoneList span {
          display: block;
          color: #7a8294;
          font-size: 11px;
          font-weight: 800;
        }

        .phoneGrid strong {
          display: block;
          margin-top: 5px;
          font-size: 24px;
        }

        .phoneList {
          margin-top: 16px;
          background: white;
          border-radius: 22px;
          padding: 14px 16px;
          box-shadow: 0 12px 30px rgba(20, 29, 49, 0.08);
        }

        .phoneList p {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0;
          padding: 12px 0;
          border-bottom: 1px solid #edf0f5;
        }

        .phoneList p:last-child {
          border-bottom: none;
        }

        .phoneList strong {
          font-size: 11px;
          color: #111318;
        }

        .blackCard {
          position: absolute;
          left: 300px;
          top: 190px;
          width: 270px;
          height: 180px;
          border-radius: 28px;
          padding: 26px;
          color: white;
          background:
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.12), transparent 28%),
            linear-gradient(135deg, #151515, #050505);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.26);
          transform: rotate(-7deg);
        }

        .blackCard small {
          display: block;
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
          font-weight: 800;
        }

        .blackCard strong {
          display: block;
          margin-top: 32px;
          font-size: 24px;
          line-height: 1.05;
        }

        .blackCard span {
          position: absolute;
          right: 24px;
          top: 24px;
          font-weight: 950;
        }

        .miniCard {
          position: absolute;
          width: 170px;
          min-height: 120px;
          border-radius: 24px;
          background: white;
          padding: 22px;
          box-shadow: 0 24px 70px rgba(25, 39, 75, 0.14);
        }

        .miniCard span {
          width: 38px;
          height: 38px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          font-weight: 950;
        }

        .miniCard strong {
          display: block;
          margin-top: 14px;
          font-size: 18px;
          line-height: 1.12;
        }

        .secureCard {
          left: 10px;
          top: 260px;
        }

        .recordCard {
          left: 410px;
          bottom: 70px;
        }

        .controlCopy h2 {
          margin: 18px 0 24px;
          max-width: 620px;
          font-size: clamp(48px, 4vw, 72px);
          line-height: 0.98;
          letter-spacing: -0.07em;
        }

        .sectionEyebrow {
          margin: 0;
          color: #4a55ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .controlCopy p {
          max-width: 560px;
          color: #747b8b;
          font-size: 18px;
          line-height: 1.65;
        }

        .controlButtons {
          display: flex;
          gap: 16px;
          margin-top: 34px;
        }

        .darkBtn,
        .lightBtn {
          height: 56px;
          padding: 0 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 15px;
          font-weight: 900;
        }

        .darkBtn {
          background: #101010;
          color: white;
        }

        .lightBtn {
          background: white;
          color: #101010;
          border: 1px solid #dfe3ea;
        }

        .controlStat {
          margin-top: 52px;
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .statAvatars {
          display: flex;
        }

        .statAvatars span {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          margin-left: -10px;
          display: grid;
          place-items: center;
          color: white;
          background: #111827;
          border: 3px solid white;
          font-size: 12px;
          font-weight: 950;
        }

        .statAvatars span:first-child {
          margin-left: 0;
          background: #d8a06b;
        }

        .statAvatars span:nth-child(2) {
          background: #4a55ff;
        }

        .statAvatars span:nth-child(3) {
          background: #111827;
        }

        .statAvatars span:nth-child(4) {
          background: #69a7ff;
        }

        .controlStat strong {
          display: block;
          font-size: 30px;
          letter-spacing: -0.04em;
        }

        .controlStat small {
          display: block;
          max-width: 260px;
          color: #7a8294;
          margin-top: 4px;
        }

        @media (max-width: 1100px) {
          .page {
            overflow-y: auto;
          }

          .shell {
            height: auto;
            min-height: 100vh;
          }

          .hero {
            height: auto;
            min-height: calc(100vh - 86px);
            grid-template-columns: 1fr;
            padding: 50px 0 70px;
          }

          .visual {
            min-height: 620px;
          }

          .controlInner {
            grid-template-columns: 1fr;
          }

          .controlCopy {
            order: -1;
          }
        }

        @media (max-width: 760px) {
          .shell,
          .controlInner {
            width: min(100% - 28px, 1440px);
          }

          .links,
          .actions a:first-child {
            display: none;
          }

          h1 {
            font-size: 46px;
          }

          .sub {
            font-size: 16px;
          }

          .buttons,
          .controlButtons {
            flex-direction: column;
          }

          .primary,
          .secondary,
          .darkBtn,
          .lightBtn {
            width: 100%;
          }

          .controlSection {
            padding: 70px 0;
          }

          .controlVisual {
            min-height: 580px;
            transform: scale(0.82);
            transform-origin: top center;
          }

          .phoneMockup {
            left: 40px;
          }

          .blackCard {
            left: 190px;
          }

          .secureCard {
            left: -10px;
          }

          .recordCard {
            left: 250px;
          }
        }
      `}</style>
    </main>
  );
}