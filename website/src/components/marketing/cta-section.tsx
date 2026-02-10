"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  title: string;
  description: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function CtaSection({
  title,
  description,
  cta,
  secondaryCta,
}: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border/50">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-[glow-breathe_4s_ease-in-out_infinite]" />
      </div>

      <motion.div
        className="mx-auto max-w-3xl px-6 py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          {secondaryCta && (
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
