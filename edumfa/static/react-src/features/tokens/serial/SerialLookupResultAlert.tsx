import { Trans } from "@lingui/react/macro";
import { Alert, Anchor, Button, Group } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

import { type TokenSerialLookupResponse } from "@/api/tokens";
import { hashHref } from "@/lib/hashbang";

export interface SerialLookupResultAlertProps {
  onClose: () => void;
  result: TokenSerialLookupResponse | null;
  searchedOtp: string;
}

/** The found serial as a link to the token, or the notice that none matched. */
export function SerialLookupResultAlert({
  onClose,
  result,
  searchedOtp
}: SerialLookupResultAlertProps) {
  if (result?.serial) {
    return (
      <Alert
        color="green"
        icon={<IconCircleCheck size={18} />}
        mb="md"
        role="status"
        variant="light"
      >
        <Trans>
          The Serial number for the OTP value {searchedOtp} is{" "}
          <Anchor
            href={hashHref(`/token/details/${encodeURIComponent(result.serial)}`)}
            size="sm"
          >
            {result.serial}
          </Anchor>
          .
        </Trans>
        <Group mt="sm">
          <Button onClick={onClose} size="xs" variant="default">
            <Trans>OK</Trans>
          </Button>
        </Group>
      </Alert>
    );
  }

  return (
    <Alert
      color="yellow"
      icon={<IconAlertTriangle size={18} />}
      mb="md"
      role="status"
      variant="light"
    >
      <Trans>No Serial number could be found for OTP value {searchedOtp}.</Trans>
      <Group mt="sm">
        <Button onClick={onClose} size="xs" variant="default">
          <Trans>OK</Trans>
        </Button>
      </Group>
    </Alert>
  );
}
