export function isUuid(input: string): boolean {
  const v = String(input || "").trim();
  if (!v) return false;
  // Accept any RFC4122 UUID variant/version (1-5) with hyphens.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
