import type { Metadata } from "next";
import Link from "next/link";
import {
  PREDEFINED_TEMPLATES,
  PLACEHOLDERS,
} from "@prism/shared";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "PRism Guide",
  description:
    "Learn how to use PRism effectively — templates, placeholders, and tips.",
};

export default function GuidePage() {
  const placeholderEntries = Object.values(PLACEHOLDERS);

  return (
    <div className="mx-auto max-w-4xl px-6 pt-24 pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          PRism Guide
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to get the most out of PRism.
        </p>
      </div>

      {/* Quick start */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Quick start</h2>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
          <li>
            Install the extension and sign in (or create a free account).
          </li>
          <li>
            Navigate to a PR creation page on GitHub or GitLab.
          </li>
          <li>
            Click the <strong className="text-foreground">Generate</strong> button in the PRism
            panel.
          </li>
          <li>
            Review the generated title and description, make any edits, and submit
            your PR.
          </li>
        </ol>
      </section>

      {/* Templates */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Templates</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Templates control the structure and content of your generated PR
          description. PRism ships with {PREDEFINED_TEMPLATES.length} built-in
          templates:
        </p>

        <div className="mt-6 space-y-4">
          {PREDEFINED_TEMPLATES.map((tpl) => (
            <div
              key={tpl.name}
              className="rounded-lg border border-border/50 bg-card p-4"
            >
              <h3 className="font-semibold">{tpl.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tpl.description}
              </p>
              <pre className="mt-3 rounded-md bg-secondary/50 p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
                {tpl.body}
              </pre>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Pro and Max plans can create unlimited custom templates with any
          combination of placeholders.
        </p>
      </section>

      {/* Placeholders */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Placeholder reference</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Placeholders are wrapped in curly braces (e.g.,{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono">
            {"{summary}"}
          </code>
          ) inside template bodies. The AI fills each one based on the diff.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="pb-3 font-semibold">Placeholder</th>
                <th className="pb-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {placeholderEntries.map((p) => (
                <tr key={p.key}>
                  <td className="py-3 pr-4">
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono">
                      {`{${p.key}}`}
                    </code>
                  </td>
                  <td className="py-3 text-muted-foreground">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tips */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Tips</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-foreground">Set a default template</strong>{" "}
            — saves a click every time. Go to Templates in the extension popup
            and mark your favorite as default.
          </li>
          <li>
            <strong className="text-foreground">Use additional prompts</strong>{" "}
            — add context the AI can&apos;t infer from the diff, like &quot;this is a
            hotfix for production&quot; or &quot;focus on the API changes.&quot;
          </li>
          <li>
            <strong className="text-foreground">Keep diffs focused</strong>{" "}
            — smaller, single-purpose PRs produce better descriptions. If your
            diff is huge, consider splitting the PR.
          </li>
          <li>
            <strong className="text-foreground">Edit after generation</strong>{" "}
            — PRism fills the form but doesn&apos;t submit. Always review and add
            any context the AI might have missed.
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className="mt-16 rounded-xl border border-border/50 bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">Need more generations?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upgrade your plan for more monthly generations and custom templates.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/products/prism/pricing">
            View Pricing <ArrowRight size={14} className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
