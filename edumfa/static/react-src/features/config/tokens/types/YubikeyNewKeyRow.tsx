import { useLingui } from "@lingui/react/macro";
import { Button, Table, TextInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

/** The table row for a new client id with its API key and the key generator. */
export function YubikeyNewKeyRow({
  apiId,
  apiKey,
  canWrite,
  creating,
  onApiIdChange,
  onApiKeyChange,
  onCreateKey
}: {
  apiId: string;
  apiKey: string;
  canWrite: boolean;
  creating: boolean;
  onApiIdChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onCreateKey: () => void;
}) {
  const { t } = useLingui();

  return (
    <Table.Tr>
      <Table.Td>
        <TextInput
          aria-label={t`Client ID`}
          id="yubikeyApiId"
          onChange={(event) => {
            onApiIdChange(event.currentTarget.value);
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
            onApiKeyChange(event.currentTarget.value);
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
            loading={creating}
            onClick={onCreateKey}
            size="xs"
            type="button"
            variant="default"
          >
            {t`Create new API key`}
          </Button>
        ) : null}
      </Table.Td>
    </Table.Tr>
  );
}
