export type DomainTenantResolution =
  | { type: "platform"; slug: string }
  | { type: "custom-domain"; hostname: string };

export function resolveTenantRequest(
  hostname: string,
  pathname: string,
): DomainTenantResolution | null {
  const agencyMatch = pathname.match(/^\/agence\/([^/]+)/);
  if (agencyMatch?.[1]) {
    return { type: "platform", slug: agencyMatch[1] };
  }

  const normalizedHost = hostname.split(":")[0]?.toLowerCase();
  if (
    normalizedHost &&
    !["localhost", "xcars.app", "www.xcars.app"].includes(normalizedHost)
  ) {
    return { type: "custom-domain", hostname: normalizedHost };
  }
  return null;
}
