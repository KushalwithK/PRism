"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PREDEFINED_TEMPLATES,
  SAMPLE_PLACEHOLDER_VALUES,
  renderTemplate,
} from "@prism/shared";
import { cn } from "@/lib/utils";

export function TemplateShowcase() {
  const [activeIndex, setActiveIndex] = useState(1); // Default to "Standard"
  const active = PREDEFINED_TEMPLATES[activeIndex];
  const rendered = renderTemplate(active.body, SAMPLE_PLACEHOLDER_VALUES);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Template showcase
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose from 5 built-in templates or create your own. Here&apos;s a
          preview of what each one generates.
        </p>
      </div>

      <div className="mt-10">
        {/* Template tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {PREDEFINED_TEMPLATES.map((tpl, i) => (
            <button
              key={tpl.name}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                i === activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Template description */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {active.description}
        </p>

        {/* Preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-6 rounded-xl border border-border/50 bg-card p-6 font-mono text-sm"
          >
            <pre className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {rendered}
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
