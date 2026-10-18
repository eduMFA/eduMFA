import { Trans } from "@lingui/react/macro";
import { Anchor, SimpleGrid } from "@mantine/core";

import type { UserDetail } from "@/api/users";
import { FieldValue } from "@/components/forms/FieldValue";
import { Card } from "@/components/layout/Card";

export interface UserProfileCardProps {
  userDetail: UserDetail;
}

/** The read-only attributes of the authenticated user. */
export function UserProfileCard({ userDetail }: UserProfileCardProps) {
  return (
    <Card title={<Trans>Profile</Trans>}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing={0}>
        <FieldValue label={<Trans>Username</Trans>} name="username">
          {userDetail.username}
        </FieldValue>
        <FieldValue label={<Trans>Email</Trans>} name="email">
          {userDetail.email ? (
            <Anchor href={`mailto:${userDetail.email}`} size="sm">
              {userDetail.email}
            </Anchor>
          ) : null}
        </FieldValue>
        <FieldValue label={<Trans>Given name</Trans>} name="givenname">
          {userDetail.givenname}
        </FieldValue>
        <FieldValue label={<Trans>Phone</Trans>} name="phone">
          {userDetail.phone}
        </FieldValue>
        <FieldValue label={<Trans>Surname</Trans>} name="surname">
          {userDetail.surname}
        </FieldValue>
        <FieldValue label={<Trans>Mobile</Trans>} name="mobile">
          {userDetail.mobile}
        </FieldValue>
        <FieldValue label={<Trans>Description</Trans>} name="description">
          {userDetail.description}
        </FieldValue>
      </SimpleGrid>
    </Card>
  );
}
