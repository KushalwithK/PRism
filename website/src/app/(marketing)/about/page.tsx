import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { AboutValues } from "./about-values";

export const metadata: Metadata = {
  title: "About",
  description:
    "Lucent builds AI-powered developer tools that automate tedious workflows.",
};

export default function AboutPage() {
  return (
    <>
      <Hero
        title="Building the future of"
        highlight="developer tooling"
        description="Lucent is a small, focused team building AI-powered tools that eliminate the tedious parts of software development. We believe great developer tools should be invisible — powerful enough to handle complexity, simple enough to forget they're there."
        primaryCta={{ label: "Explore PRism", href: "/products/prism" }}
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-bold">Our Mission</h2>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Every developer knows the feeling: you&apos;ve just finished a complex
            feature, the code is clean, tests pass — and now you need to spend
            20 minutes writing a PR description that explains it all.
          </p>
          <p>
            We started Lucent because we kept hitting these small, repetitive
            friction points that collectively eat hours of productive time. AI
            is good enough now to handle these tasks reliably, but the tools
            available were either too generic or too complex.
          </p>
          <p>
            So we&apos;re building purpose-built AI tools — each one focused on a
            single workflow, deeply integrated with the platforms developers
            already use, and simple enough that they just work.
          </p>
        </div>
      </section>

      <AboutValues />
    </>
  );
}
