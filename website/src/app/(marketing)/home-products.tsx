"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS_CONFIG } from "@/lib/constants";

const highlights: Record<string, string[]> = {
  prism: [
    "One-click PR descriptions from your diffs",
    "5 built-in templates + custom templates",
    "GitHub & GitLab support, zero config",
  ],
  "code-lens": [
    "Catches bugs and security issues in reviews",
    "Inline suggestions with explanations",
    "Works with your existing code review flow",
  ],
  "commit-craft": [
    "Conventional commit messages from staged changes",
    "Understands your project's commit style",
    "Works locally with any Git workflow",
  ],
};

export function HomeProducts() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Our Products
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Intelligent tools for every stage of your development workflow.
        </p>
      </div>

      <div className="mt-16 space-y-12">
        {PRODUCTS_CONFIG.map((product, i) => {
          const isAvailable = product.status === "available";
          const Icon = product.icon;
          const isEven = i % 2 === 1;
          const features = highlights[product.slug] || [];

          return (
            <motion.div
              key={product.slug}
              className={`flex flex-col gap-8 rounded-2xl border border-border/50 bg-card p-8 md:flex-row md:items-center ${
                isEven ? "md:flex-row-reverse" : ""
              } ${!isAvailable ? "opacity-60" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Icon area */}
              <div className="flex shrink-0 items-center justify-center md:w-48">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={40} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{product.name}</h3>
                  {!isAvailable && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <p className="mt-2 text-muted-foreground">
                  {product.description}
                </p>
                {features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6">
                  {isAvailable ? (
                    <Button asChild>
                      <Link href={`/products/${product.slug}`}>
                        Get Started
                        <ArrowRight size={16} className="ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Coming soon — stay tuned.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
