import { hashHref } from "@/lib/hashbang";

/**
 * Path segments of the legacy `config.resolvers.edit<type>` states. The
 * legacy SQL state reused the `/ldap/:resolvername` URL by mistake; the SQL
 * editor gets its own segment here.
 */
const resolverTypeSegments: Record<string, string> = {
  httpresolver: "httpresolver",
  ldapresolver: "ldap",
  passwdresolver: "passwd",
  scimresolver: "scim",
  sqlresolver: "sql"
};

/** The editor of a user resolver, linked from the realm table. */
export function resolverEditHref(resolverType: string, resolverName: string): string {
  const segment = resolverTypeSegments[resolverType] ?? resolverType;

  return hashHref(`/config/resolvers/${segment}/${encodeURIComponent(resolverName)}`);
}
