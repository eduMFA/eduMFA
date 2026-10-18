import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconUserMinus } from "@tabler/icons-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

export interface UnassignTokenCardProps {
  error: unknown;
  isPending: boolean;
  onUnassign: () => void;
}

/** A user's own unassign action. */
export function UnassignTokenCard({
  error,
  isPending,
  onUnassign
}: UnassignTokenCardProps) {
  return (
    <Card>
      <ErrorAlert error={error} />
      <Button
        color="yellow"
        id="unassignUserButton"
        leftSection={<IconUserMinus size={16} />}
        loading={isPending}
        onClick={onUnassign}
        variant="light"
      >
        <Trans>Unassign Token</Trans>
      </Button>
    </Card>
  );
}
