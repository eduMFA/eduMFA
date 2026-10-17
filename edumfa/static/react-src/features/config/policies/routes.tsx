import { PolicyEditPage } from "./PolicyEditPage";
import { PolicyListPage } from "./PolicyListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

export const policyConfigRoutes: ConfigRouteDefinition[] = [
  { element: <PolicyListPage />, path: "policies" },
  { element: <PolicyListPage />, path: "policies/list" },
  { element: <PolicyEditPage />, path: "policies/add" },
  { element: <PolicyEditPage />, path: "policies/details/:policyname" }
];
