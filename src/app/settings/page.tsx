"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SettingsPage() {
  const profile = trpc.profile.get.useQuery();
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Thesis saved");
      profile.refetch();
    },
  });

  const [thesisMarkdown, setThesisMarkdown] = useState("");

  useEffect(() => {
    if (profile.data) {
      setThesisMarkdown(profile.data.thesisMarkdown ?? "");
    }
  }, [profile.data]);

  if (profile.isLoading) return null;

  return (
    <>
      <Topbar title="Thesis" />
      <div className="max-w-3xl p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="font-medium">Investment thesis</h2>
          <p className="text-xs text-muted-foreground">
            The narrative + culture principles Sonar uses to score founders. The 9-principle grid editor lands in the UI restructure task; for now this textarea holds the raw thesis content.
          </p>
          <Textarea
            value={thesisMarkdown}
            onChange={(e) => setThesisMarkdown(e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        </section>

        <Button
          onClick={() => {
            if (
              confirm(
                "Overwriting the thesis changes how every future deal gets scored — and how every existing deal would re-score on refresh. Continue?",
              )
            ) {
              update.mutate({ thesisMarkdown });
            }
          }}
          disabled={update.isPending}
        >
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </>
  );
}
