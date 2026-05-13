"use client";

import { trpc } from "@/lib/trpc";
import { useIsMutating } from "@tanstack/react-query";
import { QuantaFitScorecard, type QuantaFit } from "./quanta-fit-scorecard";

export function QuantaFitTab({ companyId }: { companyId: string }) {
  const research = trpc.research.byCompanyId.useQuery({ companyId });

  const ensuringCount = useIsMutating({ mutationKey: [["research", "ensure"]] });
  const refreshingCount = useIsMutating({ mutationKey: [["research", "refresh"]] });
  const isResearching = ensuringCount > 0 || refreshingCount > 0;

  if (research.isLoading || research.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (isResearching) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-6 text-sm text-primary text-center">
        Synthesizing the 9-principle scorecard. The Quanta fit synthesis runs after the 4 research artifacts complete — total wait is typically 25–60 seconds from research start.
      </div>
    );
  }

  if (!research.data?.quantaFit) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          No Quanta fit yet.
        </p>
        <p className="text-xs text-muted-foreground">
          The 9-principle scorecard is synthesized automatically after research completes. If research is done but no fit is shown, refresh research from the Research tab.
        </p>
      </div>
    );
  }

  const fit = research.data.quantaFit as unknown as QuantaFit;

  return <QuantaFitScorecard fit={fit} />;
}
