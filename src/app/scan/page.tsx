"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Github, ExternalLink, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const SOURCE_META = {
  hn: {
    label: "HN Show",
    description: "Show-HN posts from the last 30 days — solo founders shipping demos.",
    icon: Sparkles,
  },
  github: {
    label: "GitHub trending",
    description: "AI repos created in the last 90 days, sorted by stars — builders shipping in public.",
    icon: Github,
  },
  huggingface: {
    label: "Hugging Face",
    description: "Trending Spaces — individual AI creators with traction.",
    icon: Sparkles,
  },
} as const;

type SourceId = keyof typeof SOURCE_META;

export default function ScanPage() {
  const [results, setResults] = useState<Awaited<ReturnType<typeof scan.mutateAsync>> | null>(null);

  const utils = trpc.useUtils();
  const scan = trpc.scan.run.useMutation({
    onSuccess: (data) => setResults(data),
    onError: (e) => toast.error(e.message),
  });

  const add = trpc.companies.createFromUrl.useMutation({
    onSuccess: () => {
      void utils.companies.list.invalidate();
      toast.success("Added to pipeline — research firing");
    },
    onError: (e) => toast.error(e.message),
  });

  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function handleAdd(url: string, name: string) {
    setAdding((prev) => new Set(prev).add(url));
    try {
      await add.mutateAsync({ url, notes: `Added from scan: ${name}` });
      setAdded((prev) => new Set(prev).add(url));
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  }

  const isScanning = scan.isPending;

  return (
    <>
      <Topbar
        title="Scan"
        actions={
          <Button
            size="sm"
            onClick={() => scan.mutate({ sources: ["hn", "github", "huggingface"] })}
            disabled={isScanning}
          >
            {isScanning ? "Scanning…" : "Scan all sources"}
          </Button>
        }
      />
      <div className="p-6 max-w-5xl space-y-6">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Sonar scans where AI-native founders show up <em>before</em> they fundraise. Three free
          sources, no Crunchbase, no Twitter, no LinkedIn — cost-awareness is a sourcing-engine
          feature. Hit <strong>Scan all sources</strong> and start adding candidates.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(SOURCE_META) as [SourceId, typeof SOURCE_META[SourceId]][]).map(
            ([id, meta]) => {
              const Icon = meta.icon;
              const stat = results?.bySource[id];
              return (
                <Card key={id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className="size-4" />
                      {meta.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                    {stat &&
                      (stat.ok ? (
                        <p className="text-xs text-primary">
                          {stat.count} candidate{stat.count === 1 ? "" : "s"}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">Error: {stat.error}</p>
                      ))}
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>

        {isScanning && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
            Fetching the 3 sources in parallel — typically 2–5 seconds.
          </div>
        )}

        {results && results.candidates.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-medium text-sm">
              Candidates ({results.candidates.length})
            </h2>
            <ul className="grid gap-3 lg:grid-cols-2">
              {results.candidates.map((c) => {
                const isAdded = added.has(c.url) || c.existingCompanyId !== null;
                const isAdding = adding.has(c.url);
                return (
                  <li
                    key={`${c.source}:${c.url}`}
                    className="rounded-md border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide font-medium",
                              c.source === "hn" && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                              c.source === "github" && "bg-foreground/10 text-foreground",
                              c.source === "huggingface" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                            )}
                          >
                            {c.source}
                          </span>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener"
                            className="font-medium text-sm hover:underline truncate"
                          >
                            {c.name}
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{c.snippet}</p>
                        <div className="flex gap-3 text-[11px] text-muted-foreground">
                          {c.founderHandle && (
                            <span>by {c.founderHandle}</span>
                          )}
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 hover:text-foreground"
                          >
                            source <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                      <div>
                        {c.existingCompanyId ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/companies/${c.existingCompanyId}`}>
                              <Check className="size-3" /> In pipeline
                            </Link>
                          </Button>
                        ) : isAdded ? (
                          <Button size="sm" variant="outline" disabled>
                            <Check className="size-3" /> Added
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAdd(c.url, c.name)}
                            disabled={isAdding}
                          >
                            {isAdding ? "Adding…" : (<><Plus className="size-3" /> Add</>)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {results && results.candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No candidates returned. Try again in a few minutes; the sources can be cache-cold or
            empty for short windows.
          </p>
        )}
      </div>
    </>
  );
}
