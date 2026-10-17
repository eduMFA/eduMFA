import { TokengroupEditPage } from "./TokengroupEditPage";
import { TokengroupListPage } from "./TokengroupListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/** The legacy `config.tokengroup.*` states; the bare path redirected to the list. */
export const tokengroupConfigRoutes: ConfigRouteDefinition[] = [
  { element: <TokengroupListPage />, path: "tokengroup" },
  { element: <TokengroupListPage />, path: "tokengroup/list" },
  { element: <TokengroupEditPage />, path: "tokengroup/edit" },
  { element: <TokengroupEditPage />, path: "tokengroup/edit/:groupname" }
];
