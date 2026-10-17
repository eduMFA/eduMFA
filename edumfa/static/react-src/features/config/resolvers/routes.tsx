import { HttpResolverPage } from "./HttpResolverPage";
import { LdapResolverPage } from "./LdapResolverPage";
import { PasswdResolverPage } from "./PasswdResolverPage";
import { ResolverListPage } from "./ResolverListPage";
import { ScimResolverPage } from "./ScimResolverPage";
import { SqlResolverPage } from "./SqlResolverPage";
import type { ConfigRouteDefinition } from "@/features/config/configRoutes";

/**
 * The user resolver routes of the config area (legacy `config.resolvers.*`
 * states). Each editor serves "new" and "edit" (`:resolvername`).
 */
export const resolverConfigRoutes: ConfigRouteDefinition[] = [
  { element: <ResolverListPage />, path: "resolvers" },
  { element: <ResolverListPage />, path: "resolvers/list" },
  { element: <PasswdResolverPage />, path: "resolvers/passwd" },
  { element: <PasswdResolverPage />, path: "resolvers/passwd/:resolvername" },
  { element: <LdapResolverPage />, path: "resolvers/ldap" },
  { element: <LdapResolverPage />, path: "resolvers/ldap/:resolvername" },
  { element: <SqlResolverPage />, path: "resolvers/sql" },
  { element: <SqlResolverPage />, path: "resolvers/sql/:resolvername" },
  { element: <ScimResolverPage />, path: "resolvers/scim" },
  { element: <ScimResolverPage />, path: "resolvers/scim/:resolvername" },
  { element: <HttpResolverPage />, path: "resolvers/httpresolver" },
  { element: <HttpResolverPage />, path: "resolvers/httpresolver/:resolvername" }
];
