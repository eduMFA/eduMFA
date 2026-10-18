import { Trans, useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { EnrollMode } from "./enrollForm";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";

export interface EnrollPageAlertsProps {
  /** The type the form fell back to when the default is not allowed. */
  defaultTokenType: string;
  defaultTypeFallback: boolean;
  /** Failed requests in display order; `null` entries render nothing. */
  errors: readonly unknown[];
  mode: EnrollMode;
}

/** The notices above the form: login, rollover warning, type fallback, failures. */
export function EnrollPageAlerts({
  defaultTokenType,
  defaultTypeFallback,
  errors,
  mode
}: EnrollPageAlertsProps) {
  const { t } = useLingui();

  const { isAuthenticated, settings } = useAuth();

  return (
    <>
      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      {mode === "rollover" ? (
        <Alert
          color="red"
          icon={<IconAlertTriangle size={18} />}
          mb="md"
          role="alert"
          variant="light"
        >
          {t`You are about to rollover your token! This will invalidate your existing token and create a new token with a new secret key!`}
        </Alert>
      ) : null}
      {defaultTypeFallback ? (
        <Alert color="yellow" mb="md" role="status" variant="light">
          <Trans>
            Your user has no permission to enroll the default tokentype "
            {settings.defaultTokenType}". Using "{defaultTokenType}" instead.
          </Trans>
        </Alert>
      ) : null}
      {errors.map((error, index) => (
        <ErrorAlert error={error} key={index} />
      ))}
    </>
  );
}
