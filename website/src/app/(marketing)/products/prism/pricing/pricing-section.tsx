"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, CircleCheckBig, Loader2, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLAN_ORDER, type UserProfile, type ProductPlanInfo } from "@prism/shared";
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

function formatPrice(currency: string, amount: number): string {
  if (amount === 0) return `${currency}0`;
  return `${currency}${amount.toLocaleString("en-IN")}`;
}

function mapPlanToTier(plan: ProductPlanInfo): PricingTier {
  return {
    name: plan.displayName,
    plan: plan.plan as "FREE" | "PRO" | "MAX",
    price: formatPrice(plan.currency, plan.monthlyPrice),
    priceValue: plan.monthlyPrice,
    period: plan.period ?? undefined,
    description: plan.description,
    features: plan.features,
    highlighted: plan.highlighted,
    badge: plan.badge ?? undefined,
  };
}

export function PricingSection() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
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
    fetch("/api/billing/plans?productSlug=prism")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductPlanInfo[]) => {
        if (Array.isArray(data)) setTiers(data.map(mapPlanToTier));
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));

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

  function isLowerPlan(tierPlan: string): boolean {
    if (!currentPlan) return false;
    return PLAN_ORDER[tierPlan as keyof typeof PLAN_ORDER] < PLAN_ORDER[currentPlan as keyof typeof PLAN_ORDER];
  }

  function getCtaLabel(tier: PricingTier): string {
    if (checkingAuth) return tier.plan === "FREE" ? "Get Started" : `Upgrade to ${tier.name}`;
    if (!user) return tier.plan === "FREE" ? "Get Started" : `Upgrade to ${tier.name}`;
    if (currentPlan === tier.plan) return "Current Plan";
    if (isLowerPlan(tier.plan)) return tier.plan === "FREE" ? "Free Plan" : tier.name;
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
        {loadingPlans
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-border/50 bg-card p-6 animate-pulse"
              >
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="mt-2 h-4 w-40 rounded bg-muted" />
                <div className="mt-6 h-10 w-24 rounded bg-muted" />
                <div className="mt-6 flex-1 space-y-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="h-4 w-full rounded bg-muted" />
                  ))}
                </div>
                <div className="mt-6 h-10 w-full rounded bg-muted" />
              </div>
            ))
          : tiers.map((tier, i) => {
          const isCurrent = isCurrentPlan(tier.plan);
          const isLoading = loadingPlan === tier.plan;
          const isLower = isLowerPlan(tier.plan);
          const isHighlighted = !!tier.highlighted;

          return (
            <motion.div
              key={tier.name}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {/* Your Plan badge — outlined, calm, purple theme */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background px-3 py-1 text-xs font-semibold text-primary whitespace-nowrap z-10">
                  <CircleCheckBig size={13} />
                  Your Plan
                </div>
              )}

              {/* Most Popular badge — sits on the border edge */}
              {tier.badge && (
                <div className="badge-shine absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 whitespace-nowrap shadow-lg shadow-primary/30 z-10">
                  <Sparkles size={13} className="text-primary-foreground" />
                  <span className="text-xs font-bold text-primary-foreground">{tier.badge}</span>
                </div>
              )}

              {/* Rotating gradient border — rendered before card so card paints on top */}
              {isHighlighted && (
                <div className="pricing-border" aria-hidden="true" />
              )}

              <div
                className={cn(
                  "relative flex flex-col rounded-xl p-6 h-full",
                  isHighlighted
                    ? "bg-card pricing-glow"
                    : isCurrent
                      ? "border-2 border-dashed border-primary/50 bg-primary/5"
                      : "border border-border/50 bg-card"
                )}
              >

              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tier.description}
              </p>

              <div className="mt-6">
                <span className={cn("text-4xl font-bold", isHighlighted && "text-primary")}>{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">/{tier.period}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                    ) : (
                      <Minus
                        size={16}
                        className="mt-0.5 shrink-0 text-muted-foreground/30"
                      />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        !feature.included && "text-muted-foreground/40"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-6",
                  isHighlighted && !isCurrent && !isLower && "shadow-md shadow-primary/20"
                )}
                variant={
                  isCurrent || isLower
                    ? "secondary"
                    : tier.highlighted
                      ? "default"
                      : "outline"
                }
                disabled={isCurrent || isLower || isLoading}
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
              </div>
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
