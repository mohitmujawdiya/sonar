import { Topbar } from "@/components/layout/topbar";
import { Kanban } from "@/components/companies/kanban";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DealsPage() {
  return (
    <>
      <Topbar
        title="Deals"
        actions={
          <Button asChild size="sm">
            <Link href="/deals/new">+ Add deal</Link>
          </Button>
        }
      />
      <Kanban />
    </>
  );
}
