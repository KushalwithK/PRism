"use client";

import { motion } from "motion/react";
import {
  Mail,
  HelpCircle,
  CreditCard,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const contactReasons = [
  {
    icon: HelpCircle,
    title: "General Inquiries",
    description:
      "Questions about our products, features, or anything else — we're happy to help.",
  },
  {
    icon: CreditCard,
    title: "Billing Support",
    description:
      "Issues with subscriptions, payments, refunds, or plan changes.",
  },
  {
    icon: Shield,
    title: "Privacy Concerns",
    description:
      "Requests for data deletion, data export, or questions about our data practices.",
  },
];

const quickLinks = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Refund Policy", href: "/legal/refund" },
];

export function ContactContent() {
  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,oklch(0.55_0.25_285/0.10),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-14 md:pt-36 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Support
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Contact Us
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed md:text-lg">
              Have a question, issue, or feedback? We&apos;d love to hear from
              you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Email card */}
        <motion.div
          className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 dark:bg-primary/[0.06]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email us at</p>
              <a
                href="mailto:support@getlucent.dev"
                className="text-lg font-semibold text-primary underline-offset-4 hover:underline"
              >
                support@getlucent.dev
              </a>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            We typically respond within 24–48 hours.
          </div>
        </motion.div>

        {/* Contact reasons */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            How can we help?
          </h2>
          <div className="mt-4 grid gap-3">
            {contactReasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                className="group flex gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.6,.6,0,1)] hover:border-primary/20 hover:shadow-sm dark:bg-card/80 dark:backdrop-blur-sm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <reason.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{reason.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Business info + quick links */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <motion.div
            className="rounded-xl border border-border/50 bg-card p-5 dark:bg-card/80 dark:backdrop-blur-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Business Information
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="font-medium text-foreground">
                  Company:
                </strong>{" "}
                Lucent
              </p>
              <p>
                <strong className="font-medium text-foreground">
                  Location:
                </strong>{" "}
                India
              </p>
              <p>
                <strong className="font-medium text-foreground">
                  Email:
                </strong>{" "}
                <a
                  href="mailto:support@getlucent.dev"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  support@getlucent.dev
                </a>
              </p>
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl border border-border/50 bg-card p-5 dark:bg-card/80 dark:backdrop-blur-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Quick Links
            </h2>
            <div className="mt-3 space-y-1.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
