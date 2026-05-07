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
        <div className="controlFrame">
          <div className="controlVisual">
            <div className="softOrb one" />
            <div className="softOrb two" />

            <div className="phoneDevice">
              <div className="phoneNotch" />
              <div className="phoneStatus">
                <span>9:41</span>
                <strong>Zyprent</strong>
              </div>

              <div className="phoneWelcome">Property workspace</div>

              <div className="phoneBalance">
                <small>Collected this month</small>
                <strong>UGX 48.2M</strong>
                <p>Rent, service requests and investor records in sync.</p>
              </div>

              <div className="phoneStats">
                <div>
                  <small>Units</small>
                  <strong>42</strong>
                </div>
                <div>
                  <small>Paid</small>
                  <strong>31</strong>
                </div>
              </div>

              <div className="phoneActivity">
                <p>
                  <span>Rent payment</span>
                  <strong>Saved</strong>
                </p>
                <p>
                  <span>Maintenance</span>
                  <strong>Assigned</strong>
                </p>
                <p>
                  <span>Investor report</span>
                  <strong>Ready</strong>
                </p>
              </div>
            </div>

            <div className="propertyCard">
              <div className="cardTop">
                <span>Zyprent Wallet</span>
                <strong>UGX</strong>
              </div>
              <h3>Property wallet</h3>
              <p>Collections, expenses and owner reports tracked clearly.</p>
              <div className="cardLines">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className="controlCopy">
            <p className="sectionEyebrow">Connected property control</p>

            <h2>
              Control every property experience from one connected workspace.
            </h2>

            <p>
              Rent payments, maintenance updates, approvals, resident records and
              investor activity stay organized in one place, so every role knows
              what is happening.
            </p>

            <div className="controlButtons">
              <a
                href={DEMO_FORM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="blueBtn"
              >
                Request Demo
              </a>
              <a href="/login" className="outlineBtn">
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
                <small>Residents, managers, providers and investors connected.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="providerImageSection">
        <div className="providerImageFrame">
          <img
            src="/experiences/service-provider-section-v2.png"
            alt="Service provider experience on Zyprent"
            className="providerImage"
          />
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
          background: #f5f8ff;
          color: #071027;
          padding: 52px 0;
        }

        .controlFrame {
          width: min(1320px, calc(100% - 70px));
          min-height: calc(100vh - 104px);
          margin: 0 auto;
          border-radius: 34px;
          background:
            radial-gradient(circle at 16% 78%, rgba(152, 195, 255, 0.28), transparent 32%),
            radial-gradient(circle at 44% 34%, rgba(198, 222, 255, 0.5), transparent 26%),
            #ffffff;
          box-shadow: 0 28px 80px rgba(41, 67, 110, 0.1);
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 64px;
          padding: 44px 76px;
          overflow: hidden;
        }

        .controlVisual {
          position: relative;
          min-height: 560px;
        }

        .softOrb {
          position: absolute;
          border-radius: 50%;
          filter: blur(8px);
          opacity: 0.9;
        }

        .softOrb.one {
          width: 54px;
          height: 54px;
          background: #c8dcff;
          right: 88px;
          top: 96px;
        }

        .softOrb.two {
          width: 36px;
          height: 36px;
          background: #9fc5ff;
          left: 90px;
          bottom: 98px;
        }

        .phoneDevice {
          position: absolute;
          left: 118px;
          top: 0;
          width: 292px;
          height: 540px;
          border-radius: 44px;
          background: linear-gradient(180deg, #ffffff, #edf4ff);
          border: 9px solid #071027;
          box-shadow: 0 34px 90px rgba(23, 48, 88, 0.16);
          padding: 24px 18px;
          overflow: hidden;
          transform: rotate(-5deg);
        }

        .phoneNotch {
          width: 86px;
          height: 22px;
          border-radius: 999px;
          background: #071027;
          margin: 0 auto 16px;
        }

        .phoneStatus {
          display: flex;
          justify-content: space-between;
          color: #071027;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .phoneWelcome {
          font-size: 12px;
          color: #7d8ba4;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .phoneBalance {
          border-radius: 26px;
          background: linear-gradient(135deg, #091a3d, #1d56d9);
          color: white;
          padding: 20px;
          box-shadow: 0 22px 50px rgba(43, 101, 255, 0.24);
        }

        .phoneBalance small,
        .phoneBalance p {
          margin: 0;
          display: block;
          color: rgba(255, 255, 255, 0.72);
          font-size: 10px;
          font-weight: 800;
        }

        .phoneBalance strong {
          display: block;
          margin: 8px 0;
          font-size: 30px;
          letter-spacing: -0.05em;
        }

        .phoneStats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .phoneStats div,
        .phoneActivity {
          background: white;
          border-radius: 18px;
          box-shadow: 0 14px 34px rgba(30, 60, 105, 0.08);
        }

        .phoneStats div {
          padding: 14px;
        }

        .phoneStats small,
        .phoneActivity span {
          display: block;
          color: #7d8ba4;
          font-size: 10px;
          font-weight: 850;
        }

        .phoneStats strong {
          display: block;
          margin-top: 5px;
          color: #071027;
          font-size: 23px;
        }

        .phoneActivity {
          margin-top: 14px;
          padding: 12px 14px;
        }

        .phoneActivity p {
          display: flex;
          justify-content: space-between;
          margin: 0;
          padding: 10px 0;
          border-bottom: 1px solid #edf2f8;
        }

        .phoneActivity p:last-child {
          border-bottom: none;
        }

        .phoneActivity strong {
          font-size: 10px;
          color: #071027;
        }

        .propertyCard {
          position: absolute;
          left: 340px;
          top: 154px;
          width: 250px;
          height: 158px;
          border-radius: 28px;
          padding: 22px;
          color: white;
          background:
            radial-gradient(circle at 82% 20%, rgba(160, 196, 255, 0.32), transparent 28%),
            linear-gradient(135deg, #06142f, #173f9e 64%, #76b6ff);
          box-shadow: 0 34px 84px rgba(33, 83, 181, 0.25);
          transform: rotate(-5deg);
          z-index: 5;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.76);
          font-weight: 900;
        }

        .propertyCard h3 {
          margin: 28px 0 8px;
          font-size: 23px;
          line-height: 1.05;
        }

        .propertyCard p {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.72);
        }

        .cardLines {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .cardLines span {
          height: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.35);
        }

        .cardLines span:nth-child(1) {
          width: 46px;
        }

        .cardLines span:nth-child(2) {
          width: 72px;
        }

        .cardLines span:nth-child(3) {
          width: 34px;
        }

        .controlCopy h2 {
          margin: 18px 0 24px;
          max-width: 620px;
          font-size: clamp(44px, 3.7vw, 66px);
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
          color: #718098;
          font-size: 18px;
          line-height: 1.65;
        }

        .controlButtons {
          display: flex;
          gap: 16px;
          margin-top: 34px;
        }

        .blueBtn,
        .outlineBtn {
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

        .blueBtn {
          background: linear-gradient(135deg, #69a7ff, #4a55ff);
          color: white;
          box-shadow: 0 18px 36px rgba(74, 85, 255, 0.24);
        }

        .outlineBtn {
          background: white;
          color: #071027;
          border: 1px solid #dfe7f3;
        }

        .controlStat {
          margin-top: 44px;
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
          background: #071027;
          border: 3px solid white;
          font-size: 12px;
          font-weight: 950;
        }

        .statAvatars span:first-child {
          margin-left: 0;
          background: #7ebaff;
        }

        .statAvatars span:nth-child(2) {
          background: #4a55ff;
        }

        .statAvatars span:nth-child(3) {
          background: #071027;
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
          max-width: 280px;
          color: #718098;
          margin-top: 4px;
        }

        .providerImageSection {
          min-height: 100vh;
          background: #eef3ff;
          padding: 34px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .providerImageFrame {
          width: min(1480px, calc(100% - 70px));
          height: calc(100vh - 68px);
          min-height: 650px;
          border-radius: 34px;
          overflow: hidden;
          background: white;
          box-shadow: 0 28px 80px rgba(41, 67, 110, 0.12);
          border: 1px solid rgba(105, 167, 255, 0.2);
        }

        .providerImage {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
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

          .controlFrame {
            grid-template-columns: 1fr;
          }

          .controlCopy {
            order: -1;
          }

          .providerImageFrame {
            height: auto;
            min-height: 0;
          }

          .providerImage {
            height: auto;
            object-fit: contain;
          }
        }

        @media (max-width: 760px) {
          .shell,
          .controlFrame,
          .providerImageFrame {
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
          .blueBtn,
          .outlineBtn {
            width: 100%;
          }

          .controlSection,
          .providerImageSection {
            padding: 46px 0;
          }

          .controlFrame {
            padding: 42px 24px;
          }

          .controlVisual {
            min-height: 520px;
            transform: scale(0.82);
            transform-origin: top center;
          }
        }
      `}</style>
    </main>
  );
}