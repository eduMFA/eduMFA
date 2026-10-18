import { Trans } from "@lingui/react/macro";

import { SelectionRow } from "./SelectionRow";
import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { RealmsResponse } from "@/api/config";
import type { TokenDetail } from "@/api/tokens";

export interface TokenRealmsRowProps {
  /** `GET /realm/`; every realm is offered while editing. */
  realms: RealmsResponse | undefined;
  setRealms: TokenPropertyMutations["setRealms"];
  token: TokenDetail;
}

/** The realms of the token, edited as checkboxes over all known realms. */
export function TokenRealmsRow({ realms, setRealms, token }: TokenRealmsRowProps) {
  const realmNames = Object.keys(realms ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );

  return (
    <SelectionRow
      dataField="realms"
      isSaving={setRealms.isPending}
      label={<Trans>Realms</Trans>}
      locked={token.locked}
      onSave={(selected) => {
        setRealms.mutate(selected);
      }}
      options={realmNames.map((realmName) => ({ label: realmName, value: realmName }))}
      right="tokenrealms"
      saveLabel={<Trans>Save realms</Trans>}
      selected={token.realms}
    />
  );
}
