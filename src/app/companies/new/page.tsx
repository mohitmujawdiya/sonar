import { Topbar } from "@/components/layout/topbar";
import { AddViaUrl } from "@/components/companies/add-via-url";

export default function Page() {
  return (
    <>
      <Topbar title="Add deal" />
      <div className="p-6">
        <AddViaUrl />
        <p className="text-xs text-muted-foreground mt-12">
          Sonar will fetch the page, infer the company, and auto-fire all 4 research queries + the Quanta-fit scorecard. Takes 15–45 seconds.
        </p>
      </div>
    </>
  );
}
