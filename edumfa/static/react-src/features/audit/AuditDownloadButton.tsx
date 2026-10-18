import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

export interface AuditDownloadButtonProps {
  isPending: boolean;
  onClick: () => void;
}

/** Downloads the filtered audit log as CSV; the label changes while it runs. */
export function AuditDownloadButton({ isPending, onClick }: AuditDownloadButtonProps) {
  return (
    <Button
      leftSection={<IconDownload size={16} />}
      loading={isPending}
      onClick={onClick}
      variant="default"
    >
      {isPending ? (
        <Trans>Please Wait! Crunching data...</Trans>
      ) : (
        <Trans>Download audit log as CSV</Trans>
      )}
    </Button>
  );
}
