import { HostsMachineResolverPage } from "./HostsMachineResolverPage";
import { LdapMachineResolverPage } from "./LdapMachineResolverPage";
import { MachineResolverListPage } from "./MachineResolverListPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/** The `config.mresolvers.*` states; the bare area path shows the list like the legacy redirect. */
export const machineResolverConfigRoutes: ConfigRouteDefinition[] = [
  { element: <MachineResolverListPage />, path: "machineresolvers" },
  { element: <MachineResolverListPage />, path: "machineresolvers/list" },
  { element: <HostsMachineResolverPage />, path: "machineresolvers/hosts" },
  {
    element: <HostsMachineResolverPage />,
    path: "machineresolvers/hosts/:resolvername"
  },
  { element: <LdapMachineResolverPage />, path: "machineresolvers/ldap" },
  { element: <LdapMachineResolverPage />, path: "machineresolvers/ldap/:resolvername" }
];
