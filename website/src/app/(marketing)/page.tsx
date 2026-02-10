import { Hero } from "@/components/marketing/hero";
import { CtaSection } from "@/components/marketing/cta-section";
import { HomeProducts } from "./home-products";
import { HomeValues } from "./home-values";

export default function HomePage() {
  return (
    <>
      <Hero
        badge="AI-Powered Developer Tools"
        title="AI tools that"
        highlight="illuminate your workflow"
        description="Lucent builds intelligent developer tools that automate the tedious parts of your workflow so you can focus on what matters — writing great code."
        primaryCta={{ label: "Explore Products", href: "#products" }}
        secondaryCta={{ label: "Learn More", href: "/about" }}
      />

      <div id="products">
        <HomeProducts />
      </div>
      <HomeValues />

      <CtaSection
        title="Ready to get started?"
        description="Install PRism and generate your first AI-powered PR description in under a minute. Free forever for up to 5 generations per month."
        cta={{ label: "Get Started Free", href: "/register" }}
        secondaryCta={{ label: "See Pricing", href: "/products/prism/pricing" }}
      />
    </>
  );
}
