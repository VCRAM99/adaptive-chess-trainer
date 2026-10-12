/**
 * Public URL for a file in `public/`.
 * Vite `base` is `/` in development, tests, and production.
 */
export function publicAssetUrl(assetPath: string, base = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const relativePath = assetPath.replace(/^\/+/, "");

  return `${prefix}${relativePath}`;
}

/** Path the chess trainer is served from. Auth providers return here. */
export const TRAINER_PATH = "/app";

/** Absolute URL auth providers should send the browser back to. */
export function appRedirectUrl(origin?: string): string {
  const resolvedOrigin = origin ?? window.location.origin;

  return new URL(TRAINER_PATH, resolvedOrigin).href;
}
