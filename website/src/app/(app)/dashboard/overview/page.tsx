"use client";

import { AppHeader } from "@/components/app/app-header";
import { Sparkles } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <>
      <AppHeader
        title="Dashboard"
        description="Unified view across all applications"
      />

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center max-w-md shadow-[0_0_40px_-10px_rgba(139,92,246,0.1)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={32} />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Coming Soon</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            A unified view of all your applications&apos; analytics and activity
            will be available here.
          </p>
        </div>
      </div>
    </>
  );
}
