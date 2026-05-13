import { Topbar } from "@/components/layout/topbar";
import { FunnelSnapshotCard } from "@/components/dashboard/funnel-snapshot-card";
import { ConversionFunnelCard } from "@/components/dashboard/conversion-funnel-card";
import { TimeToAdvanceCard } from "@/components/dashboard/time-to-advance-card";

export default function Page() {
  return (
    <>
      <Topbar title="Conversion" />
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <FunnelSnapshotCard />
          <ConversionFunnelCard />
        </div>
        <TimeToAdvanceCard />
      </div>
    </>
  );
}
