import { Topbar } from "@/components/layout/topbar";
import { AddViaUrl } from "@/components/companies/add-via-url";

export default function Page() {
  return (
    <>
      <Topbar title="Evaluate a founder" />
      <div className="p-6 space-y-4">
        <AddViaUrl />
        <p className="text-xs text-muted-foreground max-w-xl">
          Sonar runs 4 OpenAI web-search queries — overview, momentum signal, founder content, founder pedigree — then synthesizes a 9-principle Quanta-fit scorecard. About 30 seconds.
        </p>
      </div>
    </>
  );
}
