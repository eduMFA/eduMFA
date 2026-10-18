import { useLingui } from "@lingui/react/macro";
import { Button, Group, Table, TextInput } from "@mantine/core";

import type { TokenPropertyMutations } from "./useTokenPropertyMutations";

export interface RolloutStateRowProps {
  onVerifyCodeChange: (code: string) => void;
  rolloutState: string;
  verify: TokenPropertyMutations["verify"];
  verifyCode: string;
}

/**
 * The rollout state of a token that is not fully enrolled yet; in the
 * `verify` state the enrollment is confirmed with a code.
 */
export function RolloutStateRow({
  onVerifyCodeChange,
  rolloutState,
  verify,
  verifyCode
}: RolloutStateRowProps) {
  const { t } = useLingui();

  if (!rolloutState) {
    return null;
  }

  return (
    <Table.Tr>
      <Table.Td fw={600}>{t`Rollout State`}</Table.Td>
      <Table.Td data-field="rollout_state">{rolloutState}</Table.Td>
      <Table.Td ta="right">
        {rolloutState === "verify" ? (
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            <TextInput
              aria-label={t`Enter code to verify enrollment`}
              onChange={(event) => {
                onVerifyCodeChange(event.currentTarget.value);
              }}
              placeholder={t`Enter code to verify enrollment`}
              size="xs"
              value={verifyCode}
            />
            <Button
              disabled={verifyCode.length === 0}
              loading={verify.isPending}
              onClick={() => {
                verify.mutate();
              }}
              size="xs"
            >
              {t`Verify Token`}
            </Button>
          </Group>
        ) : null}
      </Table.Td>
    </Table.Tr>
  );
}
