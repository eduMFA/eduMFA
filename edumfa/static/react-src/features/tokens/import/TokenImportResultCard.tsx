import { useLingui } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import { type TokenImportResult } from "@/api/tokens";
import { Card } from "@/components/layout/Card";

export interface TokenImportResultCardProps {
  result: TokenImportResult;
  uploadedFile: string;
}

/** What the last upload imported and skipped. */
export function TokenImportResultCard({
  result,
  uploadedFile
}: TokenImportResultCardProps) {
  const { t } = useLingui();

  return (
    <Card flush title={t`Import result`}>
      <Table verticalSpacing="sm">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td fw={600} w="40%">
              {t`Uploaded File`}
            </Table.Td>
            <Table.Td data-field="uploadedFile">{uploadedFile}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td fw={600}>{t`Uploaded Tokens`}</Table.Td>
            <Table.Td data-field="uploadedTokens">{result.n_imported}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td fw={600}>{t`Skipped Tokens`}</Table.Td>
            <Table.Td data-field="skippedTokens">{result.n_not_imported}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
