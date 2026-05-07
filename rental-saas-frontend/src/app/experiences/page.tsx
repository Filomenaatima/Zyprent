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
              Property work
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
            <div className="visualGlow" />

            <img
              src="/experiences/hero-person.png"
              alt="Professional using Zyprent workspace"
              className="heroPerson"
            />

            <div className="floatingCard cardOne">
              <small>Resident payment</small>
              <strong>Receipt saved</strong>
            </div>

            <div className="floatingCard cardTwo">
              <strong>550+</strong>
              <small>Actions tracked</small>
            </div>

            <div className="floatingCard cardThree">
              <small>Team workflow</small>
              <strong>Manager approved</strong>
            </div>

            <div className="floatingIcon iconOne">✓</div>
            <div className="floatingIcon iconTwo">💬</div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .experiencesPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 82% 4%, rgba(70, 104, 255, 0.22), transparent 28%),
            linear-gradient(135deg, #030712 0%, #050817 48%, #071227 100%);
          color: #ffffff;
          overflow-x: hidden;
        }

        .pageShell {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
        }

        .nav {
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          text-decoration: none;
        }

        .brand span {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #ffffff;
          color: #040816;
          font-weight: 950;
          font-size: 20px;
        }

        .brand strong {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .navLinks {
          display: flex;
          gap: 32px;
        }

        .navLinks a,
        .navActions a {
          color: rgba(255, 255, 255, 0.82);
          text-decoration: none;
          font-size: 15px;
          font-weight: 850;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 18px;
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
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.32);
        }

        .hero {
          height: calc(100vh - 88px);
          min-height: 520px;
          max-height: 610px;
          display: grid;
          grid-template-columns: 0.88fr 1.12fr;
          gap: 48px;
          align-items: center;
          padding: 18px 0 26px;
        }

        .eyebrow {
          margin: 0;
          color: #6eadff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .heroText h1 {
          margin: 18px 0 18px;
          max-width: 560px;
          font-size: clamp(46px, 4.4vw, 68px);
          line-height: 0.94;
          letter-spacing: -0.065em;
        }

        .subtext {
          max-width: 500px;
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 18px;
          line-height: 1.55;
        }

        .heroButtons {
          display: flex;
          gap: 14px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .primary,
        .secondary {
          height: 54px;
          padding: 0 26px;
          border-radius: 16px;
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
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.34);
        }

        .secondary {
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.02);
        }

        .socialProof {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatars {
          display: flex;
        }

        .avatars span {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin-left: -9px;
          border: 3px solid #040816;
        }

        .avatars span:first-child {
          margin-left: 0;
          background: #d8a06b;
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
          font-size: 14px;
          font-weight: 950;
        }

        .socialProof small {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
        }

        .heroVisual {
          position: relative;
          height: 500px;
          border-radius: 34px;
          overflow: hidden;
          background:
            radial-gradient(circle at 63% 42%, rgba(63, 122, 255, 0.48), transparent 34%),
            radial-gradient(circle at 98% 0%, rgba(103, 161, 255, 0.22), transparent 36%),
            linear-gradient(135deg, #061024 0%, #0a1836 48%, #101944 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.36);
        }

        .visualGlow {
          position: absolute;
          right: 54px;
          top: 48px;
          width: 370px;
          height: 370px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(92, 140, 255, 0.5), transparent 68%);
          filter: blur(18px);
          z-index: 1;
        }

        .heroPerson {
          position: absolute;
          right: -8px;
          bottom: -4px;
          width: 76%;
          height: 94%;
          object-fit: cover;
          object-position: center bottom;
          z-index: 2;
          border-bottom-right-radius: 34px;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 12%, black 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 12%, black 100%);
        }

        .heroVisual::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            linear-gradient(to right, rgba(6, 16, 36, 0.92) 0%, rgba(6, 16, 36, 0.45) 30%, transparent 55%),
            linear-gradient(to top, rgba(6, 16, 36, 0.24), transparent 42%);
        }

        .floatingCard,
        .floatingIcon {
          position: absolute;
          z-index: 4;
        }

        .floatingCard {
          padding: 11px 14px;
          border-radius: 16px;
          background: rgba(16, 31, 68, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
        }

        .floatingCard small {
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .floatingCard strong {
          display: block;
          margin-top: 5px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 950;
          line-height: 1.05;
        }

        .cardOne {
          left: 34px;
          top: 104px;
        }

        .cardTwo {
          right: 42px;
          top: 160px;
          min-width: 112px;
        }

        .cardTwo strong {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .cardTwo small {
          margin-top: 2px;
        }

        .cardThree {
          left: 92px;
          bottom: 76px;
        }

        .floatingIcon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 16px;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.24);
        }

        .iconOne {
          right: 138px;
          top: 86px;
          background: #f4c300;
          color: #071027;
        }

        .iconTwo {
          right: 72px;
          bottom: 110px;
          background: #1f6fff;
        }

        @media (max-width: 1100px) {
          .hero {
            height: auto;
            max-height: none;
            grid-template-columns: 1fr;
            padding: 44px 0 60px;
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
        }

        @media (max-width: 760px) {
          .pageShell {
            width: min(100% - 28px, 1240px);
          }

          .nav {
            height: 78px;
          }

          .brand strong {
            font-size: 24px;
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
            height: 430px;
            border-radius: 28px;
          }

          .heroPerson {
            width: 96%;
            right: -80px;
          }

          .cardOne {
            left: 18px;
            top: 52px;
          }

          .cardTwo {
            right: 16px;
            top: 114px;
          }

          .cardThree {
            left: 18px;
            bottom: 48px;
          }
        }
      `}</style>
    </main>
  );
}