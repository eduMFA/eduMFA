import { Trans } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";

export interface RealmEditActionsProps {
  canWrite: boolean;
  isSaveDisabled: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/** The actions of the realm row being edited inline: save the selection or cancel. */
export function RealmEditActions({
  canWrite,
  isSaveDisabled,
  isSaving,
  onCancel,
  onSave
}: RealmEditActionsProps) {
  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      {canWrite ? (
        <Button disabled={isSaveDisabled} loading={isSaving} onClick={onSave} size="xs">
          <Trans>Save</Trans>
        </Button>
      ) : null}
      <Button color="red" onClick={onCancel} size="xs" variant="light">
        <Trans>Cancel</Trans>
      </Button>
    </Group>
  );
}
