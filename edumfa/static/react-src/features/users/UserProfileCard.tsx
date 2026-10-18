import { useLingui } from "@lingui/react/macro";
import { Anchor, SimpleGrid } from "@mantine/core";

import type { UserDetail } from "@/api/users";
import { FieldValue } from "@/components/forms/FieldValue";
import { Card } from "@/components/layout/Card";

export interface UserProfileCardProps {
  userDetail: UserDetail;
}

/** The read-only attributes of the authenticated user. */
export function UserProfileCard({ userDetail }: UserProfileCardProps) {
  const { t } = useLingui();

  return (
    <Card title={t`Profile`}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing={0}>
        <FieldValue label={t`Username`} name="username">
          {userDetail.username}
        </FieldValue>
        <FieldValue label={t`Email`} name="email">
          {userDetail.email ? (
            <Anchor href={`mailto:${userDetail.email}`} size="sm">
              {userDetail.email}
            </Anchor>
          ) : null}
        </FieldValue>
        <FieldValue label={t`Given name`} name="givenname">
          {userDetail.givenname}
        </FieldValue>
        <FieldValue label={t`Phone`} name="phone">
          {userDetail.phone}
        </FieldValue>
        <FieldValue label={t`Surname`} name="surname">
          {userDetail.surname}
        </FieldValue>
        <FieldValue label={t`Mobile`} name="mobile">
          {userDetail.mobile}
        </FieldValue>
        <FieldValue label={t`Description`} name="description">
          {userDetail.description}
        </FieldValue>
      </SimpleGrid>
    </Card>
  );
}
