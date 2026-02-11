"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface InstallStep {
  title: string;
  description: string;
  screenshot?: string;
  screenshotAlt?: string;
  copyUrl?: string;
  note?: string;
}

const chromeSteps: InstallStep[] = [
  {
    title: "Unzip the downloaded file",
    description:
      "Extract the downloaded ZIP file to a folder on your computer. Remember where you save it — you'll need it in a moment.",
  },
  {
    title: "Open the Extensions page",
    description:
      "Open your browser and navigate to the extensions management page.",
    copyUrl: "chrome://extensions",
  },
  {
    title: "Enable Developer Mode",
    description:
      'Find the "Developer mode" toggle in the top-right corner of the extensions page and turn it on.',
    screenshot: "/installation/chrome_step_1.png",
    screenshotAlt: "Chrome extensions page with Developer Mode toggle highlighted",
  },
  {
    title: "Load the unpacked extension",
    description:
      'Click the "Load unpacked" button that appears after enabling Developer Mode, then select the folder where you extracted PRism.',
    screenshot: "/installation/chrome_step_2.png",
    screenshotAlt: 'Chrome extensions page with "Load unpacked" button highlighted',
  },
  {
    title: "Pin the extension",
    description:
      "Click the puzzle piece icon in the toolbar, then click the pin icon next to PRism to keep it visible.",
    screenshot: "/installation/chrome_step_3.png",
    screenshotAlt: "Chrome toolbar showing how to pin the PRism extension",
  },
];

const firefoxSteps: InstallStep[] = [
  {
    title: "Unzip the downloaded file",
    description:
      "Extract the downloaded ZIP file to a folder on your computer. Remember where you save it — you'll need it in a moment.",
  },
  {
    title: "Open Add-ons Debugging",
    description:
      "Open Firefox and navigate to the add-ons debugging page.",
    copyUrl: "about:debugging#/runtime/this-firefox",
  },
  {
    title: "Load Temporary Add-on",
    description:
      'Click "Load Temporary Add-on…" and select the manifest.json file inside the extracted PRism folder.',
    screenshot: "/installation/firefox_step_1.png",
    screenshotAlt: "Firefox debugging page with Load Temporary Add-on button highlighted",
  },
  {
    title: "Important: Temporary Add-on",
    description:
      "Firefox temporary add-ons are removed when Firefox restarts. You'll need to reload the extension each time you restart your browser.",
    note: "Temporary add-ons are removed when you close Firefox. You'll need to repeat step 2–3 after each restart until PRism is available on Firefox Add-ons.",
  },
];

interface InstallGuideModalProps {
  open: boolean;
  onClose: () => void;
  defaultBrowser: "chrome" | "firefox";
}

export function InstallGuideModal({
  open,
  onClose,
  defaultBrowser,
}: InstallGuideModalProps) {
  const [activeBrowser, setActiveBrowser] = useState(defaultBrowser);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) setActiveBrowser(defaultBrowser);
  }, [open, defaultBrowser]);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const steps = activeBrowser === "chrome" ? chromeSteps : firefoxSteps;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Sticky Header */}
            <div className="shrink-0 border-b border-border px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Installation Guide</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Follow these steps to set up PRism in your browser.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Browser tabs */}
              <div className="mt-4 flex gap-2">
                {(["chrome", "firefox"] as const).map((browser) => (
                  <button
                    key={browser}
                    onClick={() => setActiveBrowser(browser)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                      activeBrowser === browser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {browser === "chrome" ? "Chrome" : "Firefox"}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeBrowser}
                  initial={{ opacity: 0, x: activeBrowser === "chrome" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeBrowser === "chrome" ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                    >
                      {/* Step number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Copy URL */}
                        {step.copyUrl && (
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-mono">
                              {step.copyUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(step.copyUrl!)}
                              className="shrink-0 gap-1.5"
                            >
                              {copiedUrl === step.copyUrl ? (
                                <>
                                  <Check size={14} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Screenshot */}
                        {step.screenshot && (
                          <div className="overflow-hidden rounded-xl border border-border/70 bg-secondary/20">
                            <img
                              src={step.screenshot}
                              alt={step.screenshotAlt ?? step.title}
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* Note callout */}
                        {step.note && (
                          <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                            <AlertTriangle
                              size={18}
                              className="mt-0.5 shrink-0 text-amber-500"
                            />
                            <p className="text-sm text-amber-200/80 leading-relaxed">
                              {step.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 border-t border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/products/prism/guide"
                  className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Need help? Read the guide
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <Button onClick={onClose}>Got it</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
