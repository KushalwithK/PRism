"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  badge?: string;
  title: string;
  highlight?: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Hero({
  badge,
  title,
  highlight,
  description,
  primaryCta,
  secondaryCta,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/*
        Gradient starts at the very top of the viewport — behind the fixed navbar.
        Uses fixed positioning so it literally bleeds into the header.
      */}
      {/* Cosmic background - multi-layered animated atmosphere */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
        {/* Base radial gradient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]" />

        {/* Floating orbs — breathing, pulsing violet glows */}
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px] animate-pulse-slow" />
        <div className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[120px] animate-pulse-slow [animation-delay:2s]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-primary/5 blur-[100px] animate-float" />

        {/* Gradient fade to base */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* pt-28 / pt-36 accounts for the 64px fixed navbar + breathing room */}
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-16 text-center md:pt-36 md:pb-24">
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {badge}
            </span>
          </motion.div>
        )}

        <motion.h1
          className="mt-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {title}{" "}
          {highlight && (
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </motion.h1>

        <motion.p
          className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button size="lg" asChild>
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta && (
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
