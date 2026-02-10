"use client";

import { Target, Heart, Zap, Users } from "lucide-react";
import { FeatureGrid } from "@/components/marketing/feature-grid";

const values = [
  {
    icon: Target,
    title: "Focused on impact",
    description:
      "We build tools that solve real, everyday pain points — not science projects. Every feature ships with a clear purpose.",
  },
  {
    icon: Heart,
    title: "Developer empathy",
    description:
      "We use our own tools daily. If it frustrates us, we fix it. If it doesn't save time, we cut it.",
  },
  {
    icon: Zap,
    title: "Speed over ceremony",
    description:
      "Small team, fast decisions. We ship weekly and iterate based on real usage, not roadmap theater.",
  },
  {
    icon: Users,
    title: "Community-driven",
    description:
      "Our best features come from user feedback. We build in the open and listen closely to the developers who use our tools.",
  },
];

export function AboutValues() {
  return <FeatureGrid title="What We Believe" features={values} columns={2} />;
}
