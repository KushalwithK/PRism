"use client";

import { Code, Shield, Puzzle } from "lucide-react";
import { FeatureGrid } from "@/components/marketing/feature-grid";

const values = [
  {
    icon: Code,
    title: "Developer-first",
    description:
      "Built by developers, for developers. Every tool is designed to fit naturally into existing workflows.",
  },
  {
    icon: Shield,
    title: "Privacy-centered",
    description:
      "Your code stays yours. We process diffs in real-time and never store your source code.",
  },
  {
    icon: Puzzle,
    title: "Effortlessly integrated",
    description:
      "Works with the tools you already use — GitHub, GitLab, and more. Zero-conflict, zero-setup.",
  },
];

export function HomeValues() {
  return (
    <FeatureGrid
      title="Why Lucent?"
      subtitle="We believe developer tools should be invisible — powerful enough to handle complexity, simple enough to stay out of your way."
      features={values}
    />
  );
}
