import { useEffect, useState } from "react";

import App from "../App";
import { redirectHref, resolveAppRoute } from "../lib/routes";
import DiscoverPage from "../pages/DiscoverPage";

export default function AppRoutes() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const syncPath = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", syncPath);

    return () => {
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  const resolution = resolveAppRoute(pathname);

  if (resolution === "/app" || resolution === "/discover") {
    const next = redirectHref(resolution, window.location.search, window.location.hash);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (current !== next) {
      window.history.replaceState(null, "", next);
    }

    setPathname(resolution);
    return null;
  }

  if (resolution === "discover") return <DiscoverPage />;

  return <App />;
}
