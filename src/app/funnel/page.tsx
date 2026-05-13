import { Topbar } from "@/components/layout/topbar";
import { FunnelSnapshotCard } from "@/components/dashboard/funnel-snapshot-card";

export default function Page() {
  return (
    <>
      <Topbar title="Conversion" />
      <div className="p-6 max-w-md">
        <FunnelSnapshotCard />
        <p className="text-xs text-muted-foreground mt-4">
          Deeper conversion analytics (stage-to-stage transition rates, average dwell time per stage) land if Sonar lives past the demo.
        </p>
      </div>
    </>
  );
}
