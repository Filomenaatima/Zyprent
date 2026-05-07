"use client";

export default function ExperiencesPage() {
  return (
    <main className="experiencesPage">
      <div className="experiencesContainer">
        <nav className="experiencesNav">
          <div className="brand">
            <div className="brandLogo">Z</div>
            <span>Zyprent</span>
          </div>

          <div className="navLinks">
            <a href="/">Home</a>
            <a href="/">Solution</a>
            <a href="/">Platform</a>
            <a href="/experiences">Experiences</a>
            <a href="/">FAQ</a>
          </div>

          <div className="navActions">
            <a href="/login" className="signInBtn">
              Sign In
            </a>

            <button className="demoBtn">
              Request Demo
            </button>
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
                From residents paying rent to managers approving work,
                Zyprent keeps every property experience clear,
                connected and easy to follow.
              </p>

              <div className="heroActions">
                <button className="primaryBtn">
                  Request Demo
                </button>

                <button className="secondaryBtn">
                  Explore Platform
                </button>
              </div>

              <div className="heroUsers">
                <div className="heroAvatars">
                  <span />
                  <span />
                  <span />
                </div>

                <div>
                  <strong>Built for every role</strong>

                  <p>
                    Residents · Managers · Providers · Investors
                  </p>
                </div>
              </div>
            </div>

            <div className="heroRight">
              <div className="heroImageCard">
                <div className="heroGlow" />

                <img
                  src="/experiences/hero-person.png"
                  alt="Professional property manager"
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
            radial-gradient(
              circle at top right,
              rgba(67, 97, 255, 0.22),
              transparent 30%
            ),
            #040816;
          color: white;
          overflow: hidden;
        }

        .experiencesContainer {
          width: min(1400px, 92%);
          margin: 0 auto;
        }

        .experiencesNav {
          height: 92px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 34px;
          font-weight: 700;
        }

        .brandLogo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: white;
          color: #040816;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        .navLinks a {
          color: rgba(255,255,255,.78);
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
        }

        .navActions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .signInBtn {
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        .demoBtn {
          height: 52px;
          padding: 0 26px;
          border: none;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #6ea8ff,
              #4c58ff
            );
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            0 16px 40px rgba(76,88,255,.35);
        }

        .experiencesHero {
          min-height: calc(100vh - 92px);
          display: flex;
          align-items: center;
          padding: 40px 0;
        }

        .heroContent {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 44px;
          align-items: center;
        }

        .heroEyebrow {
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #73a8ff;
          font-weight: 700;
        }

        .heroLeft h1 {
          font-size: clamp(64px, 5vw, 92px);
          line-height: .92;
          letter-spacing: -.06em;
          margin: 22px 0;
          max-width: 620px;
        }

        .heroLeft p {
          max-width: 560px;
          font-size: 22px;
          line-height: 1.65;
          color: rgba(255,255,255,.72);
        }

        .heroActions {
          display: flex;
          gap: 16px;
          margin-top: 36px;
        }

        .primaryBtn,
        .secondaryBtn {
          height: 58px;
          padding: 0 30px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          font-size: 17px;
          font-weight: 700;
          transition: .25s ease;
        }

        .primaryBtn {
          background:
            linear-gradient(
              135deg,
              #6aa4ff,
              #4b57ff
            );
          color: white;
          box-shadow:
            0 18px 40px rgba(77,108,255,.35);
        }

        .secondaryBtn {
          background: transparent;
          border: 1px solid rgba(255,255,255,.12);
          color: white;
        }

        .heroUsers {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 34px;
        }

        .heroUsers strong {
          display: block;
          font-size: 16px;
        }

        .heroUsers p {
          margin: 4px 0 0;
          font-size: 15px;
        }

        .heroAvatars {
          display: flex;
        }

        .heroAvatars span {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid #040816;
          margin-left: -10px;
        }

        .heroAvatars span:nth-child(1) {
          background: #d8a06b;
        }

        .heroAvatars span:nth-child(2) {
          background: #dfe5f6;
        }

        .heroAvatars span:nth-child(3) {
          background:
            linear-gradient(
              135deg,
              #7db0ff,
              #4b57ff
            );
        }

        .heroRight {
          position: relative;
        }

        .heroImageCard {
          position: relative;
          height: 720px;
          border-radius: 42px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at top right,
              rgba(86,124,255,.28),
              transparent 32%
            ),
            linear-gradient(
              180deg,
              rgba(14,22,52,.98),
              rgba(10,15,35,.98)
            );
          border: 1px solid rgba(255,255,255,.08);
        }

        .heroGlow {
          position: absolute;
          width: 540px;
          height: 540px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(89,130,255,.48),
              transparent 70%
            );
          top: 90px;
          right: 40px;
          filter: blur(20px);
        }

        .heroPersonImage {
          position: absolute;
          right: -20px;
          bottom: 0;
          width: 88%;
          height: auto;
          object-fit: contain;
          z-index: 2;
        }

        .floatingCard {
          position: absolute;
          z-index: 3;
          backdrop-filter: blur(14px);
          background: rgba(18,28,58,.74);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 24px;
          padding: 18px 22px;
          box-shadow:
            0 20px 40px rgba(0,0,0,.24);
        }

        .floatingCard span {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,.72);
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .floatingCard strong {
          display: block;
          margin-top: 6px;
          font-size: 30px;
          color: white;
        }

        .topCard {
          top: 120px;
          left: 42px;
        }

        .rightCard {
          top: 200px;
          right: 40px;
        }

        .bottomCard {
          left: 50px;
          bottom: 90px;
        }

        @media (max-width: 1100px) {
          .heroContent {
            grid-template-columns: 1fr;
          }

          .heroLeft {
            text-align: center;
          }

          .heroLeft p {
            margin-inline: auto;
          }

          .heroActions,
          .heroUsers {
            justify-content: center;
          }

          .heroImageCard {
            height: 620px;
          }

          .heroLeft h1 {
            font-size: 72px;
          }
        }

        @media (max-width: 768px) {
          .navLinks {
            display: none;
          }

          .heroLeft h1 {
            font-size: 54px;
          }

          .heroLeft p {
            font-size: 18px;
          }

          .heroActions {
            flex-direction: column;
          }

          .heroImageCard {
            height: 520px;
          }

          .heroPersonImage {
            width: 100%;
            right: -20px;
          }

          .floatingCard {
            transform: scale(.9);
          }
        }
      `}</style>
    </main>
  );
}