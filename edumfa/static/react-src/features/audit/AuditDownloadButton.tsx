import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

export interface AuditDownloadButtonProps {
  isPending: boolean;
  onClick: () => void;
}

/** Downloads the filtered audit log as CSV; the label changes while it runs. */
export function AuditDownloadButton({ isPending, onClick }: AuditDownloadButtonProps) {
  const { t } = useLingui();

  return (
    <Button
      leftSection={<IconDownload size={16} />}
      loading={isPending}
      onClick={onClick}
      variant="default"
    >
      {isPending ? t`Please Wait! Crunching data...` : t`Download audit log as CSV`}
    </Button>
  );
}
