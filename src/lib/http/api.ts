import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/http/errors";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestUrl = new URL(request.url);

  if (fetchSite === "cross-site") {
    throw new AppError("Requête intersite refusée.", 403, "CSRF_REJECTED");
  }

  if (origin && new URL(origin).host !== requestUrl.host) {
    throw new AppError("Origine non autorisée.", 403, "CSRF_REJECTED");
  }
}

export async function parseJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new AppError("Le corps de la requête doit être un JSON valide.");
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Certaines informations sont invalides.",
          fields: error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      {
        status: error.status,
        headers:
          error.code === "RATE_LIMITED" && typeof error.details === "number"
            ? { "Retry-After": String(error.details) }
            : undefined,
      },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        error: {
          code: "ALREADY_EXISTS",
          message: "Une ressource utilisant ces informations existe déjà.",
        },
      },
      { status: 409 },
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Une erreur interne est survenue. Réessayez dans un instant.",
      },
    },
    { status: 500 },
  );
}

export function withApiErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
