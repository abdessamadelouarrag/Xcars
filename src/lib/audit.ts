import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  agencyId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

export async function writeAuditLog({
  request,
  ...input
}: AuditInput) {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  await db.auditLog.create({
    data: {
      ...input,
      metadata: input.metadata,
      ipAddress: forwardedFor?.split(",")[0]?.trim(),
      userAgent: request?.headers.get("user-agent")?.slice(0, 500),
    },
  });
}
