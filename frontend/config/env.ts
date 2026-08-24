function normalizeApiUrl(url?: string): string {
  const base = url || "http://localhost:5000/api";
  const trimmed = base.replace(/\/+$/, "");
  // The backend mounts every route under /api. Normalize so misconfigured
  // env values (e.g. "...railway.app" without the prefix) still resolve.
  if (!/\/api$/.test(trimmed)) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

export const env = {
  baseURL: normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL),

  // Canonical public site URL used for SEO (sitemap, robots, Open Graph).
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://inveradigitalagency.com").replace(/\/+$/, ""),
};