import { Trans, useLingui } from "@lingui/react/macro";
import { Autocomplete, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getUsers, userQueryKeys, type UserListParams } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { formatUserSuggestion } from "@/lib/users";

export interface UserLookupFieldProps {
  id: string;
  label?: ReactNode;
  onChange: (value: string) => void;
  /** Realm to search in; without it no suggestions are loaded. */
  realm: string;
  required?: boolean;
  value: string;
}

/**
 * Username input with live suggestions from `GET /user/?username=*x*`,
 * replacing the legacy `assign-user` directive. Pass the selected value
 * through `fixUser` to get the login name back.
 */
export function UserLookupField({
  id,
  label,
  onChange,
  realm,
  required = false,
  value
}: UserLookupFieldProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const searchTerm = useDebouncedValue(value.trim(), 150);
  // A picked suggestion starts with "[" and would never match a user again.
  const canSearch =
    searchTerm.length > 0 && !searchTerm.startsWith("[") && realm.length > 0;
  const params: UserListParams = { realm, username: `*${searchTerm}*` };
  const suggestionsQuery = useQuery({
    enabled: isAuthenticated && canSearch,
    queryFn: ({ signal }) => getUsers(apiClient, params, signal),
    queryKey: userQueryKeys.list(params),
    staleTime: 10_000
  });

  const suggestions = (suggestionsQuery.data ?? []).map(formatUserSuggestion);
  const noResults = canSearch && suggestionsQuery.isSuccess && suggestions.length === 0;

  return (
    <Autocomplete
      autoComplete="off"
      data={suggestions}
      description={noResults ? t`No user found` : undefined}
      filter={({ options }) => options}
      id={id}
      label={label ?? <Trans>Username</Trans>}
      mb="sm"
      onChange={onChange}
      placeholder={t`start typing a username`}
      required={required}
      rightSection={suggestionsQuery.isFetching ? <Loader size="xs" /> : null}
      value={value}
    />
  );
}
