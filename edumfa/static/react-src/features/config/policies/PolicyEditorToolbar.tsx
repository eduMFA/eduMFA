import { useLingui } from "@lingui/react/macro";
import { IconPlayerPause, IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { Button, Group } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import type { PolicyMutations } from "./types";
import type { Policy } from "@/api/policies";
import type { DeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";

/** Enable/disable and delete buttons above the form of a stored policy. */
export function PolicyEditorToolbar({
  active,
  canDelete,
  canWrite,
  mutations,
  onActiveChange,
  policy,
  requestDelete
}: {
  active: boolean;
  canDelete: boolean;
  canWrite: boolean;
  mutations: PolicyMutations;
  onActiveChange: (active: boolean) => void;
  policy: Policy;
  requestDelete: DeleteConfirmation["requestDelete"];
}) {
  const { t } = useLingui();

  const navigate = useNavigate();

  return (
    <Group mb="md">
      {canWrite ? (
        <Button
          type="button"
          leftSection={
            active ? (
              <IconPlayerPause aria-hidden size={16} />
            ) : (
              <IconPlayerPlay aria-hidden size={16} />
            )
          }
          variant="light"
          disabled={mutations.busy}
          onClick={() => {
            mutations.toggle.mutate(
              { name: policy.name, active: !active },
              {
                onSuccess: () => {
                  onActiveChange(!active);
                }
              }
            );
          }}
        >
          {active ? t`Disable` : t`Enable`}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          type="button"
          color="red"
          leftSection={<IconTrash aria-hidden size={16} />}
          variant="light"
          disabled={mutations.busy}
          onClick={() => {
            requestDelete({
              identifier: policy.name,
              question: t`Do you really want to delete this policy?`,
              onConfirm: () => {
                mutations.remove.mutate(policy.name, {
                  onSuccess: () => {
                    void navigate("/config/policies/list");
                  }
                });
              }
            });
          }}
        >
          {t`Delete`}
        </Button>
      ) : null}
    </Group>
  );
}
