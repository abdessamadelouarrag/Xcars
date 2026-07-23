import { z } from "zod";
import { getTenantContext } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";

const notificationReadSchema = z
  .object({
    id: z.string().uuid().optional(),
    all: z.boolean().optional(),
  })
  .refine((input) => input.all === true || Boolean(input.id));

const PATCH = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const context = await getTenantContext();
  const input = notificationReadSchema.parse(await parseJson(request));

  const result = await db.notification.updateMany({
    where: {
      agencyId: context.agency.id,
      OR: [{ userId: null }, { userId: context.user.id }],
      readAt: null,
      ...(input.all ? {} : { id: input.id }),
    },
    data: { readAt: new Date() },
  });

  return jsonOk({ updated: result.count });
});

export { PATCH };
