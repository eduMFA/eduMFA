import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <Card flush title={t`Authentications`}>
      <Text c="dimmed" px="md" pt="sm" size="sm">
        {t`Authentications in the last 24 hours`}
      </Text>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          <StatRow label={t`success`} name="authSuccess">
            {successCount}
          </StatRow>
          <StatRow label={t`failed`} name="authFailed">
            {failureCount}
          </StatRow>
          <StatRow label={t`failed users / tokens`} name="authFailures">
            <FailureLinks failures={failures} />
          </StatRow>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
