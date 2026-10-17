import { RealmListPage } from "./RealmListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/** The `config.realms.*` states; the bare area path shows the list like the legacy redirect. */
export const realmConfigRoutes: ConfigRouteDefinition[] = [
  { element: <RealmListPage />, path: "realms" },
  { element: <RealmListPage />, path: "realms/list" }
];
