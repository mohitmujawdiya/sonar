import { db } from "../db";
import type { Prisma } from "@prisma/client";

export type ActivityType =
  | "company-created"
  | "company-status-changed"
  | "contact-created"
  | "research-cached"
  | "scored"
  | "scan-added"
  | "manual-log";

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
