"use client";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiencesPage">
      <div className="pageShell">
        <nav className="nav">
          <a href="/" className="brand">
            <span>Z</span>
            <strong>Zyprent</strong>
          </a>

          <div className="navLinks">
            <a href="/">Home</a>
            <a href="/#solution">Solution</a>
            <a href="/#platform">Platform</a>
            <a href="/experiences">Experiences</a>
            <a href="/#faq">FAQ</a>
          </div>

          <div className="navActions">
            <a href="/login">Sign In</a>
            <a
              href={DEMO_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="demoButton"
            >
              Request Demo
            </a>
          </div>
        </nav>

        <section className="hero">
          <div className="heroText">
            <p className="eyebrow">Welcome to Zyprent Experiences</p>

            <h1>
              Property work,
              <br />
              built around
              <br />
              real people.
            </h1>

            <p className="subtext">
              Residents, managers, providers and investors stay connected
              through one clean property workflow.
            </p>

            <div className="heroButtons">
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

            <div className="socialProof">
              <div className="avatars">
                <span />
                <span />
                <span />
              </div>

              <div>
                <strong>Built for every role</strong>
                <small>Residents · Managers · Providers · Investors</small>
              </div>
            </div>
          </div>

          <div className="heroVisual">
            <div className="blueGlow" />

            <img
              src="/experiences/hero-person.png"
              alt="Professional using Zyprent workspace"
              className="heroPerson"
            />

            <div className="infoCard receiptCard">
              <div className="cardIcon">▣</div>
              <div>
                <small>Resident payment</small>
                <strong>Receipt saved</strong>
              </div>
            </div>

            <div className="infoCard metricCard">
              <div className="cardIcon">▥</div>
              <strong>550+</strong>
              <small>Actions tracked</small>
            </div>

            <div className="infoCard workflowCard">
              <div className="cardIcon">♙</div>
              <div>
                <small>Team workflow</small>
                <strong>Manager approved</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .experiencesPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 76% 48%, rgba(36, 95, 255, 0.42), transparent 31%),
            radial-gradient(circle at 100% 0%, rgba(67, 104, 255, 0.18), transparent 28%),
            linear-gradient(135deg, #030713 0%, #050817 48%, #071327 100%);
          color: #ffffff;
          overflow: hidden;
        }

        .pageShell {
          width: min(1440px, calc(100% - 64px));
          margin: 0 auto;
        }

        .nav {
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #ffffff;
          text-decoration: none;
        }

        .brand span {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #ffffff;
          color: #040816;
          font-weight: 950;
          font-size: 21px;
        }

        .brand strong {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .navLinks {
          display: flex;
          gap: 34px;
        }

        .navLinks a,
        .navActions a {
          color: rgba(255, 255, 255, 0.84);
          text-decoration: none;
          font-size: 15px;
          font-weight: 850;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .demoButton {
          height: 50px;
          padding: 0 24px;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          color: #ffffff !important;
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.34);
        }

        .hero {
          height: calc(100vh - 88px);
          max-height: 680px;
          min-height: 560px;
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          align-items: center;
          gap: 42px;
          position: relative;
        }

        .heroText {
          position: relative;
          z-index: 5;
        }

        .eyebrow {
          margin: 0;
          color: #69a7ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .heroText h1 {
          margin: 24px 0 22px;
          max-width: 640px;
          font-size: clamp(56px, 5.4vw, 88px);
          line-height: 0.96;
          letter-spacing: -0.075em;
        }

        .subtext {
          max-width: 560px;
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 20px;
          line-height: 1.55;
        }

        .heroButtons {
          display: flex;
          gap: 18px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .primary,
        .secondary {
          height: 58px;
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
          color: #ffffff;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.36);
        }

        .secondary {
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.02);
        }

        .socialProof {
          margin-top: 34px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatars {
          display: flex;
        }

        .avatars span {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          margin-left: -10px;
          border: 3px solid #040816;
          background: #d8a06b;
        }

        .avatars span:first-child {
          margin-left: 0;
        }

        .avatars span:nth-child(2) {
          background: #e7ecf9;
        }

        .avatars span:nth-child(3) {
          background: linear-gradient(135deg, #7eb5ff, #4a55ff);
        }

        .socialProof strong,
        .socialProof small {
          display: block;
        }

        .socialProof strong {
          font-size: 15px;
          font-weight: 950;
        }

        .socialProof small {
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 14px;
        }

        .heroVisual {
          position: relative;
          height: 100%;
          min-height: 560px;
          overflow: visible;
        }

        .blueGlow {
          position: absolute;
          right: 60px;
          top: 76px;
          width: 540px;
          height: 540px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(65, 116, 255, 0.72), transparent 68%);
          filter: blur(18px);
          z-index: 1;
        }

        .heroPerson {
          position: absolute;
          right: -20px;
          bottom: 0;
          height: 96%;
          width: auto;
          max-width: 82%;
          object-fit: contain;
          object-position: bottom right;
          z-index: 2;
          filter: drop-shadow(0 30px 70px rgba(0, 0, 0, 0.32));
        }

        .infoCard {
          position: absolute;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(12, 25, 58, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 46px rgba(0, 0, 0, 0.26);
          backdrop-filter: blur(18px);
        }

        .infoCard small {
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .infoCard strong {
          display: block;
          margin-top: 5px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.05;
        }

        .cardIcon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #ffffff;
          font-size: 17px;
          font-weight: 950;
          background: linear-gradient(135deg, #68a6ff, #4a55ff);
          box-shadow: 0 12px 24px rgba(75, 88, 255, 0.32);
          flex: 0 0 auto;
        }

        .receiptCard {
          top: 148px;
          left: 56px;
        }

        .metricCard {
          top: 276px;
          right: 22px;
          display: block;
          min-width: 170px;
          padding: 18px 20px;
        }

        .metricCard .cardIcon {
          margin-bottom: 12px;
        }

        .metricCard strong {
          margin-top: 0;
          font-size: 42px;
          letter-spacing: -0.06em;
        }

        .metricCard small {
          margin-top: 4px;
        }

        .workflowCard {
          left: 74px;
          bottom: 92px;
        }

        @media (max-width: 1100px) {
          .experiencesPage {
            overflow-y: auto;
          }

          .hero {
            height: auto;
            max-height: none;
            min-height: auto;
            grid-template-columns: 1fr;
            padding: 48px 0 60px;
          }

          .heroText {
            text-align: center;
          }

          .heroText h1,
          .subtext {
            margin-left: auto;
            margin-right: auto;
          }

          .heroButtons,
          .socialProof {
            justify-content: center;
          }

          .heroVisual {
            height: 620px;
          }
        }

        @media (max-width: 760px) {
          .pageShell {
            width: min(100% - 28px, 1440px);
          }

          .nav {
            height: 78px;
          }

          .brand strong {
            font-size: 24px;
          }

          .brand span {
            width: 36px;
            height: 36px;
          }

          .navLinks,
          .navActions a:first-child {
            display: none;
          }

          .demoButton {
            height: 44px;
            padding: 0 16px;
            font-size: 13px;
          }

          .heroText h1 {
            font-size: 44px;
          }

          .subtext {
            font-size: 16px;
          }

          .primary,
          .secondary {
            width: 100%;
          }

          .heroVisual {
            height: 520px;
            min-height: 520px;
          }

          .blueGlow {
            right: -30px;
            top: 70px;
            width: 360px;
            height: 360px;
          }

          .heroPerson {
            right: -90px;
            max-width: none;
            height: 92%;
          }

          .receiptCard {
            top: 54px;
            left: 0;
          }

          .metricCard {
            top: 142px;
            right: 0;
            min-width: 132px;
          }

          .metricCard strong {
            font-size: 30px;
          }

          .workflowCard {
            left: 0;
            bottom: 58px;
          }

          .infoCard {
            transform: scale(0.88);
            transform-origin: left center;
          }
        }
      `}</style>
    </main>
  );
}