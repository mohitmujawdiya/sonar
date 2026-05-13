"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STAGE_ORDER = ["Sourced", "Researched", "Watching", "Met", "Passed"] as const;

export function FunnelSnapshotCard() {
  const summary = trpc.dashboard.summary.useQuery();

  if (summary.isLoading || summary.isPending || !summary.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STAGE_ORDER.map((s) => (
            <div key={s} className="flex justify-between">
              <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
              <div className="h-3 w-6 bg-muted/60 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const byStatus = new Map(summary.data.companies.byStatus.map((s) => [s.status, s.count]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="text-sm space-y-1">
          {STAGE_ORDER.map((s) => (
            <div key={s} className="flex justify-between">
              <dt>{s}</dt>
              <dd className="tabular-nums">{byStatus.get(s) ?? 0}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-1 mt-1">
            <dt>Total deals</dt>
            <dd className="tabular-nums">{summary.data.companies.total}</dd>
          </div>
        </dl>
        <Button asChild size="sm" variant="outline">
          <Link href="/deals">Open kanban →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
