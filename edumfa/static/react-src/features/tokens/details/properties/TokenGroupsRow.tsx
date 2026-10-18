import { Trans } from "@lingui/react/macro";

import { SelectionRow } from "./SelectionRow";
import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { TokengroupsResponse } from "@/api/config";
import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";

export interface TokenGroupsRowProps {
  setGroups: TokenPropertyMutations["setGroups"];
  token: TokenDetail;
  /** `GET /tokengroup/`; every group is offered while editing. */
  tokengroups: TokengroupsResponse | undefined;
}

/** The token groups, only for sessions that may list them. */
export function TokenGroupsRow({ setGroups, token, tokengroups }: TokenGroupsRowProps) {
  const { rights } = useAuth();

  if (!hasRight(rights, "tokengroup_list")) {
    return null;
  }

  const options = Object.entries(tokengroups ?? {}).map(([groupName, group]) => ({
    label: group.description ? `${groupName} (${group.description})` : groupName,
    value: groupName
  }));

  return (
    <SelectionRow
      dataField="tokengroup"
      isSaving={setGroups.isPending}
      label={<Trans>Token groups</Trans>}
      locked={token.locked}
      onSave={(selected) => {
        setGroups.mutate(selected);
      }}
      options={options}
      right="tokengroups"
      saveLabel={<Trans>Save Token Groups</Trans>}
      selected={token.tokengroup ?? []}
    />
  );
}
