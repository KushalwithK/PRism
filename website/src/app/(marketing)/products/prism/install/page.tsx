import type { Metadata } from "next";
import {
  Download,
  Settings,
  Chrome,
  Globe,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Install PRism",
  description: "Install the PRism browser extension for Chrome or Firefox.",
};

const steps = [
  {
    number: 1,
    icon: Download,
    title: "Install the extension",
    description:
      "Download PRism from the Chrome Web Store or Firefox Add-ons. Click the install button and accept the permissions.",
  },
  {
    number: 2,
    icon: Settings,
    title: "Create an account",
    description:
      'Click the PRism icon in your browser toolbar and register a free account. You\'ll get 5 generations per month to start.',
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Start generating",
    description:
      "Navigate to any PR creation page on GitHub or GitLab. You'll see the PRism button — click it to generate your description.",
  },
];

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-24 pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Install PRism
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Get up and running in under a minute. PRism works as a browser
          extension for Chrome and Firefox.
        </p>
      </div>

      {/* Browser options */}
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card p-8 text-center">
          <Chrome size={40} className="text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Chrome</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Chrome, Edge, Brave, Arc, and other<br/>Chromium based browsers.
          </p>
          <Button className="mt-6" size="sm">
            Chrome Web Store
          </Button>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card p-8 text-center">
          <Globe size={40} className="text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Firefox</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Firefox and Firefox-based browsers.
          </p>
          <Button className="mt-6" size="sm" variant="outline">
            Firefox Add-ons
          </Button>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold">Setup steps</h2>
        <div className="mt-8 space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className="mt-16 rounded-xl border border-border/50 bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">Ready to go?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Check out the usage guide for tips on templates, placeholders, and
          getting the most out of PRism.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/products/prism/guide">
            Read the Guide <ArrowRight size={14} className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
