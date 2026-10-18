import { Trans } from "@lingui/react/macro";
import { Stack } from "@mantine/core";

import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { RandomPinRow } from "@/features/tokens/details/functions/RandomPinRow";
import { ResyncRow } from "@/features/tokens/details/functions/ResyncRow";
import { SetPinRow } from "@/features/tokens/details/functions/SetPinRow";
import { TestTokenRow } from "@/features/tokens/details/functions/TestTokenRow";
import { useRandomPin } from "@/features/tokens/details/functions/useRandomPin";
import { useResyncForm } from "@/features/tokens/details/functions/useResyncForm";
import { useSetPinForm } from "@/features/tokens/details/functions/useSetPinForm";
import { useTestTokenForm } from "@/features/tokens/details/functions/useTestTokenForm";

export interface TokenFunctionsCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * Port of the "token functions" rows in `token.details.html`: resync, set
 * PIN, random PIN and the test authentication. Nothing is offered for a
 * locked token.
 */
export function TokenFunctionsCard({
  onRefresh,
  serial,
  token
}: TokenFunctionsCardProps) {
  const { rights } = useAuth();
  const resync = useResyncForm({ onRefresh, serial });
  const setPin = useSetPinForm({ onRefresh, serial, tokentype: token.tokentype });
  const randomPin = useRandomPin(serial);
  const test = useTestTokenForm({ onRefresh, serial });

  const canResync =
    !["registration", "spass"].includes(token.tokentype) && hasRight(rights, "resync");
  const canSetPin = hasRight(rights, "setpin");
  const canSetRandomPin = hasRight(rights, "setrandompin");
  const canTest = token.tokentype !== "registration";

  if (token.locked) {
    return null;
  }

  return (
    <Card title={<Trans>Token functions</Trans>}>
      <ErrorAlert error={resync.mutation.error} />
      <ErrorAlert error={setPin.mutation.error} />
      <ErrorAlert error={randomPin.mutation.error} />
      <ErrorAlert error={test.mutation.error} />

      <Stack gap="lg">
        {canResync ? <ResyncRow form={resync} /> : null}
        {canSetPin ? <SetPinRow form={setPin} /> : null}
        {canSetRandomPin ? <RandomPinRow randomPin={randomPin} /> : null}
        <TestTokenRow canTest={canTest} form={test} />
      </Stack>
    </Card>
  );
}
