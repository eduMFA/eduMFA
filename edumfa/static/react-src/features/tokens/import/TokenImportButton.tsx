import { Trans } from "@lingui/react/macro";
import { Button, FileButton } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";

export interface TokenImportButtonProps {
  loading: boolean;
  onSelect: (file: File) => void;
}

/**
 * Picks the file and hands it over at once, like the legacy
 * `ngf-select="upload($file)"`.
 */
export function TokenImportButton({ loading, onSelect }: TokenImportButtonProps) {
  return (
    <FileButton
      onChange={(file) => {
        if (file) {
          onSelect(file);
        }
      }}
    >
      {(buttonProps) => (
        <Button
          {...buttonProps}
          id="importButton"
          leftSection={<IconUpload size={16} />}
          loading={loading}
        >
          <Trans>Select file and import</Trans>
        </Button>
      )}
    </FileButton>
  );
}
