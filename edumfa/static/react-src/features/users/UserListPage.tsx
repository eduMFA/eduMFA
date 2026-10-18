import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";

import { RealmSelect } from "./RealmSelect";
import { UserSidebar } from "./UserSidebar";
import { useUserList } from "./useUserList";
import { useUserListColumns } from "./useUserListColumns";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { hashHref } from "@/lib/hashbang";

export function UserListPage() {
  const { t } = useLingui();

  const { isAuthenticated, rights } = useAuth();
  const list = useUserList();
  const { activeRealm, allUsers, isAdmin, realmNames, realmsQuery, usersQuery } = list;
  const columns = useUserListColumns(list);

  const realmSelector =
    isAdmin && realmNames.length > 0 ? (
      <RealmSelect
        onChange={list.selectRealm}
        realmNames={realmNames}
        value={activeRealm}
      />
    ) : undefined;

  return (
    <SidebarLayout
      sidebar={
        <UserSidebar
          activeItem="list"
          realmSelector={realmSelector}
          userCount={usersQuery.data ? allUsers.length : undefined}
        />
      }
    >
      <PageHeader
        actions={
          isAdmin && hasRight(rights, "adduser") ? (
            <Button
              component="a"
              href={hashHref("/user/add")}
              leftSection={<IconUserPlus size={16} />}
            >
              {t`Add user`}
            </Button>
          ) : null
        }
        subtitle={activeRealm ? <Trans>Realm {activeRealm}</Trans> : null}
        title={t`Users`}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={usersQuery.error} />

      <Card flush>
        {realmsQuery.isLoading || usersQuery.isLoading ? (
          <LoadingIndicator label={t`Loading users`} />
        ) : null}

        <Pagination
          currentPage={list.page}
          maxSize={5}
          onPageChange={list.setPage}
          pageSize={list.pageSize}
          totalCount={allUsers.length}
        />

        <DataTable
          columns={columns}
          data={list.visibleUsers}
          emptyMessage={t`No users found.`}
          getRowKey={(listedUser) => `${listedUser.resolver}-${listedUser.userid}`}
          id="tableuserlist"
          isLoading={usersQuery.data === undefined}
          minWidth={900}
        />
      </Card>
    </SidebarLayout>
  );
}
