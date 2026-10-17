import { Trans } from "@lingui/react/macro";
import { Alert, Anchor } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

import { hashHref } from "@/lib/hashbang";

/** Shown while the auth bridge has no session for a route that needs one. */
export function LoginRequiredAlert() {
  return (
    <Alert
      color="yellow"
      icon={<IconLock size={18} />}
      mb="md"
      role="alert"
      variant="light"
    >
      <Trans>
        Please{" "}
        <Anchor href={hashHref("/login")} inherit>
          log in
        </Anchor>{" "}
        to open this page.
      </Trans>
    </Alert>
  );
}
