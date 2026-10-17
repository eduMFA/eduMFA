import type { ResolverConfig } from "@/api/config";
import { isRecord } from "@/api/envelope";

/**
 * Port of the legacy `getUserAttributes` / `getUserAttributesView` scope
 * helpers. The attribute names a resolver exposes come from its
 * configuration: `USERINFO` for LDAP resolvers and `Map` for SQL resolvers,
 * both stored as JSON strings.
 */

export type UserFieldType = "email" | "password" | "text";

export interface UserFieldDefinition {
  name: string;
  required: boolean;
  type: UserFieldType;
}

/**
 * Attributes shown when the resolver configuration cannot be read (e.g. the
 * admin lacks the `resolverread` right) or the resolver type exposes no
 * attribute map. The legacy view rendered nothing in that case.
 */
export const fallbackUserFields: readonly UserFieldDefinition[] = [
  "username",
  "givenname",
  "surname",
  "email",
  "phone",
  "mobile",
  "description"
].map((name) => createUserField(name));

export function getResolverUserFields(
  resolver: ResolverConfig | undefined
): UserFieldDefinition[] {
  const attributeMap = readAttributeMap(resolver);

  if (!attributeMap) {
    return [];
  }

  return Object.keys(attributeMap).map((name) => createUserField(name));
}

export function splitIntoColumns<TItem>(
  items: readonly TItem[]
): [left: TItem[], right: TItem[]] {
  const middle = Math.ceil(items.length / 2);

  return [items.slice(0, middle), items.slice(middle)];
}

function createUserField(name: string): UserFieldDefinition {
  switch (name) {
    case "username":
      return { name, required: true, type: "text" };
    case "email":
      return { name, required: true, type: "email" };
    case "password":
      return { name, required: true, type: "password" };
    default:
      return { name, required: false, type: "text" };
  }
}

function readAttributeMap(
  resolver: ResolverConfig | undefined
): Record<string, unknown> | null {
  if (!resolver) {
    return null;
  }

  switch (resolver.type) {
    case "ldapresolver":
      return parseJsonRecord(resolver.data.USERINFO);
    case "sqlresolver": {
      const attributeMap = parseJsonRecord(resolver.data.Map);

      if (attributeMap) {
        delete attributeMap.userid;
      }

      return attributeMap;
    }
    default:
      return null;
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) {
    return { ...value };
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
