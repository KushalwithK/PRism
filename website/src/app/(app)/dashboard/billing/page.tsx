"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CreditCard } from "lucide-react";
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
  const isUnlimited = sub.usageLimit === -1;
  const percentage = isUnlimited
    ? 0
    : Math.min((sub.usageCount / sub.usageLimit) * 100, 100);

  return (
    <Card>
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
              variant={sub.status === "ACTIVE" ? "default" : "destructive"}
              className="text-[10px]"
            >
              {sub.status}
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

        {/* Upgrade button */}
        {sub.plan === "FREE" && (
          <Button className="w-full" size="sm" asChild>
            <Link href="/products/prism/pricing">Upgrade Plan</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
