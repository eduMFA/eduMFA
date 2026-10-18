import { Trans } from "@lingui/react/macro";
import { List, Stack, Table } from "@mantine/core";
import { useMemo, useState } from "react";

import { EditRowButtons } from "./EditRowButtons";
import { createInfoDraft, infoDraftToProperties, type InfoDraft } from "./infoDraft";
import { TokenInfoEditor } from "./TokenInfoEditor";
import { TokenInfoEntry } from "./TokenInfoEntry";
import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import type { TokenDetail } from "@/api/tokens";

export interface TokenInfoRowProps {
  serial: string;
  setProperties: TokenPropertyMutations["setProperties"];
  token: TokenDetail;
}

/**
 * The token info list with the editor for the authentication counters and
 * the validity period (the values go through `POST /token/set/<serial>`).
 */
export function TokenInfoRow({ serial, setProperties, token }: TokenInfoRowProps) {
  const [infoDraft, setInfoDraft] = useState<InfoDraft | null>(null);
  const infoEntries = useMemo(() => Object.entries(token.info), [token.info]);

  const saveInfo = () => {
    if (!infoDraft) {
      return;
    }

    setProperties.mutate(infoDraftToProperties(infoDraft, token.tokentype));
    setInfoDraft(null);
  };

  return (
    <Table.Tr>
      <Table.Td fw={600}>
        <Trans>Info</Trans>
      </Table.Td>
      <Table.Td>
        <Stack gap="xs">
          <List size="sm" spacing={2}>
            {infoEntries.map(([key, value]) => (
              <List.Item key={key}>
                <TokenInfoEntry infoKey={key} serial={serial} value={value} />
              </List.Item>
            ))}
          </List>
          {infoDraft ? (
            <TokenInfoEditor
              draft={infoDraft}
              onChange={setInfoDraft}
              showTimeShift={token.tokentype === "totp"}
            />
          ) : null}
        </Stack>
      </Table.Td>
      <Table.Td ta="right">
        <EditRowButtons
          isEditing={infoDraft !== null}
          isSaving={setProperties.isPending}
          locked={token.locked}
          onCancel={() => {
            setInfoDraft(null);
          }}
          onEdit={() => {
            setInfoDraft(createInfoDraft(token.info));
          }}
          onSave={saveInfo}
          right="set"
          saveLabel={<Trans>Save Token Info</Trans>}
        />
      </Table.Td>
    </Table.Tr>
  );
}
