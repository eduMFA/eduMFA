import type { ConfigRouteDefinition } from "./configRoutes";
import { caConnectorConfigRoutes } from "@/features/config/caconnectors/routes";
import { eventConfigRoutes } from "@/features/config/events/routes";
import { machineResolverConfigRoutes } from "@/features/config/machineresolvers/routes";
import { periodicTaskConfigRoutes } from "@/features/config/periodictasks/routes";
import { policyConfigRoutes } from "@/features/config/policies/routes";
import { realmConfigRoutes } from "@/features/config/realms/routes";
import { resolverConfigRoutes } from "@/features/config/resolvers/routes";
import { serverConfigRoutes } from "@/features/config/servers/routes";
import { serviceIdConfigRoutes } from "@/features/config/serviceids/routes";
import { systemConfigRoutes } from "@/features/config/system/routes";
import { tokengroupConfigRoutes } from "@/features/config/tokengroups/routes";
import { tokenConfigRoutes } from "@/features/config/tokens/routes";

/**
 * All routes of the config area, relative to `/config`. Each area exports
 * its own definitions; `app/routes.tsx` mounts them inside `ConfigLayout`.
 */
export const configRouteTable: ConfigRouteDefinition[] = [
  ...systemConfigRoutes,
  ...eventConfigRoutes,
  ...periodicTaskConfigRoutes,
  ...policyConfigRoutes,
  ...serverConfigRoutes,
  ...caConnectorConfigRoutes,
  ...serviceIdConfigRoutes,
  ...tokengroupConfigRoutes,
  ...tokenConfigRoutes,
  ...machineResolverConfigRoutes,
  ...resolverConfigRoutes,
  ...realmConfigRoutes
];
