import { Trans, useLingui } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import { EditableValueRow } from "./EditableValueRow";
import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { Card } from "@/components/layout/Card";
import { FailCounterRow } from "@/features/tokens/details/properties/FailCounterRow";
import { RolloutStateRow } from "@/features/tokens/details/properties/RolloutStateRow";
import { TokenCounterRows } from "@/features/tokens/details/properties/TokenCounterRows";
import { TokenGroupsRow } from "@/features/tokens/details/properties/TokenGroupsRow";
import { TokenInfoRow } from "@/features/tokens/details/properties/TokenInfoRow";
import { TokenPropertyErrorAlerts } from "@/features/tokens/details/properties/TokenPropertyErrorAlerts";
import { TokenRealmsRow } from "@/features/tokens/details/properties/TokenRealmsRow";
import { TokenStatusRow } from "@/features/tokens/details/properties/TokenStatusRow";
import { useTokenPropertyMutations } from "@/features/tokens/details/properties/useTokenPropertyMutations";

export interface TokenPropertiesCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * Port of the properties table in `token.details.html`: status actions,
 * the editable counters and description, token info with the validity
 * period editor, realms and token groups.
 */
export function TokenPropertiesCard({
  onRefresh,
  serial,
  token
}: TokenPropertiesCardProps) {
  const { t } = useLingui();
  const { rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { hideButtons } = settings;
  const mutations = useTokenPropertyMutations({ onRefresh, serial, token });
  const { setDescription, setProperties } = mutations;

  return (
    <Card flush title={<Trans>Token details</Trans>}>
      <TokenPropertyErrorAlerts mutations={mutations} />

      <Table verticalSpacing="sm">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td fw={600} w="25%">
              <Trans>Type</Trans>
            </Table.Td>
            <Table.Td data-field="tokentype">{token.tokentype}</Table.Td>
            <Table.Td w="30%" />
          </Table.Tr>
          <TokenStatusRow
            revoke={mutations.revoke}
            toggleActive={mutations.toggleActive}
            token={token}
          />
          <RolloutStateRow
            onVerifyCodeChange={mutations.setVerifyCode}
            rolloutState={token.rollout_state}
            verify={mutations.verify}
            verifyCode={mutations.verifyCode}
          />
          <EditableValueRow
            buttonLabel={<Trans>Set max fail</Trans>}
            canEdit={hasRight(rights, "set")}
            hideButtons={hideButtons}
            id="maxfail"
            inputType="number"
            isSaving={setProperties.isPending}
            label={t`Maxfail`}
            locked={token.locked}
            onSave={(value) => {
              setProperties.mutate({ max_failcount: value });
            }}
            value={String(token.maxfail)}
          />
          <FailCounterRow reset={mutations.reset} token={token} />
          <TokenCounterRows setProperties={setProperties} token={token} />
          <EditableValueRow
            buttonLabel={<Trans>Set description</Trans>}
            canEdit={
              hasRight(rights, "setdescription") || (isAdmin && hasRight(rights, "set"))
            }
            hideButtons={hideButtons}
            id="description"
            isSaving={setDescription.isPending}
            label={t`Description`}
            locked={token.locked}
            maxLength={80}
            onSave={(value) => {
              setDescription.mutate(value);
            }}
            value={token.description}
          />
          <TokenInfoRow serial={serial} setProperties={setProperties} token={token} />
          <TokenRealmsRow
            realms={mutations.realmsQuery.data}
            setRealms={mutations.setRealms}
            token={token}
          />
          <TokenGroupsRow
            setGroups={mutations.setGroups}
            token={token}
            tokengroups={mutations.tokengroupsQuery.data}
          />
        </Table.Tbody>
      </Table>
    </Card>
  );
}
