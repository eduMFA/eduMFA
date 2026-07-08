const defaultMigratedRoutes = ["/component/clienttype"];

export interface ReactBootstrapConfig {
  angularRootId: string;
  enabled: boolean;
  mountId: string;
  routes: string[];
}

export function normalizeHashRoute(hash: string): string {
  const trimmedHash = hash.trim();
  const withoutPrefix = trimmedHash.replace(/^#!/, "").replace(/^#/, "");
  const pathOnly = withoutPrefix.split("?")[0]?.split("#")[0] ?? "";
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  return normalized === "/" ? "/" : normalized.replace(/\/+$/, "");
}

export function readReactBootstrapConfig(
  documentRef: Document = document
): ReactBootstrapConfig {
  const mountId = "react-root";
  const mountNode = documentRef.getElementById(mountId);

  if (!(mountNode instanceof HTMLElement)) {
    return {
      angularRootId: "angular-root",
      enabled: false,
      mountId,
      routes: defaultMigratedRoutes
    };
  }

  return {
    angularRootId: mountNode.dataset.angularRootId ?? "angular-root",
    enabled: mountNode.dataset.reactEnabled === "true",
    mountId,
    routes: parseRouteList(mountNode.dataset.reactRoutes)
  };
}

function parseRouteList(routeList: string | undefined): string[] {
  if (!routeList) {
    return defaultMigratedRoutes;
  }

  const routes = routeList
    .split(",")
    .map((route) => normalizeHashRoute(route))
    .filter((route) => route.length > 1);

  return routes.length > 0 ? routes : defaultMigratedRoutes;
}
