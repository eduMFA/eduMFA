import { TokenConfigPage } from "./TokenConfigPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

export const tokenConfigRoutes: ConfigRouteDefinition[] = [
  { element: <TokenConfigPage />, path: "tokens" },
  { element: <TokenConfigPage />, path: "tokens/:tokentype" }
];
