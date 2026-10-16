import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, type ReactNode } from "react";

import { useApiClient } from "../../api/ApiClientProvider";
import { getTokens, tokenQueryKeys, type TokenListParams } from "../../api/tokens";
import { useAuth } from "../../auth/AuthProvider";
import { formatSerialSuggestion } from "../../lib/serial";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

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
 * `uib-typeahead` directives. Suggestions are offered through a native
 * `<datalist>`; pass the selected value through `fixSerial` before use.
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
  const { isAuthenticated } = useAuth();
  const suggestionListId = useId();
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

  return (
    <div className="form-group">
      <label htmlFor={id}>{label ?? <Trans>Serial</Trans>}</label>
      <input
        autoComplete="off"
        className="form-control"
        id={id}
        list={suggestionListId}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        required={required}
        type="text"
        value={value}
      />
      <datalist id={suggestionListId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {suggestionsQuery.isFetching ? (
        <div className="help-block">
          <span
            className="glyphicon glyphicon-refresh glyphicon-spin"
            aria-hidden="true"
          />{" "}
          <Trans>Loading serials...</Trans>
        </div>
      ) : null}
      {canSearch && suggestionsQuery.isSuccess && suggestions.length === 0 ? (
        <div className="help-block">
          <span className="glyphicon glyphicon-remove" aria-hidden="true" />{" "}
          <Trans>No serial found</Trans>
        </div>
      ) : null}
    </div>
  );
}
