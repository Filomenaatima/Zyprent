"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PendingApprovalContent() {
  const params = useSearchParams();
  const email = params.get("email");

  return (
    <main className="pending-page">
      <section className="pending-card">
        <a href="/" className="pending-brand">
          <span>Z</span>
          <strong>Zyprent</strong>
        </a>

        <div className="pending-icon">✓</div>

        <p className="pending-eyebrow">ACCOUNT RECEIVED</p>

        <h1>Your account is pending approval.</h1>

        <p className="pending-copy">
          Thanks for creating a Zyprent account
          {email ? ` with ${email}` : ""}. Our team will review your request
          before dashboard access is enabled.
        </p>

        <div className="pending-steps">
          <div>
            <strong>1</strong>
            <span>Account created</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Admin review</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Dashboard access</span>
          </div>
        </div>

        <div className="pending-actions">
          <a href="/" className="pending-btn primary">
            Back to home
          </a>
          <a href="/login" className="pending-btn secondary">
            Sign in later
          </a>
        </div>
      </section>

      <style jsx>{`
        .pending-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 28px;
          background:
            radial-gradient(circle at 80% 10%, rgba(107, 166, 255, 0.22), transparent 32%),
            radial-gradient(circle at 15% 80%, rgba(107, 166, 255, 0.14), transparent 34%),
            linear-gradient(135deg, #030107 0%, #07051a 45%, #0b1026 100%);
          color: #ffffff;
        }

        .pending-card {
          width: min(720px, 100%);
          padding: 42px;
          border-radius: 32px;
          text-align: center;
          border: 1px solid rgba(180, 210, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(18px);
        }

        .pending-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
          font-weight: 950;
          margin-bottom: 34px;
        }

        .pending-brand span {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #ffffff;
          color: #05071a;
          display: grid;
          place-items: center;
          font-weight: 950;
        }

        .pending-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(135deg, #6aa9ff, #3e50e8);
          box-shadow: 0 18px 44px rgba(75, 111, 255, 0.32);
          font-size: 30px;
          font-weight: 950;
        }

        .pending-eyebrow {
          margin: 0 0 12px;
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 64px);
          line-height: 0.95;
          letter-spacing: -0.07em;
        }

        .pending-copy {
          max-width: 560px;
          margin: 20px auto 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 17px;
          line-height: 1.6;
        }

        .pending-steps {
          margin: 34px 0;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .pending-steps div {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .pending-steps strong {
          width: 32px;
          height: 32px;
          margin: 0 auto 10px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(143, 208, 255, 0.15);
          color: #8fd0ff;
        }

        .pending-steps span {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 800;
        }

        .pending-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .pending-btn {
          min-height: 46px;
          padding: 0 22px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          text-decoration: none;
          font-weight: 950;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .pending-btn.primary {
          background: linear-gradient(135deg, #6aa9ff, #3e50e8);
        }

        .pending-btn.secondary {
          background: rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 620px) {
          .pending-card {
            padding: 28px;
          }

          .pending-steps {
            grid-template-columns: 1fr;
          }

          .pending-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={null}>
      <PendingApprovalContent />
    </Suspense>
  );
}