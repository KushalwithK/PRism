"use client";

import {
  FileText,
  GitBranch,
  Layout,
  History,
  Sparkles,
  Shield,
} from "lucide-react";
import { FeatureGrid } from "@/components/marketing/feature-grid";

const features = [
  {
    icon: FileText,
    title: "Template-driven output",
    description:
      "Choose from predefined templates (Minimal, Standard, Feature, Bugfix, Enterprise) or create your own with custom placeholders.",
  },
  {
    icon: GitBranch,
    title: "GitHub & GitLab support",
    description:
      "Works natively on both platforms. Auto-detects branches, diffs, and fills in the PR form for you.",
  },
  {
    icon: Layout,
    title: "Custom templates",
    description:
      "Build templates that match your team's PR conventions. Use 18+ built-in placeholders for consistent, structured descriptions.",
  },
  {
    icon: History,
    title: "Generation history",
    description:
      "Every generated description is saved. Search, filter, and revisit past generations anytime.",
  },
  {
    icon: Sparkles,
    title: "AI-powered analysis",
    description:
      "Powered by advanced AI that understands code context, identifies key changes, and writes clear, accurate summaries.",
  },
  {
    icon: Shield,
    title: "Zero-conflict design",
    description:
      "Non-intrusive browser extension that only activates on PR creation pages. Never interferes with your workflow.",
  },
];

export function PrismFeatures() {
  return <FeatureGrid title="Everything you need" features={features} />;
}
