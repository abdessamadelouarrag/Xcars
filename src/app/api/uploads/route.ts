import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { requireTenantPermission } from "@/lib/auth/tenant";
import { AppError } from "@/lib/http/errors";
import {
  assertSameOrigin,
  jsonOk,
  withApiErrorHandling,
} from "@/lib/http/api";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/x-icon",
]);

const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/x-icon": "ico",
};

const POST = withApiErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const formData = await request.formData();
  const scope = formData.get("scope");
  const tenant = await requireTenantPermission(
    scope === "theme" ? "theme:update" : "vehicles:update",
  );
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new AppError("Aucun fichier image reçu.");
  }
  if (!allowedTypes.has(file.type)) {
    throw new AppError("Format refusé. Utilisez JPEG, PNG, WebP, AVIF ou ICO.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new AppError("L’image dépasse la taille maximale de 8 Mo.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const buffer = Buffer.from(await file.arrayBuffer());
  const useLocalStorage =
    process.env.UPLOAD_STORAGE === "local" ||
    (!cloudName && !apiKey && !apiSecret && process.env.NODE_ENV !== "production");

  if (useLocalStorage) {
    const extension = fileExtensions[file.type];
    const filename = `${randomUUID()}.${extension}`;
    const relativeDirectory = path.join("uploads", tenant.agency.id);
    const uploadDirectory = path.join(
      process.cwd(),
      "storage",
      relativeDirectory,
    );

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), buffer, {
      flag: "wx",
    });

    const relativePath = `${relativeDirectory.replaceAll("\\", "/")}/${filename}`;
    return jsonOk({
      url: `/${relativePath}`,
      publicId: `local:${relativePath}`,
      width: null,
      height: null,
    });
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(
      "Le stockage d’images n’est pas configuré.",
      503,
      "UPLOAD_NOT_CONFIGURED",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: `xcars/${tenant.agency.id}`,
    resource_type: "image",
    transformation: [{ width: 2000, height: 1400, crop: "limit", quality: "auto" }],
  });

  return jsonOk({
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
  });
});

export { POST };
