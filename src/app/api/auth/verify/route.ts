import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.toLowerCase();
  const rawToken = url.searchParams.get("token");
  const redirectUrl = new URL("/connexion", url.origin);

  if (!email || !rawToken) {
    redirectUrl.searchParams.set("error", "verification-invalid");
    return NextResponse.redirect(redirectUrl);
  }

  const token = await db.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashToken(rawToken),
      purpose: "EMAIL_VERIFICATION",
      expires: { gt: new Date() },
    },
  });

  if (!token) {
    redirectUrl.searchParams.set("error", "verification-expired");
    return NextResponse.redirect(redirectUrl);
  }

  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: token.identifier,
          token: token.token,
        },
      },
    }),
  ]);

  redirectUrl.searchParams.set("verified", "true");
  return NextResponse.redirect(redirectUrl);
}
