"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2 } from "lucide-react";

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full justify-start">
          <Link href="/deals/new"><Sparkles className="size-4" /> Evaluate a founder</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/deals"><Building2 className="size-4" /> Open the kanban</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
