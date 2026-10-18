import { Trans } from "@lingui/react/macro";

import type { TokenDetail } from "@/api/tokens";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";

export interface TokenDeleteDialogProps {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  serial: string;
  token: TokenDetail | null;
}

/** Port of the legacy `dialogTokenDelete`; names the user of an assigned token. */
export function TokenDeleteDialog({
  isOpen,
  isPending,
  onCancel,
  onConfirm,
  serial,
  token
}: TokenDeleteDialogProps) {
  return (
    <ConfirmDialog
      confirmLabel={<Trans>Delete Token</Trans>}
      id="dialogTokenDelete"
      isOpen={isOpen}
      isPending={isPending}
      message={
        token?.username ? (
          <Trans>
            Do you really want to delete the Token {serial} from user {token.username}?
          </Trans>
        ) : (
          <Trans>Do you really want to delete the Token {serial}?</Trans>
        )
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={<Trans>Delete Token</Trans>}
    />
  );
}
