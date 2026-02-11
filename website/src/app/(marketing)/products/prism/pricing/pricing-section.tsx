"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@prism/shared";
import { PaymentSuccessModal } from "./payment-success-modal";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  plan: "FREE" | "PRO" | "MAX";
  price: string;
  priceValue: number;
  period?: string;
  description: string;
  features: PricingFeature[];
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    plan: "FREE",
    price: "\u20B90",
    priceValue: 0,
    description: "For individual developers trying PRism",
    features: [
      { text: "5 generations per month", included: true },
      { text: "All predefined templates", included: true },
      { text: "GitHub & GitLab support", included: true },
      { text: "Generation history", included: true },
      { text: "Custom templates", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    plan: "PRO",
    price: "\u20B9249",
    priceValue: 249,
    period: "mo",
    description: "For developers who create PRs daily",
    features: [
      { text: "50 generations per month", included: true },
      { text: "All predefined templates", included: true },
      { text: "GitHub & GitLab support", included: true },
      { text: "Generation history", included: true },
      { text: "Custom templates", included: true },
      { text: "Priority support", included: false },
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Max",
    plan: "MAX",
    price: "\u20B91,199",
    priceValue: 1199,
    period: "mo",
    description: "For teams and power users",
    features: [
      { text: "Unlimited generations", included: true },
      { text: "All predefined templates", included: true },
      { text: "GitHub & GitLab support", included: true },
      { text: "Generation history", included: true },
      { text: "Custom templates", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export function PricingSection() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    data: VerifyResponse | null;
    planName: string;
    planPrice: string;
  } | null>(null);

  const currentPlan =
    user?.subscriptions.find((s) => s.productSlug === "prism")?.plan ?? null;

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  async function handleCheckout(tier: PricingTier) {
    if (!user) {
      window.location.href = "/register";
      return;
    }

    setLoadingPlan(tier.plan);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: "prism", plan: tier.plan }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Checkout failed. Please try again.");
        return;
      }

      const { subscriptionId, razorpayKeyId } = await res.json();

      // Load Razorpay checkout
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "Lucent",
        description: `PRism ${tier.plan} Plan`,
        handler: async (response: RazorpayCheckoutResponse) => {
          let verifyData: VerifyResponse | null = null;
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            if (verifyRes.ok) {
              verifyData = await verifyRes.json();
            } else {
              const err = await verifyRes.json().catch(() => ({}));
              console.error("Payment verification failed:", verifyRes.status, err);
            }
          } catch (err) {
            console.error("Payment verification error:", err);
          }
          setSuccessModal({
            open: true,
            data: verifyData,
            planName: tier.name,
            planPrice: tier.price,
          });
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#8b5cf6",
        },
      });
      rzp.open();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  function getCtaLabel(tier: PricingTier): string {
    if (checkingAuth) return tier.plan === "FREE" ? "Get Started" : `Upgrade to ${tier.name}`;
    if (!user) return tier.plan === "FREE" ? "Get Started" : `Upgrade to ${tier.name}`;
    if (currentPlan === tier.plan) return "Current Plan";
    if (tier.plan === "FREE") return "Free Plan";
    return `Upgrade to ${tier.name}`;
  }

  function isCurrentPlan(plan: string): boolean {
    return currentPlan === plan;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pt-24 pb-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, i) => {
          const isCurrent = isCurrentPlan(tier.plan);
          const isLoading = loadingPlan === tier.plan;

          return (
            <motion.div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-6",
                isCurrent
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary"
                  : tier.highlighted
                    ? "border-primary bg-card shadow-lg shadow-primary/10"
                    : "border-border/50 bg-card"
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 gap-1">
                  <Crown size={12} />
                  Your Plan
                </Badge>
              )}
              {!isCurrent && tier.badge && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  {tier.badge}
                </Badge>
              )}

              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">/{tier.period}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2">
                    <Check
                      size={16}
                      className={cn(
                        "mt-0.5 shrink-0",
                        feature.included
                          ? "text-primary"
                          : "text-muted-foreground/30"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        !feature.included && "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6"
                variant={
                  isCurrent
                    ? "secondary"
                    : tier.highlighted
                      ? "default"
                      : "outline"
                }
                disabled={isCurrent || isLoading}
                onClick={() => {
                  if (tier.plan === "FREE") {
                    window.location.href = user ? "/dashboard" : "/register";
                  } else {
                    handleCheckout(tier);
                  }
                }}
              >
                {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
                {getCtaLabel(tier)}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {successModal && (
        <PaymentSuccessModal
          open={successModal.open}
          onClose={() => setSuccessModal(null)}
          data={successModal.data}
          planName={successModal.planName}
          planPrice={successModal.planPrice}
        />
      )}
    </section>
  );
}

function loadRazorpay(): Promise<RazorpayConstructor> {
  return new Promise((resolve, reject) => {
    const win = window as unknown as Record<string, unknown>;
    if (typeof window !== "undefined" && win.Razorpay) {
      resolve(win.Razorpay as RazorpayConstructor);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      if (win.Razorpay) {
        resolve(win.Razorpay as RazorpayConstructor);
      } else {
        reject(new Error("Razorpay SDK failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

interface VerifyResponse {
  productSlug: string;
  plan: string;
  status: string;
  usageLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentId: string;
}

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: RazorpayCheckoutResponse) => void;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
  }): RazorpayInstance;
}
