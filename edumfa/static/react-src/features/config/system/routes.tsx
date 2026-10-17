import { SystemConfigPage } from "./SystemConfigPage";
import { SystemDocumentationPage } from "./SystemDocumentationPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/**
 * The system config routes (`config.system.edit`, `config.system.doc`).
 * The bare `system` path shows the config form because the legacy
 * controller redirected `/config/system` to `/config/system/edit`.
 */
export const systemConfigRoutes: ConfigRouteDefinition[] = [
  { element: <SystemConfigPage />, path: "system" },
  { element: <SystemConfigPage />, path: "system/edit" },
  { element: <SystemDocumentationPage />, path: "system/documentation" }
];
