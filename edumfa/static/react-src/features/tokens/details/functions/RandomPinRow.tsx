import { Trans } from "@lingui/react/macro";
import { Button, Group, SimpleGrid, Text } from "@mantine/core";
import { IconKey } from "@tabler/icons-react";

import type { RandomPin } from "./useRandomPin";

export interface RandomPinRowProps {
  randomPin: RandomPin;
}

/** The generated PIN (once there is one) and the button that requests it. */
export function RandomPinRow({ randomPin }: RandomPinRowProps) {
  const { mutation, pin } = randomPin;

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
      <Text fw={600} size="sm">
        {pin === null ? null : <Trans>Random generated PIN</Trans>}
      </Text>
      <Text data-field="randomPin" ff="monospace" size="sm">
        {pin}
      </Text>
      <Group>
        <Button
          id="setRandomPinButton"
          leftSection={<IconKey size={16} />}
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate();
          }}
        >
          <Trans>Set random PIN</Trans>
        </Button>
      </Group>
    </SimpleGrid>
  );
}
