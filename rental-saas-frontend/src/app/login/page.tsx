"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

type Mode = "login" | "signup";

type Role =
  | "ADMIN"
  | "MANAGER"
  | "INVESTOR"
  | "RESIDENT"
  | "SERVICE_PROVIDER";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("MANAGER");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  const title = useMemo(
    () => (isSignup ? "Create your Zyprent account" : "Welcome back"),
    [isSignup],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        const res = await api.post("/auth/register", {
          name,
          email,
          phone,
          role,
          password,
        });

        const status = res.data?.status || res.data?.user?.status;

        if (status === "PENDING") {
          router.push(`/pending-approval?email=${encodeURIComponent(email)}`);
          return;
        }

        router.push("/pending-approval");
        return;
      }

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, refresh_token, user } = res.data;

      if (user?.status === "PENDING") {
        router.push(`/pending-approval?email=${encodeURIComponent(email)}`);
        return;
      }

      if (access_token && user) {
        localStorage.setItem("refresh_token", refresh_token || "");
        setAuth(access_token, user);

        const mustSubscribeBeforeDashboard =
          user.role === "MANAGER" ||
          user.role === "INVESTOR" ||
          user.role === "RESIDENT";

        if (mustSubscribeBeforeDashboard) {
          router.push("/pricing");
          return;
        }

        router.push("/dashboard");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Request failed";

      if (String(message).toLowerCase().includes("pending approval")) {
        router.push(`/pending-approval?email=${encodeURIComponent(email)}`);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-logo-row">
            <div className="auth-logo">Z</div>
            <span>Zyprent</span>
          </div>

          <div className="auth-brand-copy">
            <p className="auth-eyebrow">PROPERTY OPERATIONS</p>
            <h1>Control your property business from one secure workspace.</h1>
            <p>
              Track payments, manage maintenance, protect investments, and keep
              every user connected with clarity.
            </p>
          </div>

          <div className="auth-points">
            <div>
              <strong>Secure access</strong>
              <span>New accounts are reviewed before platform access.</span>
            </div>
            <div>
              <strong>Subscription access</strong>
              <span>
                Managers, investors, and residents select a plan before entering
                the workspace.
              </span>
            </div>
            <div>
              <strong>Provider friendly</strong>
              <span>
                Service providers can access jobs without a monthly
                subscription.
              </span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <p className="auth-eyebrow">ZYPRENT ACCESS</p>
            <h2>{title}</h2>
            <p>
              {isSignup
                ? "Create your account. Our team will review it before dashboard access is enabled."
                : "Sign in to continue managing your workspace."}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign in
            </button>

            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <>
                <label>
                  Full name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Phone number
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256..."
                  />
                </label>

                <label>
                  Account type
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    required
                  >
                    <option value="MANAGER">Property Manager</option>
                    <option value="INVESTOR">Investor</option>
                    <option value="RESIDENT">Resident</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                  </select>
                </label>
              </>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="auth-footer-text">
            {isSignup ? "Already have an account?" : "New to Zyprent?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "login" : "signup");
                setError("");
              }}
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </section>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(107, 166, 255, 0.22),
              transparent 32%
            ),
            radial-gradient(
              circle at 15% 80%,
              rgba(107, 166, 255, 0.14),
              transparent 34%
            ),
            linear-gradient(135deg, #030107 0%, #07051a 45%, #0b1026 100%);
          color: #ffffff;
        }

        .auth-shell {
          width: min(1120px, 100%);
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 24px;
        }

        .auth-brand-panel,
        .auth-card {
          border: 1px solid rgba(180, 210, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(18px);
          border-radius: 32px;
        }

        .auth-brand-panel {
          min-height: 620px;
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          position: relative;
        }

        .auth-brand-panel::after {
          content: "";
          position: absolute;
          right: -140px;
          bottom: -180px;
          width: 420px;
          height: 420px;
          border-radius: 999px;
          border: 1px solid rgba(127, 184, 255, 0.24);
          box-shadow: inset 0 0 80px rgba(92, 132, 255, 0.22);
        }

        .auth-logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.04em;
          position: relative;
          z-index: 1;
        }

        .auth-logo {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #ffffff;
          color: #05071a;
          font-weight: 950;
        }

        .auth-brand-copy {
          max-width: 560px;
          position: relative;
          z-index: 1;
        }

        .auth-eyebrow {
          margin: 0 0 12px;
          color: #8fd0ff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        .auth-brand-copy h1 {
          margin: 0;
          font-size: clamp(42px, 5vw, 72px);
          line-height: 0.92;
          letter-spacing: -0.075em;
        }

        .auth-brand-copy p:not(.auth-eyebrow) {
          margin: 24px 0 0;
          max-width: 470px;
          color: rgba(255, 255, 255, 0.74);
          font-size: 18px;
          line-height: 1.6;
        }

        .auth-points {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .auth-points div {
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .auth-points strong {
          display: block;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .auth-points span {
          display: block;
          color: rgba(255, 255, 255, 0.62);
          font-size: 13px;
          line-height: 1.45;
        }

        .auth-card {
          padding: 34px;
          align-self: center;
        }

        .auth-card-header h2 {
          margin: 0;
          font-size: 38px;
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .auth-card-header p:not(.auth-eyebrow) {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.66);
          line-height: 1.55;
        }

        .auth-toggle {
          margin: 26px 0;
          padding: 6px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .auth-toggle button {
          border: 0;
          border-radius: 14px;
          padding: 13px 14px;
          cursor: pointer;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 900;
        }

        .auth-toggle button.active {
          color: #ffffff;
          background: linear-gradient(135deg, #5d86ff, #3552dc);
          box-shadow: 0 14px 34px rgba(75, 111, 255, 0.28);
        }

        .auth-form {
          display: grid;
          gap: 14px;
        }

        .auth-form label {
          display: grid;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.78);
        }

        .auth-form input,
        .auth-form select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(3, 5, 18, 0.72);
          color: #ffffff;
          border-radius: 16px;
          padding: 15px 16px;
          outline: none;
          font-size: 15px;
        }

        .auth-form input:focus,
        .auth-form select:focus {
          border-color: rgba(143, 208, 255, 0.75);
          box-shadow: 0 0 0 4px rgba(143, 208, 255, 0.12);
        }

        .auth-form input::placeholder {
          color: rgba(255, 255, 255, 0.38);
        }

        .auth-submit {
          margin-top: 6px;
          border: 0;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          color: #ffffff;
          font-weight: 950;
          font-size: 15px;
          background: linear-gradient(135deg, #6aa9ff, #3e50e8);
          box-shadow: 0 18px 44px rgba(75, 111, 255, 0.32);
        }

        .auth-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .auth-error {
          margin: 0;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255, 75, 96, 0.12);
          border: 1px solid rgba(255, 75, 96, 0.28);
          color: #ffb8c0;
          font-size: 13px;
          font-weight: 700;
        }

        .auth-footer-text {
          margin: 22px 0 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.62);
        }

        .auth-footer-text button {
          border: 0;
          background: transparent;
          color: #8fd0ff;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .auth-brand-panel {
            min-height: auto;
            gap: 42px;
          }

          .auth-points {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .auth-page {
            padding: 18px;
          }

          .auth-brand-panel,
          .auth-card {
            border-radius: 24px;
            padding: 24px;
          }

          .auth-brand-copy h1 {
            font-size: 42px;
          }

          .auth-card-header h2 {
            font-size: 32px;
          }
        }
      `}</style>
    </main>
  );
}