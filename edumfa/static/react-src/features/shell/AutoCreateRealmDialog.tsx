import { useLingui } from "@lingui/react/macro";
import { Button, Group, Modal, Text } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys } from "@/api/config";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { notify } from "@/lib/notify";

export interface AutoCreateRealmDialogProps {
  onClose: () => void;
  opened: boolean;
}

/**
 * Port of `dialog.autocreate_realm.html` and `createDefaultRealm`: an
 * administrator of a system without realms is offered a `deflocal` passwd
 * resolver on `/etc/passwd` and a `defrealm` realm.
 */
export function AutoCreateRealmDialog({ onClose, opened }: AutoCreateRealmDialogProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post<number>("/resolver/deflocal", {
        filename: "/etc/passwd",
        type: "passwdresolver"
      });
      await apiClient.post<number>("/realm/defrealm", { resolvers: "deflocal" });
    },
    onSuccess: () => {
      notify(t`Realm defrealm created.`, "info");
      void queryClient.invalidateQueries({ queryKey: configQueryKeys.realms });
      onClose();
    }
  });

  return (
    <Modal centered onClose={onClose} opened={opened} title={t`Create default realm`}>
      <ErrorAlert error={createMutation.error} />
      <Text size="sm">
        {t`Obviously you have no realms defined. Do you want me to create a default realm for you from the machines /etc/passwd?`}
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button onClick={onClose} variant="default">
          {t`No`}
        </Button>
        <Button
          id="createDefaultRealm"
          loading={createMutation.isPending}
          onClick={() => {
            createMutation.mutate();
          }}
        >
          {t`Create realm`}
        </Button>
      </Group>
    </Modal>
  );
}
