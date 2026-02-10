"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
}

interface PricingTableProps {
  title: string;
  subtitle?: string;
  tiers: PricingTier[];
}

export function PricingTable({ title, subtitle, tiers }: PricingTableProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-xl border p-6",
              tier.highlighted
                ? "border-primary bg-card shadow-xl shadow-primary/15"
                : "border-border/50 bg-card"
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            {tier.badge && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer-slide_3s_ease-in-out_infinite]">
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
              variant={tier.highlighted ? "default" : "outline"}
              asChild
            >
              <Link href={tier.cta.href}>{tier.cta.label}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
