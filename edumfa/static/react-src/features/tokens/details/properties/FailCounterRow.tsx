import { Trans } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import { ActionButton } from "./ActionButton";
import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { TokenDetail } from "@/api/tokens";
import { FailCounterBadge } from "@/features/tokens/badges/FailCounterBadge";

export interface FailCounterRowProps {
  reset: TokenPropertyMutations["reset"];
  token: TokenDetail;
}

/** The fail counter with the reset action once the counter is above zero. */
export function FailCounterRow({ reset, token }: FailCounterRowProps) {
  return (
    <Table.Tr>
      <Table.Td fw={600}>
        <Trans>Fail counter</Trans>
      </Table.Td>
      <Table.Td>
        <FailCounterBadge token={token} />
      </Table.Td>
      <Table.Td ta="right">
        {token.failcount > 0 ? (
          <ActionButton
            color="green"
            id="resetButton"
            loading={reset.isPending}
            onClick={() => {
              reset.mutate();
            }}
            right="reset"
            variant="light"
          >
            <Trans>Reset fail counter</Trans>
          </ActionButton>
        ) : null}
      </Table.Td>
    </Table.Tr>
  );
}
