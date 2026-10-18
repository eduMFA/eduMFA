import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconEdit, IconRefresh } from "@tabler/icons-react";

export interface EnrollSubmitButtonProps {
  disabled: boolean;
  isRollover: boolean;
  loading: boolean;
}

/** The submit button of the enrollment form. */
export function EnrollSubmitButton({
  disabled,
  isRollover,
  loading
}: EnrollSubmitButtonProps) {
  return (
    <Button
      disabled={disabled}
      id="enrollButton"
      leftSection={isRollover ? <IconRefresh size={16} /> : <IconEdit size={16} />}
      loading={loading}
      type="submit"
    >
      {isRollover ? <Trans>Rollover Token</Trans> : <Trans>Enroll Token</Trans>}
    </Button>
  );
}
