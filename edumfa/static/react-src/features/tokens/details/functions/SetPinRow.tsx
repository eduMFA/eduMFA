import { useLingui } from "@lingui/react/macro";
import { Button, Group, PasswordInput, SimpleGrid } from "@mantine/core";
import { IconKey } from "@tabler/icons-react";

import type { SetPinForm } from "./useSetPinForm";

export interface SetPinRowProps {
  form: SetPinForm;
}

/** The PIN typed twice and the set button; the second input flags a mismatch. */
export function SetPinRow({ form }: SetPinRowProps) {
  const { t } = useLingui();
  const { mutation, pin1, pin2, setPin1, setPin2 } = form;

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
      <PasswordInput
        aria-label={t`Enter PIN for token`}
        autoComplete="new-password"
        onChange={(event) => {
          setPin1(event.currentTarget.value);
        }}
        placeholder={t`Enter PIN for token`}
        value={pin1}
      />
      <PasswordInput
        aria-label={t`Enter PIN again`}
        autoComplete="new-password"
        error={pin1 === pin2 ? undefined : t`The PINs do not match.`}
        onChange={(event) => {
          setPin2(event.currentTarget.value);
        }}
        placeholder={t`Enter PIN again`}
        value={pin2}
      />
      <Group>
        <Button
          disabled={pin1 !== pin2}
          id="setPinButton"
          leftSection={<IconKey size={16} />}
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate();
          }}
        >
          {t`Set PIN`}
        </Button>
      </Group>
    </SimpleGrid>
  );
}
