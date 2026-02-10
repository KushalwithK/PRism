"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PRODUCTS_CONFIG } from "@/lib/constants";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/app/auth-provider";

export default function ApplicationsPage() {
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
        title="Applications"
        description="Your AI-powered developer tools"
      />

      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS_CONFIG.map((product) => {
            const subscription = user?.subscriptions.find(
              (s) => s.productSlug === product.slug
            );
            const isAvailable = product.status === "available";
            const Icon = product.icon;

            return (
              <div
                key={product.slug}
                className={`group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-[450ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  isAvailable
                    ? "hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]"
                    : "opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      {!isAvailable && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Subscription info for active products */}
                {isAvailable && subscription && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Badge
                      variant={
                        subscription.plan === "FREE" ? "secondary" : "default"
                      }
                    >
                      {subscription.plan}
                    </Badge>
                    <span className="text-muted-foreground">
                      {subscription.usageCount} /{" "}
                      {subscription.usageLimit === -1
                        ? "\u221e"
                        : subscription.usageLimit}{" "}
                      used
                    </span>
                  </div>
                )}

                {/* Action */}
                <div className="mt-5">
                  {isAvailable ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 gap-1"
                    >
                      <Link href="/dashboard/prism">
                        Open
                        <ArrowRight size={16} />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
