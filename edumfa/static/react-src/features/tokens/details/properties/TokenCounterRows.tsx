import { useLingui } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { EditableValueRow } from "@/features/tokens/details/EditableValueRow";

export interface TokenCounterRowsProps {
  setProperties: TokenPropertyMutations["setProperties"];
  token: TokenDetail;
}

/** OTP length, counter and the editable windows; a spass token has none of them. */
export function TokenCounterRows({ setProperties, token }: TokenCounterRowsProps) {
  const { t } = useLingui();
  const { rights, settings } = useAuth();

  if (token.tokentype === "spass") {
    return null;
  }

  return (
    <>
      <Table.Tr>
        <Table.Td fw={600}>{t`OTP Length`}</Table.Td>
        <Table.Td data-field="otplen">{token.otplen}</Table.Td>
        <Table.Td />
      </Table.Tr>
      <Table.Tr>
        <Table.Td fw={600}>{t`Count`}</Table.Td>
        <Table.Td data-field="count">{token.count}</Table.Td>
        <Table.Td />
      </Table.Tr>
      <EditableValueRow
        buttonLabel={t`Set count window`}
        canEdit={hasRight(rights, "set")}
        hideButtons={settings.hideButtons}
        id="count_window"
        inputType="number"
        isSaving={setProperties.isPending}
        label={t`Count Window`}
        locked={token.locked}
        onSave={(value) => {
          setProperties.mutate({ count_window: value });
        }}
        value={String(token.count_window)}
      />
      <EditableValueRow
        buttonLabel={t`Set sync window`}
        canEdit={hasRight(rights, "set")}
        hideButtons={settings.hideButtons}
        id="sync_window"
        inputType="number"
        isSaving={setProperties.isPending}
        label={t`Sync Window`}
        locked={token.locked}
        onSave={(value) => {
          setProperties.mutate({ sync_window: value });
        }}
        value={String(token.sync_window)}
      />
    </>
  );
}
