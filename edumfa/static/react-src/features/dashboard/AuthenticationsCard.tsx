import { Trans } from "@lingui/react/macro";
import { Table, Text } from "@mantine/core";

import { FailureLinks } from "./FailureLinks";
import { StatRow } from "./StatRow";
import type { FailureSummary } from "./summarizeFailures";
import { Card } from "@/components/layout/Card";

export interface AuthenticationsCardProps {
  failureCount: number | undefined;
  failures: FailureSummary;
  successCount: number | undefined;
}

/** Successful and failed authentications of the last day. */
export function AuthenticationsCard({
  failureCount,
  failures,
  successCount
}: AuthenticationsCardProps) {
  return (
    <Card flush title={<Trans>Authentications</Trans>}>
      <Text c="dimmed" px="md" pt="sm" size="sm">
        <Trans>Authentications in the last 24 hours</Trans>
      </Text>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={<Trans>success</Trans>} name="authSuccess">
            {successCount}
          </StatRow>
          <StatRow label={<Trans>failed</Trans>} name="authFailed">
            {failureCount}
          </StatRow>
          <StatRow label={<Trans>failed users / tokens</Trans>} name="authFailures">
            <FailureLinks failures={failures} />
          </StatRow>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
