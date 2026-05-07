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
              Residents, managers, providers and investors stay connected
              through one clean property workflow.
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

          <div className="visual">
            <div className="glow" />

            <img
              src="/experiences/hero-person.png"
              alt="Professional using Zyprent workspace"
              className="person"
            />

            <div className="card receipt">
              <i>▣</i>
              <div>
                <small>Resident payment</small>
                <strong>Receipt saved</strong>
              </div>
            </div>

            <div className="card metric">
              <i>▥</i>
              <strong>550+</strong>
              <small>Actions tracked</small>
            </div>

            <div className="card workflow">
              <i>♙</i>
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
          width: 100%;
          height: 100vh;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(circle at 78% 48%, rgba(34, 96, 255, 0.48), transparent 30%),
            radial-gradient(circle at 92% 12%, rgba(105, 167, 255, 0.18), transparent 24%),
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
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #fff;
          text-decoration: none;
        }

        .brand span {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #fff;
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
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          color: #fff !important;
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.34);
        }

        .hero {
          height: calc(100vh - 86px);
          display: grid;
          grid-template-columns: 0.88fr 1.12fr;
          align-items: center;
          gap: 32px;
          position: relative;
        }

        .copy {
          position: relative;
          z-index: 10;
          padding-bottom: 20px;
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
          color: #fff;
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          box-shadow: 0 18px 42px rgba(75, 88, 255, 0.36);
        }

        .secondary {
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.02);
        }

        .proof {
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
        }

        .glow {
          position: absolute;
          right: 42px;
          top: 72px;
          width: 560px;
          height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(65, 116, 255, 0.78), transparent 68%);
          filter: blur(18px);
          z-index: 1;
        }

        .person {
          position: absolute;
          right: -30px;
          bottom: 0;
          height: 96%;
          max-width: 86%;
          width: auto;
          object-fit: contain;
          object-position: bottom right;
          z-index: 2;
          filter: drop-shadow(0 32px 72px rgba(0, 0, 0, 0.34));
          -webkit-mask-image:
            linear-gradient(to right, transparent 0%, #000 12%, #000 100%),
            linear-gradient(to top, transparent 0%, #000 8%, #000 100%);
          mask-image:
            linear-gradient(to right, transparent 0%, #000 12%, #000 100%),
            linear-gradient(to top, transparent 0%, #000 8%, #000 100%);
        }

        .visual::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background:
            linear-gradient(to right, #050817 0%, rgba(5, 8, 23, 0.72) 20%, transparent 46%),
            linear-gradient(to top, #050817 0%, rgba(5, 8, 23, 0.35) 12%, transparent 32%);
        }

        .card {
          position: absolute;
          z-index: 5;
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

        .card i {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #fff;
          font-style: normal;
          font-size: 17px;
          font-weight: 950;
          background: linear-gradient(135deg, #68a6ff, #4a55ff);
          box-shadow: 0 12px 24px rgba(75, 88, 255, 0.32);
          flex: 0 0 auto;
        }

        .card small {
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .card strong {
          display: block;
          margin-top: 5px;
          color: #fff;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.05;
        }

        .receipt {
          top: 132px;
          left: 56px;
        }

        .metric {
          top: 250px;
          right: 8px;
          display: block;
          min-width: 168px;
          padding: 18px 20px;
        }

        .metric i {
          margin-bottom: 12px;
        }

        .metric strong {
          margin-top: 0;
          font-size: 42px;
          letter-spacing: -0.06em;
        }

        .workflow {
          left: 72px;
          bottom: 84px;
        }

        @media (max-width: 1100px) {
          .page {
            height: auto;
            overflow-y: auto;
          }

          .shell {
            height: auto;
          }

          .hero {
            height: auto;
            grid-template-columns: 1fr;
            padding: 48px 0 60px;
          }

          .copy {
            text-align: center;
          }

          h1,
          .sub {
            margin-left: auto;
            margin-right: auto;
          }

          .buttons,
          .proof {
            justify-content: center;
          }

          .visual {
            height: 620px;
          }
        }

        @media (max-width: 760px) {
          .shell {
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

          .links,
          .actions a:first-child {
            display: none;
          }

          .demo {
            height: 44px;
            padding: 0 16px;
            font-size: 13px;
          }

          h1 {
            font-size: 44px;
          }

          .sub {
            font-size: 16px;
          }

          .buttons {
            flex-direction: column;
          }

          .primary,
          .secondary {
            width: 100%;
          }

          .visual {
            height: 520px;
            min-height: 520px;
          }

          .glow {
            right: -30px;
            top: 70px;
            width: 360px;
            height: 360px;
          }

          .person {
            right: -90px;
            height: 92%;
            max-width: none;
          }

          .receipt {
            top: 54px;
            left: 0;
          }

          .metric {
            top: 142px;
            right: 0;
            min-width: 132px;
          }

          .metric strong {
            font-size: 30px;
          }

          .workflow {
            left: 0;
            bottom: 58px;
          }

          .card {
            transform: scale(0.88);
            transform-origin: left center;
          }
        }
      `}</style>
    </main>
  );
}