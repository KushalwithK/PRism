"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CreditCard, AlertTriangle, XCircle, CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/components/app/auth-provider";
import type { ProductSubscription } from "@prism/shared";

export default function BillingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <AppHeader
        title="Billing"
        description="Manage your subscriptions and payments"
      />

      <div className="p-8 max-w-3xl space-y-6">
        {user?.subscriptions && user.subscriptions.length > 0 ? (
          user.subscriptions.map((sub) => (
            <SubscriptionCard key={sub.productSlug} subscription={sub} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/50 py-16 text-center">
            <CreditCard
              size={40}
              className="mx-auto text-muted-foreground/40"
            />
            <p className="mt-4 font-medium text-muted-foreground">
              No active subscriptions
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Get started by exploring our products and choosing a plan.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/dashboard">Browse Applications</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function SubscriptionCard({
  subscription: sub,
}: {
  subscription: ProductSubscription;
}) {
  const { refreshProfile } = useAuth();
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [cardUpdateSuccess, setCardUpdateSuccess] = useState(false);
  const isUnlimited = sub.usageLimit === -1;
  const percentage = isUnlimited
    ? 0
    : Math.min((sub.usageCount / sub.usageLimit) * 100, 100);

  const isPastDue = sub.status === "PAST_DUE";
  const isHalted = sub.status === "HALTED";
  const hasPaymentIssue = isPastDue || isHalted;
  const hasPaidSub = sub.plan !== "FREE";

  async function handleUpdatePayment() {
    setUpdatingPayment(true);
    try {
      const res = await fetch("/api/billing/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: sub.productSlug }),
      });

      if (!res.ok) {
        throw new Error("Failed to get payment info");
      }

      const { razorpaySubscriptionId, razorpayKeyId } = await res.json();

      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: razorpayKeyId,
        subscription_id: razorpaySubscriptionId,
        subscription_card_change: true,
        name: "PRism by Lucent",
        description: "Update payment method",
        handler: async () => {
          // Card change succeeded — ₹5 auth was auto-refunded.
          // Razorpay will auto-retry the pending invoice on the new card.
          // The subscription.charged webhook will update period + usage.
          setCardUpdateSuccess(true);
          refreshProfile();
        },
      });
      rzp.open();
    } catch {
      // Silently fail — user can retry
    } finally {
      setUpdatingPayment(false);
    }
  }

  return (
    <Card
      className={
        isHalted
          ? "border-destructive/50"
          : isPastDue
            ? "border-amber-500/50"
            : undefined
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard size={18} />
            </div>
            <CardTitle className="text-base">{sub.productName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                sub.status === "ACTIVE"
                  ? "default"
                  : sub.status === "PAST_DUE"
                    ? "secondary"
                    : "destructive"
              }
              className="text-[10px]"
            >
              {sub.status === "PAST_DUE"
                ? "PAST DUE"
                : sub.status === "HALTED"
                  ? "PAYMENT FAILED"
                  : sub.status}
            </Badge>
            <Badge
              variant={sub.plan === "FREE" ? "secondary" : "default"}
            >
              {sub.plan}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status banners */}
        {isPastDue && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-500">Payment retry in progress</p>
              <p className="mt-0.5 text-muted-foreground">
                We&apos;re retrying your payment. Please update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
        )}
        {isHalted && !cardUpdateSuccess && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive">Payment failed</p>
              <p className="mt-0.5 text-muted-foreground">
                Your payment could not be processed. Update your payment method to restore your subscription.
              </p>
            </div>
          </div>
        )}
        {cardUpdateSuccess && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-emerald-500">Payment method updated</p>
              <p className="mt-0.5 text-muted-foreground">
                {hasPaymentIssue
                  ? "Razorpay will retry your pending payment on the new card shortly. This may take a few minutes."
                  : "Your new card will be used for future payments."}
              </p>
            </div>
          </div>
        )}

        {/* Usage */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Usage this period</span>
            <span className="font-medium">
              {sub.usageCount} / {isUnlimited ? "\u221e" : sub.usageLimit}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Period */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Period</span>
          <span>
            {new Date(sub.currentPeriodStart).toLocaleDateString()} &rarr;{" "}
            {new Date(sub.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>

        {/* Action buttons */}
        {hasPaymentIssue && hasPaidSub && !cardUpdateSuccess && (
          <div className="space-y-2">
            <Button
              className="w-full"
              size="sm"
              variant="destructive"
              onClick={handleUpdatePayment}
              disabled={updatingPayment}
            >
              {updatingPayment ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Update Payment Method
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info size={12} className="shrink-0" />
              A &#x20B9;5 authorization will be placed to verify your new card. This is automatically refunded.
            </p>
          </div>
        )}

        {!hasPaymentIssue && hasPaidSub && !cardUpdateSuccess && (
          <div className="space-y-2">
            <Button
              className="w-full"
              size="sm"
              variant="outline"
              onClick={handleUpdatePayment}
              disabled={updatingPayment}
            >
              {updatingPayment ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Update Payment Method
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info size={12} className="shrink-0" />
              A &#x20B9;5 authorization will be placed to verify your new card. This is automatically refunded.
            </p>
          </div>
        )}

        {/* Upgrade button */}
        {sub.plan !== "MAX" && !hasPaymentIssue && (
          <Button
            className="w-full"
            size="sm"
            variant={sub.plan === "FREE" ? "default" : "outline"}
            asChild
          >
            <Link href="/products/prism/pricing">
              {sub.plan === "FREE" ? "Upgrade Plan" : "Upgrade to Max"}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Razorpay helpers ──

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
    subscription_card_change?: boolean;
    name: string;
    description: string;
    handler: (response: RazorpayCheckoutResponse) => void;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
  }): RazorpayInstance;
}
