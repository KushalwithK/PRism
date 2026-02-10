import type { Metadata } from "next";
import { CtaSection } from "@/components/marketing/cta-section";
import { PricingFaq } from "./pricing-faq";
import { PricingSection } from "./pricing-section";

export const metadata: Metadata = {
  title: "PRism Pricing",
  description:
    "Start free with 5 generations/month. Upgrade to Pro or Max for more.",
};

export default function PricingPage() {
  return (
    <>
      <PricingSection />
      <PricingFaq />
      <CtaSection
        title="Ready to get started?"
        description="Install the browser extension and generate your first PR description in under a minute."
        cta={{ label: "Install PRism", href: "/products/prism/install" }}
      />
    </>
  );
}
