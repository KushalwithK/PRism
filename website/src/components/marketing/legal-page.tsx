"use client";

import { motion } from "motion/react";

interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export type { LegalSection };

export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageProps) {
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
              Legal
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed md:text-lg">
              {description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground/50">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Table of contents */}
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <motion.nav
          className="rounded-xl border border-border/50 bg-card p-5 dark:bg-card/80 dark:backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            On this page
          </h2>
          <ol className="mt-3 columns-1 gap-x-8 sm:columns-2">
            {sections.map((section, i) => (
              <li key={section.id} className="py-1">
                <a
                  href={`#${section.id}`}
                  className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="font-mono text-[11px] text-primary/50 transition-colors group-hover:text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </motion.nav>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-3xl px-6 pt-6 pb-24">
        {sections.map((section, i) => (
          <motion.section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 border-b border-border/30 py-8 last:border-b-0"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-semibold text-primary/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
            </div>
            <div className="mt-4 pl-9 space-y-3 text-[15px] text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_li]:pl-1 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_p+p]:mt-3 [&_p+ul]:mt-2 [&_ul+p]:mt-3 [&_p+ol]:mt-2 [&_ol+p]:mt-3">
              {section.content}
            </div>
          </motion.section>
        ))}
      </div>
    </>
  );
}
