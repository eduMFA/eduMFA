import { Anchor, Group } from "@mantine/core";

import type { FailureSummary } from "./summarizeFailures";
import { hashHref } from "@/lib/hashbang";

export interface FailureLinksProps {
  failures: FailureSummary;
}

/** Links to the users with failed authentications and to user-less serials. */
export function FailureLinks({ failures }: FailureLinksProps) {
  return (
    <Group gap={6}>
      {failures.users.map((failure) => (
        <Anchor
          href={hashHref(
            `/user/details/${encodeURIComponent(failure.realm)}/${encodeURIComponent(failure.user)}`
          )}
          key={`${failure.user}@${failure.realm}`}
          size="sm"
        >
          {failure.user}@{failure.realm}[{failure.fails}]
        </Anchor>
      ))}
      {failures.serials.map((serial, index) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(serial)}`)}
          key={`${serial}-${String(index)}`}
          size="sm"
        >
          {serial}
        </Anchor>
      ))}
    </Group>
  );
}
