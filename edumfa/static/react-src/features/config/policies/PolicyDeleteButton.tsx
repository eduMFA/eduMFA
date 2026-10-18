import { useLingui } from "@lingui/react/macro";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@mantine/core";

import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";

/** Delete button of a policy row; asks first when the deletion confirmation is on. */
export function PolicyDeleteButton({
  disabled,
  name,
  onConfirm,
  requestDelete
}: {
  disabled: boolean;
  name: string;
  onConfirm: () => void;
  requestDelete: DeleteConfirmation["requestDelete"];
}) {
  const { t } = useLingui();

  return (
    <Button
      color="red"
      leftSection={<IconTrash aria-hidden size={16} />}
      size="xs"
      variant="light"
      disabled={disabled}
      onClick={() => {
        requestDelete({
          identifier: name,
          question: t`Do you really want to delete this policy?`,
          onConfirm
        });
      }}
    >
      {t`Delete`}
    </Button>
  );
}
