"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { type RouterOutputs } from "@/lib/trpc-types";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ResearchTab } from "./research-tab";
import { QuantaFitTab } from "./quanta-fit-tab";
import { Markdown } from "@/components/ui/markdown";

type Company = RouterOutputs["companies"]["byId"];

const NEXT_STAGES = ["Researched", "Watching", "Met", "Passed"] as const;

export function CompanyTabs({ company }: { company: Company }) {
  const utils = trpc.useUtils();
  const setStatus = trpc.companies.setStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await Promise.all([
        utils.companies.byId.cancel({ id }),
        utils.companies.list.cancel(),
      ]);
      const previousById = utils.companies.byId.getData({ id });
      const previousList = utils.companies.list.getData();
      if (previousById) {
        utils.companies.byId.setData({ id }, { ...previousById, status });
      }
      utils.companies.list.setData(undefined, (old) =>
        old?.map((c) => (c.id === id ? { ...c, status } : c)),
      );
      return { previousById, previousList };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousById) utils.companies.byId.setData({ id: company.id }, ctx.previousById);
      if (ctx?.previousList) utils.companies.list.setData(undefined, ctx.previousList);
      toast.error(err.message);
    },
    onSettled: () => {
      void utils.companies.byId.invalidate({ id: company.id });
      void utils.companies.list.invalidate();
    },
  });
  const remove = trpc.companies.remove.useMutation({
    onMutate: async ({ id }) => {
      await utils.companies.list.cancel();
      const previousList = utils.companies.list.getData();
      utils.companies.list.setData(undefined, (old) => old?.filter((c) => c.id !== id));
      return { previousList };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousList) utils.companies.list.setData(undefined, ctx.previousList);
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Deal removed");
      window.location.href = "/companies";
    },
  });

  return (
    <div className="space-y-4 p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{company.name}</h2>
          {company.contacts.length > 0 && (
            <p className="text-sm font-medium text-foreground">
              {company.contacts.map((c) => c.name).join(" · ")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {company.domain ?? "no domain"}{company.sector && ` · ${company.sector}`}
            {company.stage && ` · ${company.stage}`}
          </p>
          <div className="flex gap-3 text-xs text-muted-foreground pt-1">
            {company.headcount !== null && <span>{company.headcount} people</span>}
            {company.fitScore !== null && (
              <span>
                Quanta fit:&nbsp;<span className="font-medium text-foreground">{company.fitScore}/100</span>
              </span>
            )}
            {company.sourceUrl && (
              <a href={company.sourceUrl} target="_blank" rel="noopener" className="underline hover:text-foreground">
                source ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {NEXT_STAGES.map((s) => (
            <Button
              key={s}
              variant={company.status === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus.mutate({ id: company.id, status: s })}
            >
              {s}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={remove.isPending}
            onClick={() => confirm("Remove this deal?") && remove.mutate({ id: company.id })}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="research">
        <TabsList>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="quanta-fit">Quanta fit</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-4">
          <ResearchTab companyId={company.id} />

          <section className="space-y-2 rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Founders ({company.contacts.length})</h3>
              <AddContactDialog companyId={company.id} />
            </div>
            {company.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No founders linked yet. Add one to surface their LinkedIn and Twitter on this card.</p>
            ) : (
              <ul className="divide-y border rounded-md">
                {company.contacts.map((c) => (
                  <li key={c.id} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role ?? "—"}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {c.linkedinUrl && (
                        <a href={c.linkedinUrl} target="_blank" rel="noopener" className="hover:text-foreground">LinkedIn ↗</a>
                      )}
                      {c.twitterUrl && (
                        <a href={c.twitterUrl} target="_blank" rel="noopener" className="hover:text-foreground">X ↗</a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="quanta-fit" className="space-y-2">
          <QuantaFitTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {company.notes ? <Markdown>{company.notes}</Markdown> : <p className="text-sm text-muted-foreground">No notes.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
