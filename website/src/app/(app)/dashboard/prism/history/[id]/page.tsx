"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  ExternalLink,
  GitBranch,
  FileText,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import type { Generation } from "@prism/shared";

export default function GenerationDetailPage() {
  const params = useParams<{ id: string }>();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const res = await fetch(`/api/history/${params.id}`);
        if (res.ok) {
          setGeneration(await res.json());
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchGeneration();
  }, [params.id]);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Generation not found.</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader title={generation.prTitle} backHref="/dashboard/prism/history" />

      <div className="p-8 space-y-6">
        {/* Meta info */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Repository */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={generation.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline break-all"
              >
                {generation.repoUrl}
                <ExternalLink size={14} className="shrink-0" />
              </a>
            </CardContent>
          </Card>

          {/* Branches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <GitBranch size={14} className="text-muted-foreground" />
                {generation.baseBranch ? (
                  <>
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                      {generation.baseBranch}
                    </code>
                    <span className="text-muted-foreground">&larr;</span>
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                      {generation.compareBranch || "—"}
                    </code>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    No branch info available
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Platform & Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{generation.platform}</Badge>
                {generation.template?.name && (
                  <Badge variant="outline">
                    <FileText size={10} className="mr-1" />
                    {generation.template.name}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(generation.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Token Usage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <Zap size={14} className="text-accent" />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Prompt</p>
                    <p className="font-medium">
                      {generation.promptTokens?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Completion</p>
                    <p className="font-medium">
                      {generation.completionTokens?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="font-medium">
                      {generation.totalTokens?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PR Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">PR Description</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(generation.prDescription, "description")
                }
              >
                {copied === "description" ? (
                  <Check size={14} className="mr-1 text-green-500" />
                ) : (
                  <Copy size={14} className="mr-1" />
                )}
                {copied === "description" ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-sm font-mono text-foreground overflow-x-auto max-h-[500px] overflow-y-auto">
              {generation.prDescription}
            </pre>
          </CardContent>
        </Card>

        {/* Diff Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Diff Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(generation.diffSummary, "diff")
                }
              >
                {copied === "diff" ? (
                  <Check size={14} className="mr-1 text-green-500" />
                ) : (
                  <Copy size={14} className="mr-1" />
                )}
                {copied === "diff" ? "Copied" : "Copy"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-xs font-mono text-muted-foreground overflow-x-auto max-h-[400px] overflow-y-auto">
              {generation.diffSummary}
            </pre>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
