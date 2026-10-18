import { useLingui } from "@lingui/react/macro";

import { type ApplicationName } from "./types";
import { PageHeader } from "@/components/layout/PageHeader";

/** Title and introduction of the selected application's table. */
export function ApplicationPageHeader({
  application
}: {
  application: ApplicationName;
}) {
  const { t } = useLingui();

  return (
    <PageHeader
      subtitle={
        application === "ssh"
          ? t`SSH Tokens can be attached to a service ID with a user. The user is the user on the SSH server and may differ from the token owner. To attach the token to a service ID go to the token details.`
          : t`HOTP tokens can be attached with offline to e.g. notebooks.`
      }
      title={
        application === "ssh"
          ? t`SSH Tokens attached to services`
          : t`Offline tokens attached to notebooks`
      }
    />
  );
}
