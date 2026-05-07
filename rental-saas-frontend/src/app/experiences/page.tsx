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
          <p className="eyebrow">Welcome to Zyprent Experiences</p>

          <h1>
            Property work, built around real people.
          </h1>

          <span>
            From residents paying rent to managers approving work, Zyprent keeps
            every property experience clear, connected and easy to follow.
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

            <a href="/login" className="landing-btn secondary large">
              Explore Platform
            </a>
          </div>

          <div className="trustRow">
            <div className="avatarStack">
              <i />
              <i />
              <i />
            </div>
            <p>
              <strong>Built for every role</strong>
              <small>Residents · Managers · Providers · Investors</small>
            </p>
          </div>
        </div>

        <div className="xpHeroVisual" aria-hidden="true">
          <div className="heroGlow" />

          <div className="personPhotoCard">
            <div className="personFigure">
              <div className="personHead">
                <span className="hair" />
                <span className="ear left" />
                <span className="ear right" />
                <span className="eye leftEye" />
                <span className="eye rightEye" />
                <span className="nose" />
                <span className="smile" />
              </div>

              <div className="shirt">
                <span className="collar leftCollar" />
                <span className="collar rightCollar" />
                <span className="tie" />
              </div>

              <div className="laptop">
                <span />
              </div>
            </div>
          </div>

          <div className="floatingMetric topMetric">
            <small>Resident payment</small>
            <strong>Receipt saved</strong>
          </div>

          <div className="floatingMetric rightMetric">
            <strong>550+</strong>
            <small>Actions tracked</small>
          </div>

          <div className="floatingMetric bottomMetric">
            <small>Team workflow</small>
            <strong>Manager approved</strong>
          </div>

          <div className="miniIcon iconOne">₦</div>
          <div className="miniIcon iconTwo">✓</div>
          <div className="miniIcon iconThree">💬</div>
        </div>
      </section>

      <section className="brandStrip">
        <span>Trusted workflow for property teams</span>
        <div>
          <strong>Payments</strong>
          <strong>Maintenance</strong>
          <strong>Residents</strong>
          <strong>Investors</strong>
          <strong>Reporting</strong>
        </div>
      </section>

      <section className="placeholderNext">
        <p>Next section will be rebuilt after the hero is approved.</p>
      </section>

      <style jsx>{`
        .experiencePage {
          min-height: 100vh;
          background: #050814;
          color: #ffffff;
          overflow-x: hidden;
        }

        .xpNav {
          position: relative;
          z-index: 20;
        }

        .xpHero {
          width: min(1120px, calc(100% - 40px));
          height: calc(100vh - 92px);
          max-height: 640px;
          min-height: 540px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          align-items: center;
          gap: 42px;
          padding: 18px 0 28px;
        }

        .eyebrow {
          margin: 0;
          color: #74b7ff;
          font-size: 13px;
          font-weight: 850;
        }

        .xpHeroText h1 {
          margin: 18px 0 0;
          max-width: 530px;
          font-size: clamp(42px, 5vw, 66px);
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .xpHeroText span {
          display: block;
          max-width: 500px;
          margin-top: 20px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 16px;
          line-height: 1.55;
        }

        .xpHeroActions {
          margin-top: 26px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .trustRow {
          margin-top: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatarStack {
          display: flex;
        }

        .avatarStack i {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          margin-left: -8px;
          border: 2px solid #050814;
          background: linear-gradient(135deg, #8fd0ff, #3657f3);
        }

        .avatarStack i:first-child {
          margin-left: 0;
          background: linear-gradient(135deg, #f0b981, #6c3e26);
        }

        .avatarStack i:nth-child(2) {
          background: linear-gradient(135deg, #ffffff, #8fa2d9);
        }

        .trustRow p {
          margin: 0;
        }

        .trustRow strong,
        .trustRow small {
          display: block;
        }

        .trustRow strong {
          font-size: 13px;
        }

        .trustRow small {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
        }

        .xpHeroVisual {
          position: relative;
          height: 500px;
          border-radius: 34px;
          overflow: hidden;
          background:
            radial-gradient(circle at 58% 38%, rgba(55, 117, 255, 0.36), transparent 36%),
            radial-gradient(circle at 84% 8%, rgba(143, 208, 255, 0.18), transparent 28%),
            linear-gradient(145deg, #081225, #031026 52%, #061a35);
          border: 1px solid rgba(180, 210, 255, 0.14);
          box-shadow: 0 34px 95px rgba(0, 0, 0, 0.36);
        }

        .heroGlow {
          position: absolute;
          right: 70px;
          top: 45px;
          width: 310px;
          height: 310px;
          border-radius: 50%;
          background: rgba(67, 134, 255, 0.25);
          filter: blur(8px);
        }

        .personPhotoCard {
          position: absolute;
          right: 72px;
          bottom: 0;
          width: 290px;
          height: 435px;
        }

        .personFigure {
          position: absolute;
          inset: 0;
        }

        .personHead {
          position: absolute;
          top: 28px;
          left: 50%;
          width: 112px;
          height: 124px;
          transform: translateX(-50%);
          border-radius: 42% 42% 46% 46%;
          background: linear-gradient(135deg, #8a4f2d, #4b2417);
          box-shadow: inset 14px 0 22px rgba(255, 255, 255, 0.1);
        }

        .hair {
          position: absolute;
          left: 6px;
          top: -2px;
          width: 100px;
          height: 34px;
          border-radius: 40px 40px 22px 22px;
          background: #17110f;
        }

        .ear {
          position: absolute;
          top: 58px;
          width: 16px;
          height: 24px;
          border-radius: 50%;
          background: #62331f;
        }

        .ear.left {
          left: -8px;
        }

        .ear.right {
          right: -8px;
        }

        .eye {
          position: absolute;
          top: 62px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #111;
        }

        .leftEye {
          left: 34px;
        }

        .rightEye {
          right: 34px;
        }

        .nose {
          position: absolute;
          left: 52px;
          top: 70px;
          width: 9px;
          height: 18px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.16);
        }

        .smile {
          position: absolute;
          left: 43px;
          bottom: 28px;
          width: 28px;
          height: 13px;
          border-bottom: 3px solid rgba(0, 0, 0, 0.55);
          border-radius: 0 0 999px 999px;
        }

        .shirt {
          position: absolute;
          left: 50%;
          bottom: 36px;
          width: 210px;
          height: 275px;
          transform: translateX(-50%);
          border-radius: 64px 64px 18px 18px;
          background: linear-gradient(135deg, #e8f3ff, #8ca8d6);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.35);
        }

        .collar {
          position: absolute;
          top: 0;
          width: 58px;
          height: 50px;
          background: #ffffff;
          clip-path: polygon(0 0, 100% 0, 50% 100%);
        }

        .leftCollar {
          left: 52px;
        }

        .rightCollar {
          right: 52px;
        }

        .tie {
          position: absolute;
          top: 32px;
          left: 50%;
          width: 22px;
          height: 150px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, #0b1229, #152454);
          clip-path: polygon(50% 0, 100% 16%, 70% 100%, 30% 100%, 0 16%);
        }

        .laptop {
          position: absolute;
          left: 0;
          bottom: 58px;
          width: 178px;
          height: 112px;
          border-radius: 14px;
          background: linear-gradient(135deg, #d7dce5, #8f9aad);
          transform: rotate(-4deg);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.3);
        }

        .laptop span {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 38px;
          height: 38px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.32);
        }

        .floatingMetric {
          position: absolute;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(8, 20, 52, 0.72);
          border: 1px solid rgba(143, 208, 255, 0.2);
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
        }

        .floatingMetric small {
          display: block;
          color: #8fd0ff;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .floatingMetric strong {
          display: block;
          margin-top: 5px;
          font-size: 16px;
        }

        .topMetric {
          left: 40px;
          top: 188px;
        }

        .rightMetric {
          right: 36px;
          top: 164px;
        }

        .rightMetric strong {
          font-size: 31px;
        }

        .bottomMetric {
          left: 98px;
          bottom: 70px;
        }

        .miniIcon {
          position: absolute;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-weight: 950;
          background: #f5c400;
          color: #071027;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
        }

        .iconOne {
          top: 60px;
          left: 145px;
          transform: rotate(-18deg);
        }

        .iconTwo {
          right: 84px;
          top: 100px;
        }

        .iconThree {
          right: 52px;
          bottom: 120px;
          background: #0a60ff;
          color: #fff;
        }

        .brandStrip {
          background: #03040a;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 28px 20px;
          text-align: center;
        }

        .brandStrip span {
          display: block;
          margin-bottom: 18px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          font-weight: 800;
        }

        .brandStrip div {
          width: min(900px, 100%);
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          color: rgba(255, 255, 255, 0.76);
        }

        .placeholderNext {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          padding: 80px 0;
          color: rgba(255, 255, 255, 0.58);
          text-align: center;
        }

        @media (max-width: 980px) {
          .xpHero {
            height: auto;
            max-height: none;
            grid-template-columns: 1fr;
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
            height: 470px;
          }

          .personPhotoCard {
            right: 14px;
            transform: scale(0.85);
            transform-origin: bottom right;
          }

          .floatingMetric {
            transform: scale(0.84);
          }

          .topMetric {
            left: 16px;
          }

          .bottomMetric {
            left: 18px;
          }

          .brandStrip div {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}