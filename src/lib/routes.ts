export type TrainerRoute = "app" | "discover";

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

/**
 * `/` and `/app` render the trainer. `/discover` renders the marketing page.
 * The old trainer URL redirects to `/app` so an authentication fragment stays
 * on the path Supabase is allowed to return to. Any other path opens the trainer.
 */
export function resolveAppRoute(pathname: string): TrainerRoute | "/app" | "/" {
  const path = normalizePathname(pathname);

  if (path === "/" || path === "/app") return "app";
  if (path === "/discover") return "discover";
  if (path === "/chesstrainer/app") return "/app";

  return "/";
}

/** Keeps the query string and fragment when replacing the path. */
export function redirectHref(pathname: "/app" | "/", search = "", hash = ""): string {
  return `${pathname}${search}${hash}`;
}
