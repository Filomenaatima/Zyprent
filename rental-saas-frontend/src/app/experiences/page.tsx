"use client";

import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiencePage">
      <header className="landing-nav xpNav">
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

      <section className="xpHero">
        <div className="xpHeroText">
          <p>ZYPreNT EXPERIENCES</p>
          <h1>Every property user gets a clearer workspace.</h1>
          <span>
            A visual look at how Zyprent keeps managers, residents, service
            providers and investors moving through one connected system.
          </span>

          <div className="xpHeroActions">
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

        <div className="xpHeroVisual">
          <div className="productWindow">
            <div className="windowTop">
              <i />
              <i />
              <i />
              <strong>Zyprent Workspace</strong>
            </div>

            <div className="windowBody">
              <aside className="sideRail">
                <span className="active" />
                <span />
                <span />
                <span />
                <span />
              </aside>

              <div className="mainPanel">
                <div className="bluePanel">
                  <small>Live portfolio</small>
                  <strong>UGX 48.2M</strong>
                  <em>Collected this month</em>
                </div>

                <div className="miniStats">
                  <div>
                    <small>Units</small>
                    <strong>42</strong>
                  </div>
                  <div>
                    <small>Open jobs</small>
                    <strong>06</strong>
                  </div>
                  <div>
                    <small>Returns</small>
                    <strong>18.4%</strong>
                  </div>
                </div>

                <div className="activityList">
                  <div>
                    <span>Rent payment</span>
                    <b>Receipt saved</b>
                  </div>
                  <div>
                    <span>Maintenance</span>
                    <b>Provider assigned</b>
                  </div>
                  <div>
                    <span>Investor report</span>
                    <b>Ready</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="floatingCard one">
            <small>Resident</small>
            <strong>Paid</strong>
          </div>

          <div className="floatingCard two">
            <small>Provider</small>
            <strong>Assigned</strong>
          </div>
        </div>
      </section>

      <section className="xpRoles">
        <div className="xpSectionHead">
          <p>ROLE-BASED VIEWS</p>
          <h2>Four experiences. One operating system.</h2>
        </div>

        <div className="roleGrid">
          <article>
            <div className="rolePreview residentPreview">
              <div className="phoneMock">
                <span />
                <strong>Rent paid</strong>
                <small>Receipt generated</small>
              </div>
            </div>
            <p>Resident</p>
            <h3>Payments and requests feel simple.</h3>
          </article>

          <article>
            <div className="rolePreview managerPreview">
              <div className="dashMock">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <p>Manager</p>
            <h3>Property operations stay visible.</h3>
          </article>

          <article>
            <div className="rolePreview providerPreview">
              <div className="jobMock">
                <span>Job request</span>
                <strong>Quote approved</strong>
                <small>Provider on site</small>
              </div>
            </div>
            <p>Service provider</p>
            <h3>Work orders become trackable.</h3>
          </article>

          <article>
            <div className="rolePreview investorPreview">
              <div className="chartMock">
                <strong>18.4%</strong>
                <div>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
            <p>Investor</p>
            <h3>Returns and expenses become clear.</h3>
          </article>
        </div>
      </section>

      <section className="xpShowcase">
        <div>
          <p>CONNECTED WORKFLOW</p>
          <h2>One action updates the whole record.</h2>
          <span>
            Payments, maintenance, approvals and reports are tied to the right
            property, user and timeline.
          </span>
        </div>

        <div className="workflowList">
          <section>
            <b>01</b>
            <strong>Resident pays rent</strong>
          </section>
          <section>
            <b>02</b>
            <strong>Manager sees the record</strong>
          </section>
          <section>
            <b>03</b>
            <strong>Provider completes work</strong>
          </section>
          <section>
            <b>04</b>
            <strong>Investor reviews performance</strong>
          </section>
        </div>
      </section>

      <section className="xpFinal">
        <p>BUILT FOR CONNECTED PROPERTY WORK</p>
        <h2>Give every user a clearer way to work.</h2>
        <span>
          Zyprent brings people, payments, maintenance and property financials
          into one clean workspace.
        </span>

        <div>
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
        .experiencePage {
          min-height: 100vh;
          background: #050612;
          color: #ffffff;
          overflow-x: hidden;
        }

        .xpNav {
          position: relative;
          z-index: 10;
        }

        .xpHero {
          width: min(1120px, calc(100% - 40px));
          height: calc(100vh - 92px);
          max-height: 610px;
          min-height: 520px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 42px;
          align-items: center;
          padding: 16px 0 28px;
        }

        .xpHeroText p,
        .xpSectionHead p,
        .xpShowcase p,
        .xpFinal p {
          margin: 0;
          color: #8fd0ff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .xpHeroText h1 {
          margin: 14px 0 0;
          font-size: clamp(38px, 4.9vw, 62px);
          line-height: 0.96;
          letter-spacing: -0.07em;
          max-width: 560px;
        }

        .xpHeroText span {
          display: block;
          margin-top: 18px;
          max-width: 500px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 16px;
          line-height: 1.55;
        }

        .xpHeroActions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .xpHeroVisual {
          position: relative;
          min-height: 455px;
          border-radius: 34px;
          background:
            radial-gradient(circle at 70% 12%, rgba(143, 208, 255, 0.22), transparent 32%),
            linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035));
          border: 1px solid rgba(205, 225, 255, 0.16);
          box-shadow: 0 34px 90px rgba(0, 0, 0, 0.34);
          overflow: hidden;
          padding: 26px;
        }

        .productWindow {
          height: 100%;
          border-radius: 26px;
          overflow: hidden;
          background: rgba(6, 10, 30, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.36);
        }

        .windowTop {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
        }

        .windowTop i {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.34);
        }

        .windowTop strong {
          margin-left: auto;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.58);
        }

        .windowBody {
          display: grid;
          grid-template-columns: 120px 1fr;
          min-height: 381px;
        }

        .sideRail {
          padding: 22px 18px;
          background: rgba(255, 255, 255, 0.035);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sideRail span {
          display: block;
          height: 12px;
          border-radius: 999px;
          margin-bottom: 17px;
          background: rgba(255, 255, 255, 0.18);
        }

        .sideRail span.active {
          width: 78px;
          background: #6aa9ff;
        }

        .mainPanel {
          padding: 22px;
        }

        .bluePanel {
          min-height: 126px;
          border-radius: 24px;
          padding: 22px;
          background: linear-gradient(135deg, #0f1e5a, #315bea);
        }

        .bluePanel small,
        .miniStats small {
          color: rgba(255, 255, 255, 0.66);
          font-weight: 800;
        }

        .bluePanel strong {
          display: block;
          margin-top: 7px;
          font-size: 34px;
          letter-spacing: -0.06em;
        }

        .bluePanel em {
          display: block;
          margin-top: 5px;
          color: rgba(255, 255, 255, 0.68);
          font-style: normal;
        }

        .miniStats {
          margin-top: 13px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .miniStats div {
          padding: 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .miniStats strong {
          display: block;
          margin-top: 5px;
          font-size: 22px;
        }

        .activityList {
          margin-top: 13px;
          padding: 6px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .activityList div {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .activityList div:last-child {
          border-bottom: 0;
        }

        .activityList span {
          color: rgba(255, 255, 255, 0.62);
        }

        .floatingCard {
          position: absolute;
          padding: 12px 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.24);
        }

        .floatingCard small {
          display: block;
          color: #8fd0ff;
          font-weight: 950;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .floatingCard strong {
          display: block;
          margin-top: 4px;
        }

        .floatingCard.one {
          left: 10px;
          bottom: 42px;
        }

        .floatingCard.two {
          right: 14px;
          top: 76px;
        }

        .xpRoles,
        .xpShowcase,
        .xpFinal {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .xpRoles {
          padding: 58px 0 72px;
        }

        .xpSectionHead {
          text-align: center;
          max-width: 660px;
          margin: 0 auto;
        }

        .xpSectionHead h2,
        .xpShowcase h2,
        .xpFinal h2 {
          margin: 10px 0 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1;
          letter-spacing: -0.065em;
        }

        .roleGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .roleGrid article {
          min-height: 290px;
          padding: 16px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(205, 225, 255, 0.14);
        }

        .rolePreview {
          height: 142px;
          border-radius: 22px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 60% 22%, rgba(143, 208, 255, 0.22), transparent 36%),
            rgba(255, 255, 255, 0.065);
        }

        .phoneMock,
        .jobMock,
        .chartMock,
        .dashMock {
          position: absolute;
          inset: 18px;
          border-radius: 18px;
          padding: 16px;
          background: rgba(5, 8, 28, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .phoneMock span {
          display: block;
          width: 38px;
          height: 5px;
          margin: 0 auto 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
        }

        .phoneMock strong,
        .jobMock strong,
        .chartMock strong {
          display: block;
          color: #fff;
          font-size: 18px;
          line-height: 1.05;
        }

        .phoneMock small,
        .jobMock small {
          display: block;
          margin-top: 9px;
          color: #8fd0ff;
        }

        .dashMock {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .dashMock i {
          border-radius: 12px;
          background: rgba(106, 169, 255, 0.28);
        }

        .jobMock span,
        .chartMock > span {
          color: #8fd0ff;
        }

        .chartMock div {
          height: 64px;
          display: flex;
          align-items: end;
          gap: 7px;
          margin-top: 14px;
        }

        .chartMock i {
          flex: 1;
          border-radius: 9px 9px 0 0;
          background: linear-gradient(180deg, #8fd0ff, #4057f2);
        }

        .chartMock i:nth-child(1) { height: 34%; }
        .chartMock i:nth-child(2) { height: 55%; }
        .chartMock i:nth-child(3) { height: 76%; }
        .chartMock i:nth-child(4) { height: 100%; }

        .roleGrid article p {
          margin: 0;
          color: #8fd0ff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .roleGrid article h3 {
          margin: 10px 0 0;
          font-size: 21px;
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .xpShowcase {
          padding: 34px;
          border-radius: 32px;
          display: grid;
          grid-template-columns: 0.86fr 1.14fr;
          gap: 28px;
          align-items: center;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(205, 225, 255, 0.14);
        }

        .xpShowcase span,
        .xpFinal span {
          display: block;
          margin-top: 14px;
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.6;
        }

        .workflowList {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .workflowList section {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.11);
        }

        .workflowList b {
          display: block;
          color: #8fd0ff;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .workflowList strong {
          font-size: 17px;
        }

        .xpFinal {
          margin: 64px auto 56px;
          padding: 54px 28px;
          text-align: center;
          border-radius: 32px;
          background:
            radial-gradient(circle at 50% 0%, rgba(89, 112, 255, 0.18), transparent 40%),
            rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(205, 225, 255, 0.14);
        }

        .xpFinal span {
          max-width: 620px;
          margin-left: auto;
          margin-right: auto;
        }

        .xpFinal div {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        @media (max-width: 980px) {
          .xpHero,
          .xpShowcase {
            height: auto;
            max-height: none;
            grid-template-columns: 1fr;
          }

          .roleGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .xpHero {
            width: min(100% - 28px, 1120px);
            min-height: auto;
          }

          .xpHeroText h1 {
            font-size: 42px;
          }

          .xpHeroVisual {
            min-height: auto;
            padding: 16px;
          }

          .windowBody {
            grid-template-columns: 1fr;
          }

          .sideRail {
            display: none;
          }

          .miniStats,
          .roleGrid,
          .workflowList {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}