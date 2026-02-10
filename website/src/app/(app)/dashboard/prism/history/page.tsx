"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatRelativeDate } from "@/lib/utils";
import {
  History,
  GitPullRequest,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Generation, PaginatedResponse } from "@prism/shared";

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/history?page=${page}&pageSize=10`
        );
        if (res.ok) {
          const data: PaginatedResponse<Generation> = await res.json();
          setGenerations(data.data);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [page]);

  return (
    <>
      <AppHeader
        title="Generation History"
        description={`${total} generation${total !== 1 ? "s" : ""} total`}
      />

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : generations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/50 py-16 text-center">
            <History size={40} className="mx-auto text-muted-foreground/40" />
            <p className="mt-4 font-medium text-muted-foreground">
              No generations yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Use the PRism browser extension to generate your first AI-powered
              PR description. It&apos;ll show up here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {generations.map((gen) => (
                <Link
                  key={gen.id}
                  href={`/dashboard/prism/history/${gen.id}`}
                  className="group block rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <GitPullRequest
                          size={16}
                          className="shrink-0 text-primary"
                        />
                        <h3 className="font-medium truncate">{gen.prTitle}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground truncate pl-6">
                        {gen.repoUrl}
                      </p>
                      {(gen.baseBranch || gen.compareBranch) && (
                        <p className="mt-0.5 text-xs text-muted-foreground pl-6">
                          {gen.baseBranch && (
                            <span className="font-mono">{gen.baseBranch}</span>
                          )}
                          {gen.baseBranch && gen.compareBranch && " \u2190 "}
                          {gen.compareBranch && (
                            <span className="font-mono">
                              {gen.compareBranch}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary">{gen.platform}</Badge>
                        {gen.template?.name && (
                          <Badge variant="outline" className="text-[10px]">
                            {gen.template.name}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeDate(gen.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
