export const SITE_ORIGIN = "https://chess.varunsr.com";

export const SOCIAL_IMAGE_PATH = "/og-image.jpg";

export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}${SOCIAL_IMAGE_PATH}`;

export const SOCIAL_IMAGE_WIDTH = 1200;

export const SOCIAL_IMAGE_HEIGHT = 630;

export const SOCIAL_IMAGE_ALT =
  "Adaptive Chess Trainer. Train smarter. Play stronger. Destrier, a chess knight lifting a barbell.";

export type PublicRoute = "discover" | "app";

export type RouteMeta = {
  title: string;
  description: string;
  canonical: string;
  themeColor?: string;
};

export const ROUTE_META: Record<PublicRoute, RouteMeta> = {
  discover: {
    title: "Adaptive Chess Trainer | Train Smarter. Play Stronger.",
    description:
      "Discover Adaptive Chess Trainer, featuring an adaptive chess opponent, personalized difficulty modes, and Stockfish-powered move analysis.",
    canonical: `${SITE_ORIGIN}/discover`,
    themeColor: "#050507",
  },
  app: {
    title: "Play Chess | Adaptive Chess Trainer",
    description:
      "Play against an adaptive chess opponent that adjusts to your estimated skill, with Stockfish-powered analysis and personalized training.",
    canonical: `${SITE_ORIGIN}/app`,
  },
};

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

/** Static head tags for one route. Crawlers read these from the HTML response. */
export function renderRouteHead(route: PublicRoute): string {
  const meta = ROUTE_META[route];
  const title = escapeAttribute(meta.title);
  const description = escapeAttribute(meta.description);
  const image = escapeAttribute(SOCIAL_IMAGE_URL);
  const alt = escapeAttribute(SOCIAL_IMAGE_ALT);
  const theme = meta.themeColor
    ? `\n    <meta name="theme-color" content="${meta.themeColor}" />`
    : "";

  return `    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${meta.canonical}" />${theme}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Adaptive Chess Trainer" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${meta.canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${SOCIAL_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${SOCIAL_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="${alt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;
}

const ROUTE_META_PATTERN = /<!--route-meta-->[\s\S]*?<!--\/route-meta-->/;

export function injectRouteMeta(html: string, route: PublicRoute): string {
  if (!ROUTE_META_PATTERN.test(html)) {
    throw new Error("index.html is missing the route-meta markers");
  }

  return html.replace(ROUTE_META_PATTERN, renderRouteHead(route));
}
