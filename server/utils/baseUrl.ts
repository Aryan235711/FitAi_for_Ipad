export function sanitizeUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export function resolveBaseUrl() {
  const explicitUrl = process.env.PUBLIC_URL || process.env.APP_BASE_URL;
  if (explicitUrl) {
    return sanitizeUrl(explicitUrl);
  }

  if (process.env.REPLIT_DOMAINS) {
    return sanitizeUrl(`https://${process.env.REPLIT_DOMAINS}`);
  }

  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return sanitizeUrl(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return sanitizeUrl(process.env.RENDER_EXTERNAL_URL);
  }

  const railwayDomain =
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RAILWAY_STATIC_URL ||
    process.env.RAILWAY_PROJECT_DOMAIN;
  if (railwayDomain) {
    const trimmed = railwayDomain.startsWith("http")
      ? railwayDomain
      : `https://${railwayDomain}`;
    return sanitizeUrl(trimmed);
  }

  if (process.env.VERCEL_URL) {
    return sanitizeUrl(`https://${process.env.VERCEL_URL}`);
  }

  const port = process.env.PORT || "5000";
  return `http://localhost:${port}`;
}
