import { z } from "zod";

const localUploadPattern =
  /^\/uploads\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(avif|ico|jpg|png|webp)$/i;

export const imageUrlSchema = z
  .string()
  .max(2_000)
  .refine((value) => {
    if (localUploadPattern.test(value)) return true;

    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "URL d’image invalide.");
