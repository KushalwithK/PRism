"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCTS_CONFIG } from "@/lib/constants";
import { ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";

interface ProductsMenuProps {
  open: boolean;
  onClose: () => void;
}

const highlights = [
  { icon: Zap, label: "Free plans in all apps" },
  { icon: Shield, label: "Enterprise-grade security" },
  { icon: Globe, label: "One click installation" },
  { icon: Sparkles, label: "AI-powered insights" },
];

export function ProductsMenu({ open, onClose }: ProductsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 top-16 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Menu panel */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-16 z-50 w-full max-w-4xl -translate-x-1/2 rounded-b-2xl border border-t-0 border-border/50 bg-popover shadow-2xl shadow-primary/5"
          >
            <div className="grid grid-cols-5 gap-0">
              {/* Products list — 3 columns */}
              <div className="col-span-3 p-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Products
                </p>
                <div className="space-y-1">
                  {PRODUCTS_CONFIG.map((product) => {
                    const isAvailable = product.status === "available";
                    const Icon = product.icon;

                    const inner = (
                      <div className="group flex items-start gap-4 rounded-xl p-4 transition-all hover:bg-primary/5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                          <Icon size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {product.name}
                            </span>
                            {isAvailable ? (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0 hover:bg-primary/15"
                              >
                                Available
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                            {product.description}
                          </p>
                          {isAvailable && (
                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              Explore
                              <ArrowRight size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    );

                    if (isAvailable) {
                      return (
                        <Link
                          key={product.slug}
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                        >
                          {inner}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={product.slug}
                        className="opacity-60 cursor-default"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right panel — highlights + CTA */}
              <div className="col-span-2 border-l border-border/50 bg-secondary/30 p-6 rounded-br-2xl">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Why Lucent?
                </p>

                <div className="space-y-3">
                  {highlights.map((h) => (
                    <div key={h.label} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <h.icon size={16} />
                      </div>
                      <span className="text-sm text-foreground">{h.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Start for free
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <strong>No Subscription required.</strong> Start for free without credit card, upgrade when you feel like it
                  </p>
                  <Button size="sm" className="mt-3 w-full" asChild>
                    <Link href="/register" onClick={onClose}>
                      Get Started
                      <ArrowRight size={14} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
