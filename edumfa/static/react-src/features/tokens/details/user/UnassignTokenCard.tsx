import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

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
        {t`Unassign Token`}
      </Button>
    </Card>
  );
}
