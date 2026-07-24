export function sanitizePlainText(value: string) {
  return value
    .replace(/\0/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
