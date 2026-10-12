import { describe, expect, it } from "vitest";

import robots from "../../public/robots.txt?raw";
import sitemap from "../../public/sitemap.xml?raw";
import { injectRouteMeta, ROUTE_META, SOCIAL_IMAGE_URL } from "./siteMeta";

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <!--route-meta-->
    <title>placeholder</title>
    <!--/route-meta-->
  </head>
  <body></body>
</html>`;

describe("route metadata", () => {
  it("describes the marketing page and the trainer separately", () => {
    expect(ROUTE_META.discover.title).toBe(
      "Adaptive Chess Trainer | Train Smarter. Play Stronger.",
    );
    expect(ROUTE_META.discover.canonical).toBe("https://chess.varunsr.com/discover");
    expect(ROUTE_META.app.title).toBe("Play Chess | Adaptive Chess Trainer");
    expect(ROUTE_META.app.canonical).toBe("https://chess.varunsr.com/app");
    expect(SOCIAL_IMAGE_URL).toBe("https://chess.varunsr.com/og-image.jpg");
  });

  it("puts one set of social tags into the initial HTML for each route", () => {
    for (const route of ["discover", "app"] as const) {
      const html = injectRouteMeta(SAMPLE_HTML, route);
      const meta = ROUTE_META[route];

      expect(html).not.toContain("route-meta");
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html).toContain(`<title>${meta.title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${meta.canonical}" />`);
      expect(html.match(/property="og:title"/g)).toHaveLength(1);
      expect(html.match(/property="og:image"/g)).toHaveLength(1);
      expect(html).toContain(`property="og:url" content="${meta.canonical}"`);
      expect(html).toContain(
        'property="og:image" content="https://chess.varunsr.com/og-image.jpg"',
      );
      expect(html).toContain('property="og:image:width" content="1200"');
      expect(html).toContain('property="og:image:height" content="630"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
    }

    const discover = injectRouteMeta(SAMPLE_HTML, "discover");
    const app = injectRouteMeta(SAMPLE_HTML, "app");

    expect(discover).not.toContain(ROUTE_META.app.title);
    expect(app).not.toContain(ROUTE_META.discover.title);
    expect(discover).toContain('name="theme-color" content="#050507"');
    expect(app).not.toContain("theme-color");
  });
});

describe("search indexing files", () => {
  it("lets crawlers find the marketing page and leaves the trainer out of the sitemap", () => {
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /app");
    expect(robots).toContain("Sitemap: https://chess.varunsr.com/sitemap.xml");
    expect(sitemap).toContain("<loc>https://chess.varunsr.com/discover</loc>");
    expect(sitemap).not.toContain("/app");
    expect(sitemap).not.toContain("chesstrainer");
    expect(sitemap).not.toContain("<lastmod>");
  });
});
