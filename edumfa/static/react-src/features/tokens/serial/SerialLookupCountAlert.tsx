import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Button, Group } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import { type TokenSerialLookupResponse } from "@/api/tokens";

export interface SerialLookupCountAlertProps {
  onCancel: () => void;
  onRun: () => void;
  result: TokenSerialLookupResponse | null;
  searchPending: boolean;
}

/** Asks whether to run the (possibly slow) search over the counted tokens. */
export function SerialLookupCountAlert({
  onCancel,
  onRun,
  result,
  searchPending
}: SerialLookupCountAlertProps) {
  const { t } = useLingui();

  return (
    <Alert
      color="yellow"
      icon={<IconAlertTriangle size={18} />}
      mb="md"
      role="status"
      variant="light"
    >
      <Trans>
        Your search would include {result?.count ?? 0} tokens. This can take a lot of
        time and could even timeout. Do you want to run the search? You might also
        cancel this and narrow down the search!
      </Trans>
      <Group gap="xs" mt="sm">
        <Button loading={searchPending} onClick={onRun} size="xs">
          {t`Run search`}
        </Button>
        <Button disabled={searchPending} onClick={onCancel} size="xs" variant="default">
          {t`Cancel`}
        </Button>
      </Group>
    </Alert>
  );
}
