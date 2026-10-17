import { Trans, useLingui } from "@lingui/react/macro";
import { Autocomplete, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getTokens, tokenQueryKeys, type TokenListParams } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { formatSerialSuggestion } from "@/lib/serial";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export interface SerialLookupFieldProps {
  id: string;
  /** Show "[user@realm]" in suggestions, like the legacy attach-token directive. */
  includeUser?: boolean;
  label?: ReactNode;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  required?: boolean;
  /** Only suggest tokens without a user, like the legacy assign-token directive. */
  unassignedOnly?: boolean;
  value: string;
}

/**
 * Serial input with live suggestions from `GET /token/`, replacing the
 * `uib-typeahead` directives. Pass the selected value through `fixSerial`
 * before use.
 */
export function SerialLookupField({
  id,
  includeUser = false,
  label,
  onChange,
  placeholder,
  required = false,
  unassignedOnly = false,
  value
}: SerialLookupFieldProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const searchTerm = useDebouncedValue(value.trim(), 150);
  const params = useMemo<TokenListParams>(() => {
    const listParams: TokenListParams = { serial: `*${searchTerm}*` };

    if (unassignedOnly) {
      listParams.assigned = "False";
    }

    return listParams;
  }, [searchTerm, unassignedOnly]);

  // A picked suggestion contains " (" and would never match a serial again.
  const canSearch = searchTerm.length > 0 && !searchTerm.includes("(");
  const suggestionsQuery = useQuery({
    enabled: isAuthenticated && canSearch,
    queryFn: ({ signal }) => getTokens(apiClient, params, signal),
    queryKey: tokenQueryKeys.list(params),
    staleTime: 10_000
  });

  const suggestions = (suggestionsQuery.data?.tokens ?? []).map((token) =>
    formatSerialSuggestion(token, { includeUser })
  );
  const noResults = canSearch && suggestionsQuery.isSuccess && suggestions.length === 0;

  return (
    <Autocomplete
      autoComplete="off"
      data={suggestions}
      description={noResults ? t`No serial found` : undefined}
      filter={({ options }) => options}
      id={id}
      label={label ?? <Trans>Serial</Trans>}
      mb="sm"
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rightSection={suggestionsQuery.isFetching ? <Loader size="xs" /> : null}
      value={value}
    />
  );
}
