import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <Button
      disabled={disabled}
      id="enrollButton"
      leftSection={isRollover ? <IconRefresh size={16} /> : <IconEdit size={16} />}
      loading={loading}
      type="submit"
    >
      {isRollover ? t`Rollover Token` : t`Enroll Token`}
    </Button>
  );
}
