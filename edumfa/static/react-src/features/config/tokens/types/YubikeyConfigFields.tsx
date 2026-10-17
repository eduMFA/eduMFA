import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, Table, TextInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps, TokenConfigUpdate } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getRandom } from "@/api/system";
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
  const apiClient = useApiClient();
  const { t } = useLingui();
  const [apiId, setApiId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const apiKeys = listPrefixedEntries(savedConfig, yubikeyApiKeyPrefix);

  /** Re-stages the pending entry under the current id, dropping the previous key. */
  const stageEntry = (nextApiId: string, nextApiKey: string) => {
    const update: TokenConfigUpdate = {};

    if (apiId !== "") {
      update[`${yubikeyApiKeyPrefix}${apiId}`] = null;
    }

    if (nextApiId !== "" && nextApiKey !== "") {
      update[`${yubikeyApiKeyPrefix}${nextApiId}`] = nextApiKey;
    }

    onChange(update);
  };

  const randomKeyMutation = useMutation({
    mutationFn: () => getRandom(apiClient, 20, "b64"),
    onSuccess: (randomKey) => {
      setApiKey(randomKey);
      stageEntry(apiId, randomKey);
    }
  });

  return (
    <>
      <HelpText>
        <Trans>
          This is a Yubikey in the Yubico Mode authenticated against eduMFA. The Yubikey
          emits a 44 character on time password.
        </Trans>
      </HelpText>
      <HelpText>
        <Trans>
          The authentication request can be handled by the default eduMFA{" "}
          <Anchor
            href="https://edumfa.readthedocs.io/en/latest/modules/api/validate.html"
            inherit
            rel="noopener"
            target="_blank"
          >
            validate API
          </Anchor>{" "}
          but can also be handled by the{" "}
          <Anchor
            href="https://edumfa.readthedocs.io/en/latest/modules/lib/tokentypes/yubikey.html#edumfa.lib.tokens.yubikeytoken.YubikeyTokenClass.api_endpoint"
            inherit
            rel="noopener"
            target="_blank"
          >
            Yubico Validation Protocol
          </Anchor>
          .
        </Trans>
      </HelpText>
      <ErrorAlert error={randomKeyMutation.error} />
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
          <Table.Tr>
            <Table.Td>
              <TextInput
                aria-label={t`Client ID`}
                id="yubikeyApiId"
                onChange={(event) => {
                  setApiId(event.currentTarget.value);
                  stageEntry(event.currentTarget.value, apiKey);
                }}
                placeholder={t`Client ID`}
                required
                value={apiId}
              />
            </Table.Td>
            <Table.Td>
              <TextInput
                aria-label={t`API Key`}
                id="yubikeyApiKey"
                onChange={(event) => {
                  setApiKey(event.currentTarget.value);
                  stageEntry(apiId, event.currentTarget.value);
                }}
                placeholder={t`API Key`}
                required
                value={apiKey}
              />
            </Table.Td>
            <Table.Td w={1}>
              {canWrite ? (
                <Button
                  leftSection={<IconRefresh size={16} />}
                  loading={randomKeyMutation.isPending}
                  onClick={() => {
                    randomKeyMutation.mutate();
                  }}
                  size="xs"
                  type="button"
                  variant="default"
                >
                  <Trans>Create new API key</Trans>
                </Button>
              ) : null}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </>
  );
}
