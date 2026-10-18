import { Anchor, Group } from "@mantine/core";

import { hashHref } from "@/lib/hashbang";

/** The policies column; names ending in "+" are not policies and stay plain. */
export function PolicyLinks({ policies }: { policies: string | null }) {
  if (!policies) {
    return null;
  }

  const uniquePolicies = [...new Set(policies.split(","))];

  return (
    <Group gap={4}>
      {uniquePolicies.map((policy) =>
        policy.endsWith("+") ? (
          <span key={policy}>{policy}</span>
        ) : (
          <Anchor
            href={hashHref(`/config/policies/details/${encodeURIComponent(policy)}`)}
            key={policy}
            size="sm"
          >
            {policy}
          </Anchor>
        )
      )}
    </Group>
  );
}
