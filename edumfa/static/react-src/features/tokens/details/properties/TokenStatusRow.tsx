import { useLingui } from "@lingui/react/macro";
import { Badge, Group, Table } from "@mantine/core";

import { ActionButton } from "./ActionButton";
import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { TokenDetail } from "@/api/tokens";
import { TokenActiveBadge } from "@/features/tokens/badges/TokenActiveBadge";

export interface TokenStatusRowProps {
  revoke: TokenPropertyMutations["revoke"];
  /** Disables an active token and enables an inactive one. */
  toggleActive: TokenPropertyMutations["toggleActive"];
  token: TokenDetail;
}

/** The "Active" row: status badges with the disable, enable and revoke actions. */
export function TokenStatusRow({ revoke, toggleActive, token }: TokenStatusRowProps) {
  const { t } = useLingui();

  return (
    <Table.Tr>
      <Table.Td fw={600}>{t`Active`}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <TokenActiveBadge active={token.active} />
          {token.locked ? (
            <Badge color="red" variant="light">
              {t`locked`}
            </Badge>
          ) : null}
          {token.revoked ? (
            <Badge color="red" variant="light">
              {t`revoked`}
            </Badge>
          ) : null}
        </Group>
      </Table.Td>
      <Table.Td ta="right">
        <Group gap="xs" justify="flex-end">
          {token.active ? (
            <ActionButton
              color="red"
              id="disableButton"
              loading={toggleActive.isPending}
              onClick={() => {
                toggleActive.mutate();
              }}
              right="disable"
              variant="light"
            >
              {t`Disable`}
            </ActionButton>
          ) : null}
          {!token.active && !token.locked ? (
            <ActionButton
              color="green"
              id="enableButton"
              loading={toggleActive.isPending}
              onClick={() => {
                toggleActive.mutate();
              }}
              right="enable"
              variant="light"
            >
              {t`Enable`}
            </ActionButton>
          ) : null}
          {!token.revoked ? (
            <ActionButton
              color="red"
              id="revokeButton"
              loading={revoke.isPending}
              onClick={() => {
                revoke.mutate();
              }}
              right="revoke"
              variant="light"
            >
              {t`Revoke`}
            </ActionButton>
          ) : null}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
