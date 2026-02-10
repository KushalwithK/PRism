"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  FileText,
  History,
  ArrowRight,
  BarChart3,
  Zap,
  Calendar,
  Activity,
  GitPullRequest,
  TrendingUp,
  Crown,
  Gauge,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/app/auth-provider";

interface AnalyticsData {
  dailyUsage: Array<{ date: string; count: number }>;
  dailyTokens: Array<{ date: string; tokens: number }>;
  summary: {
    totalGenerations: number;
    totalTokens: number;
    avgTokensPerGeneration: number;
    periodStart: string;
    periodEnd: string;
  };
}

export default function PrismDashboardPage() {
  const { user, loading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(30);

  const fetchAnalytics = useCallback(async (days: number) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/usage/analytics?days=${days}`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch {
      // Analytics are optional
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchAnalytics(dateRange);
    }
  }, [loading, user, dateRange, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Unable to load profile.</p>
      </div>
    );
  }

  const sub = user.subscriptions.find((s) => s.productSlug === "prism");
  const isUnlimited = sub?.usageLimit === -1;
  const percentage =
    sub && !isUnlimited
      ? Math.min((sub.usageCount / sub.usageLimit) * 100, 100)
      : 0;
  const daysRemaining = sub
    ? Math.max(
        0,
        Math.ceil(
          (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86_400_000
        )
      )
    : 0;
  const totalDays = sub
    ? Math.max(
        1,
        Math.ceil(
          (new Date(sub.currentPeriodEnd).getTime() -
            new Date(sub.currentPeriodStart).getTime()) /
            86_400_000
        )
      )
    : 1;
  const periodProgress = Math.min(
    ((totalDays - daysRemaining) / totalDays) * 100,
    100
  );

  return (
    <>
      <AppHeader
        title={`Welcome back, ${user.name}`}
        description="Here's an overview of your PRism usage."
      />

      <div className="p-8 space-y-8">
        {/* Plan & Usage Section */}
        {sub && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Plan Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Crown size={20} />
                  </div>
                  <Badge
                    variant={
                      sub.status === "ACTIVE" ? "default" : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {sub.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold mt-0.5">{sub.plan}</p>
                {sub.plan === "FREE" && (
                  <Button size="sm" className="w-full mt-4" asChild>
                    <Link href="/products/prism/pricing">
                      <TrendingUp size={14} className="mr-1.5" />
                      Upgrade Plan
                    </Link>
                  </Button>
                )}
                {sub.plan !== "FREE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4"
                    asChild
                  >
                    <Link href="/dashboard/billing">Manage Plan</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Usage Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Gauge size={20} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isUnlimited
                      ? "Unlimited"
                      : `${Math.round(percentage)}% used`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Generations Used</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-2xl font-bold">{sub.usageCount}</p>
                  <p className="text-sm text-muted-foreground">
                    / {isUnlimited ? "\u221e" : sub.usageLimit}
                  </p>
                </div>
                {!isUnlimited && (
                  <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        percentage >= 90
                          ? "bg-destructive"
                          : percentage >= 70
                            ? "bg-amber-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                {isUnlimited && (
                  <div className="mt-4 h-2 rounded-full bg-primary/20 overflow-hidden">
                    <div className="h-full rounded-full bg-primary w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Period Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Calendar size={20} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(periodProgress)}% elapsed
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Billing Period
                </p>
                <p className="text-2xl font-bold mt-0.5">
                  {daysRemaining}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    days left
                  </span>
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(sub.currentPeriodStart).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-muted-foreground/30 transition-all duration-700"
                      style={{ width: `${periodProgress}%` }}
                    />
                  </div>
                  <span>
                    {new Date(sub.currentPeriodEnd).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Generations"
              value={analytics.summary.totalGenerations.toString()}
              sublabel="this period"
            />
            <StatCard
              icon={Zap}
              label="Tokens Used"
              value={formatNumber(analytics.summary.totalTokens)}
              sublabel="this period"
            />
            <StatCard
              icon={Calendar}
              label="Days Left"
              value={daysRemaining.toString()}
              sublabel="in period"
            />
            <StatCard
              icon={Activity}
              label="Avg Tokens"
              value={formatNumber(analytics.summary.avgTokensPerGeneration)}
              sublabel="per generation"
            />
          </div>
        )}

        {/* Usage Charts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Usage Analytics</h2>
            <div className="flex gap-1">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    dateRange === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : analytics ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Generations / Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={analytics.dailyUsage}>
                        <defs>
                          <linearGradient
                            id="usageGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--primary)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--primary)"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) =>
                            new Date(v).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelFormatter={(v) =>
                            new Date(v).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          fill="url(#usageGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tokens / Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.dailyTokens.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={analytics.dailyTokens}>
                        <defs>
                          <linearGradient
                            id="tokenGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--accent)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--accent)"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) =>
                            new Date(v).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelFormatter={(v) =>
                            new Date(v).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="tokens"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          fill="url(#tokenGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/prism/history" className="group">
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <History size={20} className="text-primary" />
                  <span className="text-sm font-medium">
                    Generation History
                  </span>
                  <ArrowRight
                    size={14}
                    className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-1"
                  />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/prism/templates" className="group">
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText size={20} className="text-primary" />
                  <span className="text-sm font-medium">Templates</span>
                  <ArrowRight
                    size={14}
                    className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-1"
                  />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/billing" className="group">
              <Card className="transition-colors hover:border-primary/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <GitPullRequest size={20} className="text-primary" />
                  <span className="text-sm font-medium">Billing & Plans</span>
                  <ArrowRight
                    size={14}
                    className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-1"
                  />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label} &middot; {sublabel}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
