import { Trans } from "@lingui/react/macro";
import { Anchor, Text } from "@mantine/core";

import { hashHref } from "@/lib/hashbang";

/** The "successfully enrolled" sentence with links to the token and the user. */
export function EnrollmentSummary({
  isWizard,
  realm,
  serial,
  username
}: {
  isWizard: boolean;
  realm: string;
  serial: string;
  username: string;
}) {
  const detailsLink = (
    <Anchor href={hashHref(`/token/details/${encodeURIComponent(serial)}`)} inherit>
      {serial}
    </Anchor>
  );

  if (username) {
    const userLink = (
      <Anchor
        href={hashHref(
          `/user/details/${encodeURIComponent(realm)}/${encodeURIComponent(username)}`
        )}
        inherit
      >
        {username}
      </Anchor>
    );

    return (
      <Text size="sm">
        <Trans>
          The token was successfully enrolled with serial number {detailsLink} for user{" "}
          {userLink} in realm {realm}.
        </Trans>
      </Text>
    );
  }

  if (isWizard) {
    return null;
  }

  return (
    <Text size="sm">
      <Trans>
        The token was successfully enrolled with serial number {detailsLink}.
      </Trans>
    </Text>
  );
}
