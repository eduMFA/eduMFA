import { Trans } from "@lingui/react/macro";
import { Anchor, Table } from "@mantine/core";

import { StatRow } from "./StatRow";
import type { TokenCounts } from "./useTokenCounts";
import { Card } from "@/components/layout/Card";
import { hashHref } from "@/lib/hashbang";

export interface TokenCountsCardProps {
  counts: TokenCounts;
}

/** Total, hardware and software token counts with the unassigned ones. */
export function TokenCountsCard({ counts }: TokenCountsCardProps) {
  return (
    <Card
      flush
      title={
        <Anchor href={hashHref("/token/list")} size="sm">
          <Trans>Tokens</Trans>
        </Anchor>
      }
    >
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={<Trans>Total</Trans>} name="total">
            <Anchor href={hashHref("/token/list")} size="sm">
              {counts.total}
            </Anchor>
          </StatRow>
          <StatRow label={<Trans>Hardware</Trans>} name="hardware">
            {counts.hardware}
          </StatRow>
          <StatRow label={<Trans>Software</Trans>} name="software">
            {counts.software}
          </StatRow>
          <StatRow label={<Trans>Unassigned Hardware</Trans>} name="unassignedHardware">
            {counts.unassignedHardware}
          </StatRow>
          <StatRow label={<Trans>Unassigned Software</Trans>} name="unassignedSoftware">
            {counts.unassignedSoftware}
          </StatRow>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
