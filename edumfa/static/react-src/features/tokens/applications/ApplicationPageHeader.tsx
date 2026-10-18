import { Trans } from "@lingui/react/macro";

import { type ApplicationName } from "./types";
import { PageHeader } from "@/components/layout/PageHeader";

/** Title and introduction of the selected application's table. */
export function ApplicationPageHeader({
  application
}: {
  application: ApplicationName;
}) {
  return (
    <PageHeader
      subtitle={
        application === "ssh" ? (
          <Trans>
            SSH Tokens can be attached to a service ID with a user. The user is the user
            on the SSH server and may differ from the token owner. To attach the token
            to a service ID go to the token details.
          </Trans>
        ) : (
          <Trans>HOTP tokens can be attached with offline to e.g. notebooks.</Trans>
        )
      }
      title={
        application === "ssh" ? (
          <Trans>SSH Tokens attached to services</Trans>
        ) : (
          <Trans>Offline tokens attached to notebooks</Trans>
        )
      }
    />
  );
}
