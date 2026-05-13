"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConversionFunnelCard() {
  const q = trpc.dashboard.conversion.useQuery();

  if (q.isLoading || q.isPending || !q.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Funnel conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-muted/60 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { funnel } = q.data;
  const top = funnel[0]?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Funnel conversion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {funnel.map((row) => {
          const width = top > 0 ? (row.count / top) * 100 : 0;
          return (
            <div key={row.stage} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{row.stage}</span>
                <span className="text-muted-foreground tabular-nums">
                  {row.count} deal{row.count === 1 ? "" : "s"}
                  {row.rate !== null && (
                    <span className="ml-2 text-foreground">
                      {Math.round(row.rate * 100)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
        {q.data.passRate !== null && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {q.data.passedCount} of {q.data.total} ever marked Passed
            <span className="ml-1">({Math.round(q.data.passRate * 100)}%)</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
