"use client";

import { motion } from "motion/react";
import { GitBranch, MousePointerClick, Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: GitBranch,
    title: "Navigate to your PR",
    description:
      "Open a new pull request on GitHub or GitLab. PRism detects the page automatically.",
  },
  {
    icon: MousePointerClick,
    title: "Click Generate",
    description:
      "Hit the PRism button. It reads the diff, picks your template, and sends it to the AI.",
  },
  {
    icon: Pencil,
    title: "Review & submit",
    description:
      "The generated title and description are filled into the form. Review, tweak if needed, and submit.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          How it works
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Three steps. Zero friction.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            className="relative text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <step.icon size={24} />
            </div>
            <div className="absolute -top-2 left-[calc(50%-3.5rem)] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
