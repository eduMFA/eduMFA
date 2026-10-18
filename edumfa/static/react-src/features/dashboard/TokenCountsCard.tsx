import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <Card
      flush
      title={
        <Anchor href={hashHref("/token/list")} size="sm">
          {t`Tokens`}
        </Anchor>
      }
    >
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={t`Total`} name="total">
            <Anchor href={hashHref("/token/list")} size="sm">
              {counts.total}
            </Anchor>
          </StatRow>
          <StatRow label={t`Hardware`} name="hardware">
            {counts.hardware}
          </StatRow>
          <StatRow label={t`Software`} name="software">
            {counts.software}
          </StatRow>
          <StatRow label={t`Unassigned Hardware`} name="unassignedHardware">
            {counts.unassignedHardware}
          </StatRow>
          <StatRow label={t`Unassigned Software`} name="unassignedSoftware">
            {counts.unassignedSoftware}
          </StatRow>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
