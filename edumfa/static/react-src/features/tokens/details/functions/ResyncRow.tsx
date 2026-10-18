import { useLingui } from "@lingui/react/macro";
import { Button, Group, SimpleGrid, TextInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import type { ResyncForm } from "./useResyncForm";

export interface ResyncRowProps {
  form: ResyncForm;
}

/** Two OTP inputs and the resync button. */
export function ResyncRow({ form }: ResyncRowProps) {
  const { t } = useLingui();
  const { mutation, otp1, otp2, setOtp1, setOtp2 } = form;

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
      <TextInput
        aria-label={t`Enter first OTP value`}
        autoComplete="off"
        onChange={(event) => {
          setOtp1(event.currentTarget.value);
        }}
        placeholder={t`Enter first OTP value`}
        value={otp1}
      />
      <TextInput
        aria-label={t`Enter second OTP value`}
        autoComplete="off"
        onChange={(event) => {
          setOtp2(event.currentTarget.value);
        }}
        placeholder={t`Enter second OTP value`}
        value={otp2}
      />
      <Group>
        <Button
          disabled={otp1.length === 0 || otp2.length === 0}
          id="resyncButton"
          leftSection={<IconRefresh size={16} />}
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate();
          }}
        >
          {t`Resync Token`}
        </Button>
      </Group>
    </SimpleGrid>
  );
}
