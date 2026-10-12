export type TrainerRoute = "app" | "discover";

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

/**
 * `/app` and `/discover` render in the client.
 * Every other path redirects. The old trainer URL redirects to `/app`
 * so an authentication fragment on that URL is not sent to the placeholder.
 */
export function resolveAppRoute(pathname: string): TrainerRoute | "/app" | "/discover" {
  const path = normalizePathname(pathname);

  if (path === "/app") return "app";
  if (path === "/discover") return "discover";
  if (path === "/chesstrainer/app") return "/app";

  return "/discover";
}

/** Keeps the query string and fragment when replacing the path. */
export function redirectHref(pathname: "/app" | "/discover", search = "", hash = ""): string {
  return `${pathname}${search}${hash}`;
}
