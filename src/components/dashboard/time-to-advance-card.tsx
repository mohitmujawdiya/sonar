"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STAGE_ORDER = ["Sourced", "Researched", "Watching", "Met", "Passed"] as const;

function formatDuration(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)}h`;
  const d = h / 24;
  return `${d.toFixed(1)}d`;
}

export function TimeToAdvanceCard() {
  const q = trpc.dashboard.conversion.useQuery();

  if (q.isLoading || q.isPending || !q.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Time to advance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {STAGE_ORDER.map((s) => (
            <div key={s} className="h-4 bg-muted/60 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const byStage = new Map(q.data.dwell.map((d) => [d.stage, d]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Time to advance</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="text-sm divide-y divide-border">
          {STAGE_ORDER.map((stage) => {
            const row = byStage.get(stage);
            const value = row?.medianMs;
            const samples = row?.samples ?? 0;
            return (
              <div key={stage} className="flex items-baseline justify-between py-2 first:pt-0 last:pb-0">
                <dt className="font-medium">{stage}</dt>
                <dd className="tabular-nums text-right">
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span>{formatDuration(value)}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {samples} sample{samples === 1 ? "" : "s"}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="text-xs text-muted-foreground pt-3">
          Median time between entering a stage and advancing out of it. Deals currently sitting in a stage aren&apos;t counted.
        </p>
      </CardContent>
    </Card>
  );
}
