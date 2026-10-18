import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";

/** Port of the menu's refresh button: every query is fetched again. */
export function RefreshButton() {
  const { t } = useLingui();

  const queryClient = useQueryClient();

  return (
    <Button
      leftSection={<IconRefresh size={16} />}
      onClick={() => {
        void queryClient.invalidateQueries();
      }}
      size="sm"
      variant="subtle"
    >
      {t`Refresh`}
    </Button>
  );
}
