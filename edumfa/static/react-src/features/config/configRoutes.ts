import type { ReactElement } from "react";

/**
 * One route of the config area. `path` is relative to `/config`
 * ("policies/list", "resolvers/ldap/:resolvername"); the app wires every
 * area's definitions under the `/config/*` route.
 */
export interface ConfigRouteDefinition {
  element: ReactElement;
  path: string;
}
