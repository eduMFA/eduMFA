import { Trans } from "@lingui/react/macro";

import type {
  EduMfaServerFieldSetter,
  EduMfaServerFormValues
} from "./eduMfaServerValues";
import { Card } from "@/components/layout/Card";
import { TestCredentialsFields } from "@/features/config/servers/TestCredentialsFields";

export interface EduMfaTestRequestCardProps {
  canTest: boolean;
  isPending: boolean;
  onTest: () => void;
  setValue: EduMfaServerFieldSetter;
  values: EduMfaServerFormValues;
}

/** The test request row: the credentials to try against the remote eduMFA server. */
export function EduMfaTestRequestCard({
  canTest,
  isPending,
  onTest,
  setValue,
  values
}: EduMfaTestRequestCardProps) {
  return (
    <Card>
      <TestCredentialsFields
        buttonLabel={<Trans>Send test request to eduMFA server</Trans>}
        disabled={!canTest}
        isPending={isPending}
        onPasswordChange={(value) => {
          setValue("password", value);
        }}
        onTest={onTest}
        onUsernameChange={(value) => {
          setValue("username", value);
        }}
        password={values.password}
        username={values.username}
      />
    </Card>
  );
}
