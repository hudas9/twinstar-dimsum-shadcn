export function getRequestUrl(req: Request): URL {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost";
  return new URL(req.url, base);
}

export function getSearchParams(req: Request): URLSearchParams {
  return getRequestUrl(req).searchParams;
}
