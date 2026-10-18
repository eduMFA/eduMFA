import { Trans } from "@lingui/react/macro";
import { Button, Table } from "@mantine/core";

import type { TokenConfigFieldsProps } from "./types";
import { useYubikeyApiKeyEntry } from "./useYubikeyApiKeyEntry";
import { YubikeyHelpText } from "./YubikeyHelpText";
import { YubikeyNewKeyRow } from "./YubikeyNewKeyRow";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import {
  listPrefixedEntries,
  yubikeyApiKeyPrefix
} from "@/features/config/tokens/tokenConfigForm";

/**
 * Port of `config.token.yubikey.html`. A new client id with its API key is
 * staged as `yubikey.apiid.<id>` and stored by the Save button; "Create new
 * API key" fills the key from `GET /system/random` like `yubikeyCreateNewKey`.
 */
export function YubikeyConfigFields({
  canDelete,
  canWrite,
  onChange,
  onDeleteEntry,
  savedConfig
}: TokenConfigFieldsProps) {
  const apiKeys = listPrefixedEntries(savedConfig, yubikeyApiKeyPrefix);
  const newKey = useYubikeyApiKeyEntry(onChange);

  return (
    <>
      <YubikeyHelpText />
      <ErrorAlert error={newKey.randomKeyMutation.error} />
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Trans>Client ID</Trans>
            </Table.Th>
            <Table.Th>
              <Trans>API Key</Trans>
            </Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {apiKeys.map((entry) => (
            <Table.Tr key={entry.key}>
              <Table.Td>{entry.suffix}</Table.Td>
              <Table.Td ff="monospace" style={{ wordBreak: "break-all" }}>
                {entry.value}
              </Table.Td>
              <Table.Td w={1}>
                {canDelete ? (
                  <Button
                    color="red"
                    onClick={() => {
                      onDeleteEntry(entry.key);
                    }}
                    size="xs"
                    type="button"
                    variant="light"
                  >
                    <Trans>Delete</Trans>
                  </Button>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ))}
          <YubikeyNewKeyRow
            apiId={newKey.apiId}
            apiKey={newKey.apiKey}
            canWrite={canWrite}
            creating={newKey.randomKeyMutation.isPending}
            onApiIdChange={newKey.changeApiId}
            onApiKeyChange={newKey.changeApiKey}
            onCreateKey={() => {
              newKey.randomKeyMutation.mutate();
            }}
          />
        </Table.Tbody>
      </Table>
    </>
  );
}
