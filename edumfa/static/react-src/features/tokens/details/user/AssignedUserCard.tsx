import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconUserMinus } from "@tabler/icons-react";

import { AssignedUserTable } from "./AssignedUserTable";
import type { TokenDetail } from "@/api/tokens";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

export interface AssignedUserCardProps {
  error: unknown;
  isUnassigning: boolean;
  onUnassign: () => void;
  token: TokenDetail;
}

/** The admin's view of the assigned user, with the unassign action unless locked. */
export function AssignedUserCard({
  error,
  isUnassigning,
  onUnassign,
  token
}: AssignedUserCardProps) {
  const { t } = useLingui();

  return (
    <Card
      actions={
        token.locked ? null : (
          <Button
            color="yellow"
            id="unassignAdminButton"
            leftSection={<IconUserMinus size={16} />}
            loading={isUnassigning}
            onClick={onUnassign}
            size="sm"
            variant="light"
          >
            {t`Unassign User`}
          </Button>
        )
      }
      flush
      title={t`Assigned User`}
    >
      <ErrorAlert error={error} />
      <AssignedUserTable token={token} />
    </Card>
  );
}
