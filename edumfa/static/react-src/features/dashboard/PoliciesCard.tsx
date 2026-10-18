import { Trans } from "@lingui/react/macro";
import { Anchor, Table } from "@mantine/core";

import { LinkListRow } from "./LinkListRow";
import { StatRow } from "./StatRow";
import type { PolicySummary } from "@/api/config";
import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

export interface PoliciesCardProps {
  activePolicies: PolicySummary[];
  inactivePolicies: PolicySummary[];
}

/** Active and inactive policy counts, each followed by the policy links. */
export function PoliciesCard({ activePolicies, inactivePolicies }: PoliciesCardProps) {
  return (
    <Card
      flush
      title={
        <Anchor href={hashHref("/config/policies/list")} size="sm">
          <Trans>Policies</Trans>
        </Anchor>
      }
    >
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={<Trans>Active Policies</Trans>} name="activePolicies">
            {activePolicies.length}
          </StatRow>
          <LinkListRow links={activePolicies.map(toPolicyLink)} />
          <StatRow label={<Trans>Inactive Policies</Trans>} name="inactivePolicies">
            {inactivePolicies.length}
          </StatRow>
          <LinkListRow links={inactivePolicies.map(toPolicyLink)} />
        </Table.Tbody>
      </Table>
    </Card>
  );
}

function toPolicyLink(policy: PolicySummary) {
  return {
    href: hashHref(`/config/policies/details/${encodeURIComponent(policy.name)}`),
    key: policy.name,
    label: policy.name
  };
}
