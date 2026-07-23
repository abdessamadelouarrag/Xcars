import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  avif: "image/avif",
  ico: "image/x-icon",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

type UploadRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(
  _request: Request,
  context: UploadRouteContext,
): Promise<Response> {
  const { path: segments } = await context.params;
  if (segments.length !== 2) {
    return new Response("Image introuvable", { status: 404 });
  }

  const [agencyId, filename] = segments;
  const agencyPattern = /^[a-f0-9-]{36}$/i;
  const filePattern = /^[a-f0-9-]{36}\.(avif|ico|jpg|png|webp)$/i;
  if (!agencyPattern.test(agencyId) || !filePattern.test(filename)) {
    return new Response("Image introuvable", { status: 404 });
  }

  const extension = filename.split(".").at(-1)?.toLowerCase();
  if (!extension || !contentTypes[extension]) {
    return new Response("Image introuvable", { status: 404 });
  }

  const uploadRoot = path.resolve(process.cwd(), "storage", "uploads");
  const filePath = path.resolve(uploadRoot, agencyId, filename);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return new Response("Image introuvable", { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension],
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new Response("Image introuvable", { status: 404 });
    }
    throw error;
  }
}
