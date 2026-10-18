import { Trans } from "@lingui/react/macro";
import { Stack } from "@mantine/core";

import { EnrolledTokenActions } from "./EnrolledTokenActions";
import { EnrolledTokenResult } from "./EnrolledTokenResult";
import { type EnrollMode, type ResolvedEnrollForm } from "./enrollForm";
import { EnrollmentSummary } from "./EnrollmentSummary";
import type { EnrollVisibility } from "./enrollVisibility";
import type { EnrollSubmission } from "./useEnrollSubmission";
import { VerifyTokenFields } from "./VerifyTokenFields";
import type { TokenEnrollDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { Card } from "@/components/layout/Card";
import { fixUser } from "@/lib/users";

export interface EnrolledTokenCardProps {
  detail: TokenEnrollDetail;
  mode: EnrollMode;
  resolved: ResolvedEnrollForm;
  submission: EnrollSubmission;
  visibility: EnrollVisibility;
}

/** The "Enrolled token" card: summary, type-specific result, follow-up steps. */
export function EnrolledTokenCard({
  detail,
  mode,
  resolved,
  submission,
  visibility
}: EnrolledTokenCardProps) {
  const { settings, user } = useAuth();
  const isWizard = mode === "wizard";
  const enrolledUsername = user?.role === "admin" ? fixUser(resolved.user) : "";

  return (
    <Card title={<Trans>Enrolled token</Trans>}>
      <Stack gap="md">
        {!submission.isClientWait ? (
          <EnrollmentSummary
            isWizard={isWizard}
            realm={resolved.realm}
            serial={detail.serial}
            username={enrolledUsername}
          />
        ) : null}
        <EnrolledTokenResult
          clientPart={submission.clientPart}
          detail={detail}
          fido={submission.fido}
          form={resolved}
          isSendingClientPart={submission.isSendingClientPart}
          isWizard={isWizard}
          onClientPartChange={submission.setClientPart}
          onRegenerate={submission.regenerate}
          onSendClientPart={submission.sendClientPart}
          qrCodeWidth={visibility.qrCodeWidth}
          rolloutState={submission.rolloutState}
          showSeed={settings.showSeed}
        />
        {submission.isVerifyPending ? (
          <VerifyTokenFields
            isVerifying={submission.isVerifying}
            message={detail.verify?.message}
            onChange={submission.setVerifyResponse}
            onVerify={submission.sendVerifyResponse}
            value={submission.verifyResponse}
          />
        ) : null}
        {!submission.fido.pending &&
        !submission.isClientWait &&
        !submission.isVerifyPending ? (
          <EnrolledTokenActions
            isWizard={isWizard}
            onEnrollAnother={submission.startOver}
          />
        ) : null}
      </Stack>
    </Card>
  );
}
