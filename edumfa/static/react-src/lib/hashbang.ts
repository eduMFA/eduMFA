import { createPath, parsePath, type Location, type To } from "react-router-dom";

/**
 * AngularJS 1.8 keeps its default `$locationProvider.hashPrefix("!")`, so
 * every address in the legacy app looks like `#!/user/list`. Angular rewrites
 * plain `#/...` hashes into `#!#%2F...`, which neither router understands, so
 * React must emit the hashbang form as well.
 */
export const HASHBANG_PREFIX = "#!";

export function hashHref(path: string): string {
  return `${HASHBANG_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toHashbangHref(to: To): string {
  return hashHref(typeof to === "string" ? to : createPath(to));
}

/** Parses `#!/path?search` (or the legacy `#/path`) into a router location. */
export function readHashbangLocation(hash: string): Location {
  const withoutPrefix = hash.replace(/^#!?/, "");
  const path = parsePath(
    withoutPrefix.startsWith("/") ? withoutPrefix : `/${withoutPrefix}`
  );

  return {
    hash: path.hash ?? "",
    key: "default",
    pathname: path.pathname ?? "/",
    search: path.search ?? "",
    state: null
  };
}
