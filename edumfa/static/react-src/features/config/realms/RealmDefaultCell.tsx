import { Trans } from "@lingui/react/macro";
import { Badge, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export interface RealmDefaultCellProps {
  canWrite: boolean;
  isDefault: boolean;
  isSetting: boolean;
  onSetDefault: () => void;
}

/** The "Default" column: the marker of the default realm, or the button to make it one. */
export function RealmDefaultCell({
  canWrite,
  isDefault,
  isSetting,
  onSetDefault
}: RealmDefaultCellProps) {
  if (isDefault) {
    return (
      <Badge
        color="green"
        leftSection={<IconCheck size={12} />}
        miw="max-content"
        style={{ verticalAlign: "middle" }}
        variant="light"
      >
        <Trans>Default</Trans>
      </Badge>
    );
  }

  if (canWrite) {
    return (
      <Button
        color="green"
        loading={isSetting}
        onClick={onSetDefault}
        size="xs"
        variant="light"
      >
        <Trans>set Default</Trans>
      </Button>
    );
  }

  return null;
}
