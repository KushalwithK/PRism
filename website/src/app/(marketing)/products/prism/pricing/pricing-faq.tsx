"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What counts as a generation?",
    a: "Each time you click the PRism button and the AI generates a PR description, that counts as one generation. Editing a previously generated description does not count.",
  },
  {
    q: "When does my usage reset?",
    a: "Usage resets on a rolling 30-day cycle from your account creation date. Paid plans reset based on your billing period.",
  },
  {
    q: "Can I downgrade my plan?",
    a: "Yes. You can downgrade at any time. The change takes effect at the end of your current billing period, so you keep access until then.",
  },
  {
    q: "Do you store my code?",
    a: "No. We process the diff in real-time and never store your source code. We only save the generated description and a short diff summary for your history.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We support all major payment methods through Razorpay, including credit/debit cards, UPI, net banking, and wallets.",
  },
];

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
        Frequently asked questions
      </h2>

      <div className="mt-10 divide-y divide-border/50">
        {faqs.map((faq, i) => (
          <div key={i} className="py-4">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between text-left cursor-pointer"
            >
              <span className="text-sm font-medium">{faq.q}</span>
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform",
                  openIndex === i && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="pt-3 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
