"use client";

const DEMO_FORM_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSec8xBGT1T70S0YZJCp-7h6lAt1XrcfKYHmTdbtzl5WgrujGw/viewform";

export default function ExperiencesPage() {
  return (
    <main className="experiencePage">
      <div className="heroImage" />

      <div className="clickLayer">
        <a href="/" className="logoLink" aria-label="Go to homepage" />
        <a href="/" className="homeLink">Home</a>
        <a href="/#solution" className="solutionLink">Solution</a>
        <a href="/#platform" className="platformLink">Platform</a>
        <a href="/experiences" className="experiencesLink">Experiences</a>
        <a href="/#faq" className="faqLink">FAQ</a>
        <a href="/login" className="signinLink">Sign In</a>
        <a
          href={DEMO_FORM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="demoLink"
        >
          Request Demo
        </a>
        <a
          href={DEMO_FORM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="ctaPrimary"
        >
          Request Demo
        </a>
        <a href="/login" className="ctaSecondary">
          Explore Platform
        </a>
      </div>

      <style jsx>{`
        .experiencePage {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: #040816;
        }

        .heroImage {
          position: absolute;
          inset: 0;
          background-image: url("/experiences/hero-reference.png");
          background-size: contain;
          background-position: center top;
          background-repeat: no-repeat;
          background-color: #040816;
        }

        .clickLayer {
          position: relative;
          z-index: 5;
          width: min(1440px, 100%);
          height: 100vh;
          margin: 0 auto;
        }

        .clickLayer a {
          position: absolute;
          text-indent: -9999px;
          overflow: hidden;
        }

        .logoLink {
          left: 42px;
          top: 24px;
          width: 210px;
          height: 56px;
        }

        .homeLink {
          left: 455px;
          top: 32px;
          width: 64px;
          height: 40px;
        }

        .solutionLink {
          left: 565px;
          top: 32px;
          width: 90px;
          height: 40px;
        }

        .platformLink {
          left: 690px;
          top: 32px;
          width: 90px;
          height: 40px;
        }

        .experiencesLink {
          left: 798px;
          top: 32px;
          width: 128px;
          height: 40px;
        }

        .faqLink {
          left: 945px;
          top: 32px;
          width: 60px;
          height: 40px;
        }

        .signinLink {
          right: 210px;
          top: 32px;
          width: 72px;
          height: 40px;
        }

        .demoLink {
          right: 42px;
          top: 20px;
          width: 160px;
          height: 58px;
        }

        .ctaPrimary {
          left: 45px;
          top: 590px;
          width: 210px;
          height: 66px;
        }

        .ctaSecondary {
          left: 285px;
          top: 590px;
          width: 230px;
          height: 66px;
        }

        @media (max-width: 1100px) {
          .experiencePage {
            overflow-y: auto;
          }

          .heroImage {
            position: relative;
            min-height: 100vh;
            background-size: cover;
            background-position: 64% top;
          }

          .clickLayer {
            position: absolute;
            inset: 0;
          }

          .homeLink,
          .solutionLink,
          .platformLink,
          .experiencesLink,
          .faqLink {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .heroImage {
            background-position: 70% top;
          }

          .logoLink {
            left: 16px;
            top: 18px;
            width: 160px;
          }

          .signinLink {
            display: none;
          }

          .demoLink {
            right: 16px;
            top: 18px;
            width: 138px;
            height: 50px;
          }

          .ctaPrimary {
            left: 24px;
            top: 575px;
            width: calc(100% - 48px);
            height: 58px;
          }

          .ctaSecondary {
            left: 24px;
            top: 646px;
            width: calc(100% - 48px);
            height: 58px;
          }
        }
      `}</style>
    </main>
  );
}