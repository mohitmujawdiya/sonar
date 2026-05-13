import { db } from "../db";
import type { Prisma } from "@prisma/client";

export type ActivityType =
  | "company-created"
  | "company-updated"
  | "company-status-changed"
  | "contact-created"
  | "research-cached"
  | "scored"
  | "scoring-failed";

export async function logActivity(params: {
  type: ActivityType;
  companyId?: string;
  contactId?: string;
  payload?: Prisma.JsonValue;
}): Promise<void> {
  await db.activityLog.create({
    data: {
      type: params.type,
      companyId: params.companyId ?? null,
      contactId: params.contactId ?? null,
      payload: params.payload ?? undefined,
    },
  });
}
