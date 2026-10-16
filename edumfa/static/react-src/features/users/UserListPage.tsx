import { Trans, useLingui } from "@lingui/react/macro";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import { configQueryKeys, getDefaultRealmName, getRealms } from "../../api/config";
import { getUsers, userQueryKeys, type UserListParams } from "../../api/users";
import { useAuth } from "../../auth/AuthProvider";
import { hasRight } from "../../auth/permissions";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { InfoAlert } from "../../components/feedback/InfoAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { ColumnFilter } from "../../components/tables/ColumnFilter";
import { EmptyState } from "../../components/tables/EmptyState";
import { Pagination } from "../../components/tables/Pagination";
import { popFlash } from "../../lib/flash";
import { hashHref } from "../../lib/hashbang";

/**
 * Default page size. The legacy UI could raise this through the
 * `user_page_size` WebUI policy delivered with the login response; wiring
 * that policy in React is deferred until React owns the login flow.
 * Like the legacy view, the user list is paginated client-side.
 */
const USER_PAGE_SIZE = 15;

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
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState<UserFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selectedRealm, setSelectedRealm] = useState("");
  // Notices handed over by the add/details pages, e.g. "User created."
  const [flash, setFlash] = useState(() => popFlash());

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
  const pageStart = (page - 1) * USER_PAGE_SIZE;
  const visibleUsers = allUsers.slice(pageStart, pageStart + USER_PAGE_SIZE);

  const setFilter = (name: keyof UserFilters, value: string) => {
    setPage(1);
    setFilters((previousFilters) => ({ ...previousFilters, [name]: value }));
  };

  const realmSelector =
    isAdmin && realmNames.length > 0 ? (
      <>
        <label htmlFor="realmSelect">
          <Trans>Select Realm</Trans>
        </label>
        <select
          className="form-control"
          id="realmSelect"
          onChange={(event) => {
            setPage(1);
            setFilters(emptyFilters);
            setSelectedRealm(event.target.value);
          }}
          value={activeRealm}
        >
          {realmNames.map((realmName) => (
            <option key={realmName} value={realmName}>
              {realmName}
            </option>
          ))}
        </select>
      </>
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
            <a className="btn btn-primary" href={hashHref("/user/add")}>
              <span className="glyphicon glyphicon-plus" aria-hidden="true" />
              <Trans>Add user</Trans>
            </a>
          ) : null
        }
        subtitle={activeRealm ? <Trans>Realm {activeRealm}</Trans> : null}
        title={<Trans>Users</Trans>}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

      <InfoAlert
        message={flash?.message ?? null}
        onDismiss={() => {
          setFlash(null);
        }}
        type={flash?.type}
      />
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
          pageSize={USER_PAGE_SIZE}
          totalCount={allUsers.length}
        />

        <div className="table-responsive">
          <table className="table table-bordered table-striped" id="tableuserlist">
            <thead>
              <tr>
                <th className="pifilter">
                  <Trans>username</Trans>
                  <ColumnFilter
                    label={t`username`}
                    onChange={(value) => {
                      setFilter("username", value);
                    }}
                    value={filters.username}
                  />
                </th>
                <th className="pifilter">
                  <Trans>surname</Trans>
                  <ColumnFilter
                    label={t`surname`}
                    onChange={(value) => {
                      setFilter("surname", value);
                    }}
                    value={filters.surname}
                  />
                </th>
                <th className="pifilter">
                  <Trans>givenname</Trans>
                  <ColumnFilter
                    label={t`givenname`}
                    onChange={(value) => {
                      setFilter("givenname", value);
                    }}
                    value={filters.givenname}
                  />
                </th>
                <th className="pifilter">
                  <Trans>email</Trans>
                  <ColumnFilter
                    label={t`email`}
                    onChange={(value) => {
                      setFilter("email", value);
                    }}
                    value={filters.email}
                  />
                </th>
                <th>
                  <Trans>phone</Trans>
                </th>
                <th>
                  <Trans>mobile</Trans>
                </th>
                <th>
                  <Trans>description</Trans>
                </th>
                <th>
                  <Trans>id</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 && !usersQuery.isLoading ? (
                <EmptyState colSpan={8} message={<Trans>No users found.</Trans>} />
              ) : (
                visibleUsers.map((listedUser) => (
                  <tr key={`${listedUser.resolver}-${listedUser.userid}`}>
                    <td>
                      <a
                        href={hashHref(
                          `/user/details/${encodeURIComponent(activeRealm)}/${encodeURIComponent(listedUser.username)}`
                        )}
                      >
                        {listedUser.username}
                      </a>
                    </td>
                    <td>{listedUser.surname}</td>
                    <td>{listedUser.givenname}</td>
                    <td>
                      {listedUser.email ? (
                        <a href={`mailto:${listedUser.email}`}>{listedUser.email}</a>
                      ) : null}
                    </td>
                    <td>{listedUser.phone}</td>
                    <td>{listedUser.mobile}</td>
                    <td>{listedUser.description}</td>
                    <td>{listedUser.userid}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </SidebarLayout>
  );
}
