import { Trans } from "@lingui/react/macro";

import type {
  RadiusServerFieldSetter,
  RadiusServerFormValues
} from "./radiusServerValues";
import { Card } from "@/components/layout/Card";
import { TestCredentialsFields } from "@/features/config/servers/TestCredentialsFields";

export interface RadiusTestRequestCardProps {
  canTest: boolean;
  isPending: boolean;
  onTest: () => void;
  setValue: RadiusServerFieldSetter;
  values: RadiusServerFormValues;
}

/** The test request row: the credentials to try against the RADIUS server. */
export function RadiusTestRequestCard({
  canTest,
  isPending,
  onTest,
  setValue,
  values
}: RadiusTestRequestCardProps) {
  return (
    <Card>
      <TestCredentialsFields
        buttonLabel={<Trans>Send test RADIUS request</Trans>}
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
