"use client";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiencePage">
      <div className="heroBackground" />

      <div className="pageShell">
        <nav className="topbar">
          <a href="/" className="logo">
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
            <a href="/login" className="signin">
              Sign In
            </a>

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

        <section className="heroSection">
          <div className="heroContent">
            <p className="eyebrow">
              Welcome to Zyprent Experiences
            </p>

            <h1>
              Property work,
              <br />
              built around
              <br />
              real people.
            </h1>

            <p className="description">
              Residents, managers, providers and investors stay connected
              through one clean property workflow.
            </p>

            <div className="heroButtons">
              <a
                href={DEMO_FORM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="primaryBtn"
              >
                Request Demo
              </a>

              <a href="/login" className="secondaryBtn">
                Explore Platform
              </a>
            </div>

            <div className="roleRow">
              <div className="avatars">
                <span className="avatar orange">R</span>
                <span className="avatar white">M</span>
                <span className="avatar blue">I</span>
              </div>

              <div className="roleText">
                <strong>Built for every role</strong>
                <small>
                  Residents · Managers · Providers · Investors
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .experiencePage {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: #040816;
          color: white;
        }

        .heroBackground {
          position: absolute;
          inset: 0;
          background-image: url("/experiences/hero-reference.png");
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .heroBackground::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to right,
              rgba(4, 8, 22, 0.92) 0%,
              rgba(4, 8, 22, 0.82) 28%,
              rgba(4, 8, 22, 0.55) 42%,
              rgba(4, 8, 22, 0.1) 62%,
              rgba(4, 8, 22, 0.05) 100%
            );
        }

        .pageShell {
          position: relative;
          z-index: 2;
          width: min(1440px, calc(100% - 64px));
          margin: 0 auto;
        }

        .topbar {
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: white;
        }

        .logo span {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: white;
          color: #040816;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 22px;
        }

        .logo strong {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .navLinks {
          display: flex;
          gap: 34px;
        }

        .navLinks a,
        .signin {
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          font-size: 15px;
          font-weight: 800;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .demoButton {
          height: 50px;
          padding: 0 28px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: white;
          font-size: 15px;
          font-weight: 900;
          background: linear-gradient(135deg,#70a8ff,#5560ff);
          box-shadow: 0 18px 40px rgba(79,95,255,0.35);
        }

        .heroSection {
          min-height: calc(100vh - 92px);
          display: flex;
          align-items: center;
        }

        .heroContent {
          width: 100%;
          max-width: 620px;
          padding: 40px 0 80px;
        }

        .eyebrow {
          margin: 0 0 24px;
          color: #69a7ff;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }

        h1 {
          margin: 0;
          font-size: clamp(58px, 5vw, 86px);
          line-height: 0.95;
          letter-spacing: -0.08em;
          font-weight: 900;
        }

        .description {
          margin-top: 30px;
          max-width: 560px;
          color: rgba(255,255,255,0.78);
          font-size: 19px;
          line-height: 1.6;
        }

        .heroButtons {
          display: flex;
          gap: 18px;
          margin-top: 34px;
        }

        .primaryBtn,
        .secondaryBtn {
          height: 58px;
          padding: 0 32px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 16px;
          font-weight: 900;
        }

        .primaryBtn {
          color: white;
          background: linear-gradient(135deg,#70a8ff,#5560ff);
          box-shadow: 0 20px 44px rgba(79,95,255,0.34);
        }

        .secondaryBtn {
          color: white;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.03);
        }

        .roleRow {
          margin-top: 36px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatars {
          display: flex;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          margin-left: -10px;
          border: 3px solid #040816;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 12px 26px rgba(0,0,0,0.24);
        }

        .avatar:first-child {
          margin-left: 0;
        }

        .orange {
          background: linear-gradient(135deg,#efbb7d,#bb7541);
          color: #0b1020;
        }

        .white {
          background: linear-gradient(135deg,#ffffff,#d9e1f0);
          color: #0b1020;
        }

        .blue {
          background: linear-gradient(135deg,#7eb5ff,#4f5fff);
        }

        .roleText strong {
          display: block;
          font-size: 15px;
          font-weight: 900;
        }

        .roleText small {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,0.68);
          font-size: 14px;
        }

        @media (max-width: 1100px) {
          .navLinks {
            display: none;
          }

          .heroBackground {
            background-position: 72% top;
          }

          h1 {
            font-size: 58px;
          }
        }

        @media (max-width: 760px) {
          .pageShell {
            width: calc(100% - 28px);
          }

          .topbar {
            height: 78px;
          }

          .logo strong {
            font-size: 24px;
          }

          .logo span {
            width: 38px;
            height: 38px;
          }

          .signin {
            display: none;
          }

          .demoButton {
            height: 44px;
            padding: 0 18px;
            font-size: 13px;
          }

          .heroSection {
            align-items: flex-start;
            padding-top: 36px;
          }

          .heroContent {
            padding-bottom: 120px;
          }

          .heroBackground {
            background-position: 78% top;
          }

          h1 {
            font-size: 48px;
          }

          .description {
            font-size: 16px;
          }

          .heroButtons {
            flex-direction: column;
          }

          .primaryBtn,
          .secondaryBtn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}