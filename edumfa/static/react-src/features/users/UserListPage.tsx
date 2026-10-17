import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, NativeSelect } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getDefaultRealmName, getRealms } from "@/api/config";
import {
  getUsers,
  userQueryKeys,
  type UserDetail,
  type UserListParams
} from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { popFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

interface UserFilters {
  email: string;
  givenname: string;
  surname: string;
  username: string;
}

const emptyFilters: UserFilters = {
  email: "",
  givenname: "",
  surname: "",
  username: ""
};

export function UserListPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const filterState = useDebouncedState<UserFilters>(emptyFilters, FILTER_DEBOUNCE_MS, {
    liveApply: !settings.searchOnEnter
  });
  const { applied: filters, apply: applyFilters, draft: draftFilters } = filterState;
  // Like the legacy view, the user list is paginated client-side; the page
  // size comes from the `user_page_size` WebUI policy.
  const pageSize = settings.userPageSize;
  const [page, setPage] = useState(1);
  const [selectedRealm, setSelectedRealm] = useState("");

  // Notices handed over by the add/details pages, e.g. "User created."
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });

  const realms = realmsQuery.data ?? {};
  const realmNames = Object.keys(realms).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm = realmsQuery.data
    ? (getDefaultRealmName(realmsQuery.data) ?? "")
    : "";
  const activeRealm = selectedRealm || defaultRealm;

  const params = useMemo<UserListParams>(() => {
    const listParams: UserListParams = {};

    if (activeRealm) {
      listParams.realm = activeRealm;
    }

    if (filters.username) {
      listParams.username = `*${filters.username}*`;
    }

    if (filters.surname) {
      listParams.surname = `*${filters.surname}*`;
    }

    if (filters.givenname) {
      listParams.givenname = `*${filters.givenname}*`;
    }

    if (filters.email) {
      listParams.email = `*${filters.email}*`;
    }

    return listParams;
  }, [activeRealm, filters]);

  // Admins query per realm, so wait for the realm list; the legacy view
  // did the same and only loaded users once the default realm was known.
  const usersQuery = useQuery({
    enabled: isAuthenticated && (!isAdmin || activeRealm.length > 0),
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getUsers(apiClient, params, signal),
    queryKey: userQueryKeys.list(params)
  });

  const allUsers = usersQuery.data ?? [];
  const pageStart = (page - 1) * pageSize;
  const visibleUsers = allUsers.slice(pageStart, pageStart + pageSize);

  const setFilter = (name: keyof UserFilters, value: string) => {
    setPage(1);
    filterState.setDraft((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

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

  const columns: DataTableColumn<UserDetail>[] = [
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

  const realmSelector =
    isAdmin && realmNames.length > 0 ? (
      <NativeSelect
        data={realmNames}
        id="realmSelect"
        label={<Trans>Select Realm</Trans>}
        onChange={(event) => {
          setPage(1);
          applyFilters(emptyFilters);
          setSelectedRealm(event.currentTarget.value);
        }}
        size="sm"
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
              <Trans>Add user</Trans>
            </Button>
          ) : null
        }
        subtitle={activeRealm ? <Trans>Realm {activeRealm}</Trans> : null}
        title={<Trans>Users</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={usersQuery.error} />

      <Card flush>
        {realmsQuery.isLoading || usersQuery.isLoading ? (
          <LoadingIndicator label={<Trans>Loading users</Trans>} />
        ) : null}

        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={pageSize}
          totalCount={allUsers.length}
        />

        <DataTable
          columns={columns}
          data={visibleUsers}
          emptyMessage={<Trans>No users found.</Trans>}
          getRowKey={(listedUser) => `${listedUser.resolver}-${listedUser.userid}`}
          id="tableuserlist"
          isLoading={usersQuery.data === undefined}
          minWidth={900}
        />
      </Card>
    </SidebarLayout>
  );
}
