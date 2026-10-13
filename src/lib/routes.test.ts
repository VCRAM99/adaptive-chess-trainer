import { describe, expect, it } from "vitest";

import { redirectHref, resolveAppRoute } from "./routes";

describe("resolveAppRoute", () => {
  it("renders the trainer at the site root and at /app", () => {
    expect(resolveAppRoute("/")).toBe("app");
    expect(resolveAppRoute("/app")).toBe("app");
    expect(resolveAppRoute("/app/")).toBe("app");
    expect(resolveAppRoute("/discover")).toBe("discover");
    expect(resolveAppRoute("/discover/")).toBe("discover");
  });

  it("sends unknown paths to the trainer", () => {
    expect(resolveAppRoute("/profile")).toBe("/");
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
    expect(redirectHref("/", "?code=abc", "#access_token=token")).toBe(
      "/?code=abc#access_token=token",
    );
  });
});
