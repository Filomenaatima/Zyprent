"use client";

import "@/styles/landing.css";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

const scenes = [
  {
    label: "Resident",
    title: "Rent paid. Receipt saved. No back and forth.",
    text: "A resident pays from their phone, sees their receipt, and tracks every rent record in one place.",
    stat: "Paid",
    tag: "Rent",
  },
  {
    label: "Manager",
    title: "The manager sees the payment instantly.",
    text: "Rent, units, requests, residents and property activity stay visible without chasing screenshots or calls.",
    stat: "Live",
    tag: "Operations",
  },
  {
    label: "Provider",
    title: "A repair request becomes a real job.",
    text: "The provider receives the task, sends a quote, updates progress and completes the work with a clear trail.",
    stat: "Assigned",
    tag: "Maintenance",
  },
  {
    label: "Investor",
    title: "The investor understands the numbers.",
    text: "Returns, expenses, wallet activity and property performance become easier to follow.",
    stat: "Visible",
    tag: "Returns",
  },
];

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
          <h1>See how property work feels when everyone is connected.</h1>
          <p>
            This is the real story Zyprent is built around: residents paying,
            managers staying in control, providers completing work, and
            investors seeing what is happening.
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

        <div className="human-scene-stage" aria-hidden="true">
          <div className="scene-glow glow-one" />
          <div className="scene-glow glow-two" />

          <div className="main-building">
            <div className="building-roof" />
            <div className="building-body">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="building-base" />
          </div>

          <div className="person resident-person">
            <div className="person-head" />
            <div className="person-body" />
            <div className="person-device">UGX</div>
          </div>

          <div className="person manager-person">
            <div className="person-head" />
            <div className="person-body suit" />
            <div className="mini-screen">
              <strong>Live</strong>
              <span />
              <span />
            </div>
          </div>

          <div className="person provider-person">
            <div className="person-head helmet" />
            <div className="person-body worker" />
            <div className="tool-box" />
          </div>

          <div className="person investor-person">
            <div className="person-head" />
            <div className="person-body investor" />
            <div className="return-card">+18%</div>
          </div>

          <div className="connection-line line-one" />
          <div className="connection-line line-two" />
          <div className="connection-line line-three" />

          <div className="floating-note note-one">
            <span>Payment received</span>
            <strong>Receipt saved</strong>
          </div>

          <div className="floating-note note-two">
            <span>Repair update</span>
            <strong>Provider assigned</strong>
          </div>

          <div className="floating-note note-three">
            <span>Investor view</span>
            <strong>Returns visible</strong>
          </div>
        </div>
      </section>

      <section className="experience-scenes">
        <div className="section-heading center">
          <span>Real moments</span>
          <h2>Less explaining. More showing.</h2>
          <p>
            Zyprent connects the everyday actions that usually happen across
            calls, chats, spreadsheets and screenshots.
          </p>
        </div>

        <div className="scene-card-grid">
          {scenes.map((scene, index) => (
            <article key={scene.label} className="scene-card">
              <div className="scene-card-visual">
                <div className={`scene-avatar avatar-${index + 1}`}>
                  <div className="avatar-head" />
                  <div className="avatar-body" />
                </div>

                <div className="scene-mini-ui">
                  <span>{scene.tag}</span>
                  <strong>{scene.stat}</strong>
                  <i />
                </div>

                <div className="scene-floor" />
              </div>

              <div className="scene-card-copy">
                <span>{scene.label}</span>
                <h3>{scene.title}</h3>
                <p>{scene.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="experience-storyline">
        <div className="storyline-copy">
          <span>Connected workflow</span>
          <h2>One action creates clarity for everyone else.</h2>
          <p>
            When a payment is made, a request is submitted, a quote is approved
            or a payout is tracked, Zyprent keeps that action tied to the right
            property, user and record.
          </p>
        </div>

        <div className="storyline-board">
          <div className="timeline-track" />
          <div className="timeline-step">
            <strong>01</strong>
            <span>Resident pays</span>
          </div>
          <div className="timeline-step">
            <strong>02</strong>
            <span>Manager sees it</span>
          </div>
          <div className="timeline-step">
            <strong>03</strong>
            <span>Provider updates work</span>
          </div>
          <div className="timeline-step">
            <strong>04</strong>
            <span>Investor views returns</span>
          </div>
        </div>
      </section>

      <section className="experience-showcase">
        <div className="showcase-panel resident-panel">
          <div className="showcase-phone">
            <div className="phone-top" />
            <h4>Rent payment</h4>
            <strong>UGX 1,250,000</strong>
            <span>Receipt generated</span>
          </div>

          <div className="happy-resident">
            <div className="happy-head" />
            <div className="happy-body" />
          </div>
        </div>

        <div className="showcase-panel provider-panel">
          <div className="repair-card">
            <span>Bathroom leak</span>
            <strong>Quote approved</strong>
            <p>Provider on site</p>
          </div>

          <div className="repair-visual">
            <div className="wrench" />
            <div className="spark spark-one" />
            <div className="spark spark-two" />
          </div>
        </div>

        <div className="showcase-panel investor-panel">
          <div className="chart-card">
            <span>Property return</span>
            <strong>18.4%</strong>
            <div className="mini-bars">
              <i />
              <i />
              <i />
              <i />
            </div>
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
            radial-gradient(circle at 78% 12%, rgba(134, 198, 255, 0.22), transparent 30%),
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
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: center;
          gap: 44px;
          padding: 42px 0 70px;
        }

        .experience-hero-copy h1 {
          margin: 0;
          max-width: 660px;
          font-size: clamp(48px, 6vw, 88px);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        .experience-hero-copy p:not(.hero-eyebrow) {
          margin: 24px 0 0;
          max-width: 560px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 18px;
          line-height: 1.65;
        }

        .experience-hero-actions {
          margin-top: 30px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .human-scene-stage {
          position: relative;
          min-height: 620px;
          border-radius: 42px;
          background:
            radial-gradient(circle at 50% 42%, rgba(111, 169, 255, 0.22), transparent 44%),
            linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(180, 210, 255, 0.18);
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.34);
          overflow: hidden;
        }

        .scene-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(10px);
        }

        .glow-one {
          width: 420px;
          height: 420px;
          background: rgba(92, 132, 255, 0.18);
          right: 40px;
          top: 50px;
        }

        .glow-two {
          width: 280px;
          height: 280px;
          background: rgba(143, 208, 255, 0.16);
          left: 40px;
          bottom: 70px;
        }

        .main-building {
          position: absolute;
          left: 50%;
          top: 46%;
          width: 230px;
          height: 330px;
          transform: translate(-50%, -50%);
          animation: softFloat 7s ease-in-out infinite;
        }

        @keyframes softFloat {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-12px);
          }
        }

        .building-roof {
          width: 110px;
          height: 90px;
          margin: 0 auto;
          clip-path: polygon(50% 0, 100% 100%, 0 100%);
          background: linear-gradient(155deg, #8fd0ff, #3657f3 62%, #071657);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.32);
        }

        .building-body {
          height: 210px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 22px;
          border-radius: 26px 26px 12px 12px;
          background: linear-gradient(155deg, #7dbdff, #3150e6 55%, #0a1450);
          box-shadow:
            inset 14px 0 26px rgba(255, 255, 255, 0.14),
            0 30px 70px rgba(0, 0, 0, 0.38);
        }

        .building-body span {
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.28);
        }

        .building-base {
          width: 310px;
          height: 70px;
          margin-left: -40px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.24), rgba(73, 105, 255, 0.18));
          border: 1px solid rgba(255, 255, 255, 0.18);
          transform: rotateX(62deg);
        }

        .person {
          position: absolute;
          width: 92px;
          height: 140px;
          animation: personFloat 6s ease-in-out infinite;
        }

        @keyframes personFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .person-head {
          width: 52px;
          height: 52px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0c8a0, #bf7b4b);
          box-shadow: inset 8px 0 16px rgba(255, 255, 255, 0.18);
        }

        .person-head.helmet {
          background: linear-gradient(135deg, #ffe082, #f2a900);
        }

        .person-body {
          width: 72px;
          height: 78px;
          margin: -4px auto 0;
          border-radius: 28px 28px 18px 18px;
          background: linear-gradient(135deg, #8fd0ff, #3b58ef);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28);
        }

        .person-body.suit {
          background: linear-gradient(135deg, #ffffff, #5e6d9e);
        }

        .person-body.worker {
          background: linear-gradient(135deg, #ffcf6a, #3364ff);
        }

        .person-body.investor {
          background: linear-gradient(135deg, #e4f3ff, #2b49c7);
        }

        .resident-person {
          left: 48px;
          bottom: 122px;
        }

        .manager-person {
          right: 70px;
          top: 92px;
          animation-delay: -1s;
        }

        .provider-person {
          right: 58px;
          bottom: 124px;
          animation-delay: -2s;
        }

        .investor-person {
          left: 72px;
          top: 114px;
          animation-delay: -3s;
        }

        .person-device,
        .mini-screen,
        .tool-box,
        .return-card {
          position: absolute;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(12px);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.22);
        }

        .person-device {
          right: -16px;
          top: 56px;
          padding: 10px;
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
        }

        .mini-screen {
          left: -40px;
          top: 70px;
          width: 78px;
          padding: 10px;
        }

        .mini-screen strong {
          display: block;
          color: #8fd0ff;
          font-size: 11px;
        }

        .mini-screen span {
          display: block;
          height: 5px;
          margin-top: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.42);
        }

        .tool-box {
          right: -20px;
          bottom: 18px;
          width: 46px;
          height: 34px;
          background: linear-gradient(135deg, #ffcf6a, #a86800);
        }

        .return-card {
          right: -26px;
          top: 60px;
          padding: 10px 12px;
          color: #ffffff;
          font-weight: 950;
        }

        .connection-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(143, 208, 255, 0.7), transparent);
          transform-origin: center;
          opacity: 0.6;
        }

        .line-one {
          left: 140px;
          top: 250px;
          width: 210px;
          transform: rotate(20deg);
        }

        .line-two {
          right: 150px;
          top: 250px;
          width: 210px;
          transform: rotate(-24deg);
        }

        .line-three {
          left: 190px;
          bottom: 210px;
          width: 280px;
          transform: rotate(-8deg);
        }

        .floating-note {
          position: absolute;
          min-width: 160px;
          padding: 14px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26);
        }

        .floating-note span {
          display: block;
          color: #8fd0ff;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .floating-note strong {
          display: block;
          margin-top: 5px;
          font-size: 14px;
        }

        .note-one {
          left: 42px;
          bottom: 42px;
        }

        .note-two {
          right: 40px;
          bottom: 42px;
        }

        .note-three {
          left: 50%;
          top: 48px;
          transform: translateX(-50%);
        }

        .experience-scenes,
        .experience-storyline,
        .experience-showcase,
        .experiences-final {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
        }

        .experience-scenes {
          padding: 40px 0 80px;
        }

        .section-heading p {
          max-width: 680px;
          margin: 14px auto 0;
          color: rgba(255, 255, 255, 0.64);
          line-height: 1.6;
        }

        .scene-card-grid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .scene-card {
          min-height: 360px;
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(180, 210, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
        }

        .scene-card-visual {
          height: 180px;
          position: relative;
          background:
            radial-gradient(circle at 50% 44%, rgba(143, 208, 255, 0.22), transparent 38%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(66, 91, 232, 0.12));
        }

        .scene-avatar {
          position: absolute;
          left: 50%;
          bottom: 34px;
          width: 76px;
          transform: translateX(-50%);
        }

        .avatar-head {
          width: 48px;
          height: 48px;
          margin: 0 auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4c99f, #b67446);
        }

        .avatar-body {
          width: 76px;
          height: 70px;
          margin-top: -4px;
          border-radius: 28px 28px 14px 14px;
          background: linear-gradient(135deg, #8fd0ff, #3e50e8);
        }

        .avatar-2 .avatar-body {
          background: linear-gradient(135deg, #ffffff, #6170a6);
        }

        .avatar-3 .avatar-head {
          background: linear-gradient(135deg, #ffe082, #f2a900);
        }

        .avatar-3 .avatar-body {
          background: linear-gradient(135deg, #ffcf6a, #325cff);
        }

        .avatar-4 .avatar-body {
          background: linear-gradient(135deg, #e4f3ff, #203bba);
        }

        .scene-mini-ui {
          position: absolute;
          right: 14px;
          top: 14px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(12px);
        }

        .scene-mini-ui span,
        .scene-mini-ui strong {
          display: block;
        }

        .scene-mini-ui span {
          color: #8fd0ff;
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .scene-mini-ui strong {
          margin-top: 3px;
          font-size: 13px;
        }

        .scene-mini-ui i {
          display: block;
          width: 46px;
          height: 5px;
          margin-top: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.48);
        }

        .scene-floor {
          position: absolute;
          left: 50%;
          bottom: 18px;
          width: 130px;
          height: 34px;
          border-radius: 50%;
          transform: translateX(-50%) rotateX(60deg);
          background: rgba(255, 255, 255, 0.16);
        }

        .scene-card-copy {
          padding: 22px;
        }

        .scene-card-copy span {
          color: #8fd0ff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .scene-card-copy h3 {
          margin: 12px 0 0;
          font-size: 22px;
          line-height: 1.05;
          letter-spacing: -0.05em;
        }

        .scene-card-copy p {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.62);
          line-height: 1.55;
          font-size: 14px;
        }

        .experience-storyline {
          padding: 36px;
          border-radius: 34px;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 28px;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(180, 210, 255, 0.18);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
        }

        .storyline-copy span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .storyline-copy h2 {
          margin: 14px 0 0;
          font-size: clamp(34px, 4vw, 58px);
          line-height: 0.96;
          letter-spacing: -0.07em;
        }

        .storyline-copy p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.65;
        }

        .storyline-board {
          position: relative;
          min-height: 360px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .timeline-track {
          position: absolute;
          left: 50%;
          top: 8%;
          width: 2px;
          height: 84%;
          background: linear-gradient(transparent, rgba(143, 208, 255, 0.56), transparent);
        }

        .timeline-step {
          padding: 20px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          align-self: center;
        }

        .timeline-step strong {
          color: #8fd0ff;
          font-size: 13px;
        }

        .timeline-step span {
          display: block;
          margin-top: 10px;
          font-weight: 950;
          font-size: 18px;
          line-height: 1.1;
        }

        .experience-showcase {
          padding: 80px 0;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 16px;
        }

        .showcase-panel {
          min-height: 300px;
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(180, 210, 255, 0.18);
          background:
            radial-gradient(circle at 50% 30%, rgba(143, 208, 255, 0.18), transparent 40%),
            rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.26);
        }

        .showcase-phone {
          position: absolute;
          left: 34px;
          top: 34px;
          width: 190px;
          height: 250px;
          padding: 22px;
          border-radius: 30px;
          background: #071027;
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
        }

        .phone-top {
          width: 56px;
          height: 7px;
          border-radius: 999px;
          margin: 0 auto 24px;
          background: rgba(255, 255, 255, 0.3);
        }

        .showcase-phone h4 {
          margin: 0;
          color: #8fd0ff;
        }

        .showcase-phone strong {
          display: block;
          margin-top: 18px;
          font-size: 28px;
        }

        .showcase-phone span {
          display: block;
          margin-top: 14px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(74, 110, 255, 0.22);
        }

        .happy-resident {
          position: absolute;
          right: 48px;
          bottom: 34px;
          width: 110px;
        }

        .happy-head {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          margin: 0 auto;
          background: linear-gradient(135deg, #f4c99f, #b67446);
        }

        .happy-body {
          width: 110px;
          height: 110px;
          border-radius: 40px 40px 22px 22px;
          margin-top: -6px;
          background: linear-gradient(135deg, #8fd0ff, #3e50e8);
        }

        .repair-card,
        .chart-card {
          position: absolute;
          left: 28px;
          right: 28px;
          bottom: 28px;
          padding: 22px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(14px);
        }

        .repair-card span,
        .chart-card span {
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .repair-card strong,
        .chart-card strong {
          display: block;
          margin-top: 10px;
          font-size: 24px;
        }

        .repair-card p {
          color: rgba(255, 255, 255, 0.62);
        }

        .repair-visual {
          position: absolute;
          top: 48px;
          left: 50%;
          width: 140px;
          height: 120px;
          transform: translateX(-50%);
        }

        .wrench {
          width: 110px;
          height: 24px;
          border-radius: 999px;
          background: linear-gradient(135deg, #dceeff, #6685ff);
          transform: rotate(-34deg);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
        }

        .spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8fd0ff;
          box-shadow: 0 0 22px #8fd0ff;
        }

        .spark-one {
          right: 18px;
          top: 10px;
        }

        .spark-two {
          left: 10px;
          bottom: 26px;
        }

        .mini-bars {
          display: flex;
          align-items: end;
          gap: 10px;
          height: 90px;
          margin-top: 18px;
        }

        .mini-bars i {
          flex: 1;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(180deg, #8fd0ff, #3e50e8);
        }

        .mini-bars i:nth-child(1) {
          height: 35%;
        }

        .mini-bars i:nth-child(2) {
          height: 58%;
        }

        .mini-bars i:nth-child(3) {
          height: 78%;
        }

        .mini-bars i:nth-child(4) {
          height: 100%;
        }

        .experiences-final {
          margin-bottom: 60px;
        }

        @media (max-width: 1050px) {
          .experience-hero,
          .experience-storyline,
          .experience-showcase {
            grid-template-columns: 1fr;
          }

          .scene-card-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .human-scene-stage {
            min-height: 560px;
          }
        }

        @media (max-width: 680px) {
          .experience-hero {
            width: min(100% - 28px, 1120px);
            padding-top: 28px;
          }

          .experience-hero-copy h1 {
            font-size: 48px;
          }

          .human-scene-stage {
            min-height: 520px;
          }

          .scene-card-grid,
          .storyline-board {
            grid-template-columns: 1fr;
          }

          .timeline-track,
          .connection-line,
          .floating-note {
            display: none;
          }

          .main-building {
            transform: translate(-50%, -50%) scale(0.82);
          }

          .resident-person {
            left: 24px;
          }

          .manager-person {
            right: 22px;
          }

          .provider-person {
            right: 26px;
          }

          .investor-person {
            left: 30px;
          }
        }
      `}</style>
    </main>
  );
}