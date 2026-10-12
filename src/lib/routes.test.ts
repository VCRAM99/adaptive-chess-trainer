import { describe, expect, it } from "vitest";

import { redirectHref, resolveAppRoute } from "./routes";

describe("resolveAppRoute", () => {
  it("renders the trainer and the discover placeholder", () => {
    expect(resolveAppRoute("/app")).toBe("app");
    expect(resolveAppRoute("/app/")).toBe("app");
    expect(resolveAppRoute("/discover")).toBe("discover");
    expect(resolveAppRoute("/discover/")).toBe("discover");
  });

  it("sends the site root and unknown paths to the discover page", () => {
    expect(resolveAppRoute("/")).toBe("/discover");
    expect(resolveAppRoute("/profile")).toBe("/discover");
  });

  it("sends the previous trainer URL to /app", () => {
    expect(resolveAppRoute("/chesstrainer/app")).toBe("/app");
    expect(resolveAppRoute("/chesstrainer/app/")).toBe("/app");
  });
});

describe("redirectHref", () => {
  it("keeps the authentication query and fragment", () => {
    expect(redirectHref("/app", "?code=abc", "#access_token=token")).toBe(
      "/app?code=abc#access_token=token",
    );
    expect(redirectHref("/discover", "", "#recovery")).toBe("/discover#recovery");
  });
});
