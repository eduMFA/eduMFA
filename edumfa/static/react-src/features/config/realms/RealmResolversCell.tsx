import { Anchor, Stack, Text } from "@mantine/core";

import { resolverEditHref } from "./resolverLinks";
import type { Realm } from "@/api/config";

export interface RealmResolversCellProps {
  realm: Realm;
}

/** The resolvers of a realm with their priorities, linked to their editors. */
export function RealmResolversCell({ realm }: RealmResolversCellProps) {
  return (
    <Stack gap={2}>
      {realm.resolver.map((resolver) => (
        <Text key={resolver.name} size="sm">
          <Anchor href={resolverEditHref(resolver.type, resolver.name)} size="sm">
            {resolver.name}
          </Anchor>{" "}
          [{resolver.priority ?? ""}] ({resolver.type})
        </Text>
      ))}
    </Stack>
  );
}
