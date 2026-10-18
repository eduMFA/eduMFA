import { Trans } from "@lingui/react/macro";
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
  return (
    <Table.Tr>
      <Table.Td fw={600}>
        <Trans>Active</Trans>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <TokenActiveBadge active={token.active} />
          {token.locked ? (
            <Badge color="red" variant="light">
              <Trans>locked</Trans>
            </Badge>
          ) : null}
          {token.revoked ? (
            <Badge color="red" variant="light">
              <Trans>revoked</Trans>
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
              <Trans>Disable</Trans>
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
              <Trans>Enable</Trans>
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
              <Trans>Revoke</Trans>
            </ActionButton>
          ) : null}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
