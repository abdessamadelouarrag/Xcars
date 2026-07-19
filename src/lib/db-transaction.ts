import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3,
) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      attempt += 1;
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!retryable || attempt >= maxAttempts) throw error;
    }
  }
  throw new Error("Transaction retry limit reached.");
}
