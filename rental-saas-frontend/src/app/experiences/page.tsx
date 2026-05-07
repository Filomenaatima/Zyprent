"use client";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiencesPage">
      <div className="experiencesContainer">
        <nav className="experiencesNav">
          <a href="/" className="brand">
            <div className="brandLogo">Z</div>
            <span>Zyprent</span>
          </a>

          <div className="navLinks">
            <a href="/">Home</a>
            <a href="/#solution">Solution</a>
            <a href="/#platform">Platform</a>
            <a href="/experiences">Experiences</a>
            <a href="/#faq">FAQ</a>
          </div>

          <div className="navActions">
            <a href="/login" className="signInBtn">
              Sign In
            </a>

            <a
              href={DEMO_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="demoBtn"
            >
              Request Demo
            </a>
          </div>
        </nav>

        <section className="experiencesHero">
          <div className="heroContent">
            <div className="heroLeft">
              <span className="heroEyebrow">
                Welcome to Zyprent Experiences
              </span>

              <h1>
                Property work,
                <br />
                built around real
                <br />
                people.
              </h1>

              <p>
                From residents paying rent to managers approving work, Zyprent
                keeps every property experience clear, connected and easy to
                follow.
              </p>

              <div className="heroActions">
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

              <div className="heroUsers">
                <div className="heroAvatars">
                  <span />
                  <span />
                  <span />
                </div>

                <div>
                  <strong>Built for every role</strong>
                  <p>Residents · Managers · Providers · Investors</p>
                </div>
              </div>
            </div>

            <div className="heroRight">
              <div className="heroImageCard">
                <div className="heroGlow" />

                <img
                  src="/experiences/hero-person.png"
                  alt="Professional property manager holding a laptop"
                  className="heroPersonImage"
                />

                <div className="floatingCard topCard">
                  <span>Resident payment</span>
                  <strong>Receipt saved</strong>
                </div>

                <div className="floatingCard rightCard">
                  <strong>550+</strong>
                  <span>Actions tracked</span>
                </div>

                <div className="floatingCard bottomCard">
                  <span>Team workflow</span>
                  <strong>Manager approved</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .experiencesPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 0%, rgba(65, 98, 255, 0.2), transparent 31%),
            radial-gradient(circle at 72% 44%, rgba(44, 122, 255, 0.13), transparent 34%),
            #040816;
          color: #ffffff;
          overflow-x: hidden;
        }

        .experiencesContainer {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
        }

        .experiencesNav {
          height: 90px;
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
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .brandLogo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #ffffff;
          color: #040816;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: 0;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .navLinks a,
        .signInBtn {
          color: rgba(255, 255, 255, 0.82);
          text-decoration: none;
          font-size: 15px;
          font-weight: 800;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .demoBtn {
          height: 50px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: linear-gradient(135deg, #68a6ff, #4a55ff);
          color: #ffffff;
          text-decoration: none;
          font-size: 15px;
          font-weight: 900;
          box-shadow: 0 16px 40px rgba(75, 88, 255, 0.32);
        }

        .experiencesHero {
          height: calc(100vh - 90px);
          max-height: 600px;
          min-height: 500px;
          display: flex;
          align-items: center;
          padding: 18px 0 22px;
        }

        .heroContent {
          width: 100%;
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 44px;
          align-items: center;
        }

        .heroEyebrow {
          display: inline-block;
          color: #68a6ff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .heroLeft h1 {
          max-width: 560px;
          margin: 18px 0 16px;
          font-size: clamp(46px, 4.2vw, 68px);
          line-height: 0.94;
          letter-spacing: -0.065em;
        }

        .heroLeft p {
          max-width: 510px;
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 18px;
          line-height: 1.5;
        }

        .heroActions {
          display: flex;
          gap: 14px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .primaryBtn,
        .secondaryBtn {
          height: 54px;
          padding: 0 26px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 16px;
          font-weight: 900;
        }

        .primaryBtn {
          color: #ffffff;
          background: linear-gradient(135deg, #68a6ff, #4a55ff);
          box-shadow: 0 16px 38px rgba(75, 88, 255, 0.34);
        }

        .secondaryBtn {
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.02);
        }

        .heroUsers {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 28px;
        }

        .heroAvatars {
          display: flex;
          align-items: center;
        }

        .heroAvatars span {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid #040816;
          margin-left: -9px;
        }

        .heroAvatars span:first-child {
          margin-left: 0;
          background: #d8a06b;
        }

        .heroAvatars span:nth-child(2) {
          background: #e2e7f7;
        }

        .heroAvatars span:nth-child(3) {
          background: linear-gradient(135deg, #7fb3ff, #4a55ff);
        }

        .heroUsers strong {
          display: block;
          font-size: 14px;
          font-weight: 950;
        }

        .heroUsers p {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          line-height: 1.2;
        }

        .heroImageCard {
          position: relative;
          height: 500px;
          border-radius: 34px;
          overflow: hidden;
          background:
            radial-gradient(circle at 68% 31%, rgba(64, 119, 255, 0.42), transparent 34%),
            radial-gradient(circle at 8% 84%, rgba(28, 69, 145, 0.24), transparent 34%),
            linear-gradient(135deg, #061024 0%, #0b1b3d 48%, #111a42 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 86px rgba(0, 0, 0, 0.35);
        }

        .heroGlow {
          position: absolute;
          width: 390px;
          height: 390px;
          top: 58px;
          right: 68px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(84, 132, 255, 0.5), transparent 68%);
          filter: blur(18px);
        }

        .heroPersonImage {
          position: absolute;
          right: 24px;
          bottom: 0;
          width: 68%;
          height: auto;
          max-height: 95%;
          object-fit: contain;
          z-index: 2;
        }

        .floatingCard {
          position: absolute;
          z-index: 3;
          padding: 12px 15px;
          border-radius: 16px;
          background: rgba(18, 30, 62, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(14px);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);
        }

        .floatingCard span {
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

        .rightCard strong {
          margin-top: 0;
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .rightCard span {
          margin-top: 2px;
        }

        .topCard {
          top: 86px;
          left: 34px;
        }

        .rightCard {
          top: 135px;
          right: 34px;
        }

        .bottomCard {
          left: 60px;
          bottom: 70px;
        }

        @media (max-width: 1100px) {
          .experiencesPage {
            overflow-y: auto;
          }

          .experiencesHero {
            height: auto;
            max-height: none;
            min-height: auto;
            padding: 44px 0 60px;
          }

          .heroContent {
            grid-template-columns: 1fr;
          }

          .heroLeft {
            text-align: center;
          }

          .heroLeft h1,
          .heroLeft p {
            margin-left: auto;
            margin-right: auto;
          }

          .heroActions,
          .heroUsers {
            justify-content: center;
          }

          .heroImageCard {
            height: 520px;
          }
        }

        @media (max-width: 760px) {
          .experiencesContainer {
            width: min(100% - 28px, 1240px);
          }

          .experiencesNav {
            height: 78px;
          }

          .brand {
            font-size: 24px;
          }

          .brandLogo {
            width: 36px;
            height: 36px;
          }

          .navLinks {
            display: none;
          }

          .navActions {
            gap: 10px;
          }

          .signInBtn {
            display: none;
          }

          .demoBtn {
            height: 44px;
            padding: 0 16px;
            border-radius: 13px;
            font-size: 13px;
          }

          .heroLeft h1 {
            font-size: 44px;
          }

          .heroLeft p {
            font-size: 16px;
          }

          .primaryBtn,
          .secondaryBtn {
            width: 100%;
          }

          .heroUsers {
            align-items: flex-start;
          }

          .heroImageCard {
            height: 430px;
            border-radius: 28px;
          }

          .heroPersonImage {
            width: 86%;
            right: -36px;
          }

          .topCard {
            top: 46px;
            left: 18px;
          }

          .rightCard {
            top: 116px;
            right: 16px;
          }

          .bottomCard {
            left: 18px;
            bottom: 42px;
          }

          .floatingCard {
            transform: scale(0.86);
            transform-origin: left center;
          }
        }
      `}</style>
    </main>
  );
}