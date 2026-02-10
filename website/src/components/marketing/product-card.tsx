"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
  status: "available" | "coming-soon";
  index?: number;
}

export function ProductCard({
  icon: Icon,
  name,
  description,
  href,
  status,
  index = 0,
}: ProductCardProps) {
  const isAvailable = status === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        href={isAvailable ? href : "#"}
        className={`group flex flex-col rounded-xl border border-border/50 bg-card p-6 dark:backdrop-blur-sm dark:bg-card/80 transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.6,.6,0,1)] ${
          isAvailable
            ? "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            : "opacity-60 cursor-default"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={24} />
          </div>
          {!isAvailable && <Badge variant="secondary">Coming Soon</Badge>}
        </div>

        <h3 className="mt-4 text-xl font-semibold">{name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {isAvailable && (
          <div className="mt-4 flex items-center text-sm font-medium text-primary">
            Learn more
            <ArrowRight
              size={14}
              className="ml-1 transition-transform group-hover:translate-x-1"
            />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
