"use client";

import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiences-page">
      <header className="landing-nav experiences-nav">
        <a href="/" className="landing-brand" aria-label="Zyprent home">
          <span className="landing-brand-mark">Z</span>
          <strong>Zyprent</strong>
        </a>

        <nav className="landing-nav-links" aria-label="Experiences navigation">
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

      <section className="experience-hero">
        <div className="experience-hero-copy">
          <p className="hero-eyebrow">Zyprent experiences</p>

          <h1>Property work that feels connected.</h1>

          <p>
            See how residents, managers, service providers and investors move
            through one clean property workflow.
          </p>

          <div className="experience-hero-actions">
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

        <div className="hero-scene-panel" aria-hidden="true">
          <div className="scene-orb orb-one" />
          <div className="scene-orb orb-two" />

          <div className="premium-stage">
            <div className="stage-plate plate-back" />
            <div className="stage-plate plate-front" />

            <div className="dashboard-tower">
              <div className="dash-top">
                <span />
                <span />
                <span />
              </div>

              <div className="dash-card rent">
                <small>Rent paid</small>
                <strong>UGX</strong>
              </div>

              <div className="dash-card repair">
                <small>Repair</small>
                <strong>Assigned</strong>
              </div>

              <div className="dash-card returns">
                <small>Returns</small>
                <strong>Visible</strong>
              </div>

              <div className="dash-bars">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="human-card resident">
              <div className="avatar-face">
                <span className="hair" />
                <span className="eye left" />
                <span className="eye right" />
                <span className="smile" />
              </div>
              <div className="avatar-body blue" />
              <div className="mini-bubble">Receipt saved</div>
            </div>

            <div className="human-card manager">
              <div className="avatar-face manager-face">
                <span className="hair neat" />
                <span className="eye left" />
                <span className="eye right" />
                <span className="smile" />
              </div>
              <div className="avatar-body suit" />
              <div className="mini-bubble">Live dashboard</div>
            </div>

            <div className="human-card provider">
              <div className="avatar-face provider-face">
                <span className="helmet" />
                <span className="eye left" />
                <span className="eye right" />
                <span className="smile" />
              </div>
              <div className="avatar-body overall" />
              <div className="tool tool-one" />
              <div className="tool tool-two" />
              <div className="mini-bubble">On site</div>
            </div>
          </div>
        </div>
      </section>

      <section className="moment-section">
        <div className="section-heading center">
          <span>Real moments</span>
          <h2>Less explaining. More showing.</h2>
          <p>
            Zyprent turns everyday property actions into clear records everyone
            can follow.
          </p>
        </div>

        <div className="moment-grid">
          <article className="moment-card">
            <div className="moment-visual">
              <div className="phone-visual">
                <span />
                <h4>Rent payment</h4>
                <strong>UGX 1,250,000</strong>
                <p>Receipt generated</p>
              </div>

              <div className="person-visual resident-mini">
                <div className="mini-head" />
                <div className="mini-body" />
              </div>
            </div>

            <div className="moment-copy">
              <span>Resident</span>
              <h3>Rent paid without screenshots.</h3>
              <p>
                The resident sees the record immediately, and the manager sees
                it too.
              </p>
            </div>
          </article>

          <article className="moment-card">
            <div className="moment-visual">
              <div className="operations-panel">
                <div>
                  <span>Units</span>
                  <strong>42</strong>
                </div>
                <div>
                  <span>Paid</span>
                  <strong>31</strong>
                </div>
                <div>
                  <span>Open jobs</span>
                  <strong>06</strong>
                </div>
              </div>

              <div className="person-visual manager-mini">
                <div className="mini-head" />
                <div className="mini-body suit-mini" />
              </div>
            </div>

            <div className="moment-copy">
              <span>Manager</span>
              <h3>Operations stay visible.</h3>
              <p>
                Rent, units, residents, expenses and maintenance are not sitting
                in different places.
              </p>
            </div>
          </article>

          <article className="moment-card">
            <div className="moment-visual provider-scene">
              <div className="provider-worker">
                <div className="worker-head">
                  <i />
                </div>
                <div className="worker-overall" />
                <div className="worker-arm left-arm" />
                <div className="worker-arm right-arm" />
                <div className="wrench-tool" />
              </div>

              <div className="repair-ticket">
                <span>Bathroom leak</span>
                <strong>Quote approved</strong>
                <p>Provider assigned</p>
              </div>
            </div>

            <div className="moment-copy">
              <span>Service provider</span>
              <h3>Work becomes trackable.</h3>
              <p>
                Jobs move from request, to quote, to progress, to completion
                with a clean trail.
              </p>
            </div>
          </article>

          <article className="moment-card">
            <div className="moment-visual">
              <div className="return-panel">
                <span>Property return</span>
                <strong>18.4%</strong>
                <div className="return-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="person-visual investor-mini">
                <div className="mini-head" />
                <div className="mini-body investor-mini-body" />
              </div>
            </div>

            <div className="moment-copy">
              <span>Investor</span>
              <h3>Money becomes easier to follow.</h3>
              <p>
                Returns, expenses, wallets and property performance become part
                of one picture.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="storyboard-section">
        <div className="storyboard-copy">
          <span>Connected workflow</span>
          <h2>One action creates clarity for everyone else.</h2>
          <p>
            A payment, request, quote or payout is tied to the right property,
            user and record.
          </p>
        </div>

        <div className="storyboard-flow">
          <div>
            <strong>01</strong>
            <span>Resident pays</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Manager sees it</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Provider updates work</span>
          </div>
          <div>
            <strong>04</strong>
            <span>Investor views returns</span>
          </div>
        </div>
      </section>

      <section className="final-cta experiences-final">
        <span>Built for connected property work</span>
        <h2>Give every user a better way to work.</h2>
        <p>
          Managers, investors, residents and service providers all operate from
          one connected property system.
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
            radial-gradient(circle at 78% 12%, rgba(134, 198, 255, 0.2), transparent 30%),
            radial-gradient(circle at 12% 78%, rgba(51, 83, 221, 0.18), transparent 34%),
            linear-gradient(135deg, #030107 0%, #07051a 45%, #0b1026 100%);
          color: #ffffff;
          overflow-x: hidden;
        }

        .experiences-nav {
          position: relative;
          z-index: 10;
        }

        .experience-hero {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          min-height: calc(100vh - 92px);
          max-height: 760px;
          display: grid;
          grid-template-columns: 0.84fr 1.16fr;
          align-items: center;
          gap: 42px;
          padding: 26px 0 42px;
        }

        .experience-hero-copy h1 {
          margin: 0;
          max-width: 560px;
          font-size: clamp(54px, 6.4vw, 86px);
          line-height: 0.91;
          letter-spacing: -0.08em;
        }

        .experience-hero-copy p:not(.hero-eyebrow) {
          margin: 20px 0 0;
          max-width: 470px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 17px;
          line-height: 1.55;
        }

        .experience-hero-actions {
          margin-top: 26px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-scene-panel {
          position: relative;
          height: 560px;
          border-radius: 42px;
          background:
            radial-gradient(circle at 50% 35%, rgba(132, 197, 255, 0.24), transparent 42%),
            linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(180, 210, 255, 0.18);
          box-shadow: 0 34px 95px rgba(0, 0, 0, 0.34);
          overflow: hidden;
        }

        .scene-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(8px);
        }

        .orb-one {
          width: 360px;
          height: 360px;
          right: 50px;
          top: 42px;
          background: rgba(116, 172, 255, 0.18);
        }

        .orb-two {
          width: 250px;
          height: 250px;
          left: 52px;
          bottom: 58px;
          background: rgba(61, 88, 235, 0.2);
        }

        .premium-stage {
          position: absolute;
          inset: 30px;
        }

        .stage-plate {
          position: absolute;
          left: 50%;
          border-radius: 50%;
          transform: translateX(-50%) rotateX(62deg);
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(70, 104, 255, 0.12));
        }

        .plate-back {
          bottom: 68px;
          width: 420px;
          height: 170px;
          opacity: 0.62;
        }

        .plate-front {
          bottom: 48px;
          width: 520px;
          height: 190px;
          box-shadow: 0 30px 75px rgba(0, 0, 0, 0.28);
        }

        .dashboard-tower {
          position: absolute;
          left: 50%;
          top: 78px;
          width: 245px;
          height: 315px;
          transform: translateX(-50%);
          border-radius: 34px;
          background:
            linear-gradient(145deg, rgba(143, 208, 255, 0.18), rgba(58, 80, 230, 0.24)),
            rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(18px);
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
          padding: 18px;
          animation: softFloat 7s ease-in-out infinite;
        }

        @keyframes softFloat {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
        }

        .dash-top {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .dash-top span {
          width: 34px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.32);
        }

        .dash-card {
          padding: 12px;
          border-radius: 18px;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .dash-card small {
          display: block;
          color: #8fd0ff;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .dash-card strong {
          display: block;
          margin-top: 4px;
          font-size: 15px;
        }

        .dash-bars {
          height: 82px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-top: 8px;
        }

        .dash-bars i {
          flex: 1;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(180deg, #8fd0ff, #4057f2);
        }

        .dash-bars i:nth-child(1) { height: 32%; }
        .dash-bars i:nth-child(2) { height: 56%; }
        .dash-bars i:nth-child(3) { height: 76%; }
        .dash-bars i:nth-child(4) { height: 100%; }

        .human-card {
          position: absolute;
          width: 130px;
          height: 172px;
          padding: 14px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.26);
          animation: floatHuman 6s ease-in-out infinite;
        }

        @keyframes floatHuman {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .resident {
          left: 30px;
          bottom: 70px;
        }

        .manager {
          right: 34px;
          top: 56px;
          animation-delay: -1.5s;
        }

        .provider {
          right: 44px;
          bottom: 64px;
          animation-delay: -3s;
        }

        .avatar-face {
          position: relative;
          width: 58px;
          height: 58px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3c69a, #b97748);
          overflow: hidden;
        }

        .hair {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 20px;
          border-radius: 50% 50% 40% 40%;
          background: #2a1b18;
        }

        .hair.neat {
          height: 16px;
          background: #1b2136;
        }

        .helmet {
          position: absolute;
          left: 4px;
          top: 0;
          width: 50px;
          height: 24px;
          border-radius: 24px 24px 8px 8px;
          background: linear-gradient(135deg, #ffd96a, #f2a900);
        }

        .eye {
          position: absolute;
          top: 31px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #171717;
        }

        .eye.left { left: 20px; }
        .eye.right { right: 20px; }

        .smile {
          position: absolute;
          left: 23px;
          bottom: 13px;
          width: 14px;
          height: 7px;
          border-bottom: 2px solid rgba(0, 0, 0, 0.5);
          border-radius: 0 0 999px 999px;
        }

        .avatar-body {
          width: 82px;
          height: 75px;
          margin: -4px auto 0;
          border-radius: 30px 30px 18px 18px;
          box-shadow: inset 10px 0 20px rgba(255, 255, 255, 0.14);
        }

        .blue {
          background: linear-gradient(135deg, #8fd0ff, #4057f2);
        }

        .suit {
          background: linear-gradient(135deg, #ffffff, #6f7faa);
        }

        .overall {
          background:
            linear-gradient(90deg, transparent 42%, rgba(255, 255, 255, 0.34) 42%, rgba(255, 255, 255, 0.34) 58%, transparent 58%),
            linear-gradient(135deg, #ffcb62, #315cff);
        }

        .mini-bubble {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          white-space: nowrap;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
        }

        .tool {
          position: absolute;
          background: #d8eaff;
          border-radius: 999px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
        }

        .tool-one {
          right: 4px;
          top: 74px;
          width: 44px;
          height: 8px;
          transform: rotate(-34deg);
        }

        .tool-two {
          right: 16px;
          top: 88px;
          width: 28px;
          height: 8px;
          transform: rotate(40deg);
        }

        .moment-section,
        .storyboard-section,
        .experiences-final {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .moment-section {
          padding: 80px 0;
        }

        .section-heading p {
          max-width: 640px;
          margin: 14px auto 0;
          color: rgba(255, 255, 255, 0.64);
          line-height: 1.6;
        }

        .moment-grid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .moment-card {
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(180, 210, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
        }

        .moment-visual {
          height: 210px;
          position: relative;
          background:
            radial-gradient(circle at 50% 44%, rgba(143, 208, 255, 0.2), transparent 38%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(66, 91, 232, 0.12));
        }

        .phone-visual {
          position: absolute;
          left: 22px;
          top: 22px;
          width: 125px;
          height: 160px;
          padding: 18px;
          border-radius: 24px;
          background: #071027;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .phone-visual span {
          display: block;
          width: 40px;
          height: 5px;
          margin: 0 auto 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.32);
        }

        .phone-visual h4 {
          margin: 0;
          color: #8fd0ff;
          font-size: 13px;
        }

        .phone-visual strong {
          display: block;
          margin-top: 12px;
          font-size: 22px;
        }

        .phone-visual p {
          margin: 12px 0 0;
          padding: 8px;
          border-radius: 10px;
          background: rgba(74, 110, 255, 0.22);
          font-size: 12px;
        }

        .person-visual {
          position: absolute;
          right: 32px;
          bottom: 22px;
          width: 80px;
        }

        .mini-head {
          width: 52px;
          height: 52px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3c69a, #b97748);
        }

        .mini-body {
          width: 80px;
          height: 78px;
          margin-top: -4px;
          border-radius: 28px 28px 16px 16px;
          background: linear-gradient(135deg, #8fd0ff, #4057f2);
        }

        .suit-mini {
          background: linear-gradient(135deg, #ffffff, #6f7faa);
        }

        .investor-mini-body {
          background: linear-gradient(135deg, #e4f3ff, #203bba);
        }

        .operations-panel,
        .return-panel,
        .repair-ticket {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 24px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(12px);
        }

        .operations-panel {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .operations-panel span,
        .return-panel span,
        .repair-ticket span {
          display: block;
          color: #8fd0ff;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .operations-panel strong,
        .return-panel strong,
        .repair-ticket strong {
          display: block;
          margin-top: 6px;
          font-size: 20px;
        }

        .provider-scene {
          display: grid;
          place-items: center;
        }

        .provider-worker {
          position: absolute;
          left: 32px;
          bottom: 26px;
          width: 100px;
          height: 145px;
        }

        .worker-head {
          position: relative;
          width: 56px;
          height: 56px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3c69a, #b97748);
        }

        .worker-head i {
          position: absolute;
          left: 3px;
          top: -2px;
          width: 50px;
          height: 24px;
          border-radius: 24px 24px 8px 8px;
          background: linear-gradient(135deg, #ffd96a, #f2a900);
        }

        .worker-overall {
          width: 86px;
          height: 86px;
          margin: -4px auto 0;
          border-radius: 30px 30px 18px 18px;
          background:
            linear-gradient(90deg, transparent 42%, rgba(255, 255, 255, 0.34) 42%, rgba(255, 255, 255, 0.34) 58%, transparent 58%),
            linear-gradient(135deg, #ffcb62, #315cff);
        }

        .worker-arm {
          position: absolute;
          width: 46px;
          height: 12px;
          border-radius: 999px;
          background: #f0bd90;
          top: 76px;
        }

        .left-arm {
          left: 0;
          transform: rotate(28deg);
        }

        .right-arm {
          right: 0;
          transform: rotate(-34deg);
        }

        .wrench-tool {
          position: absolute;
          right: -4px;
          top: 58px;
          width: 52px;
          height: 9px;
          border-radius: 999px;
          background: #d8eaff;
          transform: rotate(-36deg);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
        }

        .repair-ticket {
          left: auto;
          right: 20px;
          width: 150px;
          bottom: 38px;
        }

        .repair-ticket p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.62);
          font-size: 13px;
        }

        .return-bars {
          display: flex;
          align-items: end;
          gap: 8px;
          height: 70px;
          margin-top: 14px;
        }

        .return-bars i {
          flex: 1;
          border-radius: 10px 10px 0 0;
          background: linear-gradient(180deg, #8fd0ff, #4057f2);
        }

        .return-bars i:nth-child(1) { height: 32%; }
        .return-bars i:nth-child(2) { height: 55%; }
        .return-bars i:nth-child(3) { height: 78%; }
        .return-bars i:nth-child(4) { height: 100%; }

        .moment-copy {
          padding: 22px;
        }

        .moment-copy span {
          color: #8fd0ff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .moment-copy h3 {
          margin: 12px 0 0;
          font-size: 24px;
          line-height: 1.04;
          letter-spacing: -0.06em;
        }

        .moment-copy p {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.62);
          line-height: 1.55;
          font-size: 14px;
        }

        .storyboard-section {
          padding: 38px;
          border-radius: 34px;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 28px;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(180, 210, 255, 0.18);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
        }

        .storyboard-copy span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .storyboard-copy h2 {
          margin: 14px 0 0;
          font-size: clamp(34px, 4vw, 56px);
          line-height: 0.96;
          letter-spacing: -0.07em;
        }

        .storyboard-copy p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.65;
        }

        .storyboard-flow {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .storyboard-flow div {
          padding: 20px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .storyboard-flow strong {
          color: #8fd0ff;
          font-size: 13px;
        }

        .storyboard-flow span {
          display: block;
          margin-top: 10px;
          font-weight: 950;
          font-size: 18px;
          line-height: 1.1;
        }

        .experiences-final {
          margin: 80px auto 60px;
        }

        @media (max-width: 1050px) {
          .experience-hero,
          .storyboard-section {
            grid-template-columns: 1fr;
            max-height: none;
          }

          .moment-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-scene-panel {
            height: 560px;
          }
        }

        @media (max-width: 680px) {
          .experience-hero {
            width: min(100% - 28px, 1120px);
            padding-top: 28px;
          }

          .experience-hero-copy h1 {
            font-size: 46px;
          }

          .hero-scene-panel {
            height: 500px;
          }

          .dashboard-tower {
            transform: translateX(-50%) scale(0.82);
          }

          .human-card {
            transform: scale(0.82);
          }

          .manager {
            right: 14px;
          }

          .resident {
            left: 12px;
          }

          .provider {
            right: 16px;
          }

          .moment-grid,
          .storyboard-flow {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}