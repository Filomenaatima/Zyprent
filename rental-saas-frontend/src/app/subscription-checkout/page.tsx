"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function SubscriptionCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();

  const plan = params.get("plan") || "Subscription";
  const amount = Number(params.get("amount") || 0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      setMessage(
        "Payment provider is not fully connected yet. Your subscription has not been activated, and dashboard access remains locked until payment is confirmed.",
      );

      // IMPORTANT:
      // Do NOT redirect to dashboard here.
      // Dashboard redirect should only happen after DPO confirms payment successfully.
    } catch {
      setMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-pill">SUBSCRIPTION CHECKOUT</div>

        <h1>Complete your Zyprent subscription</h1>

        <p>
          Your dashboard access will only be activated after a successful payment
          confirmation.
        </p>

        <div className="summary-card">
          <div className="summary-row">
            <span>Selected Plan</span>
            <strong>{plan}</strong>
          </div>

          <div className="summary-row">
            <span>Billing</span>
            <strong>Monthly</strong>
          </div>

          <div className="summary-row total">
            <span>Total Amount</span>
            <strong>UGX {amount.toLocaleString()}</strong>
          </div>
        </div>

        {message && <div className="checkout-message">{message}</div>}

        <button onClick={handlePayment} className="pay-button" disabled={loading}>
          {loading ? "Processing..." : "Continue to Payment"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => router.push("/pricing")}
        >
          Change Plan
        </button>
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 30%),
            linear-gradient(135deg, #020617 0%, #061129 45%, #081a3a 100%);
        }

        .checkout-card {
          width: 100%;
          max-width: 560px;
          padding: 42px;
          border-radius: 34px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(8, 26, 58, 0.98));
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          color: white;
        }

        .checkout-pill {
          width: fit-content;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(96, 165, 250, 0.12);
          border: 1px solid rgba(147, 197, 253, 0.28);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        h1 {
          margin: 22px 0 0;
          font-size: 46px;
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        p {
          margin: 18px 0 0;
          color: rgba(226, 232, 240, 0.72);
          line-height: 1.7;
        }

        .summary-card {
          margin-top: 34px;
          padding: 24px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: grid;
          gap: 18px;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(226, 232, 240, 0.82);
        }

        .summary-row strong {
          color: white;
        }

        .summary-row.total {
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .summary-row.total strong {
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .checkout-message {
          margin-top: 22px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.24);
          color: #fde68a;
          font-size: 14px;
          line-height: 1.55;
        }

        .pay-button,
        .secondary-button {
          width: 100%;
          margin-top: 18px;
          height: 58px;
          border: none;
          border-radius: 18px;
          color: white;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .pay-button {
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          box-shadow: 0 24px 54px rgba(37, 99, 235, 0.35);
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pay-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}