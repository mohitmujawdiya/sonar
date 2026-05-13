"use client";

// Placeholder while the full Quanta Fit scorecard component is being built.
// Renders a thin "research first" empty state. The real grid lands in the
// next task.

import { trpc } from "@/lib/trpc";

export function QuantaFitTab({ companyId }: { companyId: string }) {
  const research = trpc.research.byCompanyId.useQuery({ companyId });

  if (research.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!research.data?.quantaFit) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Run research first. The Quanta fit scorecard is synthesized from the 4 research artifacts + your thesis.
        </p>
      </div>
    );
  }

  return (
    <pre className="text-xs rounded-md border border-border bg-card p-4 overflow-auto">
      {JSON.stringify(research.data.quantaFit, null, 2)}
    </pre>
  );
}
