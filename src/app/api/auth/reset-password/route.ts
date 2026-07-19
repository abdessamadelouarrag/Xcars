import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { AppError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { hashToken } from "@/lib/security/tokens";
import { resetPasswordSchema } from "@/lib/validation/auth";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const input = resetPasswordSchema.parse(await parseJson(request));
  const tokenHash = hashToken(input.token);
  const token = await db.verificationToken.findFirst({
    where: {
      identifier: input.email,
      token: tokenHash,
      purpose: "PASSWORD_RESET",
      expires: { gt: new Date() },
    },
  });

  if (!token) {
    throw new AppError(
      "Ce lien est invalide ou a expiré.",
      400,
      "RESET_TOKEN_INVALID",
    );
  }

  const passwordHash = await hash(input.password, 12);
  await db.$transaction([
    db.user.update({
      where: { email: input.email },
      data: { passwordHash },
    }),
    db.verificationToken.deleteMany({
      where: {
        identifier: input.email,
        purpose: "PASSWORD_RESET",
      },
    }),
    db.session.deleteMany({
      where: { user: { email: input.email } },
    }),
  ]);

  return jsonOk({ message: "Votre mot de passe a été mis à jour." });
});

export { POST };
