import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { CtaSection } from "@/components/marketing/cta-section";
import { PrismFeatures } from "./prism-features";
import { HowItWorks } from "./how-it-works";
import { TemplateShowcase } from "./template-showcase";

export const metadata: Metadata = {
  title: "PRism",
  description:
    "AI-powered PR descriptions in one click. Supports GitHub and GitLab with customizable templates.",
};

export default function PrismPage() {
  return (
    <>
      <Hero
        badge="PRism by Lucent"
        title="AI-powered PR descriptions"
        highlight="in one click"
        description="Stop spending time writing PR descriptions. PRism analyzes your diff, applies your template, and fills in a polished description — all from a single button click."
        primaryCta={{ label: "Install PRism", href: "/products/prism/install" }}
        secondaryCta={{
          label: "View Pricing",
          href: "/products/prism/pricing",
        }}
      />

      <HowItWorks />

      <PrismFeatures />

      <TemplateShowcase />

      <CtaSection
        title="Get started free"
        description="5 AI-generated PR descriptions per month, included with every free account. No credit card required."
        cta={{ label: "Install PRism", href: "/products/prism/install" }}
        secondaryCta={{ label: "View Pricing", href: "/products/prism/pricing" }}
      />
    </>
  );
}
