/**
 * Public URL for a file in `public/`, using Vite's `base`.
 * Local development and tests use `/`. Production uses `/chesstrainer/app/`.
 */
export function publicAssetUrl(assetPath: string, base = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const relativePath = assetPath.replace(/^\/+/, "");

  return `${prefix}${relativePath}`;
}

/** Absolute URL auth providers should send the browser back to. */
export function appRedirectUrl(origin?: string, base = import.meta.env.BASE_URL): string {
  const resolvedOrigin = origin ?? window.location.origin;
  const path = base.endsWith("/") ? base : `${base}/`;

  return new URL(path, resolvedOrigin).href;
}
