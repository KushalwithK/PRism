"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Chrome,
  Globe,
  ArrowRight,
  MonitorCheck,
  Shield,
  Zap,
  FileText,
  Package,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InstallGuideModal } from "./install-guide-modal";

const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_EXTENSION_DOWNLOAD_URL || "";

type DetectedBrowser = "chrome" | "firefox" | null;

function detectBrowser(): DetectedBrowser {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("chrome") || ua.includes("chromium") || ua.includes("edg") || ua.includes("brave") || ua.includes("opr"))
    return "chrome";
  return null;
}

const browserInfo = {
  chrome: {
    name: "Chrome",
    fullName: "Google Chrome",
    icon: Chrome,
    description: "Also works with Edge, Brave, Arc, Opera, and all Chromium-based browsers.",
    variant: "default" as const,
  },
  firefox: {
    name: "Firefox",
    fullName: "Mozilla Firefox",
    icon: Globe,
    description: "Works with Firefox and Firefox-based browsers.",
    variant: "outline" as const,
  },
};

const features = [
  {
    icon: Zap,
    title: "AI-Powered Descriptions",
    description: "Generate comprehensive PR descriptions from your diff in one click.",
  },
  {
    icon: FileText,
    title: "Custom Templates",
    description: "Use built-in templates or create your own with placeholder variables.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your code is processed securely and never stored on our servers.",
  },
  {
    icon: Package,
    title: "Lightweight",
    description: "Minimal permissions, fast load times, and zero impact on browsing.",
  },
];

export function InstallContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultBrowser, setDefaultBrowser] = useState<"chrome" | "firefox">("chrome");
  const [detectedBrowser, setDetectedBrowser] = useState<DetectedBrowser>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const detected = detectBrowser();
    setDetectedBrowser(detected);
    if (detected) setDefaultBrowser(detected);
  }, []);

  function handleDownload(browser: "chrome" | "firefox") {
    if (linkRef.current) linkRef.current.click();
    setDefaultBrowser(browser);
    setModalOpen(true);
  }

  const recommended = detectedBrowser ?? "chrome";
  const alternative: "chrome" | "firefox" = recommended === "chrome" ? "firefox" : "chrome";
  const recInfo = browserInfo[recommended];
  const altInfo = browserInfo[alternative];

  return (
    <>
      {/* Hidden download anchor */}
      <a
        ref={linkRef}
        href={DOWNLOAD_URL}
        download
        className="hidden"
        aria-hidden="true"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,oklch(0.55_0.25_285/0.10),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-14 md:pt-36 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Early Access
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Install PRism
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed md:text-lg">
              PRism is not yet on the browser stores. Download the extension
              directly and sideload it — takes under a minute.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Detected browser banner */}
        <AnimatePresence>
          {detectedBrowser && (
            <motion.div
              className="mb-8 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 dark:bg-primary/[0.06]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MonitorCheck size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  We detected you&apos;re using{" "}
                  <span className="text-primary">{browserInfo[detectedBrowser].fullName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  We recommend downloading the {browserInfo[detectedBrowser].name} version below.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommended download card */}
        <motion.div
          className="group relative rounded-xl border border-primary/30 bg-card p-6 transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.6,.6,0,1)] hover:border-primary/50 hover:shadow-md dark:bg-card/80 dark:backdrop-blur-sm md:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {detectedBrowser && (
            <span className="absolute -top-3 left-5 inline-flex rounded-full border border-primary/30 bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Recommended
            </span>
          )}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <recInfo.icon size={32} className="text-primary" />
            </div>
            <div className="mt-4 flex-1 sm:mt-0">
              <h3 className="text-xl font-semibold">{recInfo.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {recInfo.description}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  className="gap-2"
                  onClick={() => handleDownload(recommended)}
                >
                  <Download size={16} />
                  Download for {recInfo.name}
                </Button>
                <span className="text-xs text-muted-foreground/60 sm:ml-1">
                  ZIP file &middot; Manual install required
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alternative browser card */}
        <motion.div
          className="group mt-4 rounded-xl border border-border/50 bg-card p-5 transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.6,.6,0,1)] hover:border-primary/20 hover:shadow-sm dark:bg-card/80 dark:backdrop-blur-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <altInfo.icon size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">
                Looking for {altInfo.name}?
              </h3>
              <p className="text-xs text-muted-foreground">
                {altInfo.description}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => handleDownload(alternative)}
            >
              <Download size={14} />
              Download
            </Button>
          </div>
        </motion.div>

        {/* How it works — quick overview */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            How it works
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Download & Install",
                description: "Download the ZIP, extract it, and load it into your browser.",
              },
              {
                step: "2",
                title: "Create an Account",
                description: "Click the PRism icon and register. You get 5 free generations/month.",
              },
              {
                step: "3",
                title: "Generate Away",
                description: "Open any PR page on GitHub or GitLab and click the PRism button.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="rounded-xl border border-border/50 bg-card p-5 dark:bg-card/80 dark:backdrop-blur-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* What's included */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            What&apos;s included
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group flex gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.6,.6,0,1)] hover:border-primary/20 hover:shadow-sm dark:bg-card/80 dark:backdrop-blur-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Early access notice */}
        <motion.div
          className="mt-10 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Info size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-200/90">
              Early Access — Manual Install Required
            </p>
            <p className="mt-1 text-xs text-amber-200/60 leading-relaxed">
              PRism is not yet listed on the Chrome Web Store or Firefox Add-ons.
              You&apos;ll need to sideload the extension manually. Click the
              download button above and follow the installation guide that
              appears — it only takes a minute.
            </p>
          </div>
        </motion.div>

        {/* Ready to go? CTA */}
        <motion.div
          className="mt-10 rounded-xl border border-border/50 bg-card p-8 text-center dark:bg-card/80 dark:backdrop-blur-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <h3 className="text-lg font-semibold">Already installed?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Check out the usage guide for tips on templates, placeholders, and
            getting the most out of PRism.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/products/prism/guide">
              Read the Guide <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      <InstallGuideModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultBrowser={defaultBrowser}
      />
    </>
  );
}
