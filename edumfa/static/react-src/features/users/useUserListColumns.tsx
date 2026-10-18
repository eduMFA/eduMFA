import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import type { UserFilters, UserList } from "./useUserList";
import type { UserDetail } from "@/api/users";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

export type UserListColumnsParams = Pick<
  UserList,
  "activeRealm" | "applyFilters" | "draftFilters" | "setFilter"
>;

/** The user list columns with their header filters. */
export function useUserListColumns({
  activeRealm,
  applyFilters,
  draftFilters,
  setFilter
}: UserListColumnsParams): DataTableColumn<UserDetail>[] {
  const { t } = useLingui();

  const filterFor = (name: keyof UserFilters, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        setFilter(name, value);
      }}
      onSubmit={() => {
        applyFilters();
      }}
      value={draftFilters[name]}
    />
  );

  return [
    {
      filter: filterFor("username", t`username`),
      header: <Trans>username</Trans>,
      key: "username",
      render: (listedUser) => (
        <Anchor
          href={hashHref(
            `/user/details/${encodeURIComponent(activeRealm)}/${encodeURIComponent(listedUser.username)}`
          )}
          size="sm"
        >
          {listedUser.username}
        </Anchor>
      )
    },
    {
      filter: filterFor("surname", t`surname`),
      header: <Trans>surname</Trans>,
      key: "surname",
      render: (listedUser) => listedUser.surname
    },
    {
      filter: filterFor("givenname", t`givenname`),
      header: <Trans>givenname</Trans>,
      key: "givenname",
      render: (listedUser) => listedUser.givenname
    },
    {
      filter: filterFor("email", t`email`),
      header: <Trans>email</Trans>,
      key: "email",
      render: (listedUser) =>
        listedUser.email ? (
          <Anchor href={`mailto:${listedUser.email}`} size="sm">
            {listedUser.email}
          </Anchor>
        ) : null
    },
    {
      header: <Trans>phone</Trans>,
      key: "phone",
      nowrap: true,
      render: (listedUser) => listedUser.phone
    },
    {
      header: <Trans>mobile</Trans>,
      key: "mobile",
      nowrap: true,
      render: (listedUser) => listedUser.mobile
    },
    {
      header: <Trans>description</Trans>,
      key: "description",
      render: (listedUser) => listedUser.description
    },
    {
      header: <Trans>id</Trans>,
      key: "userid",
      render: (listedUser) => listedUser.userid
    }
  ];
}
