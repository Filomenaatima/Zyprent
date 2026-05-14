"use client";

import { Suspense } from "react";
import SubscriptionCheckoutContent from "./SubscriptionCheckoutContent";

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionCheckoutContent />
    </Suspense>
  );
}