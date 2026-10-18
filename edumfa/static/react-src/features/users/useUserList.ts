import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getDefaultRealmName,
  getRealms,
  type RealmsResponse
} from "@/api/config";
import {
  getUsers,
  userQueryKeys,
  type UserDetail,
  type UserListParams
} from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";
import { useDebouncedState } from "@/lib/useDebouncedState";

/** Typing pauses this long before the backend is queried; Enter applies at once. */
const FILTER_DEBOUNCE_MS = 300;

export interface UserFilters {
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

export interface UserList {
  activeRealm: string;
  allUsers: UserDetail[];
  /** Applies the draft filters now, e.g. on Enter. */
  applyFilters: () => void;
  draftFilters: UserFilters;
  isAdmin: boolean;
  page: number;
  pageSize: number;
  realmNames: string[];
  realmsQuery: UseQueryResult<RealmsResponse>;
  selectRealm: (realm: string) => void;
  setFilter: (name: keyof UserFilters, value: string) => void;
  setPage: Dispatch<SetStateAction<number>>;
  usersQuery: UseQueryResult<UserDetail[]>;
  visibleUsers: UserDetail[];
}

/** The realm selection, column filters and client-side paging of the user list. */
export function useUserList(): UserList {
  const apiClient = useApiClient();
  const { isAuthenticated, settings, user } = useAuth();
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

  const params = useMemo<UserListParams>(
    () => toUserListParams(activeRealm, filters),
    [activeRealm, filters]
  );

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

  return {
    activeRealm,
    allUsers,
    applyFilters,
    draftFilters,
    isAdmin,
    page,
    pageSize,
    realmNames,
    realmsQuery,
    selectRealm: (realm) => {
      setPage(1);
      applyFilters(emptyFilters);
      setSelectedRealm(realm);
    },
    setFilter: (name, value) => {
      setPage(1);
      filterState.setDraft((previousFilters) => ({
        ...previousFilters,
        [name]: value
      }));
    },
    setPage,
    usersQuery,
    visibleUsers: allUsers.slice(pageStart, pageStart + pageSize)
  };
}

/** Text filters match "contains", like the legacy `*value*` wildcards. */
function toUserListParams(activeRealm: string, filters: UserFilters): UserListParams {
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
}
