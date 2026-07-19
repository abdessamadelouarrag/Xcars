import { hash } from "bcryptjs";
import { ThemePreset, ThemeVersionStatus } from "@prisma/client";
import { AppError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  parseJson,
  withApiErrorHandling,
} from "@/lib/http/api";
import { db } from "@/lib/db";
import { verificationEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import {
  checkRateLimit,
  requestFingerprint,
} from "@/lib/security/rate-limit";
import { createToken, hashToken } from "@/lib/security/tokens";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { registerSchema } from "@/lib/validation/auth";

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  if (process.env.NODE_ENV === "production") {
    const rateLimit = checkRateLimit({
      key: requestFingerprint(request, "register"),
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.success) {
      throw new AppError(
        "Trop de tentatives. Réessayez plus tard.",
        429,
        "RATE_LIMITED",
        rateLimit.retryAfterSeconds,
      );
    }
  }

  const input = registerSchema.parse(await parseJson(request));
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(
      "Un compte existe déjà avec cette adresse e-mail.",
      409,
      "EMAIL_ALREADY_USED",
    );
  }

  const [slugExists, passwordHash] = await Promise.all([
    db.agency.findUnique({ where: { slug: input.slug }, select: { id: true } }),
    hash(input.password, 12),
  ]);
  if (slugExists) {
    throw new AppError(
      "Cette adresse d’agence est déjà utilisée.",
      409,
      "SLUG_ALREADY_USED",
    );
  }

  const rawToken = createToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: sanitizePlainText(input.name),
        email: input.email,
        passwordHash,
        role: "OWNER",
      },
    });

    await tx.agency.create({
      data: {
        ownerId: createdUser.id,
        name: sanitizePlainText(input.agencyName),
        slug: input.slug,
        onboardingStep: 1,
        members: {
          create: {
            userId: createdUser.id,
            role: "OWNER",
            permissions: ["*"],
          },
        },
        settings: { create: { contactEmail: input.email } },
        themes: {
          create: {
            version: 1,
            status: ThemeVersionStatus.DRAFT,
            preset: ThemePreset.MINIMAL,
            createdById: createdUser.id,
            visibleSections: {
              search: true,
              featured: true,
              categories: true,
              benefits: true,
              testimonials: true,
              cta: true,
              contact: true,
            },
            sectionOrder: [
              "search",
              "featured",
              "categories",
              "benefits",
              "testimonials",
              "cta",
              "contact",
            ],
          },
        },
      },
    });

    await tx.verificationToken.create({
      data: {
        identifier: input.email,
        token: hashToken(rawToken),
        expires,
        purpose: "EMAIL_VERIFICATION",
      },
    });

    return createdUser;
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const verificationUrl = new URL("/api/auth/verify", appUrl);
  verificationUrl.searchParams.set("email", input.email);
  verificationUrl.searchParams.set("token", rawToken);

  const delivery = await sendEmail({
    to: input.email,
    subject: "Vérifiez votre adresse e-mail",
    html: verificationEmail({
      name: user.name,
      actionUrl: verificationUrl.toString(),
    }),
  });

  return jsonOk(
    {
      message:
        delivery.delivered
          ? "Compte créé. Consultez votre boîte e-mail pour activer votre accès."
          : process.env.NODE_ENV === "development"
            ? "Compte créé. Utilisez le lien local ci-dessous pour activer votre accès."
            : "Compte créé, mais l’e-mail n’a pas pu être envoyé. Demandez un nouveau lien.",
      emailDelivered: delivery.delivered,
      developmentVerificationUrl:
        process.env.NODE_ENV === "development"
          ? verificationUrl.toString()
          : undefined,
    },
    { status: 201 },
  );
});

export { POST };
