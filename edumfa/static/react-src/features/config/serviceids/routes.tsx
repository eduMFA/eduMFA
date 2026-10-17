import { ServiceIdEditPage } from "./ServiceIdEditPage";
import { ServiceIdListPage } from "./ServiceIdListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/** The legacy `config.serviceid.*` states; the bare path redirected to the list. */
export const serviceIdConfigRoutes: ConfigRouteDefinition[] = [
  { element: <ServiceIdListPage />, path: "serviceid" },
  { element: <ServiceIdListPage />, path: "serviceid/list" },
  { element: <ServiceIdEditPage />, path: "serviceid/edit" },
  { element: <ServiceIdEditPage />, path: "serviceid/edit/:servicename" }
];
