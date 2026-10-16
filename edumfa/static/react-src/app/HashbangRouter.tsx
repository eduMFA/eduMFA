import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Router, type Navigator } from "react-router-dom";

import { readHashbangLocation, toHashbangHref } from "../lib/hashbang";

/**
 * Router for the coexistence shell. React Router's `HashRouter` only
 * understands `#/...`, but the legacy app addresses everything as
 * `#!/...`. This router reads and writes the hashbang form and navigates
 * through `window.location`, so Angular's `$location` receives the same
 * `hashchange` events and both routers stay in sync.
 */
export function HashbangRouter({ children }: PropsWithChildren) {
  const [location, setLocation] = useState(() =>
    readHashbangLocation(window.location.hash)
  );

  useEffect(() => {
    const syncLocation = () => {
      setLocation(readHashbangLocation(window.location.hash));
    };

    window.addEventListener("hashchange", syncLocation);
    syncLocation();

    return () => {
      window.removeEventListener("hashchange", syncLocation);
    };
  }, []);

  const navigator = useMemo<Navigator>(
    () => ({
      createHref: (to) => toHashbangHref(to),
      go: (delta) => {
        window.history.go(delta);
      },
      push: (to) => {
        window.location.hash = toHashbangHref(to);
      },
      replace: (to) => {
        window.location.replace(toHashbangHref(to));
      }
    }),
    []
  );

  return (
    <Router location={location} navigator={navigator}>
      {children}
    </Router>
  );
}
